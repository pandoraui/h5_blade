define(['PageView', getViewTemplatePath('address')],
  function (PageView, viewhtml){

    var addressList = [
      {
        id: 1,
        name: '徐某某',
        mobile: '134****3245',
        address: '上海徐汇区城区钦州路100号2号楼XXX室'
      },
      {
        id: 2,
        name: '徐某某',
        mobile: '134****3245',
        address: '上海徐汇区城区钦州路100号2号楼XXX室'
      },
      {
        id: 3,
        name: '徐某某',
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
          // "tplbox_bs2_intro": this.$el.find('#'),
        };

        var tpl_hsq_box = this.$el.find('.tpl_hsq_box');

        this.tpls = {
            'tpl_hsq_box': tpl_hsq_box.html(),
        };
        tpl_hsq_box.remove();
      },
      onShow: function(){
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

        this.initPage();
      },
      onHide: function(){},
      //初始化页面
      initPage: function(){
        var scope = this;

        tempArr = _.indexBy(addressList, 'id');
      },
      ajaxRequest: function(){},
      renderPage: function(data){

      },
      checkedAddress: function(e){
        var target = $(e.currentTarget);
        var curId = target.data('id');
        target.addClass('icon-check').siblings().removeClass('icon-check');
        this.curAddress = tempArr[curId] || {};

        console.log(this.curAddress);

        this.back();
      },
    });
});
