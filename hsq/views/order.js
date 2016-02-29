define(['PageView', getViewTemplatePath('order')],
  function (PageView, viewhtml){

    return _.inherit(PageView, {
      pageName: 'order',
      onCreate: function(){
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
            value: ['列表页']
          },
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
