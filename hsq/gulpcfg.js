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

    "SchemaUrl": "common/SchemaUrl",
    "Detect": "common/Detect",
    "Tongji": "common/Tongji",
    "FormatReg": "common/FormatReg",
    "CountDown": "common/CountDown",
    "LoginCommon": "common/LoginCommon",
    "DealData": "common/DealData",

    "PageView": "ex_mvc/PageView",
    "PageList": "ex_mvc/PageList",

  },
  // "viewsExclude": [
  //   "views/*.html"
  // ],
  "include": [
    //项目基础部分
    "./main",
    "ApiConfig",
    "SchemaUrl",
    "Detect",
    "Tongji",
    "FormatReg",
    "CountDown",
    "AppModel",
    "AppStore",
    "Swiper",

    //抽象view
    "PageView",
    "PageList",
    // "../blade/function/swiper",

    //common
    "LoginCommon",
    "DealData",

    //首页
    "views/home",

    //views
    "views/index",
    "text!views/index.html",
    "views/list",
    "text!views/list.html",

    "views/detail",
    "text!views/detail.html",

    "views/quick_login",
    "text!views/quick_login.html",
    "views/iframe_page",

    "views/address",
    "text!views/address.html",
    "views/address_update",
    "text!views/address_update.html",
    "views/district",
    "text!views/district.html",

    "views/order",
    "text!views/order.html",
    "views/order_success",
    "text!views/order_success.html",

    "text!views/test.html",


  //主题活动页面
    //推荐有奖
    "views/zt_reg_reward",
    "text!views/zt_reg_reward.html",
    //每日Top 10
    "views/today_top10",
    "text!views/today_top10.html",
    //top10 专题列表
    "views/zt_top10",
    "text!views/zt_top10.html",

  ],
  "exclude": [],
};
