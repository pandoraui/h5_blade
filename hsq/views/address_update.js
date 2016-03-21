define(['PageView', getViewTemplatePath('address_update'), 'AppModel', 'AppStore', 'FormatReg'],
  function (PageView, viewhtml, AppModel, AppStore, FormatReg){

    var storeCommonShort = AppStore.CommonShort.getInstance();
    var modelAddAddress = AppModel.addAddress.getInstance();

    var newAddress = {},
        curDistrict = {};

    return _.inherit(PageView, {
      pageName: 'address_update',
      events: {
        'click .J_address': 'selectDistrict'
      },
      onCreate: function(){
        // var viewhtml = '更新地址';
        this.$el.html(viewhtml);
        //元素集合
        this.els = {
          '$form': this.$el.find('#J_new_address'),
          '$inputName': this.$el.find('.J_name'),
          '$inputMobile': this.$el.find('.J_mobile'),
          '$inputAddress': this.$el.find('.J_address'),
          '$inputAddressDetail': this.$el.find('.J_address_detail'),
          'hsq_box': this.$el.find('.hsq_box'),
        };

        var tpl_hsq_box = this.$el.find('#tpl_hsq_box');

        this.tpls = {
            'hsq_box': tpl_hsq_box.html(),
        };
        tpl_hsq_box.remove();
      },
      setHeader: function(){
        var self = this;
        var type = 'add';
        var title = type === 'add' ? '新增收货地址' : '修改地址';
        var headerData = {
          center: {
            tagname: 'title',
            value: [title]
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
            value: '保存',
            callback: function() {
              //这里返回订单详情页
              self.saveAddress();
            }
          }]
        };
        this.header.set(headerData);
        this.header.show();
      },
      onShow: function(){
        curDistrict = storeCommonShort.getAttr('curDistrict') || {};

        this.initPage();
      },
      onHide: function(){},
      //初始化页面
      initPage: function(){
        var scope = this;
        this.ajaxRequest();
      },
      ajaxRequest: function(){
        this.renderPage();
      },
      renderPage: function(){
        if(curDistrict.id_c_name){
          var address = curDistrict.id_a_name + curDistrict.id_b_name + curDistrict.id_c_name;
          this.els.$inputAddress.val(address);
        }
      },
      selectDistrict: function(){
        //跳转去选择地址时，可把默认地址传递过去（用于编辑页面，暂时不需要）
        this.forward('district');
      },
      checkNewAddress: function(){
        //检测新地址状态
        // console.log(this.els.$form);
        newAddress = {
          contacter: this.els.$inputName.val().trim(),
          mobile: this.els.$inputMobile.val().trim(),
          detailAddress: this.els.$inputAddressDetail.val().trim(),

          //所在区域
          provinceId: curDistrict.id_a,
          province: curDistrict.id_a_name,
          cityId: curDistrict.id_b,
          city: curDistrict.id_b_name,
          districtId: curDistrict.id_c,
          district: curDistrict.id_c_name,
        };

        if(!newAddress.contacter){
          this.showToast('请输入联系人');
          return;
        }

        if(!newAddress.mobile){
          this.showToast('请输入手机号');
          return;
        } else if( !FormatReg.mobile.reg.test(newAddress.mobile) ){
          this.showToast(FormatReg.mobile.tip);
          // this.focusInput(this.els.$nodeMobile);
          return;
        }

        if( !(newAddress.provinceId && newAddress.cityId && newAddress.districtId) ){
          this.showToast('请选择地址所在区域');
          return;
        }

        if(!newAddress.detailAddress){
          this.showToast('请输入详细地址');
          return;
        }

        return true;
      },
      saveAddress: function(){
        var self = this;
        if( !this.checkNewAddress() ){
          return;
        }

        modelAddAddress.param = newAddress;

        this.showLoading();
        modelAddAddress.execute(function(res){
          this.hideLoading();
          //成功
          var data = res.data;

          this.showToast('保存成功');

          setTimeout(function(){
            self.back();
          }, 1500);

        },function(error){
          //失败
          this.showToast(error.errmsg);
        },this);
      },
    });
});
