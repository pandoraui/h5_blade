
//唤醒 App，通过 SchemaUrl 实现
//文档：https://worktile.com/project/f1965210efe642f1ac7d3ecf5199f3fb/page/1045646c7e7a40f1a344386ff41b6aef

/*
店铺详情
haoshiqi://com.doweidu/merchant?merchantId={id}&xx={?}&xxx={?}

sku详情
haoshiqi://com.doweidu/sku?skuId={id}&xx={?}&xxx={?}
*/

define(['cSchema'], function(cSchema){

  var schema_domain = 'haoshiqi://com.doweidu/';
  var schema_urls = {
    home: schema_domain + 'home',
    detail: schema_domain + 'sku',          //?skuId={id}&xx={?}&xxx={?}
    merchant: schema_domain + 'merchant',   //?merchantId={id}&xx={?}&xxx={?}
  };

  var SchemaApp = $.extend(cSchema, {
    _schema_urls: schema_urls,
  });

  return SchemaApp;
});
