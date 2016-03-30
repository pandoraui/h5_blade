
/*
* cPageView
* 多数UI View的基类，提供基础方法，以及自建事件机
* @example
* defined('cPageView',function(cPageView){
*  var view = cPageView.extend({
*    //view初始化调用,在生命周期中只调用一次
*    onCreate:function(){
*    },
*    //view显示时调用
*    onShow:function(){
*    ),
*    //view隐藏调用
*    onHide:function(){
*    },
*    //view获得视口时调用,此方法仅在hybrid有效
*    onAppear:function(){
*    }
*  })
* })
*/

define(['cPageView', 'Tongji', 'UIDownTip', 'AppStore', 'SchemaApp'], function (cPageView, Tongji, UIDownTip, AppStore, SchemaApp) {

  var storeLogin = AppStore.Login.getInstance();

  //这个还是放在各自界面比较好
  // var waitAjaxPage = {
  //   'home': 0,
  //   'index': 0,
  //   'list': 1,
  //   'detail': 1,
  //   'order': 1,
  //   'order_success': 1,
  //   'address': 1,
  //   'district': 1,
  // };

  return _.inherit(cPageView, $.extend(SchemaApp, {
    scrollPos: { x: 0, y: 0 },
    header: null,
    waitAjax: false,
    keepScrollPos: false,
    hashChangeParamsRefresh: true,
    _CustomEvent: Tongji.CustomEvent,
    events: {

    },
    onPreShow: function(){
      var loginInfo = storeLogin.get() || {};
      this.logged = !!loginInfo.token;
    },
    ajaxErrNext: function(error){
      var scope = this;
      if(error.errno == 510010){
        storeLogin.remove();
        setTimeout(function(){
          scope.forward('quick_login');
        }, 100);
      }
    },
    downTipCheckStatus: function(){
      this.downTip = new UIDownTip();
      this.downTip.checkStatus();
      return this.downTip;
    },
    closeDownTip: function(e){
      this.downTip.hide();
      // target.hide();
    },
    imgLazyLoad: function(){
      var lazyLoadList = this.$el.find('img.lazy');
      if(lazyLoadList.length){
        lazyLoadList.scrollLoading({
          // container: $('.viewport-wrapper'),
        });
      }
    },
    showToast: function(params){
      if (!params) params = {};
      if (!params || (typeof params == 'string') ) {
        params = {
          content: params || '正在处理中...',
          hideSec: 1500,
        };
      }

      params.validate = (params.content != '用户未登录');

      this._showToast(params);

      // var content = content || '正在处理中...';
      // var timer = timer || 1500;
      //
      // if(content == '用户未登录'){
      //   return false;
      // }
      //
      // if(!this.__toast){
      //   this.__toast = new UIToast({
      //     content: content,
      //     hideSec: timer
      //   });
      // }else{
      //   this.__toast.content = content;
      //   this.__toast.hideSec = timer;
      //
      //   this.__toast.refresh();
      // }
      // this.__toast.show();
    },
    show404: function(type){
      this.$el.html(this._warning404);
    },
  }));

});
