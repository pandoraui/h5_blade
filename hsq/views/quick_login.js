define(['PageView', getViewTemplatePath('quick_login'), 'CountDown'],
  function (PageView, viewhtml, CountDown){

    var FORMAT = {
      mobile: {
        /*
          130~139
          145、147
          15*（没有154）
          170、176、177、178
          180-189
        */
        reg: /^((13[0-9])|(14[5|7])|(15([0-3]|[5-9]))|(17(0|[6-8]))|(18([0-9])))\d{8}$/,
        tip: '手机格式不正确'
      },
      code: {
        reg: '',
        tip: '验证码有误'
      }
    };

    return _.inherit(PageView, {
      pageName: 'quick_login',
      events: {
        'click .get_phone_code': 'clickBtnCode',
        'click .J_login_btn': 'quickLogin',
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
        };

        var tpl_hsq_box = this.$el.find('.tpl_hsq_box');

        this.tpls = {
            'tpl_hsq_box': tpl_hsq_box.html(),
        };
        tpl_hsq_box.remove();
      },
      onShow: function(){
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
        if(this.countDownTimeStamp){
          var now = +new Date();
          var diffSecond = 60 - Math.round((now - this.countDownTimeStamp)/1000);
          this.CountDown.start(diffSecond);
        }
      },
      clickBtnCode: function(e){
        var self = this;
        e.stopPropagation();
        e.preventDefault();
        var target = $(e.currentTarget);

        if(this.CountDown.isDisabled) return;

        if(this.checkMobile()){
          if(!this.isNeedImgCode()){
            this.getMobileCode();
          }else{
            this.getImgCode();
          }
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

        //ajax去发送短信
        this.showToast('发送手机校验码成功！');
        this.focusInput(this.els.$nodeCode);
      },
      checkMobile: function(){
        var mobile = this.els.$nodeMobile.val().trim();
        this.mobile = mobile;

        var bool = false;
        if(!mobile){
          this.showToast('请输入手机号');
          this.focusInput(this.els.$nodeMobile);
          return;
        }else if( !FORMAT.mobile.reg.test(mobile) ){
          this.showToast(FORMAT.mobile.tip);
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
        console.log('goLogin');
      },
    });
});
