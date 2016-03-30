define(['PageList', getViewTemplatePath('list'), 'AppModel', 'AppStore', 'DealData'],
  function (PageList, viewhtml, AppModel, AppStore, DealData){


    var modelRPList = AppModel.RPList.getInstance();
    var sroreRPList = AppStore.RPList.getInstance();

    return _.inherit(PageList, $.extend(DealData, {
    // return PageView.extend({
      pageName: 'list',
      waitAjax: true,
      events: {
        'click .rec-list>.item': 'goDetail',
      },
      keepScrollPos: true,
      needPagination: 1,  //是否需要分页信息
      pageNum: 1,         //页码，默认1
      pageLimit: 20,      //每页显示数量，默认 0
      onCreate: function(){
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
            value: ['列表页']
          },
          back: false,
        };
        if(this.Debug){
          headerData.back = {
            tagname: 'back',
            value: '返回',
            callback: function() {
              self.back('index');
            }
          };
        }
        this.header.set(headerData);
      },
      onShow: function(){
        if(!this.loaded){
          this.resetPageData();
          this.initPage();
        }

        if(this.loadedTimeout){
          clearTimeout(this.loadedTimeout);
        }
      },
      onHide: function(){
        this.setTimeoutUpdateData();
      },
      setTimeoutUpdateData: function(){
        var self = this;
        //页面缓存的问题，如果离开列表页15分钟，则重新进入列表页会重新加载
        if(!this.loadedTimeout){
          this.loadedTimeout = setTimeout(function(){
            self.resetPageData();
          }, 900000);
        }
      },
      resetPageData: function(){
        this.pageNum = 1;
        this.loadover = false;
        this.saveScrollPos(0, 0);
      },
      //初始化页面
      initPage: function(){
        var scope = this;

        this.ajaxRequest();
      },
      ajaxRequest: function(){
        var self = this;

        modelRPList.param = {
          needPagination: this.needPagination,
          pageNum: this.pageNum,
          pageLimit: this.pageLimit,
        };

        this.showLoading();
        modelRPList.execute(function(res){
          this.hideLoading();
          //成功
          var data = res.data;
          this.timestamp = res.timestamp;
          this.totalPage = data.totalPage;
          this.loaded = true;

          this.renderPage(data);

          // this.back(redirect_from, {replace: true});

        },function(error){
          //失败
          this.showToast(error.errmsg);
        }, this);
      },
      renderPage: function(data, bool){
        var html = '';

        if(data.list && data.list.length){
          data = this.dealData(data);
          html = _.template(this.tpls.hsq_box)(data);
        }else{
          html = '<p class="pull-loading pull-loading-bottom">' + (bool ? '没有更多数据了' : '没有数据') + '</p>';
        }

        if(bool){
          this.els.hsq_box.append(html);
        }else{
          this.els.hsq_box.html(html);
        }

        this.imgLazyLoad();
      },
      dealData: function(data){
        var self = this;
        data.imgPlaceHold = this.imgPlaceHold;

        data.list.forEach(function(item, index){
          //下线时间
          item.skuInfo._offline_times = item.skuInfo.expired_date - item.skuInfo.offline_before_expired;
          //剩余时间
          item.skuInfo._left_times = item.skuInfo._offline_times - self.timestamp;
          item._format_price = self.dealPrice(item.skuInfo);
        });
        return data;
      },

      onBottomPull: function(){
        //底部刷新

        if(this.pageNum < this.totalPage){
          this.pageNum++;
          modelRPList.param = {
            needPagination: this.needPagination,
            pageNum: this.pageNum,
            pageLimit: this.pageLimit,
          };

          this.showBottomLoading();

          modelRPList.execute(function(res){
            this.hideBottomLoading();
            //成功
            var data = res.data;
            this.timestamp = res.timestamp;

            this.renderPage(data, true);

            // this.back(redirect_from, {replace: true});

          },function(error){
            this.pageNum--;
            //失败
            this.showToast(error.errmsg);
          },this);
        }else{
          if(!this.loadover){
            this.loadover = true;
            this.renderPage({}, true);
          }
        }

      },
      goDetail: function(e){
        var target = $(e.currentTarget),
            sid = target.data('sid');

        //此时，页面跳转详情页，不能切换 sid，故直接跳转主 sid(一般价格最低的)
        var detailUrl = 'detail?sid=' + sid;
        this.forward(detailUrl);
      },
    }));
});
