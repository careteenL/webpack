# [webpack](https://github.com/careteenL/webpack)
[![](https://img.shields.io/badge/Powered%20by-webpack-brightgreen.svg)](https://github.com/careteenL/webpack)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/careteenL/webpack/blob/master/LICENSE)
[![Build Status](https://travis-ci.org/careteenL/webpack.svg?branch=master)](https://travis-ci.org/careteenL/webpack)
[![npm](https://img.shields.io/badge/npm-0.1.0-orange.svg)](https://www.npmjs.com/package/@careteen/webpack)
[![NPM downloads](http://img.shields.io/npm/dm/@careteen/webpack.svg?style=flat-square)](http://www.npmtrends.com/@careteen/webpack)

学习并仿写`webpack`，目前已提供基础功能

- [x] 默认查找`webpack.config.js`配置文件
- [ ] 可根据参数拿到配置文件
- [ ] 区分`development`和`production`
- [x] 单文件入口/出口
- [ ] 多文件入口/出口
- [x] 支持`require`导入方式
- [ ] 支持`ESModule`导入方式
- [ ] 支持`loaders`
- [ ] 完善生命周期
- [ ] 支持`plugins`

## 快速使用

安装
```shell
npm i -D @careteen/webpack
# 可全局
npm i -g @careteen/webpack
```

命令行使用
```shell
npx careteen-pack
```

js使用
```js
// todo ...
```

## 使用文档

- [对该库的源码解析](xxx)

## 使用例子

- [原生webpack使用例子](./examples/primary-simple)
- [简单使用例子](./examples/my-simple)
- [loader使用例子](./examples/my-loader)