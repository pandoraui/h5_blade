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
          "$_a": "zepto-adapter",
          "_": "underscore",
          "_e": "underscore.extend",
          "F": "fastclick"
        },
        "include": [
          "$",
          "$_a",
          "_",
          "_e",
          "F"
        ],
        "out": distDir + "out/libs.js"
      }
    },
    //blade 组件
    "blade": {
      "options": {
        "baseUrl": srcDir,
        "uglify": {
          "except": ["$super"]
        },
        // "modules": [],
        "paths": {
          // "common_dest": "common_dest",

          //核心部分：

          "text": "libs/require.text",
          "cAjax": "mvc/c.ajax",
          // "cInherit": "common/c.inherit",
          "AbstractApp": "mvc/abstract.app",
          "AbstractModel": "mvc/abstract.model",
          "AbstractView": "mvc/abstract.view",
          // "AbstractStore": "mvc/abstract.store",

          //抽象view
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
          // "UIAlert": "ui/ui.alert",
          // "UIMask": "ui/ui.mask",
          // "UILoading": "ui/ui.loading",
          // "UILoadingLayer": "ui/ui.loading.layer",
          // "UIToast": "ui/ui.toast",
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
          // "T_UIToast": "ui/ui.toast.html"
        },
        "include": [
          "text!ui/core.header.html",
          // "text!ui/ui.mask.html",
          // "text!ui/ui.layer.html",
          "text!ui/ui.loading.layer.html",
          // "text!ui/ui.toast.html",

          // "text!ui/ui.alert.html",
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


        ],
        // "out": distDir + "out/blade.js"
      }

    }
  }
};
