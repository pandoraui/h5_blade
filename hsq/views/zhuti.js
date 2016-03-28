
//活动中转页面

define(['PageView', 'AppModel', 'AppStore'],
  function (PageView, AppModel, AppStore){

    var storeLogin = AppStore.Login.getInstance();
    var modelRPList = AppModel.RPList.getInstance();

    return _.inherit(PageView, $.extend({
      pageName: 'zhuti',
      events: {
      },
      onCreate: function(){
        // var viewhtml = '下单成功';
        this.$el.html('');
      },
      setHeader: function(){
        var self = this;
        var headerData = {
          center: {
            tagname: 'title',
            value: ['加载中...']  //每日 TOP 10
          },
          back: false,
        };
        this.header.set(headerData);
      },
      onShow: function(){
        this.initPage();
      },
      onHide: function(){},
      //初始化页面
      initPage: function(){
        var scope = this;
        var code = this.params.code;

        switch (code) {
          case 'iqg_banner':
            this.ajaxRPList();
            break;
          default:

        }

      },
      ajaxRPList: function(){
        var self = this;

        modelRPList.param = {
          needPagination: 1,
          pageNum: 1,
          pageLimit: 20,
        };

        this.showLoading();
        modelRPList.execute(function(res){
          this.hideLoading();
          //成功
          var data = res.data;

          //获取列表第一个 skuId 然后 replace 跳转到详情页
          if(data.list && data.list[0]){
            var skuId = data.list[0].skuInfo.id;
            var detailUrl = 'detail?sid=' + skuId;
            this.forward(detailUrl, {replace: true});
          }

        },function(error){
          //失败
          this.showToast(error.errmsg);
        }, this);
      },
    }));
});
