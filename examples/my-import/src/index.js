let button = document.createElement('button')
button.innerHTML = '点我点我'
button.addEventListener('click', event => {
  debugger
  import('./hello.js').then(result => {
    alert(result.default)
  })
})
document.body.appendChild(button)
// import的原理
// 1、首先如果遇到import会把这个import的模块单独放到一个代码块中，会单独生成一个文件。
// 2、首次加载的时候只需要加载main.js，当遇到import语句的时候，会向服务器发送一个jsonp请求被分隔出去的异步代码，
// 然后合并到原来modules，然后去加载这个新的模块，并且把模块的执行结果向后传递。
