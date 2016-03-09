define(['PageView', getViewTemplatePath('address'), 'AppModel', 'AppStore'],
  function (PageView, viewhtml, AppModel, AppStore){

    var storeAddress = AppStore.Address.getInstance();
    var modelAddressList = AppModel.addressList.getInstance();

    var addressTestList = [
      {
        "id": 10000001,
        "province": "上海市",
        "city": "上海市",
        "district": "闵行区",
        "contacter": "王二",
        "detail_address": "100号2号楼206室",
        "mobile": "170****5856"
      },
      {
        "id": 10000002,
        "province": "上海市",
        "city": "上海市",
        "district": "徐汇区",
        "contacter": "赵子云",
        "detail_address": "100号2号楼207室",
        "mobile": "170****5856"
      },
      {
        "id": 10000003,
        "province": "上海市",
        "city": "上海市",
        "district": "长宁区",
        "contacter": "司马无情",
        "detail_address": "100号2号楼208室",
        "mobile": "170****5856"
      },
    ];
    var tempArr = [];

    return _.inherit(PageView, {
      pageName: 'address',
      events: {
        'click .address-list li': 'checkedAddress',
      },
      onCreate: function(){
        // var viewhtml = '地址列表';
        this.$el.html(viewhtml);
        //元素集合
        this.els = {
          'hsq_box': this.$el.find('.hsq_box')
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
            value: ['地址管理']
          },
          back: {
            tagname: 'back',
            value: '返回',
            callback: function() {
              self.back();
            }
          },
          right: [{
            tagname: 'address-add',
            value: '新建地址',
            callback: function() {
              //这里返回订单详情页
              self.forward('address_update');
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
      ajaxRequest: function(){
        //更新默认地址，优先使用 store 地址，没有的话，使用ajax 中的默认地址
        var curAddress = storeAddress.get() || {};

        modelAddressList.param = {};

        this.showLoading();
        modelAddressList.execute(function(res){
          this.hideLoading();

          //成功
          console.log(res);

          var data = res.data;

          var addressList = data.list;

          addressList = addressTestList;

          addressList = this.dealAddress(addressList);

          console.log(addressList)
          this.renderPage({
            list: addressList,
            curId: curAddress.id || 0
          });

        },function(error){
          //失败
          this.showToast(error.errmsg);
        },this);



      },
      dealAddress: function(addressList){
        if(!addressList.length) return [];

        addressList.forEach(function(address){
          var tempCity = address.province == address.city ? address.city : (address.province + address.city);
          address.detail = tempCity + address.district + address.detail_address;
        });

        tempArr = _.indexBy(addressList, 'id');
        return addressList;
      },
      renderPage: function(data){

        var html_address = _.template(this.tpls.hsq_box)(data);
        this.els.hsq_box.html(html_address);
      },
      checkedAddress: function(e){
        var target = $(e.currentTarget);
        var curId = target.data('id');

        if(!curId) return;
        target.addClass('icon-check').siblings().removeClass('icon-check');
        this.curAddress = tempArr[curId] || null;

        storeAddress.set(this.curAddress);

        this.back();
      },
    });
});
