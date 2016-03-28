define(['PageView', getViewTemplatePath('zt_top10'), 'AppModel', 'AppStore'],
  function (PageView, viewhtml, AppModel, AppStore){

    var storeLogin = AppStore.Login.getInstance();

    return _.inherit(PageView, $.extend({
      pageName: 'zhuti',
      events: {
      },
      onCreate: function(){
        // var viewhtml = '下单成功';
        this.$el.html(viewhtml);

        //元素集合
        this.els = {
          "hsq_box": this.$el.find('.hsq_box'),
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
            value: ['专题']  //每日 TOP 10
          },
          back: false,
          // back: {
          //   tagname: 'back',
          //   value: '返回',
          //   callback: function() {
          //     //这里返回订单详情页
          //     self.backAction();
          //   }
          // }
        };
        this.header.set(headerData);
      },
      backAction: function(){
        this.back();
      },
      onShow: function(){
        this.initPage();
      },
      onHide: function(){},
      //初始化页面
      initPage: function(){
        var scope = this;

        // this.ajaxRequest();
      },
      ajaxRequest: function(){
        var scope = this;

        this.showLoading();
        modelGetRewardInfo.param = {
          rewardCode: this.params.reward_code,
        };
        modelGetRewardInfo.execute(function(res){
          this.hideLoading();
          //成功
          var data = res.data;

          //活动是否生效
          var dataList = [];
          if(data.status && !data.is_expired){
            dataList = data.couponList;
          }

          if(dataList.length){
            this.renderPage({
              list: dataList
            });
            this.showStep(1);
          }else{
            this.showStep(3);
          }

        },function(error){
          //失败
          if(error.errno == 9310001){
            this.showStep(3);
          }else{
            this.showToast(error.errmsg);
          }
        },this);
      },
      renderPage: function(data){
        var html = _.template(this.tpls.hsq_box)(data);
        this.els.hsq_box.html(html);
      },
    }));
});
