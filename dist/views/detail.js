define(['View', 'AppModel', 'UISwiper', getViewTemplatePath('detail')],
  function (View, AppModel, UISwiper, viewhtml){

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

        var container = this.$el.find('.swiper-container');
        var imgList = [
          'http://gqianniu.alicdn.com/bao/uploaded/i4//tfscom/i1/TB1n3rZHFXXXXX9XFXXXXXXXXXX_!!0-item_pic.jpg_640x640q60.jpg',
          'http://gqianniu.alicdn.com/bao/uploaded/i4//tfscom/i4/TB10rkPGVXXXXXGapXXXXXXXXXX_!!0-item_pic.jpg_640x640q60.jpg',
          'http://gqianniu.alicdn.com/bao/uploaded/i4//tfscom/i1/TB1kQI3HpXXXXbSXFXXXXXXXXXX_!!0-item_pic.jpg_640x640q60.jpg'
        ];
        var swiper = new UISwiper(container, imgList);
        // $(".swiper-container").swiper(config)
      },
      renderPage: function(){

      },
    });
});
