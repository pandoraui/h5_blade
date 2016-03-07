define(['PageView', getViewTemplatePath('order')],
  function (PageView, viewhtml){

    return _.inherit(PageView, {
      pageName: 'order',
      events: {
        'click .J_s_invoice': 'selectInvoice',
        'click .J_s_invoice_types label': 'selectInvoiceTypes',
      },
      onCreate: function(){
        this.$el.html(viewhtml);
        //元素集合
        this.els = {
          // "tplbox_bs2_intro": this.$el.find('#'),
          // "select_invoice": this.$el.find('.J_select_invoice'),
        };

        var tpl_hsq_box = this.$el.find('.tpl_hsq_box');

        this.tpls = {
            'tpl_hsq_box': tpl_hsq_box.html(),
        };
        tpl_hsq_box.remove();
      },
      onShow: function(){
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
      selectInvoice: function(e){
        var target = $(e.currentTarget);
        var $header = target.find('.icon-select');

        console.log(111);
        if(!this.useInvoice){
          $header.addClass('icon-selected');
          target.next().show();
          this.useInvoice = true;
        }else{
          $header.removeClass('icon-selected');
          target.next().hide();
          this.useInvoice = false;
        }
      },
      selectInvoiceTypes: function(e){
        var target = $(e.currentTarget);
        var $radioBox = target.find('.icon-select');

        this.invoiceType = target.data('type');
        target.find('.icon-select').addClass('icon-selected').end()
              .siblings().find('.icon-select').removeClass('icon-selected');
      },
    });
});
