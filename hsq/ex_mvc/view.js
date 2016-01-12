define(['UIView', 'UIDownTip', 'UILoadingLayer'], function (AbstractView, UIDownTip, UILoadingLayer) {

  return _.inherit(AbstractView, {

    propertys: function ($super) {
      $super();
      this.openShadowDom = false;
    },

    resetPropery: function ($super) {
      $super();

      this.addEvents({
        'click #J_down_tip': 'closeDownTip',
      });

      var i = 0, len = 0 , k;

      if(this.APP && this.APP.interface) {
        for(i = 0, len = this.APP.interface.length; i < len; i++){
          k = this.APP.interface[i];
          if(_.isFunction(this.APP[k])) this[k] = $.proxy(this.APP[k], this.APP);
        }
      }

    },

    addEvent: function ($super) {
      $super();

      this.on('onCreate', function () {
        this.onCreate && this.onCreate();
      });

      this.on('onShow', function () {
        console.log(1234);
        this.initHeader();
        var downTip = new UIDownTip();
        downTip.checkStatus();
        this.onShow && this.onShow();
      });

      this.on('onHide', function () {
        this.mask.hide();
      });

      this.on('onDestroy', function () {
        this.mask.destroy();
      });

    },

    initHeader: function () {
      Blade.header.set({
        back: {
          tagname: 'back',
          callback: function () {
            Blade.back('index');
          }
        },
        title: 'blade APP'
      });
      Blade.header.show();

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
    // formatCode: function () {
    //   window.sss = this;
    //   hljs.initHighlighting(this);
    // }

  });

});
