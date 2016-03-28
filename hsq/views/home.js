define(['PageView', getViewTemplatePath('test'), 'AppModel', 'AppStore'],
  function (PageView, viewhtml, AppModel, AppStore){

    var viewhtml = [
        '<div class="xcard guide-box text-center">',
        '  <div class="header">',
        '    <p class="app-logo"><img src="assets/img/logo.png" width="60" height="60" alt=""></p>',
        '    <h2>专做食品特卖</h2>',
        '  </div>',
        '  <div class="intro-text">',
        '    <p>【精挑细选】国内外知名品牌鼎力加盟，样样都是精心挑选</p>',
        '    <p>【超低价位】全场低价，限时限量</p>',
        '    <p>【全场包邮】无论买多少，全场都包邮</p>',
        '    <p>【服务到家】享受一站式服务，足不出户坐等美食上门</p>',
        '  </div>',
        '  <div class="intro-img">',
        '    <p><img class="hsq-img" src="http://7xr4hg.com1.z0.glb.clouddn.com/static/hsq/images/features/s1_7386bbf782.jpg" alt=""></p>',
        '    <p><img class="hsq-img" src="http://7xr4hg.com1.z0.glb.clouddn.com/static/hsq/images/features/s2_d2b6269e28.jpg" alt=""></p>',
        '    <p><img class="hsq-img" src="http://7xr4hg.com1.z0.glb.clouddn.com/static/hsq/images/features/s3_54a9590066.jpg" alt=""></p>',
        '    <p><img class="hsq-img" src="http://7xr4hg.com1.z0.glb.clouddn.com/static/hsq/images/features/s4_30fca8a206.jpg" alt=""></p>',
        '  </div>',
        '</div>'].join('');

    return _.inherit(PageView, {
      pageName: 'help',
      onCreate: function(){
        // var viewhtml = '下单成功';
        this.$el.html(viewhtml);
        //元素集合
        // this.els = {
        //   'hsq_box': this.$el.find('.hsq_box')
        // };
        //
        // var tpl_hsq_box = this.$el.find('#tpl_hsq_box');
        //
        // this.tpls = {
        //   'hsq_box': tpl_hsq_box.html(),
        // };
        // tpl_hsq_box.remove();
      },
      setHeader: function(){
        var self = this;

        var headerData = {
          center: {
            tagname: 'title',
            value: ['好食期']
          },
          back: false,
          // back: {
          //   tagname: 'back',
          //   value: '返回',
          //   callback: function() {
          //     //这里返回订单详情页
          //     self.backAction();
          //   }
          // }
        };
        this.header.set(headerData);
      },
      onShow: function(){
        this.initPage();
      },
      onHide: function(){},
      //初始化页面
      initPage: function(){
        var scope = this;

        this.ajaxRequest();
      },
      ajaxRequest: function(){

      },
      renderPage: function(data){

      },
    });
});
