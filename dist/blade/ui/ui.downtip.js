/*
  down-tip 组件
*/
define([], function () {
  var template = [
    '<div id="J_down_tip" class="down-tip">',
    '  <div class="tip-bg"></div>',
    '  <span class="close">×</span>',
    '  <p>',
    '    <img src="favicon.png" alt="">',
    '    <a href="<%=url%>"><span class="btn fr">立即体验</span>限时限量，下载好食期购买吧！</a>',
    '  </p>',
    '</div>'
  ].join('');


  var store = window.localStorage;
  var closeShowDownTip = store.getItem('closeShowDownTip') || 0;

  var downUrl = '###';

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
      if(!closeShowDownTip){
        this.show();
      }else{
        this.hide();
      }
    },
    show: function(){
      var scope = this;
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
        store.setItem('closeShowDownTip', 1);
      }
    },
  });

});
