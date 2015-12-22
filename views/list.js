define(['View', getViewTemplatePath('index'), 'UIGroupList'],
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
      //初始化页面
      initPage: function () {
        var scope = this;


      },
      renderPage: function(){

      },
    });
});
