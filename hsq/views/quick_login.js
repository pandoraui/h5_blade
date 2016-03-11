define(['PageView', getViewTemplatePath('quick_login'), 'AppModel', 'AppStore', 'CountDown', 'FormatReg'],
  function (PageView, viewhtml, AppModel, AppStore, CountDown, FormatReg){

    var storeLogin = AppStore.Login.getInstance();
    var modelLogin = AppModel.login.getInstance();
    var modelGetMobileCode = AppModel.getMobileCode.getInstance();

    return _.inherit(PageView, {
      pageName: 'quick_login',
      events: {
        'click .get_phone_code': 'clickBtnCode',
        'click .J_login_btn:not(.disabled)': 'quickLogin',
      },
      onCreate: function(){
        // var viewhtml = '下单成功';
        this.$el.html(viewhtml);
        //元素集合
        this.els = {
          "$nodeBtnCode": this.$el.find('.get_phone_code'),
          "$nodeMobile": this.$el.find('.J_phone'),
          "$nodeCode": this.$el.find('.J_code'),
          "$nodeChecked": this.$el.find('.J_checked'),
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

        this.initPage();

      },
      onHide: function(){},
      //初始化页面
      initPage: function(){
        var scope = this;

        this.checkBtnCode();
      },
      ajaxRequest: function(){},
      renderPage: function(){

      },
      checkBtnCode: function(){
        this.CountDown = new CountDown({
          node: this.els.$nodeBtnCode,
        });
        //进入页面，先检查，是否可以发送验证码
        // if(this.countDownTimeStamp){
        //   var now = +new Date();
        //   var diffSecond = 60 - Math.round((now - this.countDownTimeStamp)/1000);
        //   this.CountDown.start(diffSecond);
        // }
      },
      clickBtnCode: function(e){
        var self = this;
        e.stopPropagation();
        e.preventDefault();
        var target = $(e.currentTarget);

        if(this.CountDown.isDisabled) return;

        if(this.checkMobile()){
          this.getMobileCode();
          // if(!this.isNeedImgCode()){
          // }else{
          //   this.getImgCode();
          // }
        }
      },
      focusInput: function($node){
        setTimeout(function(){
          $node.focus();
        }, 1500);
      },
      isNeedImgCode: function(){
        return false;
      },
      getMobileCode: function(){
        this.CountDown.start();

        modelGetMobileCode.param = {
          mobile: this.mobile,
          type: 5,
        };

        this.showLoading();
        //ajax去发送短信
        modelGetMobileCode.execute(function(res){
          this.hideLoading();
          //成功
          console.log(res);
          this.showToast('发送手机校验码成功！');
          this.focusInput(this.els.$nodeCode);

        },function(error){
          //失败
          this.showToast(error.errmsg);
        },this);
      },
      checkMobile: function(){
        var mobile = this.els.$nodeMobile.val().trim();
        this.mobile = mobile;

        var bool = false;
        if(!mobile){
          this.showToast('请输入手机号');
          this.focusInput(this.els.$nodeMobile);
        }else if( !FormatReg.mobile.reg.test(mobile) ){
          this.showToast(FormatReg.mobile.tip);
          // this.focusInput(this.els.$nodeMobile);
        }else{
          bool = true;
        }
        return bool;
      },
      checkCode: function(){
        var mobileCode = this.els.$nodeCode.val().trim();
        this.mobileCode = mobileCode;

        var bool = false;
        if(!mobileCode){
          this.showToast('请输入验证码');
        } else{
          bool = true;
        }
        return bool;
      },
      quickLogin: function(){
        if(this.checkMobile() && this.checkCode()){
          if(!this.els.$nodeChecked[0].checked){
            this.showToast('您必须选择同意用户协议');
          } else {
            this.goLogin();
          }
        }
      },
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
          storeLogin.set(res.data);
          this.back();

        },function(error){
          //失败
          this.showToast(error.errmsg);
        },this);
      },
    });
});
