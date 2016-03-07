// blade 打包配置

// 参看 http://www.cnblogs.com/lhb25/p/requirejs-ptimizer-using.html

// 好食期项目 打包配置文件

var srcDir = "./hsq/";
var distDir = "./hsq/";
var blade = "/blade/";

module.exports = {
  "baseUrl": srcDir,
  "uglify": {
    // 丑化，以下情况除外
    "except": ["$super"]
  },
  removeCombined: true,
  // "modules": [],
  "paths": {
    "lib": "../blade/js/libs",
    // "text": "../blade/libs/require.text",
    "ApiConfig": "model/config",
    "AppModel": "model/model",
    "AppStore": "model/store",

    "Detect": "common/Detect",
    "FormatReg": "common/FormatReg",
    "CountDown": "common/CountDown",

    "PageView": "ex_mvc/view",

  },
  // "viewsExclude": [
  //   "views/*.html"
  // ],
  "include": [
    //项目基础部分
    "./main",
    "ApiConfig",
    "Detect",
    "FormatReg",
    "CountDown",
    "AppModel",
    "AppStore",
    "Swiper",

    //抽象view
    "PageView",
    // "../blade/function/swiper",

    //views
    "views/index",
    "text!views/index.html",
    "views/list",
    "text!views/list.html",
    "views/detail",
    "text!views/detail.html",
    "views/order",
    "text!views/order.html",
    "views/address",
    // "text!views/address.html",
    "views/address_update",
    "text!views/address_update.html",
    "views/order_success",
    "text!views/order_success.html",


    "views/quick_login",
    "text!views/quick_login.html",

    "text!views/test.html",

  ],
  "exclude": [],
};
