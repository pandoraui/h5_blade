define(['View', 'AppModel', 'UISwiper', 'LazyLoad', getViewTemplatePath('detail')],
  function (View, AppModel, UISwiper, LazyLoad, viewhtml){

    var ajaxTest = AppModel.getTestPage.getInstance();
    var ajaxGetDetailDesc = AppModel.getDetailDesc.getInstance();
    var ajaxGetDetailArticle = AppModel.getDetailArticle.getInstance();

    return _.inherit(View, {
      propertys: function ($super) {
        $super();

        // this.template = viewhtml;
        // this.$el.html(viewhtml);
        this.addEvents({
          'click .js_demo01': 'demo01',
          'click .js_demo02': 'demo02'
        });
      },

      addEvent: function ($super) {
        $super();
        //在页面显示后做的事情
        this.on('onShow', function () {
          this.$el.html(viewhtml);
          this.$tplbox = {
            detail_desc: this.$el.find('#tplbox_detail'),
            detail_article: this.$el.find('#tplbox_detail_article'),
          };
          this.$tpl = {
            detail_desc: this.$el.find('#tpl_detail').html(),
            detail_article: this.$el.find('#tpl_detail_article').html(),
          };

          this.initPage();

        });
      },

      initHeader: function () {
        var scope = this;
        Blade.header.set({
          back: false,
          title: '商品详情',
          // callback: function(){
          //   scope.back();
          // }
        });
        Blade.header.show();
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
        var scope = this;

        // $.swiper = function (container, params) {
        //     return new $.Swiper(container, params);
        // };

        var params = _.getUrlParam();

        ajaxGetDetailDesc.param = {
          productId: params.id,
          skuId: params.sid,
        };

        this.dealParams(ajaxGetDetailDesc.param);

        ajaxGetDetailDesc.execute(function(res){
          //成功
          console.log(res);

          var data = res.data;
          this.timestamp = res.timestamp;
          this.renderPage(data);

          // if(!params.id){
            this.productId = data.product_id;
            this.getDetailArticle();
          // }

        },function(error){
          //失败
          console.log(error);
          console.log(error.errmsg);
        },this);

        // if(params.id){
        //   this.productId = params.id;
        //   this.getDetailArticle();
        // }
        // $(".swiper-container").swiper(config)
      },
      dealData: function(data){
        /**
        关于库存或停售时间的呈现逻辑：
          this.timestamp 当前时间
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
        var deal_stock = '';  //经过处理的库存状态显示
        var offline_times = data.expired_date - data.offline_before_expired;//下架时间
        var left_times = offline_times - this.timestamp;  //剩余时间
        this.left_times = left_times;
        if( (data.left_stock > 30) && (left_times < 86400*7)){
          if(left_times >= 86400){
            deal_stock = "剩" + data.left_stock + "停售";  //剩x天xx小时停售
          }else if(left_times >= 3600){
            deal_stock = "剩xx小时xx分停售";  //剩xx小时xx分停售
          }else if(left_times >= 1){
            deal_stock = "剩xx分xx秒停售";  //剩xx分xx秒停售
          }else{
            deal_stock = "已停售";   //已停售
          }
        }else{
          if(data.left_stock < 1){
            deal_stock = "已售完";
          }else{
            deal_stock = "仅剩" + data.left_stock + "件";
          }
        }
        data.deal_stock = deal_stock;

        /** 处理价格
          14.59<i>23434</i>
          变动的价格=（起售价-最底价）*1s/（保质期截止时间-提前下架的时间-上架售卖时间）
          起售价 price
          最底价 lowest_price
          开售时间 seller_time
        */

        //(price - cur_price) / (cur_price - lowest_price)
        // = (timestamp - seller_time)/(offline_times - timestamp)

        var diff_all_price = data.price - data.lowest_price;
        //每秒变动的价格
        var diff_m_price = 1/(offline_times - data.seller_time);
        var diff_price = diff_all_price * (this.timestamp - data.seller_time)*diff_m_price;
        var deal_price = (data.price - diff_price).toFixed(6);

        var format_price = this.formatPrice(deal_price, 6, 4);

        this.deal_price = deal_price;
        data.format_price = format_price;

        return data;
      },
      formatPrice: function(_price, needCount){
        var price = parseFloat(_price);
        if(isNaN(price)) return _price;
        var is0 = price < 1 && price >= 0;
        if(is0) price += 1;
        // 需要小数点后2位
        needCount = needCount || 2;
        // fn = fn || 'round';
        var numStr = Math['round'](price * Math.pow(10, needCount)).toString();
        var index = numStr.length - needCount;
        var intPart = numStr.substr(0, index);
        if(is0) intPart = parseInt(intPart) - 1;
        return intPart + '.' + numStr.substr(index, 2) + '<i>' + numStr.substr(index+2) + '</i>';
      },
      renderPage: function(data){
        console.log('渲染页面');
        data.deal_stock = this.dealData(data).deal_stock;
        data.format_price = this.dealData(data).format_price;

        var container = this.$el.find('.swiper-container');
        var imgList = data.pics || [];
        // [
        //   'http://gqianniu.alicdn.com/bao/uploaded/i4//tfscom/i1/TB1n3rZHFXXXXX9XFXXXXXXXXXX_!!0-item_pic.jpg_640x640q60.jpg',
        //   'http://gqianniu.alicdn.com/bao/uploaded/i4//tfscom/i4/TB10rkPGVXXXXXGapXXXXXXXXXX_!!0-item_pic.jpg_640x640q60.jpg',
        //   'http://gqianniu.alicdn.com/bao/uploaded/i4//tfscom/i1/TB1kQI3HpXXXXbSXFXXXXXXXXXX_!!0-item_pic.jpg_640x640q60.jpg'
        // ];

        if(imgList.length > 5){
          imgList.length = 5;
        }
        var swiper = new UISwiper(container, imgList);

        var html_desc = _.template(this.$tpl.detail_desc)(data);
        this.$tplbox.detail_desc.html(html_desc);
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
