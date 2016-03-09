// ﻿define(['cPageView', getViewTemplatePath('index')], function (cPageView, viewhtml){
﻿define(['PageView', getViewTemplatePath('index'), 'AppModel', 'AppStore'],
  function (PageView, viewhtml, AppModel, AppStore){

    // var storeCommonLong = AppStore.CommonLong.getInstance();
    var storeCommonShort = AppStore.CommonShort.getInstance();

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
      setHeader: function(){
        var self = this;
        var headerData = {
          back: false,
          center: {
            tagname: 'title',
            value: ['首页']
          },
          // back: {
          //   tagname: 'back',
          //   callback: function() {
          //     self.back('index');
          //   }
          // }
        };
        this.header.set(headerData);
        this.header.show();
      },
      onShow: function(){

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
            this.showAlert({
              title: 'alert测试' + testNum++
            });
            break;
          case 'show404':
            this.show404();
            break;
          case 'storage':
            this.testStorage(e);
            break;
          default:

        }
      },
      testStorage: function(e){
        var target = $(e.target);
        var type = target.data('type');
        console.log('缓存测试: ', type);
        var store;

        switch (type) {
          case 'save':
            store = {
              test: 'hello'
            };
            storeCommonShort.set(store);
            break;
          case 'update':
            storeCommonShort.setAttr('test', 'good');
            break;
          case 'read':
            store = storeCommonShort.get();
            break;
          case 'remove':
            store = storeCommonShort.remove();
            break;
          case 'clear':

            break;
          default:

        }

        store = storeCommonShort.get();
        console.log(store);
      },
    });
});
