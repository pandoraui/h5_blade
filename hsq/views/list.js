define(['PageView', getViewTemplatePath('list'), 'AppModel', 'AppStore'],
  function (PageView, viewhtml, AppModel, AppStore){

    return _.inherit(PageView, {
      pageName: 'list',
      onCreate: function(){
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
