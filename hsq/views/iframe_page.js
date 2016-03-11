define(['PageView', 'AppModel', 'AppStore'],
  function (PageView, AppModel, AppStore){

    var viewhtml = [
      '<div class="iframe_box hsq_box"></div>'
    ].join('');

    var iframeUrl;

    return _.inherit(PageView, {
      pageName: 'iframe_page',
      events: {

      },
      onCreate: function(){
        this.$el.html(viewhtml);
        //元素集合
        this.els = {
          'hsq_box': this.$el.find('.hsq_box')
        };

        // var tpl_hsq_box = this.$el.find('#tpl_hsq_box');
        //
        // this.tpls = {
        //   'hsq_box': tpl_hsq_box.html(),
        // };
        // tpl_hsq_box.remove();
      },
      setHeader: function(){
        var self = this;
        var title = this.params.title;

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
        this.renderPage();
      },
      renderPage: function(data){
        iframeUrl = decodeURIComponent(this.params.iframe_url);
        //<iframe class="iframe" src="<%=iframeUrl%>"></iframe>
        // var html = _.template(this.tpls.hsq_box)(data);

        var html = '<iframe class="iframe_page" src="' + iframeUrl + '"></iframe>';
        this.els.hsq_box.html(html);
      },
    });
});
