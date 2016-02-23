/*
  down-tip 组件
*/
define([], function () {
  var imgLogoSrc = "assets/img/logo.png";

  var template = [
    '<div id="J_down_tip" class="down-tip">',
    '  <div class="tip-bg"></div>',
    '  <span class="close">×</span>',
    '  <p>',
    ('    <img src="'+ imgLogoSrc +'" width="32" height="32" alt="logo">'),
    '    <a href="<%=url%>"><span class="btn fr">立即体验</span><span class="text">专做食品特卖，全场包邮</span></a>',
    '  </p>',
    '</div>'
  ].join('');


  var store = window.localStorage;
  // var closeShowDownTip = store.getItem('closeShowDownTip') || 0;

  var downUrl = '';

  if($.os.ios){
    downUrl = 'http://a.app.qq.com/o/simple.jsp?pkgname=com.doweidu.android.haoshiqi';
  }else if($.os.android){
    downUrl = 'http://a.app.qq.com/o/simple.jsp?pkgname=com.doweidu.android.haoshiqi';
  } else {
    downUrl = '';
  }

  //ios     http://pre.im/hsq1
  //android http://pre.im/hsq2

  return _.inherit({
    propertys: function () {
      this.template = template;
    },
    initialize: function (swiperContainer, imgList) {
      this.propertys();
      //根据参数重置属性
      this.checkStatus();
    },
    checkStatus: function(){
      this.$downTipDom = $('#J_down_tip');
      // if(!closeShowDownTip){
        this.show();
      // }else{
      //   this.hide();
      // }
    },
    show: function(){
      var scope = this;

      if(!downUrl){
        return;
      }
      var html = _.template(this.template)({url: downUrl});

      if(!this.$downTipDom.length){
        $('body').append(html);
      }else{
        this.$downTipDom.show();
      }
      this.$downTipDom.find('.close').click(function(e){
        scope.hide();
      });
    },
    hide: function(){
      if(this.$downTipDom.length){
        this.$downTipDom.hide();
        // store.setItem('closeShowDownTip', 1);
      }
    },
  });

});
