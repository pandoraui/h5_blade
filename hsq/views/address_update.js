define(['PageView', getViewTemplatePath('address_update')],
  function (PageView, viewhtml){

    return _.inherit(PageView, {
      pageName: 'address_edit',
      onCreate: function(){
        // var viewhtml = '更新地址';
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
        var type = 'add';
        var title = type === 'add' ? '新增收获地址' : '修改地址';
        var headerData = {
          center: {
            tagname: 'title',
            value: [title]
          },
          back: {
            tagname: 'back',
            value: '返回',
            callback: function() {
              self.back();
            }
          },
          right: [{
            tagname: 'address-save',
            value: '保存',
            callback: function() {
              //这里返回订单详情页
              console.log('保存');
            }
          }]
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
