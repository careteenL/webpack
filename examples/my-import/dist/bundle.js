/**
 * 简易模板
 * todo: 功能太弱，需要完善
 */ 
(function (modules) {
  var installedModules = {};

  function __webpack_require__(moduleId) {
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }
    var module = installedModules[moduleId] = {
      i: moduleId,
      l: false,
      exports: {}
    };
    modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
    module.l = true;
    return module.exports;
  }
  // 提供一个入口  ejs
  return __webpack_require__("./src/index.js");
})
( // 参数是一个对象
  {
    
    "./src/index.js":
      (function (module, exports, __webpack_require__) {
        eval(`let str = __webpack_require__("./src/b.js");

console.log(str);`);
      }),
    
    "./src/b.js":
      (function (module, exports, __webpack_require__) {
        eval(`module.exports = __webpack_require__("./src/base/a.js");`);
      }),
    
    "./src/base/a.js":
      (function (module, exports, __webpack_require__) {
        eval(`module.exports = 'Careteen v Lanlan';`);
      }),
    
  }
);