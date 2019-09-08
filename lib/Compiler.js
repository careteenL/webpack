const path = require('path')
const fs = require('fs')
const babylon = require('babylon')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default
const types = require('@babel/types')
const ejs = require('ejs')
const {
  join,
  dirname
} = require('path').posix // 为了保证在不同的操作系统下的唯 一性
const {
  SyncHook,
  AsyncParallelHook
} = require('tapable')

class Compiler {
  constructor(config) {
    this.config = config // 配置文件
    this.root = process.cwd() // 运行webpack时项目所在的更目录
    this.entryId = this.config.entry // 入口文件
    // this.modules = {} // 所有依赖的模块
    this.chunks = { // 存放所有的代码块，取代上面modules
      main: {}
    }
    this.hooks = {
      compile: new SyncHook(['compile']),
      make: new SyncHook(['make']),
      build: new AsyncParallelHook(['build']),
      emit: new AsyncParallelHook(['emit'])
    }
  }

  /**
   * 根据文件绝对路径获取文件内容
   * 1) 可处理`loaders`
   * @param {Path} filename 文件绝对路径
   * @return {String} 文件内容
   */
  getResource(filename) {
    let content = fs.readFileSync(filename, 'utf8')
    let {
      module: {
        rules = []
      } = {},
      plugins
    } = this.config
    // 循环`loader`并对文件进行处理
    for (let i = 0; i < rules; i++) {
      const {
        test,
        use: loaders
      } = rules[i]
      let loaderIndex = loaders.length - 1
      if (test.test(filename)) {
        // 可能为异步
        const iterateLoaders = () => {
          // todo: 找`node_modules`
          let loader = require(loaders[loaderIndex--])
          content = loader(content)
          if (loaderIndex >= 0) {
            iterateLoaders()
          }
        }
        iterateLoaders()
      }
    }
    if (plugins && plugins.length > 0) { // 执行插件
      plugins.forEach(plugin => plugin.apply(this))
    }
    return content
  }

  /**
   * 使用自己的模块机制，对模块内容做替换处理
   * 1) 将内容代码转换为`AST`           `babylon`
   * 2) 遍历`AST`找到对应节点 并做处理    `@babel/traverse`
   * 3) 重新根据`AST`生成代码           `@babel/generator`
   * @param {String} content 模块内容
   * @param {Path} parentPath 模块相对于根目录的路径
   * @return {Object} {sourceCode, dependencies} {经过处理生成的代码, 当前模块的所有依赖}
   */
  // parse(content, parentPath, chunkId) {
  //   let {
  //     buildModule
  //   } = this
  //   let dependencies = [] // 存放当前模块的所有依赖
  //   let ast = babylon.parse(content, {
  //     plugins: ['dynamicImport']
  //   })
  //   traverse(ast, {
  //     CallExpression(p) {
  //       let node = p.node
  //       // todo: 支持ESModule
  //       if (node.callee.name === 'require') { // 处理require
  //         node.callee.name = '__webpack_require__'
  //         let filename = node.arguments[0].value
  //         filename = filename + (path.extname(filename) ? '' : '.js') // 引入时可能没有后缀
  //         filename = './' + path.join(parentPath, filename)
  //         dependencies.push(filename)
  //         node.arguments = [types.stringLiteral(filename)]
  //       } else if (types.isImport(node.callee)) { // 处理动态import
  //         let filename = node.arguments[0].value
  //         filename = filename + (path.extname(filename) ? '' : '.js') // 引入时可能没有后缀
  //         let dependencyModuleId = './' + path.join(parentPath, filename)
  //         let dependencyChunkId = dependencyModuleId.slice(2).replace(/(\/|\.)/g, '_') + '.js'
  //         p.replaceWithSourceString(`
  //           __webpack_require__.e("${dependencyChunkId}").then(__webpack_require__.t.bind(__webpack_require__, "${dependencyModuleId}"))
  //         `)
  //         buildModule(dependencyModuleId, dependencyChunkId, false)
  //       }
  //     }
  //   })
  //   let sourceCode = generator(ast).code
  //   return {
  //     sourceCode,
  //     dependencies
  //   }
  // }

  /**
   * 编译模块
   * 1) 根据模块路径获取模块内容
   * 2) 使用自己的模块机制，对模块内容做替换处理
   * 3) 递归解析模块依赖，并将其放入`modules`
   * @param {String} moduleId 需要编译模块的绝对路径
   * @param {Boolean} isEntry 是否为入口模块
   */
  // buildModule(moduleId, chunkId, isEntry = false) {
  //   let content = this.getResource(moduleId)
  //   let relativePath = './' + path.relative(this.root, moduleId) // 获取模块对于所在项目根目录的相对路径
  //   if (isEntry) {
  //     this.entryId = relativePath
  //   }
  //   let {
  //     sourceCode,
  //     dependencies
  //   } = this.parse(content, path.dirname(relativePath), chunkId)
  //   // this.modules[relativePath] = sourceCode
  //   (this.chunks[chunkId] = this.chunks[chunkId] || {})[moduleId] = sourceCode
  //   dependencies.forEach(dep => {
  //     this.buildModule(path.resolve(this.root, dep), chunkId, false)
  //   })
  // }

  // 源代码->babylon->语法树->traverse遍历树的所有节点，找到我们想要的节点
  // ->types生成新的节点替换老节点->generator重新生成代码
  buildModule(moduleId, chunkId) { //把模块ID传进来，然后开始编译这个模块
    console.log(moduleId)
    let originalSource = fs.readFileSync(moduleId, 'utf8');
    let originalSource = this.getResource(moduleId)
    let relativePath = './' + path.relative(this.root, moduleId) // 获取模块对于所在项目根目录的相对路径    
    const ast = babylon.parse(originalSource, {
      plugins: ['dynamicImport']
    });
    const dependencies = []; //声明一个依赖的数组，里面放着本模块所依赖的模块ID数组
    traverse(ast, {
      CallExpression: (nodePath) => {
        if (nodePath.node.callee.name == 'require') {
          let node = nodePath.node;
          node.callee.name = '__webpack_require__';
          let moduleName = node.arguments[0].value;
          let dependencyModuleId = './' + join(dirname(moduleId), moduleName); // ./src/hello.js
          dependencies.push(dependencyModuleId);
          node.arguments = [types.stringLiteral(dependencyModuleId)]
        } else if (types.isImport(nodePath.node.callee)) {
          let node = nodePath.node;
          let moduleName = node.arguments[0].value; //异步加载的模块名
          // ./src/hello.js => src_hello_js
          let dependencyModuleId = './' + join(dirname(moduleId), moduleName);
          let dependencyChunkId = dependencyModuleId.slice(2).replace(/(\/|\.)/g, '_') + '.js';
          nodePath.replaceWithSourceString(`
                    __webpack_require__.e("${dependencyChunkId}").then(__webpack_require__.t.bind(__webpack_require__,"${dependencyModuleId}"))
                `);
          //此模块依赖的代码也会放在分割出去的代码块中
          this.buildModule(path.resolve(this.root, moduleName), dependencyChunkId);
        }
      }
    });
    let {
      code
    } = generator(ast);
    (this.chunks[chunkId] = this.chunks[chunkId] || {})[moduleId] = code;
    //this.modules[moduleId] = code;//属性名就是模块ID值 就是这个模块对应的代码
    //递归编译本模块的依赖项
    dependencies.forEach(dependency => this.buildModule(dependency));
  }

  /**
   * 打包实体文件
   * 1) 使用自己的模块机制模板，对源代码做替换
   * 2) 然后写入到指定目录
   */
  emitFile() {
    // todo: 支持多个出口文件
    let {
      output
    } = this.config
    let {
      getResource
    } = this
    Object.keys(this.chunks).forEach(chunkId => {
      let outputFile = path.join(output.path, output.filename)
      if (chunkId === 'main') {
        let templateStr = getResource(path.resolve(__dirname, './template.ejs'))
        let ret = ejs.compile(templateStr, {
          entryId: this.entryId,
          modules: this.chunks[chunkId]
        })
        fs.writeFileSync(outputFile, ret, 'utf8')
      } else {
        let templateStr = getResource(path.resolve(__dirname, './chunk.ejs'))
        let ret = ejs.compile(templateStr, {
          chunkId,
          modules: this.chunks[chunkId]
        })
        fs.writeFileSync(outputFile, ret, 'utf8')
      }
    })
    console.log('write success...')
  }

  /**
   * 开始打包
   * 1) 编译模块
   * 2) 打包实体文件
   */
  run() {
    // todo: 入口可能为多个
    let moduleName = path.join(this.root, this.config.entry)
    this.hooks.compile.call()
    this.hooks.make.call()
    this.buildModule(moduleName, 'main')
    this.hooks.build.call()
    this.hooks.emit.call()
    this.emitFile()
  }
}

module.exports = Compiler