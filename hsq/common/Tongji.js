
// 百度统计配置
define(['Detect'],function(Detect){

  if (!window._hmt) window._hmt = [];

  //详细参看 http://tongji.baidu.com/open/api/more?p=ref_setCustomVar
  var BaiduTongji = {
    _trackPage: function(pageURL){
      //统计页面 pv，若包含 hash 则被无视
      _hmt && _hmt.push(['_trackPageview', pageURL]);
    },
    _trackEvent: function(category, action, opt_label, opt_value){
      //需要统计的事件：如定位，下载，下单，支付，分享等
      _hmt && _hmt.push(['_trackEvent', category, action, opt_label, opt_value]);
    },
    _customVar: function(index, name, value, opt_scope){
      //需要统计的数据：访问状态是否登录，宿主，设备平台等
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
    CustomEvent: {  //统计的是行为，不在乎他有没有验证通过，如登录
      //event:              [category, action, opt_label, opt_value]
      //点击了立即购买
      'gobuy':              ['gobuy', 'click_gobuy', 'click_gobuy_btn', ''],
      //点击提交订单
      'order_submit':       ['order_submit', 'click_submit', 'click_submit_btn', ''],
      //提交订单，自动去支付
      'auto_order_pay':     ['order_pay', 'auto_order_pay', 'auto_order_pay', ''],
      //提交订单失败，再次click，不再提交，也去支付（不重新提交订单了）
      'click_order_pay':    ['order_pay', 'click_order_pay', 'click_order_pay', ''],
      //点击继续支付按钮
      'continue_order_pay': ['order_pay', 'continue_to_pay', 'click_continue_to_pay_btn', ''],
      //快捷登录
      'quick_login':        ['quick_login', 'click_login', 'click_quick_login_btn', ''],
      //点击了推荐有奖 注册
      'reg_reward':         ['register', 'click_register', 'click_reg_reward_register_btn', ''],
      // 'order_submit_suc':       ['order_submit', 'submit', 'order_submit', ''],
    },
    // EventCategory: {
    //   DOWNLOAD: 'download',
    //   GOBUY: 'gobuy',
    //   ORDER_SUBMIT: 'order_submit',
    //   ORDER_PAY: 'order_pay',
    //   GEO: 'geo',
    //   SHARE: 'share',
    //
    //   // 睡前摇分享
    //   MOTION_SHARE: 'motion_share'
    // },
    // EventAction: {
    //   CLICK_DOWN_BTN: 'click_down_btn',
    //   ORDER_CANCEL: 'order_cancel',
    //   ORDER_SUBMIT: 'order_cancel',
    //   ORDER_PAY: 'order_cancel',
    //   GEO_SUC: 'geo_suc',
    //   GEO_ERR: 'geo_err',
    //
    //   // MOTION_SHARE_APP: 'ms_app',
    //   // MOTION_SHARE_WEIXIN: 'ms_wx'
    // },
    // EventLabel: {
    //   // 下订单的过程中，取消订单，并删除订单
    //   ORDER_CANCEL_YES: 'order_cancel_y',
    //   // 下订单的过程中，取消订单，但点击按钮又留下了
    //   ORDER_CANCEL_NO_BUTTON: 'order_cancel_n_btn',
    //   // 下订单的过程中，取消订单，但点击空白又留下了
    //   ORDER_CANCEL_NO_MASK: 'order_cancel_n_msk',
    //   ORDER_CANCEL_TIMEOUT: 'order_cancel_timeout'
    // },
  };

  return BaiduTongji;
});
