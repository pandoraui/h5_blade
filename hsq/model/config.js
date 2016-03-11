/********************************
 * @description:  配置
 * @author:       xiaohan
 */
// define(['libs'], function(libs) {
define([], function() {

  var testDebug = true;

  var hosts = {
    test: 'm.ctrip.com/restapi/soa2/10184',
    local: 'm.devapi.haoshiqi.net:9502',
    dev: 'm.devapi.haoshiqi.net:9502',
    staging: 'm.devapi.haoshiqi.net:9502',
    pro: 'm.api.haoshiqi.net',
  };
  var config = {
    //运行环境
    runTimeEnvironment: function(test) {
      if(test){
        return hosts.test;
      }
      //0本地 1dev 2staging 3pro
      var host = location.host;
      if (host.match(/^m\.haoshiqi\.net/i)) {
        return hosts.pro;
      }
      if ( host.match(/^(localhost|10\.0|127\.0|192\.168)/i)) {
        return hosts.local;
      }
      if ( host.match(/^(m\.devapi\.haoshiqi\.net)/i)) {
        return hosts.dev;
      }
      if ( host.match(/^(staging\.haoshiqi\.net)/i)) {
        return hosts.staging;
      }
      // if (host.match(/^(10\.8)/i) || host.match(/^h5seo\.mobile\.ctripcorp/i) || host.match(/^(h5seo\.mobile)/i)) {
      //   return 1;
      // }
      // if (host.match(/^(m\.uat)/i) || host.match(/^(m\.lpt10\.qa\.nt)/i)) {
      //   return 2;
      // }
      return hosts.pro;
    },
    //api 域名地址
    restApi: function(protocol, url) {
      var host = this.runTimeEnvironment();
      var urls = {
        "http": 'http://' + host,
        "https": 'https://' + host
      };
      return urls[protocol] + url;
    }
  };

  return config;
});
