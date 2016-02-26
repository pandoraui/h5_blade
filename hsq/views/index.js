// ﻿define(['cPageView', getViewTemplatePath('index')], function (cPageView, viewhtml){
﻿define(['View', getViewTemplatePath('index')], function (View, viewhtml){

    // return cPageView.extend({
    return _.inherit(View, {
      propertys: function ($super) {
        $super();

        this.addEvents(this._events);
        // this.template = viewhtml;
      },
      pageName: 'index',
      _events: {
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
          back: false,
          center: {
            tagname: 'title',
            value: ['好食期首页']
          },
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
            console.log(1111)
            this.showToast('测试');
            break;
          default:

        }
      },
    });
});
