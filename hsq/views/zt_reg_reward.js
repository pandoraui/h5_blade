define(['PageView', getViewTemplatePath('zt_reg_reward'), 'AppModel', 'AppStore', 'LoginCommon'],
  function (PageView, viewhtml, AppModel, AppStore, LoginCommon){

    var storeLogin = AppStore.Login.getInstance();
    var modelGetRewardInfo = AppModel.getRewardInfo.getInstance();
    var modelRegister = AppModel.register.getInstance();
    var redirect_from = '';

    return _.inherit(PageView, $.extend(LoginCommon, {
      pageName: 'zhuti',
      events: {
        'click .get_phone_code': 'clickBtnCode',
        // 'click .protocol>.p_text': 'setProtocol',
        'click .J_register_btn:not(.disabled)': 'goRegister',
      },
      onCreate: function(){
        // var viewhtml = '下单成功';
        this.$el.html(viewhtml);

        //元素集合
        this.els = {
          "$zhuti_box": this.$el.find('.zhuti_box'),
          "$nodeBtnCode": this.$el.find('.get_phone_code'),
          "$nodeMobile": this.$el.find('.J_phone'),
          "$nodeCode": this.$el.find('.J_code'),
          "$nodeProtocol": this.$el.find('.protocol>.p_text'),
          "$nodeChecked": this.$el.find('.J_checked'),
          "$nodeLoginBtn": this.$el.find('.J_login_btn'),
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
            value: ['推荐有奖']
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
        this.header.show();
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

        this.checkBtnCode(this.els.$nodeBtnCode);

        //reward_code 活动码
        //invite_code 邀请码

        if(this.params.reward_code){
          this.showStep(1);
          this.checkBtnCode(this.els.$nodeBtnCode);

          this.ajaxRequest();
        }else{
          this.showStep(3);
        }
      },
      showStep: function(step){
        var stepClass = 'reg_reward' + (step || 1);
        this.els.$zhuti_box.removeClass('reg_reward1 reg_reward2 reg_reward3').addClass(stepClass);
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
      clickBtnCode: function(e){
        var self = this;
        e.stopPropagation();
        e.preventDefault();
        var target = $(e.currentTarget);

        if(this.CountDown.isDisabled) return;

        if(this.checkMobile(this.els.$nodeMobile)){
          this.getMobileCode(this.mobile, this.els.$nodeCode);
        }
      },
      goRegister: function(){
        this.trackEvent('reg_reward');

        if( !(this.checkMobile(this.els.$nodeMobile) && this.checkCode(this.els.$nodeCode) ) ){
          return;
        }

        modelRegister.param = {
          mobile: this.mobile,
          type: 5,
          verifyCode: this.mobileCode,
          rewardCode: this.params.reward_code || '',
          inviteCode: this.params.invite_code || '',
        };

        this.showLoading();
        //ajax去发送短信
        modelRegister.execute(function(res){
          this.hideLoading();
          //成功
          this.showToast('注册成功');

          //成功后，要存储登录信息
          //{"errno":0,"errmsg":"success","data":{"username":"138****1714","avatar":"","mobile":"13817131714","email":"","birthday":"0000-00-00","sex":0,"enabled":1,"token":"5f8facea123903bfa2e18340de673eef"},"timestamp":1457406584,"serverlogid":"2842dbc50976c899d5285d80eb042481"}

          //如果是隐身模式，怎么登录，目前手机端隐身模式是不能访问存储的???
          // storeLogin.set(res.data);

          this.showStep(2);
          this.scrollTo(0, 0);
          // this.back(redirect_from, {replace: true});

        },function(error){
          //失败
          this.showToast(error.errmsg);
        },this);
      },
    }));
});
