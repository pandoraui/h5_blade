// define(["libs", "AbstractStore", "cInherit"], function(libs, AbstractStore, cInherit) {
// define(["libs", "AbstractStore"], function(libs, AbstractStore) {
define(["AbstractStore"], function(AbstractStore) {
  var _ret = {};
  _ret.CustomStore = function(key, lifeTime, defaultData) { //自定义
    return _.inherit(AbstractStore, {
      //默认属性
      __propertys__: function() {
        this.key = key;
        this.lifeTime = lifeTime; //D代表天，H代表小时，M代表分钟，S代表秒
        defaultData && (this.defaultData = defaultData);
      },
      initialize: function($super, options) {
        this.__propertys__();
        $super(options);
      }
    });
  };
  /***************
   *
   *  前缀的意义  示例 (如：产品名称=HSQ)
   *  BU内公共数据  产品名称_XXX
   *  S 查询    S_产品名称_XXX
   *  P 产品    P_产品名称_XXX
   *  F 表单    F_产品名称_XXX
   *  U 用户    U_产品名称_XXX
   *  B 订单    B_产品名称_XXX
   *  O 其他    O_产品名称_XXX
   *
   ********/

  /******************
   * @name : 公共长缓存
   * @time : 1年
   * @author : <鸿飞>
   * @page : index
   *
   * @value :
   *    {
   *     from: "/webapp/tour/index.html"  //记录首页回退链接。避免丢失首页回退链接。
   *     history: [{"id":74,"saillingid":1987}] //记录用户浏览记录.
   *     backurls: {"detail":["list","/webapp/cruise/index","/webapp/xx/view"]} //记录用户回退列表.
   *    }
   ******************/
  _ret.CommonLong = _ret.CustomStore("HSQ_COMMON_LONG", "365D",{

  });

  /******************
   * @name : 公共短缓存
   * @time : 1天
   * @author : <鸿飞>
   * @page : bookingnotice, addedit, passengerData
   *
   * @value :
   *    {
   *     "bookingnotice": 1,  //预订须知页面，记录tab位置
   *     "passengerData":null //新增旅客和常旅列表页面，记录旅客列表
   *    }
   ******************/
  _ret.CommonShort = _ret.CustomStore("HSQ_COMMON_SHORT", "1D",{

  });

  /******************
   * @name : 地理定位存储
   * @time : 1天
   * @author : <田盛>
   * @page : common,index,list,search,bookingstep3,bookingstep3.invoices
   *
   * @value :
   *    {
   *     name:"上海",   //定位城市
   *     id: 2 ,    //城市id
   *     lat:0,     //定位经度
   *     lng:0,     //定位纬度
   *     islocated:false
   *    }
   ******************/
  _ret.Location = _ret.CustomStore('HSQ_LOCATION_STORE','1D',{
    id: 2 ,
    name:"上海",
    lat: null,
    lng: null,
    islocated:false
  });

  //详情页
  _ret.DetailIntro = _ret.CustomStore("HSQ_DETAIL_INTRO", "1D", {});

  _ret.Zhuti = _ret.CustomStore('HSQ_ZHUTI_STORE', '30M', {});

  return _ret;
});
