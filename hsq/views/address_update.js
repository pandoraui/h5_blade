define(['PageView', getViewTemplatePath('address_update'), 'AppModel', 'AppStore', 'FormatReg'],
  function (PageView, viewhtml, AppModel, AppStore, FormatReg){

    // var storeAddress = AppStore.Address.getInstance();
    var modelAddressAdd = AppModel.addressAdd.getInstance();


    var newAddress = {},
        District = {};

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
        var title = type === 'add' ? '新增收获地址' : '修改地址';
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
              // self.back();
            }
          }]
        };
        this.header.set(headerData);
        this.header.show();
      },
      onShow: function(){
        this.initPage();
      },
      onHide: function(){},
      //初始化页面
      initPage: function(){
        var scope = this;
        this.ajaxRequest();
      },
      ajaxRequest: function(){},
      renderPage: function(){

      },
      selectDistrict: function(){
        //选择区域城市
        console.log('选择城市');
      },
      checkNewAddress: function(){
        //检测新地址状态
        // console.log(this.els.$form);
        newAddress = {
          contacter: this.els.$inputName.val().trim(),
          mobile: this.els.$inputMobile.val().trim(),
          detailAddress: this.els.$inputAddressDetail.val().trim(),

          //所在区域
          provinceId: District.provinceId,
          province: District.province,
          cityId: District.cityId,
          city: District.city,
          districtId: District.districtId,
          district: District.district,
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
        if( !this.checkNewAddress() ){
          return;
        }

        
      },
    });
});
