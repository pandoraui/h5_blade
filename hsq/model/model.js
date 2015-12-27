// define(['libs', 'AbstractModel', 'AppStore', 'ApiConfig', 'AppCommonStore'], function(libs, AbstractModel, AppStore, ApiConfig, AppCommonStore) {
// define(['libs', 'AbstractModel', 'AppStore', 'ApiConfig', 'AppCommonStore'], function(libs, AbstractModel, AppStore, ApiConfig, AppCommonStore) {
// define(['AbstractModel', 'AppStore', 'ApiConfig', 'AppCommonStore'], function( AbstractModel, AppStore, ApiConfig, AppCommonStore) {

//暂时不要 store 了
define(['AbstractModel', 'ApiConfig'], function( AbstractModel, ApiConfig) {
  var _model = {};


  // var headStore = CommonStore.HeadStore.getInstance(),
  //   locationStore = CruiseStore.CruiseLocationStore.getInstance();

  // /**
  //  * 获取本地localStorage信息
  //  **/
  // // console.log(CommonCruiseModel);
  // var getLocalData = function(name) {
  //   var result = window.localStorage.getItem(name);
  //   if (result) {
  //   result = JSON.parse(result);
  //   if (Date.parse(result.timeout.replace(/-/g, '/')) >= new Date()) {
  //     return result.value || result.data;
  //   }
  //   }
  //   return "";
  // };
  //
  // /**
  //  @ 读取客户端信息
  //  @ DeviceType:  客户端的
  //  @ Version:"5.9"  客户端app 版本号（H5就传H5）
  //  @ Device:  客户端的机型
  //  @ ScreenWidth: 屏幕宽
  //  @ ScreenHeight: 屏幕高
  //  @ ScreenDPI: 屏幕每英寸点数
  //  @ ClientId:  //取cid
  //  @ Longitude: //缓存的经度 since 5.7
  //  @ Latitude:  //缓存的纬度 since 5.7
  //  **/
  // var getClientInfo = function() {
  //   var clientInfo = {
  //   Version: window.CruiseVersion(),
  //   DeviceType: "unknown",
  //   ScreenWidth: window.screen.width,
  //   ScreenHeight: window.screen.height
  //   };
  //   if (isInApp) {
  //   var deviceInfo = window.localStorage.getItem("DEVICEINFO") || '{}';
  //   deviceInfo = JSON.parse(deviceInfo);
  //
  //   clientInfo.Device = deviceInfo ? deviceInfo.device : "";
  //   }
  //   clientInfo.ClientId = window.localStorage.getItem("GUID") || '';
  //   if (window.screen.deviceXDPI) {
  //   clientInfo.ScreenDpiX = window.screen.deviceXDPI;
  //   clientInfo.ScreenDpiY = window.screen.deviceYDPI;
  //   }
  //   if ($.os.phone) {
  //   if ($.os.iphone) {
  //     clientInfo.DeviceType = "phone";
  //   }
  //   if ($.os.ipad) {
  //     clientInfo.DeviceType = "pad";
  //   }
  //   }
  //   return clientInfo;
  // };

  var buildurl = function() {
    var matchUrl = this.url;
    return ApiConfig.restApi(this.protocol, matchUrl);
  };

  //model功能方法
  _model.CustomModel = function(url, opts) { //自定义
    return _.inherit(AbstractModel, {
      propertys: function($super) {
        $super();
        var opt = opts || {};
        this.url = url;
        this.param = opt.param || {};
        opt.method && (this.method = opt.method);
        opt.result && (this.result = opt.result);
        opt.checkAuth && (this.checkAuth = opt.checkAuth);
        this.buildurl = buildurl;
      },
      initialize: function($super, options) {
        //var options = this._propertys();
        $super(options);
      }
    });
  };

  /***************
   *  关于model的命名
   *
   *  如命名CruiseSearchPageModel中，Cruise以及Model是没有意义的，可以省去
   *    余下的部分应在**保证理解**请求数据意义的情况下**尽量简短**
   *  在页面中调用使用时
   *  如上命名可简化如下：
   *  searchPageModel = CruiseModel.SearchPage.getInstance()
   *  locationStore   = CruiseStore.Location.getInstance()
   *  推荐的命名：(页面使用时采用小驼峰并追加Model/Store后缀，如：addCustomerModel)
   *  _model.AddCustomer    //新增××
   *  _model.UpdateCustomer   //更新××
   *  _model.GetCustomerList  //获取××列表
   *  _model.CancelOrder    //取消××
   *  _model.RemovePriceRemind  //取消××（Remove or Cancel）
   *  _model.SendOrderDocuments //发送××
   ********/

   /*
  * SEO相关的页面，请求在页面中
  * TODO：请相关人员把这里的Model请求注释掉
  * 比如首页等
  */

  //首页请求
  //_model.CruiseHomePage = _model.CustomModel("/GetHomePage");

  _model.getHomePage = _model.CustomModel("/GetHomePage", {method: "GET"});

  //搜索项目获取列表，带缓存
  // _model.CruiseSearchPageModel = _model.CustomModel("/GetSearchItem",{
  //   param : CruiseStore.SearchParam.getInstance(),  //参数
  //   result: CruiseStore.SearchData.getInstance()  //数据
  // });

  //获取短链接
  // _model.ShortUrlModel = _model.CustomModel("/GetShortUrl");

  return _model;
});
