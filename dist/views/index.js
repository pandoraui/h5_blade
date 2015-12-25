define(['View', getViewTemplatePath('index'), 'UIGroupList'],
  function (View, viewhtml, UIGroupList){

    return _.inherit(View, {
      propertys: function ($super) {
        $super();

        this.template = viewhtml;
        this.addEvents({
          'click li[data-link]': 'goLink',
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
        Blade.header.set({
          back: {
            tagname: 'back',
            callback: function () {
              alert('退无可退，无需再退');
            }
          },
          title: 'blade'
        });
        Blade.header.show();
      },
      //初始化页面
      initPage: function () {
        var scope = this;


      },
      renderPage: function(){

      },
      goLink: function(e){
        var target = $(e.currentTarget),
            link = target.data('link');

        Blade.forward(link);


      },
    });
});
