define(['PageView', getViewTemplatePath('order_success'), 'AppModel', 'AppStore'],
  function (PageView, viewhtml, AppModel, AppStore){

    // 此订单需要请求 ajax，获取对应的订单相关信息。
    var modelOrderDetail = AppModel.orderDetail.getInstance();
    var modelOrderPay = AppModel.orderPay.getInstance();

    var orderStatus = [{
        title: '订单详情'
      }, {
        status_code: 1,
        status: '未支付',
        title: '待付款'
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
      events: {
        'click .J_go_pay': 'goPay',
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

        var title = this.params.oid ? '订单详情' : '下载';
        var headerData = {
          center: {
            tagname: 'title',
            value: [title]
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
      },
      backAction: function(){
        if(this.skuId){
          this.back('detail?sid=' + this.skuId);
        }else{
          this.back();
        }
      },
      onShow: function(){
        this.initPage();
      },
      onHide: function(){},
      //初始化页面
      initPage: function(){
        var scope = this;

        if(this.params.oid){
          // this.showToast('订单号不存在！');
          // this.waitAjax = true; 该页面默认设定了等待 ajax 加载
          this.ajaxRequest();
        }else{
          this.hideLoading();
        }
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
      goPay: function(){
        //modelOrderPay
        //据说这里的回跳地址不能带 ‘#’ 号，故作此中转页面
        var returnUrl = window.location.origin + '/jump.html?oid=' + this.orderId;

        this.trackEvent('continue_order_pay');

        this.showLoading();
        modelOrderPay.param = {
          orderIds: this.orderId,
          type: 4,
          returnUrl: returnUrl, //回跳地址，目前回跳到订单成功页面
        };
        modelOrderPay.execute(function(res){
          this.hideLoading();
          //成功
          var data = res.data;

          this.paymentId = data.paymentId;
          this.requestUrl = data.requestUrl;

          // this.jump(requestUrl);
          window.location.href = this.requestUrl;
          // this.showToast('下单成功');

        },function(error){
          //失败
          this.showToast(error.errmsg);
        },this);
      },
    });
});
