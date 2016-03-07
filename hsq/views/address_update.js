define(['PageView', getViewTemplatePath('address_update'), 'AppModel', 'AppStore'],
  function (PageView, viewhtml, AppModel, AppStore){

    return _.inherit(PageView, {
      pageName: 'address_edit',
      onCreate: function(){
        // var viewhtml = '更新地址';
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
