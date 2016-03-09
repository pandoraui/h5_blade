define(['PageView', getViewTemplatePath('order_success'), 'AppModel', 'AppStore'],
  function (PageView, viewhtml, AppModel, AppStore){

    // 此订单需要请求 ajax，获取对应的订单相关信息。
    var modelOrderDetail = AppModel.orderDetail.getInstance();

    return _.inherit(PageView, {
      pageName: 'order_success',
      onCreate: function(){
        // var viewhtml = '下单成功';
        this.$el.html(viewhtml);
        //元素集合
        this.els = {
          'hsq_box': this.$el.find('.hsq_box')
        };

        var tpl_hsq_box = this.$el.find('#tpl_hsq_box');

        this.tpls = {
          'hsq_box': tpl_hsq_box.html(),
        };
        tpl_hsq_box.remove();
      },
      setHeader: function(){
        var self = this;
        var headerData = {
          center: {
            tagname: 'title',
            value: ['付款成功']
          },
          back: {
            tagname: 'back',
            value: '返回',
            callback: function() {
              //这里返回订单详情页
              self.back('index');
            }
          }
        };
        this.header.set(headerData);
        this.header.show();
      },
      onShow: function(){

        this.initPage();
      },
      onHide: function(){},
      //初始化页面
      initPage: function(){
        var scope = this;

      },
      ajaxRequest: function(){},
      renderPage: function(){

      },
    });
});
