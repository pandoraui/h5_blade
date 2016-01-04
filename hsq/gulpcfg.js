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
    "View": "ex_mvc/view",
    "ApiConfig": "model/config",
    "AppModel": "model/model",
  },
  // "viewsExclude": [
  //   "views/*.html"
  // ],
  "include": [
    //项目基础部分
    "./main",
    "ApiConfig",
    "AppModel",
    "Swiper",

    //抽象view
    "View",
    // "../blade/function/swiper",

    //views
    "views/detail",
    "text!views/detail.html",

  ],
};
