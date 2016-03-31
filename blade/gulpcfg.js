// blade 打包配置

// 参看 http://www.cnblogs.com/lhb25/p/requirejs-ptimizer-using.html

var srcDir = "./blade/";
var distDir = "./blade/";

module.exports = {
  //核心依赖 libs
  "requirejs": {
    "libs": {
      "options": {
        "baseUrl": srcDir + "libs",
        "paths": {
          "$": "zepto",
          "B": "backbone",
          "$_a": "zepto-adapter",
          "_": "underscore",
          // "_e": "underscore.extend",
          "F": "fastclick"
        },
        "include": [
          "$",
          "B",
          "$_a",
          "_",
          // "_e",
          "F"
        ],
        "out": distDir + "out/libs.js"
      }
    },
    //blade 组件
    "blade": {
      "options": {
        "baseUrl": srcDir,
        // "optimize": "none",
        "uglify": {
          // 丑化，以下情况除外
          "except": ["$super"]
        },
        // "modules": [],
        "paths": {
          // "common_dest": "common_dest",

          //核心部分：

          "text": "libs/require.text",
          "cAjax": "mvc/c.ajax",
          "libs": "libs/libs",
          // "cInherit": "common/c.inherit",
          "AbstractApp": "mvc/abstract.app",
          "AbstractModel": "mvc/abstract.model",


          //工具类
          "cDetect": "common/c.detect",
          "cValidate": "common/c.validate",
          "cSchema": "common/c.schema",
          "cCount": "common/c.count", //统计
          // "cLazyload": "common/c.lazyload",

          "cUtilDate": "util/c.util.date",
          "cUtilObject": "util/c.util.object",
          "cAbstractStorage": "data/storage/c.abstract.storage",
          "cLocalStorage": "data/storage/c.local.storage",

          "cAbstractStore": "data/store/c.abstract.store",
          "cLocalStore": "data/store/c.local.store",

          //抽象view
          // "AbstractView": "mvc/abstract.view",
          "UIView": "ui/core.abstract.view",
          // "C_UIView": "ui/core.abstract.view.css",

          //头部组件
          "UIHeader": "ui/core.header",
          "T_UIHeader": "ui/core.header.html",
          // "C_UIHeader": "ui/core.header.css",

          //基础组件部分

          "LazyLoad": "function/lazyload",
          "Swiper": "function/swiper", //extend
          "UISwiper": "ui/ui.swiper",
          "UIDownTip": "ui/ui.downtip",

          //蒙版
          "UIMask": "ui/ui.mask",
          // "C_UIMask": "ui/ui.mask.css",

          //弹出层基类
          "UILayer": "ui/ui.layer",
          // "T_UILayer": "ui/ui.layer.html",
          // "C_UILayer": "ui/ui.layer.css",

          //loading弹出层
          "UILoadingLayer": "ui/ui.loading.layer",
          "T_UILoadingLayer": "ui/ui.loading.layer.html",

          // //头部组件
          // "UIHeader": "ui/core.header",
          //
          // "cLazyload": "common/c.lazyload",
          // "cValidate": "common/c.validate",
          // "cHighlight": "common/c.highlight",
          //
          // // "UIView": "ui/ui.abstract.view",
          // "UILayer": "ui/ui.layer",
          // "UIMask": "ui/ui.mask",
          // "UILoading": "ui/ui.loading",
          // "UILoadingLayer": "ui/ui.loading.layer",
          "UIToast": "ui/ui.toast",
          "T_UIToast": "ui/ui.toast.html",
          "UIAlert": "ui/ui.alert",
          "T_UIAlert": "ui/ui.alert.html",
          // "UIInlineView": "ui/ui.inline.view",
          // "UINum": "ui/ui.num",
          // "UISwitch": "ui/ui.switch",
          // "UIBubbleLayer": "ui/ui.bubble.layer",
          // "UITab": "ui/ui.tab",
          // "UITabs": "ui/ui.tabs",
          // "UIScroll": "ui/ui.scroll",
          // "UIScrollLayer": "ui/ui.scroll.layer",
          // "UIRadioList": "ui/ui.radio.list",
          // "UISelect": "ui/ui.select",
          // "UIGroupSelect": "ui/ui.group.select",
          // "UIGroupList": "ui/ui.group.list",
          // "UICalendar": "ui/ui.calendar",
          // "UISlider": "ui/ui.slider",
          // "UIWarning404": "ui/ui.warning404",
          "cPageView": "page/c.page.view",
          "cPageList": "page/c.page.list",
        },
        "map": {
          "*": {
            // "cUtility": "cUtilCommon",
            "cStore": "cLocalStore",
            // "cGuider": "cGuiderService",
            // "CommonStore":"cCommonStore"
          }
        },
        "include": [
          //项目模块
          // "./common",            //: "mvc/c.ajax",
          "cAjax",            //: "mvc/c.ajax",
          "AbstractApp",      //: "mvc/abstract.app",
          "AbstractModel",    //: "mvc/abstract.model",
          // "AbstractView",     //: "mvc/abstract.view",

          "cDetect",
          "cValidate",
          "cSchema",
          "cCount",

          "cUtilDate",
          "cUtilObject",
          "cAbstractStorage",
          "cLocalStorage",

          "cAbstractStore",
          "cLocalStore",

          //抽象view
          "UIView",         //: "ui/core.abstract.view",

          //头部组件
          "UIHeader",       //: "ui/core.header",
          "text!ui/core.header.html",
          // "T_UIHeader",     //: "ui/core.header.html",


          //基础组件部分
          "LazyLoad",       //: "function/lazyload",
          // "Swiper",         //: "function/swiper", //extend
          "UISwiper",       //: "ui/ui.swiper",
          "UIDownTip",      //: "ui/ui.downtip",

          //蒙版
          "UIMask",         //: "ui/ui.mask",

          //弹出层基类
          "UILayer",        //: "ui/ui.layer",

          //loading弹出层
          "UILoadingLayer",    //: "ui/ui.loading.layer",
          "text!ui/ui.loading.layer.html",
          // "T_UILoadingLayer",  //: "ui/ui.loading.layer.html",

          "text!ui/ui.toast.html",

          "text!ui/ui.alert.html",
          // "text!ui/ui.bubble.layer.html",
          // "text!ui/ui.calendar.html",
          // "text!ui/ui.group.list.html",
          // "text!ui/ui.group.select.html",
          // "text!ui/ui.num.html",
          // "text!ui/ui.pageview.html",
          //
          // "text!ui/ui.radio.list.html",
          // "text!ui/ui.scroll.layer.html",
          // "text!ui/ui.select.html",
          // "text!ui/ui.slider.html",
          //
          // "text!ui/ui.switch.html",
          // "text!ui/ui.tab.html",
          //
          //
          // "text!ui/ui.warning404.html"

          "cPageView",
          "cPageList",
        ],
        // "out": distDir + "out/blade.js"
      }

    }
  }
};
