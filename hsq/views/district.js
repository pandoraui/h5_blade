define(['PageView', getViewTemplatePath('district'), 'AppModel', 'AppStore', 'FormatReg'],
  function (PageView, viewhtml, AppModel, AppStore, FormatReg){

    var storeCommonShort = AppStore.CommonShort.getInstance();
    var modelAddrListA = AppModel.addrListA.getInstance();
    var modelAddrListB = AppModel.addrListB.getInstance();
    var modelAddrListC = AppModel.addrListC.getInstance();

    var addrTempList = {},
        curDistrict = {},
        District = {};

    return _.inherit(PageView, {
      pageName: 'district',
      events: {
        'click .J_list_a>li:not(.active)': 'getAddrListB',
        'click .J_list_b>li:not(.active)': 'getAddrListC',
        'click .J_list_c>li:not(.active)': 'selectDistrict',
      },
      onCreate: function(){
        // var viewhtml = '更新地址';
        this.$el.html(viewhtml);
        //元素集合
        this.els = {
          '$list_a' : this.$el.find('.J_list_a'),
          '$list_b' : this.$el.find('.J_list_b'),
          '$list_c' : this.$el.find('.J_list_c'),
        };

        var tpl_hsq_box = this.$el.find('#tpl_hsq_box');

        this.tpls = {
          'hsq_box': tpl_hsq_box.html(),
        };
        tpl_hsq_box.remove();
      },
      setHeader: function(){
        var self = this;
        var headerData = {
          center: {
            tagname: 'title',
            value: ['选择城市']
          },
          back: {
            tagname: 'back',
            value: '返回',
            callback: function() {
              self.back();
            }
          },
          right: [{
            tagname: 'address-save',
            value: '确定',
            callback: function() {
              //这里返回订单详情页
              self.saveSelected();
              // self.back();
            }
          }]
        };
        this.header.set(headerData);
        this.header.show();
      },
      onShow: function(){
        curDistrict = storeCommonShort.getAttr('curDistrict') || {};
        addrTempList = storeCommonShort.getAttr('addrTempList') || {};
        this.initPage();
      },
      onHide: function(){},
      //初始化页面
      initPage: function(){
        var scope = this;
        this.ajaxRequest();
      },
      ajaxRequest: function(){

        this.getAddrListA();
        this.renderPage();
      },
      renderPage: function(){

      },
      getAddrListA: function(){
        var self = this;
        this.getAddrList({
          idType: 'id_a',
          model: modelAddrListA,
          params: {},
          type: 'allProvince',
          $dom: this.els.$list_a,
          callback: function(list){
            // if(!curDistrict.id_a){
            if( _.findIndex(list, {id: parseInt(curDistrict.id_a)}) == -1 ){
              curDistrict.id_a = list[0] && list[0].id;
              curDistrict.id_a_name = list[0] && list[0].province;
            }
            curDistrict.tempId = curDistrict.id_b;

            self.getAddrListB();
          },
        });
      },
      getAddrListB: function(e){
        var self = this;
        if(e){
          var target = $(e.currentTarget);
          curDistrict.id_a = target.data('id');
          curDistrict.id_a_name = target.text();
          target.addClass('active').siblings().removeClass('active');

          curDistrict.id_c = '';
        }

        this.getAddrList({
          idType: 'id_b',
          model: modelAddrListB,
          params: {
            provinceId: curDistrict.id_a
          },
          type: ('province' + curDistrict.id_a),
          $dom: this.els.$list_b,
          callback: function(list){
            if( _.findIndex(list, {id: parseInt(curDistrict.id_b) }) == -1 ){
              curDistrict.id_b = list[0] && list[0].id;
              curDistrict.id_b_name = list[0] && list[0].city;
            }
            curDistrict.tempId = curDistrict.id_b;

            self.getAddrListC();
          },
        });
      },
      getAddrListC: function(e){
        var self = this;
        if(e){
          var target = $(e.currentTarget);
          curDistrict.id_b = target.data('id');
          curDistrict.id_b_name = target.text();
          target.addClass('active').siblings().removeClass('active');

          curDistrict.id_c = '';
        }

        this.getAddrList({
          idType: 'id_c',
          model: modelAddrListC,
          params: {
            cityId: curDistrict.id_b,
          },
          type: ('city' + curDistrict.id_b),
          $dom: this.els.$list_c,
          callback: function(data){
            // if(!curDistrict.id_c){
            //   curDistrict.id_c = data[0] && data[0].id;
            // }
          },
        });
      },
      getAddrList: function(obj){
        if(!obj) return;

        var type = obj.type;

        if(!addrTempList[type]){
          obj.model.param = obj.params;
          this.showLoading();
          obj.model.execute(function(res){
            this.hideLoading();
            //成功
            console.log(res);

            addrTempList[type] = res.data.list;

            //缓存一下数据
            storeCommonShort.setAttr('addrTempList', addrTempList);

            this.renderList(obj);

          },function(error){
            //失败
            this.showToast(error.errmsg);
          },this);
        }else{
          this.renderList(obj);
        }
      },
      renderList: function(obj){
        var list = addrTempList[obj.type];

        if( $.isFunction(obj.callback) ){
          obj.callback(list);
        }

        var data = {
          list: list,
          curId: curDistrict[obj.idType],
          dataType: obj.idType,
        };
        var html = _.template(this.tpls.hsq_box)(data);
        obj.$dom.html(html);
      },
      selectDistrict: function(e){
        //选择区域城市
        var target = $(e.currentTarget);
        curDistrict.id_c = target.data('id');
        curDistrict.id_c_name = target.text();
        target.addClass('active iconfont icon-check').siblings().removeClass('active');

        console.log(curDistrict);

        // storeCommonShort.setAttr('curDistrict', curDistrict);
      },
      saveSelected: function(){
        if(!curDistrict.id_c){
          this.showToast('请选择区县');
          return;
        }
        storeCommonShort.setAttr('curDistrict', curDistrict);
        this.back();
      },
    });
});
