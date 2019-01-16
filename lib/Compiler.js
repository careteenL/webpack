const path = require('path')
const fs = require('fs')
const babylon = require('babylon')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default
const types = require('@babel/types')
const ejs = require('ejs')

class Compiler {
  constructor (config) {
    this.config = config // 配置文件
    this.root = process.cwd() // 运行webpack时项目所在的更目录
    this.entryId // 入口文件
    this.modules = {} // 所有依赖的模块
  }

  /**
   * 根据文件绝对路径获取文件内容
   * @param {Path} filename 文件绝对路径
   * @return {String} 文件内容
   */ 
  getResource (filename) {
    let content = fs.readFileSync(filename, 'utf8')
    return content
  }

  /**
   * 使用自己的模块机制，对模块内容做替换处理
   * 1) 将内容代码转换为`AST`           `babylon`
   * 2) 遍历`AST`找到对应节点 并做处理    `@babel/traverse`
   * 3) 重新根据`AST`生成代码            `@babel/generator`
   * @param {String} content 模块内容
   * @param {Path} parentPath 模块相对于根目录的路径
   * @return {Object} {sourceCode, dependencies} {经过处理生成的代码, 当前模块的所有依赖}
   */ 
  parse (content, parentPath) {
    let dependencies = [] // 存放当前模块的所有依赖
    let ast = babylon.parse(content)
    traverse(ast, {
      CallExpression (p) {
        let node = p.node
        // todo: 支持ESModule
        if (node.callee.name === 'require') {
          node.callee.name = '__webpack_require__'
          let filename = node.arguments[0].value
          filename = filename + (path.extname(parentPath) ? '' : '.js') // 引入时可能没有后缀
          filename = './' + path.join(parentPath, filename)
          dependencies.push(filename)
          node.arguments = [types.stringLiteral(filename)]
        }
      }
    })
    let sourceCode = generator(ast).code
    return {
      sourceCode,
      dependencies
    }
  }

  /**
   * 编译模块
   * 1) 根据模块路径获取模块内容
   * 2) 使用自己的模块机制，对模块内容做替换处理
   * 3) 递归解析模块依赖，并将其放入`modules`
   * @param {String} moduleName 需要编译模块的绝对路径
   * @param {Boolean} isEntry 是否为入口模块
   */ 
  buildModule (moduleName, isEntry) {
    let content = this.getResource(moduleName)
    let relativePath = './' + path.relative(this.root, moduleName) // 获取模块对于所在项目根目录的相对路径
    if (isEntry) {
      this.entryId = relativePath
    }
    let { sourceCode, dependencies } = this.parse(content, path.dirname(relativePath)) 
    this.modules[relativePath] = sourceCode
    dependencies.forEach(dep => {
      this.buildModule(path.resolve(this.root, dep), false)
    })    
  }

  /**
   * 打包实体文件
   * 1) 使用自己的模块机制模板，对源代码做替换
   * 2) 然后写入到指定目录
   */ 
  emitFile () {
    let templateStr = this.getResource(path.resolve(__dirname, './template.js'))
    let ret = ejs.render(templateStr, {
      entryId: this.entryId,
      modules: this.modules
    })
    // todo: 支持多个出口文件
    let outputPath = path.join(this.config.output.path, this.config.output.filename)
    fs.writeFileSync(outputPath, ret)
    console.log('write success...')
  }

  /**
   * 开始打包
   * 1) 编译模块
   * 2) 打包实体文件
   */ 
  run () {
    // todo: 入口可能为多个
    let moduleName = path.join(this.root, this.config.entry)
    this.buildModule(moduleName, true)
    this.emitFile()
  }
}

module.exports = Compiler