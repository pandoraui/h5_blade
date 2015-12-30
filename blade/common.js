(function () {

  //项目根路径，这个会跟着外层入口index.html而变化
  var srcDir = "./blade/";
  //模板路径

  require.config({
    // baseUrl: srcDir,
    shim: {
      // $: {
      //   exports: "Zepto"
      // },
      // _: {
      //   exports: "_"
      // },
      // // B: {
      // //   deps: ["_", "$"],
      // //   exports: "Backbone"
      // // },
      // F: {
      //   deps: ["$"],
      //   exports: "Fastclick"
      // },
      // libs: {
      //   deps: ["_", "$", "F"],
      //   exports: "libs"
      // },
      // common: {
      //   deps: ["libs"]
      // },
      // cAjax: {
      //   exports: "cAjax"
      // },
      // UIView: {
      //   deps: ["B"],
      //   exports: "UIView"
      // },
    },
    paths: {
      //依赖部分
      // "R": srcDir + "libs/require",
      // "$": srcDir + "libs/zepto",
      // "_": srcDir + "libs/underscore",
      // // "B": srcDir + "libs/backbone",
      // "F": srcDir + "libs/fastclick",
      // "libs": srcDir + "libs/libs",
      // "text": srcDir + "libs/require.text",
      // "cInherit": srcDir + "common/c.class.inherit",

      //核心部分：

      "text": srcDir + "libs/require.text",
      "cAjax": srcDir + "mvc/c.ajax",
      // "cInherit": srcDir + "common/c.inherit",
      "AbstractApp": srcDir + "mvc/abstract.app",
      "AbstractModel": srcDir + "mvc/abstract.model",
      "AbstractView": srcDir + "mvc/abstract.view",
      // "AbstractStore": srcDir + "mvc/abstract.store",

      //抽象view
      "UIView": srcDir + "ui/core.abstract.view",
      "C_UIView": srcDir + "ui/core.abstract.view.css",

      //头部组件
      "UIHeader": srcDir + "ui/core.header",
      "T_UIHeader": srcDir + "ui/core.header.html",
      "C_UIHeader": srcDir + "ui/core.header.css",


      //基础组件部分

      "LazyLoad": srcDir + "function/lazyload",
      "Swiper": srcDir + "function/swiper",  //extend
      "UISwiper": srcDir + "ui/ui.swiper",
      "UIDownTip": srcDir + "ui/ui.downtip",

      //蒙版
      "UIMask": srcDir + "ui/ui.mask",
      // "C_UIMask": srcDir + "ui/ui.mask.css",

      //弹出层基类
      "UILayer": srcDir + "ui/ui.layer",
      "T_UILayer": srcDir + "ui/ui.layer.html",
      // "C_UILayer": srcDir + "ui/ui.layer.css",

      //loading弹出层
      "UILoadingLayer": srcDir + "ui/ui.loading.layer",
      "T_UILoadingLayer": srcDir + "ui/ui.loading.layer.html",
      // "C_UILoadingLayer": srcDir + "ui/ui.loading.layer.css",

      // //toast提升
      // "UIToast": srcDir + "ui/ui.toast",
      // "T_UIToast": srcDir + "ui/ui.toast.html",
      // "C_UIToast": srcDir + "ui/ui.toast.css",
      //
      // //404提示
      // "UIWarning404": srcDir + "ui/ui.warning404",
      // "T_UIWarning404": srcDir + "ui/ui.warning404.html",
      // "C_UIWarning404": srcDir + "ui/ui.warning404.css",

      //alert组件
      // "UIAlert": srcDir + "ui/ui.alert",
      // "T_UIAlert": srcDir + "ui/ui.alert.html",
      //
      // //扩展组件部分
      // //
      //
      // //气泡组件
      // "UIBubbleLayer": srcDir + "ui/ui.bubble.layer",
      // "T_UIBubbleLayer": srcDir + "ui/ui.bubble.layer.html",
      // "C_UIBubbleLayer": srcDir + "ui/ui.bubble.layer.css",
      //
      // //日历
      // "UICalendar": srcDir + "ui/ui.calendar",
      // "T_UICalendar": srcDir + "ui/ui.calendar.html",
      // "C_UICalendar": srcDir + "ui/ui.calendar.css",
      //
      // //分组列表
      // "UIGroupList": srcDir + "ui/ui.group.list",
      // "T_UIGroupList": srcDir + "ui/ui.group.list.html",
      // "C_UIGroupList": srcDir + "ui/ui.group.list.css",
      //
      // //身份证组件
      // "UIIdentitycard": srcDir + "ui/ui.identitycard",
      // "T_UIIdentitycard": srcDir + "ui/ui.identitycard.html",
      // "C_UIIdentitycard": srcDir + "ui/ui.identitycard.css",
      //
      // //图片轮播
      // "UIImageSlider": srcDir + "ui/ui.image.slider",
      //
      // //底部弹出层列表
      // "UILayerList": srcDir + "ui/ui.layer.list",
      // "T_UILayerList": srcDir + "ui/ui.layer.list.html",
      // "C_UILayerList": srcDir + "ui/ui.layer.list.css",
      //
      // //数字组件
      // "UINum": srcDir + "ui/ui.num",
      // "T_UINum": srcDir + "ui/ui.num.html",
      // "C_UINum": srcDir + "ui/ui.num.css",
      //
      // //可拖动选择弹出层
      // "UIRadioList": srcDir + "ui/ui.radio.list",
      // "T_UIRadioList": srcDir + "ui/ui.radio.list.html",
      //
      // //IScroll滚动基类
      // "UIScroll": srcDir + "ui/ui.scroll",
      //
      // //滚动容器层
      // "UIScrollLayer": srcDir + "ui/ui.scroll.layer",
      // "T_UIScrollLayer": srcDir + "ui/ui.radio.layer.html",
      //
      // //select组件
      // "UISelect": srcDir + "ui/ui.select",
      // "T_UISelect": srcDir + "ui/ui.select.html",
      // "C_UISelect": srcDir + "ui/ui.select.css",
      //
      // //slider横向滚动组件
      // "UISlider": srcDir + "ui/ui.slider",
      // "T_UISlider": srcDir + "ui/ui.slider.html",
      // "C_UISlider": srcDir + "ui/ui.slider.css",
      //
      // //switch组件
      // "UISwitch": srcDir + "ui/ui.switch",
      // "T_UISwitch": srcDir + "ui/ui.switch.html",
      // "C_UISwitch": srcDir + "ui/ui.switch.css",
      //
      // //tab组件
      // "UITab": srcDir + "ui/ui.tab",
      // "T_UITab": srcDir + "ui/ui.tab.html",
      // "C_UITab": srcDir + "ui/ui.tab.css",

      //"cHighlight": srcDir + "common/c.highlight",
    }

  });

})();
