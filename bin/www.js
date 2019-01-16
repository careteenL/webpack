#! /usr/bin/env node

let path = require('path')

// 默认查找当前项目根目录下的`webpack.config.js`文件
// todo: 若有`命令行参数`则从中拿到配置文件路径
let configPath = path.resolve('webpack.config.js')
let config = require(configPath)

let Compiler = require('../lib/Compiler')

let compiler = new Compiler(config)

compiler.run()