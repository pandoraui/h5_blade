define(['PageView', getViewTemplatePath('quick_login'), 'AppModel', 'AppStore', 'LoginCommon'],
  function (PageView, viewhtml, AppModel, AppStore, LoginCommon){

    var storeLogin = AppStore.Login.getInstance();
    var modelLogin = AppModel.login.getInstance();
    // var modelGetMobileCode = AppModel.getMobileCode.getInstance();
    var redirect_from = '';

    return _.inherit(PageView, $.extend(LoginCommon, {
      pageName: 'quick_login',
      events: {
        'click .get_phone_code': 'clickBtnCode',
        'click .protocol>.p_text': 'setProtocol',
        'click .J_login_btn:not(.disabled)': 'quickLogin',
        // 'click .J_quick_login_btn:not(.disabled)': 'quick_Login',
      },
      onCreate: function(){
        // var viewhtml = '下单成功';
        this.$el.html(viewhtml);
        //元素集合
        this.els = {
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
        redirect_from = decodeURIComponent(this.params.redirect_from || '');
        var headerData = {
          center: {
            tagname: 'title',
            value: ['手机号快捷登录']
          },
          back: {
            tagname: 'back',
            value: '返回',
            callback: function() {
              //这里返回订单详情页
              self.back();
            }
          }
        };
        this.header.set(headerData);
        this.header.show();
      },
      onShow: function(){
        // var loginInfo = storeLogin.get() || {};

        // if(loginInfo.token){
        //   //您已经登录，直接返回
        //   this.back();
        //   return;
        // }

        this.initPage();
      },
      onHide: function(){},
      //初始化页面
      initPage: function(){
        var scope = this;

        this.checkBtnCode(this.els.$nodeBtnCode);
      },
      ajaxRequest: function(){},
      renderPage: function(){

      },
      setProtocol: function(e){
        if(e.target.nodeName == 'A'){
          return;
        }
        if(e.target.nodeName == 'INPUT'){
          //点击 input 时，出现双次点击问题
          this.clickCheckBox(true);
          return;
        }
        this.clickCheckBox();
      },
      clickCheckBox: function(bool){
        var agreeProtocol = this.els.$nodeChecked[0].checked;
        if(bool) {
          agreeProtocol = !agreeProtocol;
        }
        if(agreeProtocol){
          this.els.$nodeChecked[0].checked = false;
          this.els.$nodeLoginBtn.addClass('disabled');
        }else{
          this.els.$nodeChecked[0].checked = true;
          this.els.$nodeLoginBtn.removeClass('disabled');
        }
      },
      clickBtnCode: function(e){
        var self = this;
        e.stopPropagation();
        e.preventDefault();
        var target = $(e.currentTarget);

        if(this.CountDown.isDisabled) return;

        if(this.checkMobile(this.els.$nodeMobile)){
          this.getMobileCode(this.mobile, this.els.$nodeCode);
          // if(!this.isNeedImgCode()){
          // }else{
          //   this.getImgCode();
          // }
        }
      },
      quickLogin: function(){
        this.trackEvent('quick_login');
        
        if(this.checkMobile(this.els.$nodeMobile) && this.checkCode(this.els.$nodeCode)){
          if(!this.els.$nodeChecked[0].checked){
            this.showToast('您必须选择同意用户协议');
          } else {
            this.goLogin();
          }
        }
      },
      // quick_Login: function(){
      //   var loginInfo = {"username":"138****1714","avatar":"","mobile":"13817131714","email":"","birthday":"0000-00-00","sex":0,"enabled":1,"token":"5f8facea123903bfa2e18340de673eef"};
      //   storeLogin.set(loginInfo);
      //   this.back(redirect_from, {replace: true});
      // },
      goLogin: function(){
        modelLogin.param = {
          mobile: this.mobile,
          type: 5,
          verifyCode: this.mobileCode,
        };

        this.showLoading();
        //ajax去发送短信
        modelLogin.execute(function(res){
          this.hideLoading();
          //成功
          this.showToast('登录成功');

          //成功后，要存储登录信息
          //{"errno":0,"errmsg":"success","data":{"username":"138****1714","avatar":"","mobile":"13817131714","email":"","birthday":"0000-00-00","sex":0,"enabled":1,"token":"5f8facea123903bfa2e18340de673eef"},"timestamp":1457406584,"serverlogid":"2842dbc50976c899d5285d80eb042481"}

          //如果是隐身模式，怎么登录，目前手机端隐身模式是不能访问存储的???
          storeLogin.set(res.data);
          this.back(redirect_from, {replace: true});

        },function(error){
          //失败
          this.showToast(error.errmsg);
        },this);
      },
    }));
});
