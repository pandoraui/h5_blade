/********************************
 * @description:  配置
 * @author:       xiaohan
 */
// define(['libs'], function(libs) {
define([], function() {

  var testDebug = true;

  var hosts = {
    test: 'm.ctrip.com/restapi/soa2/10184',
    local: '10.0.0.10:9502',
    dev: '10.0.0.10:9502',
    staging: '10.0.0.10:9502',
    pro: '',
  };
  var config = {
    //运行环境
    runTimeEnvironment: function(test) {
      if(test){
        return hosts.test;
      }
      //0本地 1dev 2staging 3pro
      var host = location.host;
      if (host.match(/^m\.hsq\.com/i)) {
        return hosts.pro;
      }
      if ( host.match(/^(localhost|10\.0|127\.0|192\.168)/i)) {
        return hosts.dev;
      }
      if ( host.match(/^(staging)/i)) {
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
      var host = this.runTimeEnvironment(testDebug);
      var urls = {
        "http": 'http://' + host,
        "https": 'https://' + host
      };
      return urls[protocol] + url;
    }
  };

  return config;
});
