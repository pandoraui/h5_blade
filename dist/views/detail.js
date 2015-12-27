define(['View', 'AppModel', 'Swiper', getViewTemplatePath('detail')],
  function (View, AppModel, Swiper, viewhtml){

    var ajaxGetHomePage = AppModel.getHomePage.getInstance();

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

        ajaxGetHomePage.param = {};
        ajaxGetHomePage.execute(function(response){
          //成功
          console.log(response);
        },function(error){
          //失败
          console.log(error);
        },this);

        var container = $(".swiper-container");
        var params = {
          // nextButton: '.swiper-button-next',
          // prevButton: '.swiper-button-prev',
          pagination: '.swiper-pagination',
          paginationClickable: true,
          // Disable preloading of all images
          preloadImages: false,
          // Enable lazy loading
          lazyLoading: true
        };
        var swiper = new $.Swiper(container, params);
        // $(".swiper-container").swiper(config)
      },
      renderPage: function(){

      },
    });
});
