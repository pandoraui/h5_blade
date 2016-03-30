/*
  CountDown 倒计时插件
*/
define(['UIView'], function (UIView) {

  var template = [
    ''
  ].join('');


  var store = window.localStorage;

  //ios     http://pre.im/hsq1
  //android http://pre.im/hsq2

  return _.inherit(UIView, {
    propertys: function ($super) {
      $super();
      this.template = template;
    },
    initialize: function (opts) {
      this.propertys();

      //根据参数重置属性
      this.node = opts.node;
      this.nodeCount = $('i.num', this.node);
      this.maxCount = opts.maxCount || 60;
    },
    // 开始倒计时
    start: function(count){
      var self = this;

      if(count > self.maxCount || count <= 0) return;

      self._disable();

      self._setCount(count || self.maxCount);

      function onTimeout(){
        self._setCount(self.count - 1);
        if(self.count > 0) {
          setTimeout(onTimeout, 1000);
        } else{
          self._stop();
        }
      }
      setTimeout(onTimeout, 1000);
    },
    _stop: function(){
      this._setCount(null);
      this._enable();
    },
    _setCount: function(count){
      if(count === null){
        this.count = undefined;
        this.nodeCount.text('');
      }
      else if(count.toString().match(/^\d{1,}$/)){
        this.count = count;
        this.nodeCount.text(count);
      }
      return this
    },
    _disable: function(){
      this.isDisabled = true;
      this.node.addClass('disabled');
      return this;
    },
    _enable: function(){
      this.isDisabled = false;
      this.node.removeClass('disabled');
    }
  });

});
