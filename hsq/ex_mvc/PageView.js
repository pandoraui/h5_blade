define(['UIView', 'UIHeader', 'Detect', 'Tongji', 'UIDownTip', 'UILoadingLayer', 'UIToast', 'UIAlert', 'AppStore', 'LazyLoad', 'SchemaUrl'], function (AbstractView, UIHeader, Detect, Tongji, UIDownTip, UILoadingLayer, UIToast, UIAlert, AppStore, LazyLoad, SchemaUrl) {

  var storeLogin = AppStore.Login.getInstance();

  var Debug = false;
  var host = window.location.host;
  var pathname = window.location.pathname;
  if(pathname === '/d.html' || host.match(/^localhost/i) ){
    Debug = true;
  }

  var imgPlaceHold = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEXCwsK592mkAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==";

  var $header = $('.header-wrapper');
  var warning404 = [
    '<div class="warning404">',
    '  <div class="fun">',
    '    <img src="https://placeholdit.imgix.net/~text?txtsize=23&txt=240%C3%97240&w=240&h=240" alt="">',
    '  </div>',
    '  <p>加载失败，请稍后重新加载</p>',
    '  <p><span class="btn btn-pink refreshPage">刷新试试</span></p>',
    '</div>'
  ].join('');

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

  return _.inherit(AbstractView, $.extend(SchemaUrl, {
    /**
     * 滚动条位置
     * @var
     * @private
     */
    scrollPos: { x: 0, y: 0 },
    header: null,
    waitAjax: false,
    hashChangeParamsRefresh: true,
    imgPlaceHold: imgPlaceHold,
    Detect: Detect,
    // initialize: function initialize(options) {
    //   this.__toast = new UIToast();
    // },
    propertys: function ($super) {
      $super();
      this.openShadowDom = false;
      this.addEvents(this.events);
    },

    resetPropery: function ($super) {
      $super();

      var i = 0, len = 0 , k;

      if(this.APP && this.APP.interface) {
        for(i = 0, len = this.APP.interface.length; i < len; i++){
          k = this.APP.interface[i];
          if(_.isFunction(this.APP[k])) this[k] = $.proxy(this.APP[k], this.APP);
        }
      }

    },
    events: {
      'click [data-link]': 'goLink',
      'click .refreshPage': 'refreshPage',
      'click [data-event="tj"]': '_trackEvent',
    },
    addEvent: function ($super) {
      $super();

      this.on('onCreate', function () {
        this.__openDebug();
        this.onCreate && this.onCreate();
      });

      this.on('onPreShow', function () {
        // this.saveScrollPos();
      });

      this.on('onShow', function () {
        //获取 url 参数
        this.params = _.getUrlParam();

        this._updatePageOptions();

        //生成头部 如果在好食期 App 里，不要生成头部，但要更新 document.title
        this._createHeader( this.Detect.isHsq );


        if (this.onBottomPull) {
          this._onWidnowScroll = $.proxy(this.onWidnowScroll, this);
          this.addScrollListener();
        }

        if (this.scrollZero) {
          this.scrollTo(0, 0);
        }

        this.onShow && this.onShow();

        this.sendHmt();

        //如果定义了addScrollListener,说明要监听滚动条事,此方法在cListView中实现
        // this.addScrollListener && this.addScrollListener();
      });

      this.on('onHide', function () {
        // this.hideLoading();
        // this.abort();
        // this.__toast && this.__toast.hide();
        // this.saveScrollPos();

        this.removeScrollListener && this.removeScrollListener();
        this.mask && this.mask.hide();
        this.onHide && this.onHide();
      });

      this.on('onDestroy', function () {
        this.mask && this.mask.destroy();
        this.onDestroy && this.onDestroy();
      });

    },
    __openDebug: function(){
      if(Debug){
        this.Debug = Debug;
      }
    },
    downTipCheckStatus: function(){
      this.downTip = new UIDownTip();
      this.downTip.checkStatus();
      return this.downTip;
    },
    _updatePageOptions: function(pageName){
      var pageName = pageName || this.pageName;
      if (!pageName) {
        throw Error("This view need set the pageName!!!");
        return;
      }
      // this.waitAjax = !!waitAjaxPage[pageName] || false;

      //个别第三方程序，不经判断，不管 url 是否已经有 ？都直接后面添加？带自己的参数，
      //这很坑，要处理一下
      // var href = window.location.href;

      // window.history.replaceState(null, document.title, href);

      var loginInfo = storeLogin.get() || {};
      this.logged = !!loginInfo.token;

    },
    /**
     * 保存滚动条位置
     */
    saveScrollPos: function (x, y) {
      this.scrollPos = {
        x: x || window.scrollX,
        y: y || window.scrollY,
      };
      // console.log('保存位置：', this.scrollPos);
    },

    /**
     * 恢复原滚动条位置
     * @method View.cPageView.restoreScrollPos
     */
    restoreScrollPos: function () {
      var scrollPos = this.scrollPos;
      setTimeout(function(){
        window.scrollTo(scrollPos.x, scrollPos.y);
      }, 100);
    },
    scrollTo: function(x, y){
      window.scrollTo(x||0, y||0);
    },
    /**
     * 生成头部
     */
    _createHeader: function (isInApp) {
      this.header = new UIHeader({
        wrapper: $header
      });

      this.setHeader();

      if(isInApp){
        this.header.hide();
        this.$body.addClass('is_in_app');
      }else{
        this.header.show();
        this.$body.removeClass('is_in_app');
      }

      if(this.header && this.header.center && this.header.center.value && this.header.center.value[0]){
        var title = this.header.center.value[0];
        this.setTitle(title);
      }
    },
    setHeader: function () {
      var self = this;
      // var headerData = {
      //   center: {
      //     tagname: 'title',
      //     value: ['好食期']
      //   }
      // };
      // this.header.set(headerData);
      // this.header.show();
    },
    setTitle: function(title){
      document.title = title || '好食期';
    },
    errNextDeal: function(error){
      var scope = this;
      if(error.errno == 510010){
        storeLogin.remove();
        setTimeout(function(){
          scope.forward('quick_login');
        }, 100);
      }
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
    showLoading: function(tip, closeBtn){
      var tip = tip || '加载中...';
      var closeBtn = closeBtn || false;

      // if(!this.loading){
      //   this.__loading = new UILoadingLayer({
      //     content: tip,
      //     closeBtn: close
      //   });
      // }else{
      //   this.__toast.content = tip;
      //   this.__toast.closeBtn = closeBtn;
      //
      //   this.__toast.refresh();
      // }

      // this.__loading.show();
      Blade.loading.show();
    },
    hideLoading: function(tip){
      // this.__loading && this.__loading.hide();
      Blade.loading.hide();
    },
    showToast: function(content, timer){
      // if (!params) params = {};
      // if (typeof params == 'string') {
      //   params = {
      //     datamodel: {
      //       content: params
      //     }
      //   };
      // }
      //
      // this._toast.resetDefaultProperty();
      // this._toast.setOption(params);
      // this._toast.refresh();
      // this._toast.show();

      var content = content || '正在处理中...';
      var timer = timer || 1500;

      if(content == '用户未登录'){
        return false;
      }

      if(!this.__toast){
        this.__toast = new UIToast({
          content: content,
          hideSec: timer
        });
      }else{
        this.__toast.content = content;
        this.__toast.hideSec = timer;

        this.__toast.refresh();
      }
      this.__toast.show();


    },
    showAlert: function(opts){
      var _default = {
        title: '提醒',
        content: '确认要这样操作吗？',
        btns: [
          { name: '取消', className: 'cui-btns-no' },
          { name: '确定', className: 'cui-btns-ok' }
        ],
        events: {
          'click .cui-btns-no': 'noAction',
          'click .cui-btns-ok': 'okAction',
        },
        noAction: function() {
          this.hide();
        },
        okAction: function() {
          this.hide();
        }
      };
      var options = $.extend({}, _default, opts || {});

      if(!this.__alert){
        this.__alert = new UIAlert(options);
      }else{
        //怎么更新内容呢？
        this.__alert = $.extend(this.__alert, options);

        this.__alert.refresh();
      }
      this.__alert.show();
    },
    // formatCode: function () {
    //   window.sss = this;
    //   hljs.initHighlighting(this);
    // }
    goLink: function(e){
      var target = $(e.currentTarget),
          link = target.data('link');

      switch (link) {
        case 'iframe_page':
            var iframeUrl = target.attr('href');
            var iframeTitle = target.attr('title');
            if( iframeUrl && iframeTitle ){
              e.preventDefault();
              e.stopPropagation();
              this.forward('iframe_page?title=' + iframeTitle + '&iframe_url=' + encodeURIComponent(iframeUrl) );
            }
          break;
        default:
          this.forward(link);
      };
    },
    show404: function(type){
      this.$el.html(warning404);
    },
    refreshPage: function(){
      window.location.reload();
    },
    /**
     * 发送 _hmt 百度统计代码
     * @method pageView.sendHmt()
     * 关于统计，在使用上，要更为便捷才可以，配置自定义属性，即可统计数据
     */
    sendHmt: function (retry) {
      if (!window._hmt) window._hmt = [];
      var url = this.$root.attr('page-url'),
          pageId = "",
          orderid = "";
      // if (pageId === 0) {
      //   return;
      // }
      if(Debug || !url) return;

      var customValue = this.logged ? Tongji.CustomValue.LOGGED_YES : Tongji.CustomValue.LOGGED_NO;

      //统计是否登录
      Tongji._customVar(Tongji.CustomIndex.LOGGED, Tongji.CustomName.LOGGED, customValue, Tongji.CustomScope.LOG);
      //统计web页面宿主
      Tongji._customVar(Tongji.CustomIndex.HOST, Tongji.CustomName.HOST, Detect.host || 'PC', Tongji.CustomScope.HOST);
      //统计访问平台
      Tongji._customVar(Tongji.CustomIndex.PLATFORM, Tongji.CustomName.PLATFORM, Detect.platform || 'PC', Tongji.CustomScope.PLATFORM);



      /*注意：以下格式链接会被过滤，不统计
        带 hash 值的
        包含 window.location.origin 的
        完整链接也不行 window.location.href

        标准格式如： _hmt.push(['_trackPageview', '/virtual/login']);
      */

      // var hmtURL = window.location.origin + window.location.pathname + '/' + url;
      // var hmtURL = window.location.pathname + '#' + url;
      // var hmtURL = window.location.href;

      var searchParams = '';
      if( !$.isEmptyObject(this.params) ){
        searchParams =  '?' + $.param(this.params);
      }
      var hmtURL = '/' + url + searchParams;
      //统计 PV
      Tongji._trackPage(hmtURL);

      // var refererView = Lizard.instance.views[this.referrer];
      // window.__bfi.push(['_asynRefresh', {
      //   page_id: pageId,
      //   orderid: orderid,
      //   url: this._hybridUrl(ubtURL),
      //   refer: refererView?refererView._hybridUrl(window.location.protocol + '//' + window.location.host + refererView.$el.attr('page-url')):document.referrer
      // }]);
    },
    //统计事件，通过 type 统一调用 Tongji 模块中对应的参数
    trackEvent: function(type){
      var curEvent = Tongji.CustomEvent[type];
      if(!curEvent || Debug) return;

      Tongji._trackEvent.apply(Tongji, curEvent);
    },
  }));

});
