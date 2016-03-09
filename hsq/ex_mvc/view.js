define(['UIView', 'UIHeader', 'UIDownTip', 'UILoadingLayer', 'UIToast', 'UIAlert'], function (AbstractView, UIHeader, UIDownTip, UILoadingLayer, UIToast, UIAlert) {
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

  var waitAjaxPage = {
    'index': 0,
    'list': 0,
    'detail': 1,
    'order': 1,
    'order_success': 0,
    'address': 0,
    'address_update': 0,
    'quick_login': 0,
  };

  return _.inherit(AbstractView, {
    header: null,
    waitAjax: false,
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
      'click .refreshPage': 'refreshPage'
    },

    addEvent: function ($super) {
      $super();

      this.on('onCreate', function () {
        this.onCreate && this.onCreate();
      });

      this.on('onShow', function () {
        //生成头部
        this._createHeader();

        //获取 url 参数
        this.params = _.getUrlParam();

        this.onShow && this.onShow();
      });

      this.on('onHide', function () {
        this.mask && this.mask.hide();
        this.onHide && this.onHide();
      });

      this.on('onDestroy', function () {
        this.mask && this.mask.destroy();
        this.onDestroy && this.onDestroy();
      });

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
      this.waitAjax = !!waitAjaxPage[pageName] || false;
    },
    /**
     * 生成头部
     */
    _createHeader: function () {
      this.header = new UIHeader({
        wrapper: $header
      });

      this.setHeader();

      if(this.header && this.header.center && this.header.center.value && this.header.center.value[0]){
        var title = this.header.center.value[0];
        this.updateTitle(title + '-好食期');
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
    updateTitle: function(title){
      document.title = title || '好食期';
    },
    closeDownTip: function(e){
      this.downTip.hide();
      // target.hide();
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
      var content = content || '正在处理中...';
      var timer = timer || 1500;

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

      this.forward(link);
    },
    show404: function(type){
      this.$el.html(warning404);
    },
    refreshPage: function(){
      window.location.reload();
    },
  });

});
