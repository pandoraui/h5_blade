﻿define(['cAjax'], function (cAjax) {

  var Model = _.inherit({
    //默认属性
    propertys: function () {
      this.url = null;
      this.param = null;
      this.dataformat = null;
      this.validates = [];
      this.protocol = (window.location.protocol.indexOf("https") > -1) ? "https" : "http";
      this.contentType = 'json';
      this.method = 'POST';

      this.timeout = 30000;

      //是否主动取消当前ajax
      this.isAbort = false;

      this.baseurl = {
        domain: '',
        path: ''
      };
    },

    setOption: function (options) {
      // _.extend(this, options);
      for (var key in options) {
        this[key] = options[key];
      }
    },

    assert: function () {
      if (this.url === null) {
        throw 'not override url property';
      }
      if (this.param === null) {
        throw 'not override param property';
      }
    },

    initialize: function (opts) {
      this.propertys();
      this.setOption(opts);
      this.assert();

    },

    setAttr:function(key, val){
      this[key] = val;
    },

    pushValidates: function (handler) {
      if (typeof handler === 'function') {
        this.validates.push($.proxy(handler, this));
      }
    },

    setParam: function (key, val) {
      if (typeof key === 'object' && !val) {
        this.param = key;
      } else {
        this.param[key] = val;
      }
    },

    getParam: function () {
      return this.param;
    },

    //构建url请求方式，子类可复写，我们的model如果localstorage设置了值便直接读取，但是得是非正式环境
    buildurl: function () {
      //      var baseurl = AbstractModel.baseurl(this.protocol);
      //      return this.protocol + '://' + baseurl.domain + '/' + baseurl.path + (typeof this.url === 'function' ? this.url() : this.url);
      throw "[ERROR]abstract method:buildurl, must be override";

    },

    /**
    *	取model数据
    *	@param {Function} onComplete 取完的回调函
    *	传入的第一个参数为model的数第二个数据为元数据，元数据为ajax下发时的ServerCode,Message等数
    *	@param {Function} onError 发生错误时的回调
    *	@param {Boolean} ajaxOnly 可选，默认为false当为true时只使用ajax调取数据
    * @param {Boolean} scope 可选，设定回调函数this指向的对象
    * @param {Function} onAbort 可选，但取消时会调用的函数
    */
    execute: function (onComplete, onError, scope, onAbort, params) {
      // @description 定义是否需要退出ajax请求
      this.isAbort = false;

      // @description 请求数据的地址
      var url = this.buildurl();

      var self = this;

      var __onComplete = $.proxy(function (data) {


        // @description 开发者可以传入一组验证方法进行验证
        for (var i = 0, len = this.validates.length; i < len; i++) {
          if (!this.validates[i](data)) {
            // @description 如果一个验证不通过就返回
            if (typeof onError === 'function') {
              return onError.call(scope || this, data);
            } else {
              return false;
            }
          }
        }

        // @description 对获取的数据做字段映射
        var datamodel = typeof this.dataformat === 'function' ? this.dataformat(data) : data;

        if (typeof onComplete === 'function') {
          onComplete.call(scope || this, datamodel, data);
        }

      }, this);

      var __onError = $.proxy(function (e) {
        if (self.isAbort) {
          self.isAbort = false;

          if (typeof onAbort === 'function') {
            return onAbort.call(scope || this, e);
          } else {
            return false;
          }
        }

        //发生错误，隐藏 loading 弹层
        Blade.loading.hide();

        var _scope = this;
        if (typeof onError === 'function') {
          setTimeout(function(){
            onError.call(scope || _scope, e);

            setTimeout(function(){
              if( $.isFunction(scope.errNextDeal) ){
                scope.errNextDeal.call(scope || _scope, e);
              }
            }, 1500);
          }, 300);
        }
      }, this);

      // @description 从this.param中获得数据，做深copy
      if( $.isFunction(this.__updateOption) ){
        this.__updateOption();
      }

      var params = params || _.clone(this.getParam() || {});

      var params = $.extend({},this.commonParams, params);

      //设置contentType无效BUG，改动一，将contentType保存
      params.contentType = this.contentType;

      // cAjax.cros(url, this.method, params, __onComplete, __onError);

      if (this.contentType === 'json') {
        // @description 跨域请求
        cAjax.cros(url, this.method, params, __onComplete, __onError);
      } else if (this.contentType === 'jsonp') {
        // @description jsonp的跨域请求
        cAjax.jsonp(url, params, __onComplete, __onError);
      } else {
        // @description 默认post请求
        cAjax.post(url, params, __onComplete, __onError);
      }
    },
    /**
     * 终止请求
     * @method Model.cAbstractModel.abort
     */
    abort: function () {
      this.isAbort = true;
      this.ajax && this.ajax.abort && this.ajax.abort();
    },
    // ajaxGet: function(onComplete, onError, scope, onAbort, params){
    //   params = params || {};
    //   params.method = 'GET';
    //   this.execute(onComplete, onError, scope, onAbort, params);
    // },
    //
    // ajaxPost: function(onComplete, onError, scope, onAbort, params){
    //   params = params || {};
    //   params.method = 'POST';
    //   this.execute(onComplete, onError, scope, onAbort, params);
    // },

  });



  /**
   * Model的单例获取方式
   * @method Model.getDetail.getInstance()
   * @returns {*}
   */
  Model.getInstance = function () {
    if (this.instance instanceof this) {
      return this.instance;
    } else {
      return this.instance = new this;
    }
  };

  return Model;
});
