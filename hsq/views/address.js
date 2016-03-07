define(['PageView', getViewTemplatePath('address'), 'AppModel', 'AppStore'],
  function (PageView, viewhtml, AppModel, AppStore){

    var storeAddress = AppStore.Address.getInstance();

    var addressList = [
      {
        id: 1,
        name: '徐某某',
        mobile: '134****3245',
        address: '上海徐汇区城区钦州路100号2号楼XXX室'
      },
      {
        id: 2,
        name: '王二',
        mobile: '134****3245',
        address: '上海徐汇区城区钦州路100号2号楼XXX室'
      },
      {
        id: 3,
        name: '司马无情',
        mobile: '134****3245',
        address: '上海徐汇区城区钦州路100号2号楼XXX室'
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

        tempArr = _.indexBy(addressList, 'id');
        this.renderPage({
          list: addressList,
          curId: curAddress.id || 0
        });

      },
      renderPage: function(data){

        var html_address = _.template(this.tpls.hsq_box)(data);
        this.els.hsq_box.html(html_address);
      },
      checkedAddress: function(e){
        var target = $(e.currentTarget);
        var curId = target.data('id');
        target.addClass('icon-check').siblings().removeClass('icon-check');
        this.curAddress = tempArr[curId] || {};

        storeAddress.set(this.curAddress);

        this.back();
      },
    });
});
