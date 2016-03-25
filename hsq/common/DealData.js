define([], function(){
  var DealData = {
    dealPrice: function(item){
      var timestamp = this.timestamp;
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

      if( (item._left_times < 1) || (item._offline_times - item.seller_time < 1) ){
        //如果已下线 或 下线时间小于开卖时间
        _diff_m_price = 0;
        _diff_price = _diff_all_price;
      }else{
        _diff_m_price = _diff_all_price * 1/(item._offline_times - item.seller_time);
        _diff_price = (timestamp - item.seller_time)*_diff_m_price;
      }
      var _deal_price = (item.price - _diff_price).toFixed(6);
      var _format_price = _.formatPrice(_deal_price, 6, 0);

      return _format_price;
    },
  };

  return DealData;
});
