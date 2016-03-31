
define(['AbstractModel', 'ApiConfig', 'AppStore', 'cDetect'], function( AbstractModel, ApiConfig, AppStore, cDetect) {
  var _model = {};

/*
  Usage Example

  var storeCommonLong = CommonStore.CommonLong.getInstance();
  var storeCommonShort = CommonStore.CommonShort.getInstance();
  var modelLogin = AppModel.login.getInstance();

 */


  //{"value":{"username":"138****1714","avatar":"","mobile":"13817131714","email":"","birthday":"0000-00-00","sex":0,"enabled":1,"token":"5f8facea123903bfa2e18340de673eef"},"timeout":"2016/06/16 11:09:55","savedate":"2016/03/08 11:09:55"}

  var storeLogin = AppStore.Login.getInstance();
  var loginInfo = storeLogin.get() || {};


  /*
  API接口UserAgent规范:

  Iphone: HSQIphone/版本号 (机型; 系统版本; Scale/像素与宽高比例): 举例: HSQIphone/1.0.0 (iPhone; iOS 9.1.0; Scale/3.00)
  Android: HSQAndroid/版本号 (机型; 系统版本): 举例: HSQAndroid/1.0.0 (机型; 系统版本)

  说明文档 https://worktile.com/share/pages/b1d17c75870545fea9aa76c26f12c3af
  */
  var deviceType = 'pc';
  if ($.os.phone) {
    deviceType = "phone";
    if ($.os.iphone) {
      deviceType = "iphone";
    } else if($.os.android){
      deviceType = "android";
    } else if ($.os.ipad) {
      deviceType = "pad";
    }
  }
  var channel = '';
  if(cDetect.isWifiKey){
    channel = 'wifikey';
  }
  function setCommonParams(opts){
    var opts = opts || storeLogin.get() || {};
    return {
      token: opts.token || '',  //用户登录时必传
      device: deviceType,    //设备
      uuid: '',    //用户唯一标志
      udid: '',    //设备唯一标志
      timestamp: '',    //时间
      channel: channel,    //渠道
      location: '',    //地理位置
      net: '',    //网络
      v: '',    //应用版本号
      swidth: window.screen.width,    //屏幕宽度
      sheight: window.screen.height,  //屏幕高度
      page: '',    //当前页面
      zoneId: '',    //当前收货省份
    };
  };

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

        this.commonParams = setCommonParams();
        // var _params = $.extend({}, commonParams, opt.param);
        this.param = opt.param || {};
        opt.method && (this.method = opt.method);
        opt.result && (this.result = opt.result);
        opt.checkAuth && (this.checkAuth = opt.checkAuth);
        this.buildurl = buildurl;
      },
      initialize: function($super, options) {
        //var options = this._propertys();
        $super(options);
      },
      //这里要每次 ajax 请求之前，更新公共参数（因为 token 可能发生变化了）
      __updateOption: function(){
        // if(!loginInfo.token){
          loginInfo = storeLogin.get() || {};
        // }
        this.commonParams = setCommonParams(loginInfo);
      },
    });
  };

  /***************
   *  关于model的命名
   *
   *  如命名CruiseSearchPageModel中，Cruise以及Model是没有意义的，可以省去
   *    余下的部分应在**保证理解**请求数据意义的情况下**尽量简短**
   *  在页面中调用使用时
   *  如上命名可简化如下：
   *  searchPageModel = AppModel.SearchPage.getInstance()
   *  locationStore   = AppStore.Location.getInstance()
   *  推荐的命名：(页面使用时采用小驼峰并追加Model/Store后缀，如：addCustomerModel)
   *  _model.AddCustomer        //新增××
   *  _model.UpdateCustomer     //更新××
   *  _model.GetCustomerList    //获取××列表
   *  _model.CancelOrder        //取消××
   *  _model.SendOrderDocuments //发送××
   *  _model.RemovePriceRemind  //移除××（Remove or Cancel）
   ********/

   /*
  * SEO相关的页面，请求在页面中
  * TODO：请相关人员把这里的Model请求注释掉
  * 比如首页等
  */

  //首页请求

  // _model.getTestPage = _model.CustomModel("/GetHomePage", {method: "GET"});

  //获取推荐商品列表
  _model.RPList = _model.CustomModel("/product/recommendproducts", {
    method: "GET",
    result: AppStore.RPList.getInstance()  //数据
  });
  //分类列表页
  _model.categoryList = _model.CustomModel("/category/categorylist", {method: "GET"});

  //详情页
  _model.getDetailDesc = _model.CustomModel("/product/iteminfo", {method: "GET"});
  _model.getDetailArticle = _model.CustomModel("/product/productdetail", {method: "GET"});

  //快捷登录
  _model.login = _model.CustomModel("/user/login", {method: "POST"});
  _model.getMobileCode = _model.CustomModel("/common/getverifycode", {method: "GET"});

  //初始化订单
  _model.orderInit = _model.CustomModel("/order/orderinit", {method: "POST"});
  //提交订单
  _model.orderSubmit = _model.CustomModel("/order/submitorder", {method: "POST"});
  //提交支付
  _model.orderPay = _model.CustomModel("/order/orderpay", {method: "POST"});

  //订单详情
  _model.orderDetail = _model.CustomModel("/order/orderdetail", {method: "GET"});

  //地址
  _model.addAddress = _model.CustomModel("/user/addaddress", {method: "POST"});
  _model.addressList = _model.CustomModel("/user/addresslist", {method: "GET"});

  //省市县三级数据
    //获取省份列表
  _model.addrListA = _model.CustomModel("/nation/provincelist", {method: "GET"});
    //获取城市列表
  _model.addrListB = _model.CustomModel("/nation/citylist", {method: "GET"});
    //获取行政区县列表
  _model.addrListC = _model.CustomModel("/nation/districtlist", {method: "GET"});


  //搜索项目获取列表，带缓存
  // _model.SearchPage = _model.CustomModel("/GetSearchItem",{
  //   param : AppStore.SearchParam.getInstance(),  //参数
  //   result: AppStore.SearchData.getInstance()  //数据
  // });




  //主题活动、专题等

  //推荐有奖
  //获取营销活动信息
  _model.getRewardInfo = _model.CustomModel("/reward/getrewardinfo", {method: "GET"});
  //用户注册
  _model.register = _model.CustomModel("/user/register", {method: "POST"});
  //每日 Top 10
  _model.todayTop10 = _model.CustomModel("/product/topicskusinfo", {method: "GET"});


  //获取短链接
  // _model.ShortUrlModel = _model.CustomModel("/GetShortUrl");

  return _model;
});
