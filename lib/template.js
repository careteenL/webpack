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
  return __webpack_require__("<%-entryId%>");
})
( // 参数是一个对象
  {
    <%for(let key in modules){%>
    "<%-key%>":
      (function (module, exports, __webpack_require__) {
        eval(`<%-modules[key]%>`);
      }),
    <%}%>
  }
);