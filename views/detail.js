define(['View', getViewTemplatePath('index'), 'UIGroupList'],
  function (View, viewhtml, UIGroupList){

    return _.inherit(View, {
      propertys: function ($super) {
        $super();

        this.template = viewhtml;
        this.addEvents({
          'click .js_demo01': 'demo01',
          'click .js_demo02': 'demo02'
        });
      },

      addEvent: function ($super) {
        $super();
        //在页面显示后做的事情
        this.on('onShow', function () {
          this.initPage();
        });

      },
      //初始化页面
      initPage: function () {
        var scope = this;


      },
      renderPage: function(){

      },
    });
});
