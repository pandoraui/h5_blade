define(['PageView', getViewTemplatePath('zt_reg_awards'), 'AppModel', 'AppStore'],
  function (PageView, viewhtml, AppModel, AppStore){

    return _.inherit(PageView, {
      pageName: 'zhuti',
      events: {
        // 'click .J_go_pay': 'goPay',
      },
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
            value: ['推荐有奖']
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
        this.back();
      },
      onShow: function(){
        this.initPage();
      },
      onHide: function(){},
      //初始化页面
      initPage: function(){
        var scope = this;

        // this.ajaxRequest();
      },
      ajaxRequest: function(){
        var scope = this;

        this.showLoading();
        modelOrderDetail.param = {
          orderId: this.params.oid,
        };
        modelOrderDetail.execute(function(res){
          this.hideLoading();
          //成功
          console.log(res);

          var data = res.data;

          this.orderId = data.id;
          this.skuId = data.skuList && data.skuList[0] && data.skuList[0].skuId;

          var status_code = data.statusCode || 0;
          this.renderPage({
            order: data,
            status: orderStatus[status_code] || orderStatus[0],
          });

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
