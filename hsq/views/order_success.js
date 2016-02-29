define(['PageView', getViewTemplatePath('test')],
  function (PageView, viewhtml){

    // var viewhtml = '下单成功';

    // 此订单需要请求 ajax，获取对应的订单相关信息。

    return _.inherit(PageView, {
      pageName: 'order_success',
      onCreate: function(){
        // var viewhtml = '下单成功';
        this.$el.html(viewhtml);
        //元素集合
        this.els = {
          // "tplbox_bs2_intro": this.$el.find('#'),
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
            value: ['付款成功']
          },
          // backtext: '返回',
          // events: {
          //   returnHandler: function(){
          //     self.back('list');
          //   },
          // },
          back: {
            tagname: 'back',
            value: '返回',
            callback: function() {
              self.back('index');
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
    });
});
