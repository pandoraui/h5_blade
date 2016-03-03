define([], function(){
  var userAgent = navigator.userAgent.toLowerCase()
  var detect = {}
  var os = $.os
  var browser = $.browser
  // 手机端
  //detect.isMobile = navigator.userAgent.toLowerCase().indexOf('mobile') >= 0

  // 手持设备
  detect.isHandheldDevice = os.phone || os.tablet

  // 微信
  var micromessengerUA = userAgent.indexOf('micromessenger') >= 0
  if(micromessengerUA){
    detect.isWechat = true;
    detect.micromessenger = {}
  }

  // 多维度内部APP userAgent 规范：
  // navigator.userAgent + DWD_IQG/3.2.2.x
  // Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4 DWD_IQG/3.2.2
  var iqgUA = userAgent.match(/\sdwd_iqg\/([\d\.]+)/)
  if(iqgUA){
    detect.isIqg = true;
    detect.iqg = {
      version: iqgUA[1]
    }
  }
  if(iqgUA){
    detect.dwd = {}
  }
  // wifi万能钥匙
  // Mozilla/5.0 (Linux; Android 4.4.4; MI 4W Build/KTU84P) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 wkbrowser 3.1.9 629
  var wifiKey = userAgent.match(/\s*wkbrowser[\s|\/]*([\d\.]+)\s(\d+)/)
  if(/wkbrowser/.test(userAgent)){
    detect.wifiKey = {};
  }
  if(wifiKey){
    detect.isWifiKey = true;
    detect.wifiKey = {
      version: wifiKey[1],
      buildVersion: wifiKey[2]
    }
  }

  return detect;
});
