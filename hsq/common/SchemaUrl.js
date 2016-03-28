
//唤醒 App，通过 SchemaUrl 实现
//文档：https://worktile.com/project/f1965210efe642f1ac7d3ecf5199f3fb/page/1045646c7e7a40f1a344386ff41b6aef

/*
店铺详情
haoshiqi://com.doweidu/merchant?merchantId={id}&xx={?}&xxx={?}

sku详情
haoshiqi://com.doweidu/sku?skuId={id}&xx={?}&xxx={?}
*/

define([], function(){
  var _schema = 'haoshiqi://com.doweidu/';
  var _schema_urls = {
    home: _schema + 'home',
    detail: _schema + 'sku',          //?skuId={id}&xx={?}&xxx={?}
    merchant: _schema + 'merchant',   //?merchantId={id}&xx={?}&xxx={?}
  };
  var Schema = {
    getAppUrl: function(url){
      var _tempArr = url.split('?');
      var params = '';
      var pageName = 'home';
      if(_tempArr.length){
        pageName = _tempArr.shift();
      }
      if(_tempArr.length){
        params = '?' + _tempArr.join('&');
      }
      var schemaUrl = _schema_urls[pageName] + params;

      return schemaUrl;
    },
    _jumpApp: function(appUrl){
      this._schemaIframe && this._schemaIframe.remove();
      this._schemaIframe = $('<iframe src="'+appUrl+'" style="display:none"></iframe>').appendTo('body');
    },
    jumpApp: function(url, params){
      var self = this;
      var appUrl = this.getAppUrl(url);

      this._jumpApp(appUrl);

      setTimeout(function(){
        //此处如果执行则表示没有app
        // self._jumpApp(appUrl);
        console.log('没有 App');
        // self.forward(url);
      }, 500);
    },
  };

  return Schema;
});
