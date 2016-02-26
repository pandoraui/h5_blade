define(['UIView', 'UIHeader', 'UIDownTip', 'UILoadingLayer', 'UIToast'], function (AbstractView, UIHeader, UIDownTip, UILoadingLayer, UIToast) {

  return _.inherit(AbstractView, {
    header: null,
    propertys: function ($super) {
      $super();
      this.openShadowDom = false;

      var events = $.extend({}, this.commonEvents, this.events);
      this.addEvents(events);
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

    commonEvents: {
      'click #J_down_tip': 'closeDownTip',
      'click [data-link]': 'goLink',
    },

    addEvent: function ($super) {
      $super();

      this.on('onCreate', function () {
        this.onCreate && this.onCreate();
      });

      this.on('onShow', function () {
        console.log(1234);

        //生成头部
        this._createHeader();

        this.initHeader();
        var downTip = new UIDownTip();
        downTip.checkStatus();
        this.onShow && this.onShow();


      });

      this.on('onHide', function () {
        this.mask && this.mask.hide();
      });

      this.on('onDestroy', function () {
        this.mask && this.mask.destroy();
      });

    },
    /**
     * 生成头部
     */
    _createHeader: function () {
      var $header = $('.header-wrapper');
      this.header = new UIHeader({
        wrapper: $header
      });
    },
    initHeader: function () {
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
      var target = $(e.currentTarget);
      target.hide();
    },

    showLoading: function(tip){
      Blade.loading.show();
    },
    hideLoading: function(tip){
      Blade.loading.hide();
    },
    showToast: function(content, timer){
      var content = content || '正在处理中...';
      var timer = timer || 2000;

      if(!this.__toast){
        this.__toast = new UIToast({
          content: content,
          hideSec: timer
        });
      }else{
        this.__toast.content = content;
        this.__toast.hideSec = timer;
      }
      this.__toast.show();
    },
    // formatCode: function () {
    //   window.sss = this;
    //   hljs.initHighlighting(this);
    // }
    goLink: function(e){
      var target = $(e.currentTarget),
          link = target.data('link');

      Blade.forward(link);


    },
  });

});
