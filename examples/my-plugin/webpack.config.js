/**
 * webpack.config.js
 */
const path = require('path')
const MyPlugin = require('./MyPlugin')

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve('dist'),
    filename: 'bundle.js'
  },
  plugins: [
    // ...
    new MyPlugin()
  ]
}