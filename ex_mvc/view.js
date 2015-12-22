define(['UIView'], function (AbstractView) {

  return _.inherit(AbstractView, {

    propertys: function ($super) {
      $super();
      this.openShadowDom = false;
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

    addEvent: function ($super) {
      $super();

      this.on('onShow', function () {
         this.initHeader();

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

    // formatCode: function () {
    //   window.sss = this;
    //   hljs.initHighlighting(this);
    // }

  });

});
