
//统计代码
if (!window._hmt) window._hmt = [];
(function() {
  var hm = document.createElement("script");
  hm.src = "//hm.baidu.com/hm.js?d211ce22f96ac8839475cfc3f64c40b8";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();

(function () {
  var project = './';
  var blade = './blade/';

  window.getViewTemplatePath = function (path) {
    return 'text!' + project + path + '.html';
  };

  // RequireJS配置
  require.config({
    baseUrl: './',  //js文件载入基路径
    //enforceDefine: true,//enforceDefine用来强制模块使用define定义，否则可能会报No define call for ...之类错误
    paths: {  //路径别名
      'PageView': project + 'ex_mvc/PageView',
      'PageList': project + 'ex_mvc/PageList',

      'ApiConfig': project + 'model/config',
      'Swiper': blade + 'function/swiper',
      'AppModel': project + 'model/model',
      'AppStore': project + 'model/store',

      //组件
      'Detect': project + 'common/Detect',
      'Tongji': project + 'common/Tongji',
      'FormatReg': project + 'common/FormatReg',
      'CountDown': project + 'common/CountDown',
      'LoginCommon': project + 'common/LoginCommon',
      // 'AppCommonStore': project + 'model/commonStore',
      // 'SwiperInit': 'blade/function/swiper-init',
    },
  });

  var animations = {

    slideleft: function (inView, outView, callback, scope) {
      $('body').addClass('hiddenx');

      outView.show();
      inView.show();

      inView.$el.addClass('animatestart1 tview');
      outView.$el.addClass('animatestart1 lview');

      inView.$el.addClass('cm-page--right-in');
      outView.$el.addClass('cm-page--left-out');

      inView.$el.one('webkitAnimationEnd transitionend oTransitionEnd', function () {
        $('body').removeClass('hiddenx');

        outView.hide();

        inView.$el.removeClass('animatestart1 tview');
        inView.$el.removeClass('cm-page--right-in');

        outView.$el.removeClass('animatestart1 lview');
        outView.$el.removeClass('cm-page--left-out');


        callback && callback.call(scope, inView, outView);

      }, 340);
    },

    slideright: function (inView, outView, callback, scope) {
      $('body').addClass('hiddenx');

      outView.show();
      inView.show();

      inView.$el.addClass('animatestart1 lview');
      outView.$el.addClass('animatestart1 tview');

      inView.$el.addClass('cm-page--left-in');
      outView.$el.addClass('cm-page--right-out');

      outView.$el.one('webkitAnimationEnd transitionend oTransitionEnd', function () {
        $('body').removeClass('hiddenx');
        outView.hide();

        inView.$el.removeClass('animatestart1 lview');
        inView.$el.removeClass('cm-page--left-in');

        outView.$el.removeClass('animatestart1 tview');
        outView.$el.removeClass('cm-page--right-out');

        callback && callback.call(scope, inView, outView);

      }, 340);
    }
  };

  var Debug = false;
  var host = window.location.host;
  var pathname = window.location.pathname;
  if(host.match(/^localhost/i) || pathname === '/d.html'){
    Debug = true;
  }

  require(['AbstractApp'], function (App) {
    //实例化App
    var app = new App({
      //选择pushState还是hashChange
      hasPushState: false,
      'defaultView': Debug ? 'index' : 'home',
      'viewRootPath': '' + project + 'views/',
      animations: animations
    });

    window.Blade = app;

    $.bindFastClick && $.bindFastClick();

  });
})();
