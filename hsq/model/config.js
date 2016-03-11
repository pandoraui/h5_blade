/********************************
 * @description:  配置
 * @author:       xiaohan
 */
// define(['libs'], function(libs) {
define([], function() {

  var testDebug = false;

  var hosts = {
    test: 'm.devapi.haoshiqi.net:9502',
    local: 'm.devapi.haoshiqi.net:9502',
    dev: 'm.devapi.haoshiqi.net:9502',
    staging: 'm.devapi.haoshiqi.net:9502',
    pro: 'm.api.haoshiqi.net',
  };
  var config = {
    //运行环境
    runTimeEnvironment: function(test) {
      //默认是调用线上，如果在 app 中以其他协议打开，域名无法匹配时，使用线上
      var server = hosts.pro;
      if(test){
        server = hosts.test;
      }
      //0本地 1dev 2staging 3pro
      var host = window.location.host;
      if (host.match(/^m\.haoshiqi\.net/i)) {
        return server;
      }
      if ( host.match(/^(localhost|10\.0|127\.0|192\.168)/i)) {
        server = hosts.local;
      }else if ( host.match(/^(m\.devapi\.haoshiqi\.net)/i)) {
        server = hosts.dev;
      }
      // else if ( host.match(/^(staging\.haoshiqi\.net)/i)) {
      //   serverDomain = hosts.staging;
      // }
      return server;
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
