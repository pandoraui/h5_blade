// ﻿define(['cPageView', getViewTemplatePath('index')], function (cPageView, viewhtml){
﻿define(['PageView', getViewTemplatePath('index')], function (PageView, viewhtml){

    var testNum = 0;
    // return cPageView.extend({
    return _.inherit(PageView, {
      // propertys: function ($super) {
      //   $super();
      //
      //   console.log(this.events);
      //   // this.addEvents(this.events);
      //   // this.template = viewhtml;
      // },
      pageName: 'index',
      events: {
        'click .j_test': 'jTest',
      },
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
          // back: false,
          center: {
            tagname: 'title',
            value: ['好食期首页']
          },
          back: {
            tagname: 'back',
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
      initPage: function(){},
      ajaxRequest: function(){},
      jTest: function(e){
        var target = $(e.currentTarget);
        var type = target.data('type');

        switch (type) {
          case 'toast':
            this.showToast('测试：' + testNum++);
            break;
          case 'alert':
            // this.showAlert('测试');
            break;
          default:

        }
      },
    });
});
