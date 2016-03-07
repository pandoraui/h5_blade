// define(["libs", "AbstractStore", "cInherit"], function(libs, AbstractStore, cInherit) {
// define(["libs", "AbstractStore"], function(libs, AbstractStore) {
// define(["cStore"], function(cStore) {
define(["cLocalStore"], function(cStore) {
  var _ret = {};
  _ret.CustomStore = function(key, lifeTime, defaultData) { //自定义
    return _.inherit(cStore, {
      //默认属性
      __propertys__: function() {

        this.key = key;
        this.lifeTime = lifeTime; //D代表天，H代表小时，M代表分钟，S代表秒
        defaultData && (this.defaultData = defaultData);
      },
      initialize: function($super, options) {
        $super(options);
        // this.__propertys__();
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

  //公共长缓存
  _ret.CommonLong = _ret.CustomStore("HSQ_COMMON_LONG", "365D",{

  });

  //公共短缓存
  _ret.CommonShort = _ret.CustomStore("HSQ_COMMON_SHORT", "15M",{

  });

  //地理定位存储
  _ret.Location = _ret.CustomStore('HSQ_LOCATION_STORE','1D',{
    id: 2 ,
    name:"上海",
    lat: null,
    lng: null,
    islocated: false
  });

  //详情页
  _ret.DetailIntro = _ret.CustomStore("HSQ_DETAIL_INTRO", "1D", {});

  _ret.Zhuti = _ret.CustomStore('HSQ_ZHUTI_STORE', '30M', {});

  return _ret;
});
