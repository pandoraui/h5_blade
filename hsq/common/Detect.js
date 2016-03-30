define([], function(){
  var userAgent = navigator.userAgent.toLowerCase();
      detect = {},
      os = $.os,
      browser = $.browser;

  var _const = {
    HOST_WECHAT: 'wechat',
    HOST_DWD_IQG: 'iqg',
    HOST_DWD_HSQ: 'hsq',
    // wifi万能钥匙
    HOST_WIFIKEY: 'wifikey',
    HOST_ALIPAY: 'alipay',

    HOST_CHROME: 'chrome',
    HOST_FIREFOX: 'firefox',
    HOST_IE: 'ie',
    HOST_SAFARI: 'safari',
    HOST_WEBKIT: 'webkit',
    HOST_BROWSER: 'browser',

    PLATFORM_ANDROID: 'android',
    PLATFORM_IPHONE: 'iphone',
    PLATFORM_IPAD: 'ipad',
    PLATFORM_IPOD: 'ipod',
    PLATFORM_WP: 'wp',
    PLATFORM_KINDEL: 'kindle',
    PLATFORM_FIREFOXOS: 'firefoxos',
    PLATFORM_OTHER: 'platform_other'
  };
  // 手机端
  //detect.isMobile = navigator.userAgent.toLowerCase().indexOf('mobile') >= 0

  // 手持设备
  detect.isHandheldDevice = os.phone || os.tablet;

  //要输出两个东西，用于统计：宿主 Host 与平台 platform


  // 微信
  var micromessengerUA = userAgent.indexOf('micromessenger') >= 0
  if(micromessengerUA){
    detect.isWechat = true;
    detect.micromessenger = {};
  }

  // 多维度内部APP userAgent 规范：
  // navigator.userAgent + DWD_IQG/3.2.2.x
  // Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4 DWD_IQG/3.2.2
  // Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4 DWD_HSQ/3.2.2
  var iqgUA = userAgent.match(/\sdwd_iqg\/([\d\.]+)/)
  if(iqgUA){
    detect.isIqg = true;
    detect.iqg = {
      version: iqgUA[1]
    }
  }
  if(iqgUA){
    detect.dwd = {};
  }

  var hsqUA = userAgent.match(/\sdwd_hsq\/([\d\.]+)/)
  if(hsqUA){
    detect.isHsq = true;
    detect.hsq = {
      version: hsqUA[1]
    }
  }
  if(hsqUA){
    detect.dwd = {};
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
    };
  }


  var c = _const;
  detect.host = detect.micromessenger ? c.HOST_WECHAT :
        detect.isHsq ? c.HOST_DWD_HSQ :
        detect.isWifiKey ? c.HOST_WIFIKEY :
        detect.isIqg ? c.HOST_DWD_IQG :
        detect.isAlipay ? c.HOST_ALIPAY :
        browser.chrome ? c.HOST_CHROME :
        browser.firefox ? c.HOST_FIREFOX:
        browser.ie ? c.HOST_IE :
        browser.safari ? c.HOST_SAFARI :
        browser.webkit ? c.HOST_WEBKIT :
              c.HOST_BROWSER;

  detect.platform = os.android ? c.PLATFORM_ANDROID :
        os.iphone ? c.PLATFORM_IPHONE :
        os.ipad ? c.PLATFORM_IPAD :
        os.ipod ? c.PLATFORM_IPOD :
        os.wp ? c.PLATFORM_WP :
        os.kindle ? c.PLATFORM_KINDEL :
        os.firefoxos ? c.PLATFORM_FIREFOXOS : c.PLATFORM_OTHER;

  return detect;
});
