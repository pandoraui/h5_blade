define(['PageView', 'AppModel', 'AppStore'],
  function (PageView, AppModel, AppStore){

    var viewhtml = [
        '<div class="xcard more-tips">',
        '  <h4>享受更多服务，请安装好食期 APP</h4>',
        '  <a href="http://a.app.qq.com/o/simple.jsp?pkgname=com.doweidu.android.haoshiqi" class="btn btn-blue">下载好食期 APP</a>',
        '  <p>您的手机号就是好食期的登录账号</p>',
        '</div>'].join('');

    return _.inherit(PageView, {
      pageName: 'help',
      onCreate: function(){
        // var viewhtml = '下单成功';
        this.$el.html(viewhtml);
        //元素集合
        // this.els = {
        //   'hsq_box': this.$el.find('.hsq_box')
        // };
        //
        // var tpl_hsq_box = this.$el.find('#tpl_hsq_box');
        //
        // this.tpls = {
        //   'hsq_box': tpl_hsq_box.html(),
        // };
        // tpl_hsq_box.remove();
      },
      setHeader: function(){
        var self = this;

        var headerData = {
          center: {
            tagname: 'title',
            value: ['下载好食期']
          },
          back: false,
          // back: {
          //   tagname: 'back',
          //   value: '返回',
          //   callback: function() {
          //     //这里返回订单详情页
          //     self.backAction();
          //   }
          // }
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

      },
      renderPage: function(data){

      },
    });
});
