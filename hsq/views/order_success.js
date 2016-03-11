define(['PageView', getViewTemplatePath('order_success'), 'AppModel', 'AppStore'],
  function (PageView, viewhtml, AppModel, AppStore){

    // 此订单需要请求 ajax，获取对应的订单相关信息。
    var modelOrderDetail = AppModel.orderDetail.getInstance();

    var orderStatus = [{
        title: '订单详情'
      }, {
        status_code: 1,
        status: '未支付',
        title: '待付款，订单付款请使用好食期app'
      }, {
        status_code: 2,
        status: '已支付',
        title: '恭喜您，付款成功！'
      }, {
        status_code: 3,
        status: '已完成',
        title: '交易完成'
      }, {
        status_code: 4,
        status: '已取消',
        title: '交易关闭'
      }, {
        status_code: 5,
        status: '申请退款',
        title: '退款待审核'
      }, {
        status_code: 6,
        status: '退款中',
        title: '退款中'
      }, {
        status_code: 7,
        status: '已退款',
        title: '已退款'
      },
    ];

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
            value: ['订单详情']
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

          var status_code = data.statusCode || 0;
          this.renderPage({
            order: data,
            status: orderStatus[status_code] || orderStatus[0],
          });
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
