define(['UIView', 'UIHeader', 'UIDownTip', 'UILoadingLayer', 'UIToast'], function (AbstractView, UIHeader, UIDownTip, UILoadingLayer, UIToast) {
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

  return _.inherit(AbstractView, {
    header: null,
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

        this.setHeader();

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
    /**
     * 生成头部
     */
    _createHeader: function () {

      this.header = new UIHeader({
        wrapper: $header
      });
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

      setTimeout(function(){
        if(self.header && self.header.center && self.header.center.value && self.header.center.value[0]){
          var title = self.header.center.value[0];
          self.updateTitle(title);
        }
      },100)
    },
    updateTitle: function(title){
      document.title = title || '好食期';
    },
    closeDownTip: function(e){
      this.downTip.hide();
      // target.hide();
    },
    showLoading: function(tip){
      Blade.loading.show();
    },
    hideLoading: function(tip){
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
    // formatCode: function () {
    //   window.sss = this;
    //   hljs.initHighlighting(this);
    // }
    goLink: function(e){
      var target = $(e.currentTarget),
          link = target.data('link');

      Blade.forward(link);
    },
    show404: function(type){
      this.$el.html(warning404);
    },
    refreshPage: function(){
      window.location.reload();
    },
  });

});
