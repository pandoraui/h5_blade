define(['View', 'Swiper', getViewTemplatePath('detail')],
  function (View, Swiper, viewhtml){

    return _.inherit(View, {
      propertys: function ($super) {
        $super();

        this.template = viewhtml;
        this.addEvents({
          'click .js_demo01': 'demo01',
          'click .js_demo02': 'demo02'
        });
      },

      addEvent: function ($super) {
        $super();
        //在页面显示后做的事情
        this.on('onShow', function () {
          this.initPage();
        });
      },

      initHeader: function () {
        var scope = this;
        Blade.header.set({
          back: false,
          title: '商品详情',
          // callback: function(){
          //   scope.back();
          // }
        });
        Blade.header.show();
      },
      //初始化页面
      initPage: function () {
        var scope = this;

        // $.swiper = function (container, params) {
        //     return new $.Swiper(container, params);
        // };

        var container = $(".swiper-container");
        var params = {};
        var swiper = new $.Swiper(container, params);
        // $(".swiper-container").swiper(config)
      },
      renderPage: function(){

      },
    });
});
