define(['PageView', 'AppModel', 'AppStore', 'CountDown', 'cValidate'],
  function (PageView, AppModel, AppStore, CountDown, cValidate){

    var storeLogin = AppStore.Login.getInstance();
    var modelLogin = AppModel.login.getInstance();
    var modelGetMobileCode = AppModel.getMobileCode.getInstance();
    var redirect_from = '';


    var LoginCommonFunction = {
      checkBtnCode: function($node){
        this.$nodeBtnCode = $node;
        this.CountDown = new CountDown({
          node: $node,  //this.els.$nodeBtnCode,
        });
        // 进入页面，先检查，是否可以发送验证码
        // if(this.countDownTimeStamp){
        //   var now = +new Date();
        //   var diffSecond = 60 - Math.round((now - this.countDownTimeStamp)/1000);
        //   this.CountDown.start(diffSecond);
        // }
      },
      getImgCode: function(){

      },
      focusInput: function($node){
        setTimeout(function(){
          $node.focus();
        }, 1500);
      },
      isNeedImgCode: function(){
        return false;
      },
      getMobileCode: function(mobile){
        //this.els.$nodeCode
        this.CountDown.start();

        modelGetMobileCode.param = {
          mobile: mobile || this.mobile,
          type: 5,
        };

        this.showLoading();
        //ajax去发送短信
        modelGetMobileCode.execute(function(res){
          this.hideLoading();
          //成功
          console.log(res);
          this.showToast('发送手机校验码成功！');
        },function(error){
          //失败
          this.showToast(error.errmsg);
        },this);
      },
      checkMobile: function($node){
        var mobile = $node.val().trim();// this.els.$nodeMobile.val().trim();
        this.mobile = mobile;

        var bool = false;
        if(!mobile){
          this.showToast('请输入手机号');
          this.focusInput($node);
        } else if( !cValidate.isMobile(mobile) ){
            this.showToast('手机格式不正确');
          // this.focusInput($node);
        }else{
          bool = true;
        }
        return bool;
      },
      checkCode: function($node){
        var mobileCode = $node.val().trim();  //this.els.$nodeCode.val().trim();
        this.mobileCode = mobileCode;

        var bool = false;
        if(!mobileCode){
          this.showToast('请输入验证码');
        } else{
          bool = true;
        }
        return bool;
      },
    };

    return LoginCommonFunction;
});
