define(['PageView', getViewTemplatePath('list'), 'AppModel', 'AppStore'],
  function (PageView, viewhtml, AppModel, AppStore){


    var modelProductRList = AppModel.productRList.getInstance();

    return _.inherit(PageView, {
      pageName: 'list',
      events: {

      },
      needPagination: 1,  //是否需要分页信息
      pageNum: 1,         //页码，默认1
      pageLimit: 20,      //每页显示数量，默认 0
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

        this.ajaxRequest();
      },
      ajaxRequest: function(){
        var self = this;

        modelProductRList.param = {
          needPagination: this.needPagination,
          pageNum: this.pageNum,
          pageLimit: this.pageLimit,
        };

        this.showLoading();
        //ajax去发送短信
        modelProductRList.execute(function(res){
          this.hideLoading();
          //成功
          var data = res.data;
          if(data.list.length){
            
          }else{

          }

          // this.back(redirect_from, {replace: true});

        },function(error){
          //失败
          this.showToast(error.errmsg);
        },this);
      },
      renderPage: function(){

      },
    });
});
