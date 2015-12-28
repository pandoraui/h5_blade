define(['View', 'AppModel', 'UISwiper', getViewTemplatePath('detail')],
  function (View, AppModel, UISwiper, viewhtml){

    var ajaxTest = AppModel.getTestPage.getInstance();
    var ajaxGetDetailDesc = AppModel.getDetailDesc.getInstance();
    var ajaxGetDetailArticle = AppModel.getDetailArticle.getInstance();

    return _.inherit(View, {
      propertys: function ($super) {
        $super();

        // this.template = viewhtml;
        // this.$el.html(viewhtml);
        this.addEvents({
          'click .js_demo01': 'demo01',
          'click .js_demo02': 'demo02'
        });
      },

      addEvent: function ($super) {
        $super();
        //在页面显示后做的事情
        this.on('onShow', function () {
          this.$el.html(viewhtml);
          this.$tplbox = {
            detail_desc: this.$el.find('#tplbox_detail'),
            detail_article: this.$el.find('#tplbox_detail_article'),
          };
          this.$tpl = {
            detail_desc: this.$el.find('#tpl_detail').html(),
            detail_article: this.$el.find('#tpl_detail_article').html(),
          };

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
      dealParams: function(params){
        for(var key in params){
          if(!params[key]){
            delete(params[key]);
          }
        }
        return params;
      },
      //初始化页面
      initPage: function () {
        var scope = this;

        // $.swiper = function (container, params) {
        //     return new $.Swiper(container, params);
        // };

        var params = _.getUrlParam();

        ajaxGetDetailDesc.param = {
          productId: params.id,
          skuId: params.sid,
        };

        this.dealParams(ajaxGetDetailDesc.param);

        ajaxGetDetailDesc.execute(function(res){
          //成功
          console.log(res);

          var data = res.data;

          if(!params.id){
            this.productId = data.product_id;
            this.renderDetailArticle();
          }

          this.renderPage(data);
        },function(error){
          //失败
          console.log(error);
          console.log(error.errmsg);
        },this);

        if(params.id){
          this.productId = params.id;
          this.getDetailArticle();
        }
        // $(".swiper-container").swiper(config)
      },
      renderPage: function(data){
        console.log('渲染页面');

        var container = this.$el.find('.swiper-container');
        var imgList = data.pics || [];
        // [
        //   'http://gqianniu.alicdn.com/bao/uploaded/i4//tfscom/i1/TB1n3rZHFXXXXX9XFXXXXXXXXXX_!!0-item_pic.jpg_640x640q60.jpg',
        //   'http://gqianniu.alicdn.com/bao/uploaded/i4//tfscom/i4/TB10rkPGVXXXXXGapXXXXXXXXXX_!!0-item_pic.jpg_640x640q60.jpg',
        //   'http://gqianniu.alicdn.com/bao/uploaded/i4//tfscom/i1/TB1kQI3HpXXXXbSXFXXXXXXXXXX_!!0-item_pic.jpg_640x640q60.jpg'
        // ];
        var swiper = new UISwiper(container, imgList);

        var html_desc = _.template(this.$tpl.detail_desc)(data);
        this.$tplbox.detail_desc.html(html_desc);

      },
      //继续请求图文详情接口
      getDetailArticle: function(){
        ajaxGetDetailArticle.param = {
          productId: this.productId
        };

        ajaxGetDetailArticle.execute(function(res){
          //成功
          console.log(res);

          var data = res.data;

          this.renderDetailArticle(data);
        },function(error){
          //失败
          console.log(error);
          console.log(error.errmsg);
        },this);
      },
      renderDetailArticle: function(data){
        var html_article = _.template(this.$tpl.detail_article)(data);
        this.$tplbox.detail_article.html(html_article);
      },
    });
});
