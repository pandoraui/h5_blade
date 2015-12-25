define(['View', getViewTemplatePath('list'), 'UIGroupList'],
  function (View, viewhtml, UIGroupList){

    return _.inherit(View, {
      propertys: function ($super) {
        $super();

        this.template = viewhtml;
        this.addEvents({
        });
      },

      addEvent: function ($super) {
        $super();
        //在页面显示后做的事情
        this.on('onShow', function () {
          this.initPage();
        });

      },

      initHeader: function () {
        var scope = this;
        Blade.header.set({
          title: '列表页',
          callback: function(){
            scope.back();
          }
        });
        Blade.header.show();
      },
      //初始化页面
      initPage: function () {
        var scope = this;


      },
      renderPage: function(){

      },
    });
});
