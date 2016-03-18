
// 百度统计配置
define(['Detect'],function(Detect){

  if (!window._hmt) window._hmt = [];

  //详细参看 http://tongji.baidu.com/open/api/more?p=ref_setCustomVar
  var BaiduTongji = {
    trackPage: function(pageURL){
      _hmt && _hmt.push(['_trackPageview', pageURL]);
    },
    trackEvent: function(category, action, opt_label){
      _hmt && _hmt.push(['_trackEvent', category, action, opt_label, opt_value]);
    },
    customVar: function(index, name, value, opt_scope){
      _hmt && _hmt.push(['_setCustomVar', index, name, value, opt_scope]);
    },
    CustomIndex: {
      PAGE:     1,
      LOGGED:   2,
      HOST:     3,
      PLATFORM: 4,
      CUSTOM:   5
    },
    CustomName: {
      PAGE:      'page',
      LOGGED:    'logged',
      HOST:      'host',
      PLATFORM:  'platform',
      CUSTOM:    'custom'
    },
    CustomScope: {
      PAGE: 3,      // 对于页面的统计，使用页面级别
      LOG: 2,       // 对于访问的用户是否登陆，使用访次级别
      HOST: 3,      // 统计web的宿主，是webview还是浏览器，使用页面级别
      PLATFORM: 3   // 统计访问平台，android/ios...，使用页面级别
    },
    CustomValue: {
      LOGGED_YES:          'Logged_yes',
      LOGGED_NO:           'Logged_no',
    },

  };

  return BaiduTongji;
});
