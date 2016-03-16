define(['PageView', getViewTemplatePath('order'), 'AppModel', 'AppStore', 'Detect'],
  function (PageView, viewhtml, AppModel, AppStore, Detect){

    var storeAddress = AppStore.Address.getInstance();
    var storeWifiKeyParams = AppStore.wifiKeyParams.getInstance();
    var modelOrderInit = AppModel.orderInit.getInstance();
    var modelOrderSubmit = AppModel.orderSubmit.getInstance();
    var modelOrderPay = AppModel.orderPay.getInstance();

    var isWifiKey = Detect.isWifiKey;

    return _.inherit(PageView, {
      pageName: 'order',
      events: {
        'click .J_s_invoice': 'selectInvoice',
        'click .J_s_invoice_types label': 'selectInvoiceTypes',
        'click .J_go_pay': 'orderSubmit',
      },
      onCreate: function(){
        this.$el.html(viewhtml);
        //元素集合
        this.els = {
          'hsq_box': this.$el.find('.hsq_box'),
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
            value: ['订单支付']
          },
          back: {
            tagname: 'back',
            value: '返回',
            callback: function() {
              self.back();
            }
          }
        };
        this.header.set(headerData);
        this.header.show();
      },
      onShow: function(){
        this.initPage();
      },
      onHide: function(){
        this.requestUrl = null;
      },
      //初始化页面
      initPage: function(){
        var scope = this;

        this.curAddress = storeAddress.get();

        this.invoiceId = 1;
        this.ajaxRequest();
      },
      ajaxRequest: function(){
        var skusInfo = {
          skuId: this.params.sid,
          amount: this.params.amount,
          price: this.params.price
        };

        modelOrderInit.param = {
          addressId: '',
          skusInfo: JSON.stringify([skusInfo]),
        };

        this.showLoading();
        modelOrderInit.execute(function(res){
          this.hideLoading();
          //成功
          console.log(res);

          var data = res.data;

          if(!this.curAddress){
            this.curAddress = data.address || null;
          }

          //确认订单序列号
          this.confirmSid = data.confirmSid;

          this.renderPage(data);

        },function(error){
          //失败
          console.log(error);
          this.showToast(error.errmsg);
        },this);
      },
      renderPage: function(data){
        var address = this.curAddress;
        if(address){
          var tempCity = address.province == address.city ? address.city : (address.province + address.city);
          address.detail = tempCity + address.district + address.detail_address;
        }
        var pageData = {
          address: address,
          pInfo: data.packageInfo,
          paymentway: '',
        };

        var html = _.template(this.tpls.hsq_box)(pageData);
        this.els.hsq_box.html(html);

        this.els.$invoice_title = this.$el.find('.J_invoice_title');
      },
      selectInvoice: function(e){
        var target = $(e.currentTarget);
        var $header = target.find('.icon-select');

        if(!this.useInvoice){
          $header.addClass('icon-selected');
          target.next().show();
          this.useInvoice = true;

          this.invoiceId = (this.invoiceType == 'company') ? 3 : 2;
        }else{
          $header.removeClass('icon-selected');
          target.next().hide();
          this.useInvoice = false;
          this.invoiceId = 1;
        }
      },
      selectInvoiceTypes: function(e){
        var target = $(e.currentTarget);
        var $radioBox = target.find('.icon-select');

        this.invoiceType = target.data('type');
        this.invoiceId = (this.invoiceType == 'company') ? 3 : 2;
        target.find('.icon-select').addClass('icon-selected').end()
              .siblings().find('.icon-select').removeClass('icon-selected');
      },
      checkOrderStatus: function(){
        if(!this.curAddress){
          this.showToast('请选择一个邮寄地址');
          return false;
        }

        if(this.invoiceId == 3){
          this.invoceTitle = this.els.$invoice_title.val().trim();
          if(!this.invoceTitle){
            this.showToast('请填写发票抬头');
            return false;
          }
        }else{
          this.invoceTitle = null;
        }

        return true;
      },
      orderSubmit: function(){
        //去支付，要先检查下单条件是否满足：邮寄地址，发票选择
        if( !this.checkOrderStatus() ){
          return;
        }

        if(this.requestUrl){
          this.goPay();
          return;
        }
        var invoiceInfo = {
          type: this.invoiceId,
          title: this.invoceTitle || '',
        };


        modelOrderSubmit.param = {
          addressId: this.curAddress.id,
          invoice: JSON.stringify(invoiceInfo),
          notes: JSON.stringify({}),
          confirmOrderSerialId: this.confirmSid,
          couponCode: '',
          couponId: '',
        };

        if(isWifiKey){
          var wifiKeyParams = storeWifiKeyParams.get() || {};
          modelOrderSubmit.param = $.extend(modelOrderSubmit.param, wifiKeyParams);
        }

        this.showLoading();
        modelOrderSubmit.execute(function(res){
          this.hideLoading();
          //成功
          console.log(res);

          var data = res.data;

          this.orderIds = data.orderIds;
          this.goPay();

        },function(error){
          //失败
          this.showToast(error.errmsg);
        },this);
      },
      goPay: function(){
        //modelOrderPay
        //据说这里的回跳地址不能带 ‘#’ 号，故作此中转页面
        var returnUrl = window.location.origin + '/jump.html?oid=' + this.orderIds[0];

        this.showLoading();
        modelOrderPay.param = {
          orderIds: this.orderIds.join(','),
          type: 4,
          returnUrl: returnUrl, //回跳地址，目前回跳到订单成功页面
        };
        modelOrderPay.execute(function(res){
          this.hideLoading();

          //成功
          console.log(res);
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
