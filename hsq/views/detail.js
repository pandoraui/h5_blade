define(['View', 'AppModel', 'Swiper', 'UISwiper', 'LazyLoad', getViewTemplatePath('detail')],
  function (View, AppModel, Swiper, UISwiper, LazyLoad, viewhtml){

    // var ajaxTest = AppModel.getTestPage.getInstance();
    var ajaxGetDetailDesc = AppModel.getDetailDesc.getInstance();
    var ajaxGetDetailArticle = AppModel.getDetailArticle.getInstance();

    return _.inherit(View, {
      propertys: function ($super) {
        $super();

        // this.template = viewhtml;
        // this.$el.html(viewhtml);
        this.addEvents({
          // 'click #J_down_tip': 'closeDownTip',
          'click .swiper-wrapper': 'demo02'
        });
      },
      hashChangeParamsRefresh: true,
      addEvent: function ($super) {
        $super();
        //在页面显示后做的事情
      },
      initElement: function(){

        this.$el.html(viewhtml);
        this.$el.$errorDom = this.$el.find('.J_error_box');
        this.$el.$showViewDom = this.$el.find('.J_showview_box');
        this.$tplbox = {
          detail_desc: this.$el.find('#tplbox_detail'),
          detail_article: this.$el.find('#tplbox_detail_article'),
        };
        this.$tpl = {
          detail_desc: this.$el.find('#tpl_detail').html(),
          detail_article: this.$el.find('#tpl_detail_article').html(),
        };
      },
      initHeader: function () {
        var self = this;
        var headerData = {
          center: {
            tagname: 'title',
            value: ['商品详情']
          },
          back: {
            tagname: 'back',
            callback: function() {
              self.back('list');
            }
          }
        };
        this.header.set(headerData);
        this.header.show();
      },
      onShow: function(){
        //倒计时功能需要更新时清除下，不然会有闭包问题
        this.clearPreInit();
        this.initPage();
      },
      dealParams: function(params){
        for(var key in params){
          if(!params[key]){
            delete(params[key]);
          }
        }
        return params;
      },
      //初始化页面
      initPage: function () {
        this.fullWidth = $(document).width();
        var scope = this;
        this.errorTip();

        // $.swiper = function (container, params) {
        //     return new $.Swiper(container, params);
        // };

        var params = _.getUrlParam();

        ajaxGetDetailDesc.param = {
          productId: params.pid,
          skuId: params.sid,
        };

        this.dealParams(ajaxGetDetailDesc.param);

        this.showLoading();
        ajaxGetDetailDesc.execute(function(res){
          this.hideLoading();
          //成功
          console.log(res);

          var data = res.data;
          data._offline_times = data.expired_date - data.offline_before_expired;//下架时间
          this.timestamp = res.timestamp;
          data.timestamp = res.timestamp;
          if(data._offline_times < res.timestamp){
            data.timestamp = data._offline_times;
          }

          data._humanTimes = scope.humanTimes;

          this.renderPage(data);

          // if(!params.id){
            this.productId = data.product_id;
            this.getDetailArticle();
          // }

        },function(error){
          //失败
          console.log(error);
          this.errorTip(error.errmsg);
        },this);

        // if(params.id){
        //   this.productId = params.id;
        //   this.getDetailArticle();
        // }
        // $(".swiper-container").swiper(config)
      },
      errorTip: function(msg){
        var html = '';
        if(!msg){
          this.$el.$showViewDom.show();
          this.$el.$errorDom.html(html).hide();
        }else{
          html = '<p>'+msg+'</p>';
          this.$el.$showViewDom.hide();
          this.$el.$errorDom.html(html).show();
        }
      },
      renderPage: function(data){
        console.log('渲染页面');
        this.updateTitle(data.name);

        //注意，自己自定义的挂在 data 上的变量，使用_开头，避免后期服务器端修改，导致数据冲突
        data._deal_stock = this.dealStock(data)._deal_stock;
        data._format_price = this.dealPrice(data)._format_price;

        var container = this.$el.find('.swiper-container');
        container.css({'height': this.fullWidth});
        var imgList = data.pics || [];
        // [
        //   'http://gqianniu.alicdn.com/bao/uploaded/i4//tfscom/i1/TB1n3rZHFXXXXX9XFXXXXXXXXXX_!!0-item_pic.jpg_640x640q60.jpg',
        //   'http://gqianniu.alicdn.com/bao/uploaded/i4//tfscom/i4/TB10rkPGVXXXXXGapXXXXXXXXXX_!!0-item_pic.jpg_640x640q60.jpg',
        //   'http://gqianniu.alicdn.com/bao/uploaded/i4//tfscom/i1/TB1kQI3HpXXXXbSXFXXXXXXXXXX_!!0-item_pic.jpg_640x640q60.jpg'
        // ];

        if(imgList.length > 5){
          imgList.length = 5;
        }
        this.swiper = new UISwiper(container, imgList);

        var html_desc = _.template(this.$tpl.detail_desc)(data);
        this.$tplbox.detail_desc.html(html_desc);

        this.$priceDom = this.$tplbox.detail_desc.find('#J_price_box');
        this.$stockDom = this.$tplbox.detail_desc.find('#J_stock_box');
        this.countDownPrice(data);
        this.countDownStock(data);
      },
      humanTimes: function(times){
        //如果是今天，显示 "今天 时分秒"，否则显示 'Y-M-D H:F:S' 格式
        if(!this.today){
          this.today = _.dateUtil.format(this.timestamp*1000, {
            format: 'Y-M-D'
          });
        }
        var result = _.dateUtil.format(times*1000, {
          format: 'Y-M-D H:F:S'
        });

        return result.replace(this.today, '今天');
      },
      clearPreInit: function(){
        if(this.swiper){
          this.swiper.destroy();
        }
        if(this.clear_price_countdown){
          clearTimeout(this.clear_price_countdown);
        }
        if(this.clear_stock_countdown){
          clearTimeout(this.clear_stock_countdown);
        }
      },
      countDownPrice: function(data){
        var scope = this;
        var _deal_price = data._deal_price;
        scope.clear_price_countdown = setTimeout(function(){
          //拿到数据之后，只要未下架且当前价格大于最低价时，就可以操作
          _deal_price = data._deal_price;
          var _format_price;
          if( (_deal_price > data.lowest_price) && data._diff_m_price){
            _deal_price = (_deal_price - data._diff_m_price);//.toFixed(6);
            if(_deal_price < data.lowest_price){
              clearTimeout(scope.clear_price_countdown);
              _format_price = scope.formatPrice(data.lowest_price, 6, 4);
              scope.$priceDom.html(_format_price);
            }
            _format_price = scope.formatPrice(_deal_price, 6, 4);
            data._deal_price = _deal_price;
            data._format_price = _format_price;
            scope.$priceDom.html(_format_price);
            data.timestamp += 1;

            scope.countDownPrice(data);
          }
        },1000);
      },
      countDownStock: function(data){
        var scope = this;
        var bool = this.need_countdown_stock;
        if( !bool ){
          return;
        }
        if(data._left_times >= 3660){
          blankTimes = 60000;
        }else{
          blankTimes = 1000;
        }

        var _deal_stock = scope.dealStock(data, true)._deal_stock;
        scope.$stockDom.html(_deal_stock);

        //开启倒计时
        scope.clear_stock_countdown = setTimeout(function(){//clearInterval
          if( (data._left_times < 0) || !scope.need_countdown_stock){
            clearTimeout(scope.clear_stock_countdown);
            return;
          }
          data._left_times -= blankTimes*0.001;

          scope.countDownStock(data);

        }, blankTimes);

      },
      dealStock: function(data, countType){
        /**
        关于库存或停售时间的呈现逻辑：
          data.timestamp 当前时间
          _offline_times 下架时间
          left_stock 剩余库存
          expired_date 过期时间
          offline_before_expired 离保质期多久下架

        1）当库存＞30，并且剩余售卖时间＜7天时，显示剩余售卖时间。文案分3种情况：
          - 当1天≤剩余售卖时间＜7天时，显示：**剩x天xx小时停售** （如果小时数为0，则不显示小时，比如：最后6天）
          - 当1小时≤剩余售卖时间＜1天时，显示：**剩xx小时xx分停售** （如果分钟数为0，则不显示分，比如：最后12小时）
          - 当剩余售卖时间＜1小时时，显示：**剩xx分xx秒停售**（秒数每秒变动，倒计时）
          - 当商品停售时，文案显示**已停售**
        2）其他情况（库存≤30，或最后售卖时间≥7天），都显示库存数，文案：仅剩xxx件。
          - 当库存为0时，显示：**已售完**
        */
        //部分数据需要处理，比如库存 仅剩<%=left_stock%>件
        var _deal_stock = '';  //经过处理的库存状态显示

        var _left_times;
        if(data._left_times && countType){
          _left_times = data._left_times;
        }else{
          _left_times = data._offline_times - data.timestamp;  //剩余时间
          // _left_times = 3605;
          data._left_times = _left_times;
        }

        this.need_countdown_stock = false;
        if( (data.left_stock > 30) && (_left_times < 86400*7)){
          if(_left_times >= 86400){
            _deal_stock = _.dateUtil.format(_left_times*1000 ,{type: 'countdown', format: '剩D天H小时停售'});  //剩x天xx小时停售
          }else if(_left_times >= 3600){
            this.need_countdown_stock = true;
            _deal_stock = _.dateUtil.format(_left_times*1000 ,{type: 'countdown', format: '剩H小时F分停售'});  //剩xx小时xx分停售
          }else if(_left_times >= 1){
            this.need_countdown_stock = true;
            _deal_stock = _.dateUtil.format(_left_times*1000 ,{type: 'countdown', format: '剩F分S秒停售'});  //剩xx分xx秒停售
          }else{
            _deal_stock = "已停售";   //已停售
          }
        }else{
          if(data.left_stock < 1){
            _deal_stock = "已售完";
          }else{
            _deal_stock = "仅剩" + data.left_stock + "件";
          }
        }

        data._deal_stock = _deal_stock;

        return data;
      },
      dealPrice: function(data, countType){
        /** 处理价格
          14.59<i>23434</i>
          变动的价格=（起售价-最底价）*1s/（保质期截止时间-提前下架的时间-上架售卖时间）
          起售价 price
          最底价 lowest_price
          开售时间 seller_time
        */

        //(price - cur_price) / (cur_price - lowest_price)
        // = (timestamp - seller_time)/(_offline_times - timestamp)
        var _diff_all_price = data.price - data.lowest_price;
        //每秒变动的价格
        var _diff_m_price;
        var _diff_price;
        if(data._offline_times - data.seller_time <= 0){
          _diff_m_price = 0;
          _diff_price = _diff_all_price;
        }else{
          _diff_m_price = _diff_all_price * 1/(data._offline_times - data.seller_time);
          _diff_price = (data.timestamp - data.seller_time)*_diff_m_price;
        }
        var _deal_price = (data.price - _diff_price).toFixed(6);
        var _format_price = this.formatPrice(_deal_price, 6, 4);

        data._diff_m_price = _diff_m_price;
        data._deal_price = _deal_price;
        data._format_price = _format_price;

        return data;
      },
      formatPrice: function(_price, needCount){
        var price = parseFloat(_price)*0.01;
        if(isNaN(price)) return _price;
        var is0 = price < 1 && price >= 0;
        if(is0) price += 1;
        // 需要小数点后2位
        needCount = needCount || 2;
        var fn = fn || 'round';
        var numStr = Math[fn](price * Math.pow(10, needCount)).toString();
        var index = numStr.length - needCount;
        var intPart = numStr.substr(0, index);
        if(is0) intPart = parseInt(intPart) - 1;
        return intPart + '.' + numStr.substr(index, 2) + '<i>' + numStr.substr(index+2) + '</i>';
      },
      //继续请求图文详情接口
      getDetailArticle: function(){
        ajaxGetDetailArticle.param = {
          productId: this.productId
        };

        ajaxGetDetailArticle.execute(function(res){
          //成功
          console.log(res);

          var data = res.data;

          this.renderDetailArticle(data);
        },function(error){
          //失败
          console.log(error);
          console.log(error.errmsg);
        },this);
      },
      renderDetailArticle: function(data){

        var html_article = _.template(this.$tpl.detail_article)(data);

        //此处要做图片延迟加载，将所有的 img 图片 src 替换掉
        var $tempBox = $('<div id="temp"></div>');
        $tempBox.html(html_article);
        $tempBox.find('img').forEach(function(item){
          var src = $(item).attr('src');
          $(item).addClass('lazy').attr('data-src',src).attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEXCwsK592mkAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==');
        });
        var tempHtml = $tempBox.html();

        this.$tplbox.detail_article.html(tempHtml);

        $('img.lazy').scrollLoading({
          // container: $('.viewport-wrapper'),
        });
      },
    });
});
