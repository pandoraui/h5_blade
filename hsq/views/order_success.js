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
              self.backAction();
            }
          }
        };
        this.header.set(headerData);
        this.header.show();
      },
      backAction: function(){
        this.back('detail?sid=' + this.skuId);
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
        var scope = this;
        if(!this.params.oid){
          this.showToast('订单号不存在！');
          return;
        }

        this.showLoading();
        modelOrderDetail.param = {
          orderId: this.params.oid,
        };
        modelOrderDetail.execute(function(res){
          //成功
          console.log(res);

          var data = res.data;

          this.skuId = data.skuList && data.skuList[0] && data.skuList[0].skuId;

          this.renderPage({order: data});
          this.hideLoading();

        },function(error){
          //失败
          this.showToast(error.errmsg);
        },this);
      },
      renderPage: function(data){
        var html = _.template(this.tpls.hsq_box)(data);
        this.els.hsq_box.html(html);
      },
    });
});
