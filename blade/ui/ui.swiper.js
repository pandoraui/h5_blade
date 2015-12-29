/*
******bug******
容器类组件，css传递是一个痛点
*/
define(['Swiper'], function (Swiper) {
  var template = [
'    <div class="swiper-wrapper">',
'      <%list.forEach(function(imgurl){%>',
'        <div class="swiper-slide">',
'          <img class="swiper-lazy" data-src="<%=imgurl%>" style="width: 100%">',
'          <div class="preloader"></div>',
'        </div>',
'      <%})%>',
'    </div>',
'    <div class="swiper-pagination"></div>'
  ].join('');

  return _.inherit({
    propertys: function () {
      this.template = template;
    },
    initialize: function (swiperContainer, imgList) {
      this.propertys();
      //根据参数重置属性
      this.renderSwiper(swiperContainer, imgList);
    },
    renderSwiper: function(swiperContainer, imgList){
      var length = imgList.length;

      if(!length){
        return;
      }

      var html = '';
      if(length > 1){
        html = _.template(this.template)({list: imgList});
        swiperContainer.html(html);
        var params = {
          // nextButton: '.swiper-button-next',
          // prevButton: '.swiper-button-prev',
          pagination: '.swiper-pagination',
          paginationClickable: true,
          // autoHeight: true, 这个插件不支持这个功能
          loop: true,
          // Disable preloading of all images
          preloadImages: false,
          lazyLoadingInPrevNext: true,
          // Enable lazy loading
          lazyLoading: true
        };
        var swiper = new $.Swiper(swiperContainer, params);
        return swiper;
      }else{
        html = '<img src="' + imgList[0] + '" style="width: 100%">';
        swiperContainer.html(html);
      }
    }
  });

});
