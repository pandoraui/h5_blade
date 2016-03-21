define(['PageList', getViewTemplatePath('list'), 'AppModel', 'AppStore'],
  function (PageList, viewhtml, AppModel, AppStore){


    var modelProductRList = AppModel.productRList.getInstance();

    return _.inherit(PageList, {
    // return PageView.extend({
      pageName: 'list',
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
        this.header.show();
      },
      onShow: function(){

        if(!this.loaded){
          this.pageNum = 1;
          this.loadover = false;
          this.initPage();
        }else{

        }


      },
      onHide: function(){},
      //初始化页面
      initPage: function(){
        var scope = this;

        this.ajaxRequest();
      },
      ajaxRequest: function(){
        var self = this;

        modelProductRList.param = {
          needPagination: this.needPagination,
          pageNum: this.pageNum,
          pageLimit: this.pageLimit,
        };

        this.showLoading();
        //ajax去发送短信
        modelProductRList.execute(function(res){
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
        },this);
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
          item.skuInfo._offline_times = item.skuInfo.expired_date - item.skuInfo.offline_before_expired;
          item._format_price = self.dealPrice(item.skuInfo);
        });
        return data;
      },
      dealPrice: function(item){
        /** 处理价格
          14.59<i>23434</i>
          变动的价格=（起售价-最底价）*1s/（保质期截止时间-提前下架的时间-上架售卖时间）
          起售价 price
          最底价 lowest_price
          开售时间 seller_time
        */

        //(price - cur_price) / (cur_price - lowest_price)
        // = (timestamp - seller_time)/(_offline_times - timestamp)
        var _diff_all_price = item.price - item.lowest_price;
        //每秒变动的价格
        var _diff_m_price;
        var _diff_price;
        if(item._offline_times - item.seller_time <= 0){
          _diff_m_price = 0;
          _diff_price = _diff_all_price;
        }else{
          _diff_m_price = _diff_all_price * 1/(item._offline_times - item.seller_time);
          _diff_price = (this.timestamp - item.seller_time)*_diff_m_price;
        }
        var _deal_price = (item.price - _diff_price).toFixed(6);
        var _format_price = _.formatPrice(_deal_price, 6, 0);

        return _format_price;
      },
      onBottomPull: function(){
        //底部刷新

        if(this.pageNum < this.totalPage){
          this.pageNum++;
          modelProductRList.param = {
            needPagination: this.needPagination,
            pageNum: this.pageNum,
            pageLimit: this.pageLimit,
          };

          this.showBottomLoading();
          //ajax去发送短信
          modelProductRList.execute(function(res){
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
    });
});
