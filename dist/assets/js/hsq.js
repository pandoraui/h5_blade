(function(){var e="./",t="./blade/";window.getViewTemplatePath=function(t){return"text!"+e+t+".html"},require.config({baseUrl:"./",paths:{View:e+"ex_mvc/view",ApiConfig:e+"model/config",Swiper:t+"function/swiper",AppModel:e+"model/model"}});var n={slideleft:function(e,t,n,r){$("body").addClass("hiddenx"),t.show(),e.show(),e.$el.addClass("animatestart1 tview"),t.$el.addClass("animatestart1 lview"),e.$el.addClass("cm-page--right-in"),t.$el.addClass("cm-page--left-out"),e.$el.one("webkitAnimationEnd transitionend oTransitionEnd",function(){$("body").removeClass("hiddenx"),t.hide(),e.$el.removeClass("animatestart1 tview"),e.$el.removeClass("cm-page--right-in"),t.$el.removeClass("animatestart1 lview"),t.$el.removeClass("cm-page--left-out"),n&&n.call(r,e,t)},340)},slideright:function(e,t,n,r){$("body").addClass("hiddenx"),t.show(),e.show(),e.$el.addClass("animatestart1 lview"),t.$el.addClass("animatestart1 tview"),e.$el.addClass("cm-page--left-in"),t.$el.addClass("cm-page--right-out"),t.$el.one("webkitAnimationEnd transitionend oTransitionEnd",function(){$("body").removeClass("hiddenx"),t.hide(),e.$el.removeClass("animatestart1 lview"),e.$el.removeClass("cm-page--left-in"),t.$el.removeClass("animatestart1 tview"),t.$el.removeClass("cm-page--right-out"),n&&n.call(r,e,t)},340)}};require(["AbstractApp"],function(t){var r=new t({hasPushState:!1,defaultView:"index",viewRootPath:""+e+"views/",animations:n});window.Blade=r,$.bindFastClick&&$.bindFastClick()})})(),define("main",function(){}),define("ApiConfig",[],function(){var e=!0,t={test:"m.ctrip.com/restapi/soa2/10184",local:"10.0.0.193:9502",dev:"10.0.0.193:9502",staging:"10.0.0.193:9502",pro:"m.api.haoshiqi.net"},n={runTimeEnvironment:function(e){if(e)return t.test;var n=location.host;return n.match(/^m\.haoshiqi\.net/i)?t.pro:n.match(/^(localhost|10\.0|127\.0|192\.168)/i)?t.dev:n.match(/^(staging)/i)?t.staging:t.pro},restApi:function(e,t){var n=this.runTimeEnvironment(),r={http:"http://"+n,https:"https://"+n};return r[e]+t}};return n}),define("AppModel",["AbstractModel","ApiConfig"],function(e,t){var n={},r=function(){var e=this.url;return t.restApi(this.protocol,e)};return n.CustomModel=function(t,n){return _.inherit(e,{propertys:function($super){$super();var e=n||{};this.url=t,this.param=e.param||{},e.method&&(this.method=e.method),e.result&&(this.result=e.result),e.checkAuth&&(this.checkAuth=e.checkAuth),this.buildurl=r},initialize:function($super,e){$super(e)}})},n.getTestPage=n.CustomModel("/GetHomePage",{method:"GET"}),n.getDetailDesc=n.CustomModel("/product/iteminfo",{method:"GET"}),n.getDetailArticle=n.CustomModel("/product/productdetail",{method:"GET"}),n}),define("text!T_UIToast",[],function(){return'<section class="cm-modal cm-modal--toast">\n   <%=content %>\n</section>'}),define("UIToast",["UILayer","text!T_UIToast"],function(e,t){return _.inherit(e,{propertys:function($super){$super()},resetDefaultProperty:function($super){$super(),this.template=t,this.content="toast",this.hideSec=2e3,this.hasPushState=!1,this.TIMERRES=null,this.hideAction=function(){}},getViewModel:function(){return this._getDefaultViewModel(["content","btns"])},addEvent:function($super){$super(),this.on("onCreate",function(){this.$el.addClass("cui-toast")}),this.on("onShow",function(){this.TIMERRES&&clearTimeout(this.TIMERRES),this.TIMERRES=setTimeout($.proxy(function(){this.hide()},this),this.hideSec)}),this.on("onHide",function(){this.TIMERRES&&clearTimeout(this.TIMERRES),this.hideAction()})}})}),define("View",["UIView","UIHeader","UIDownTip","UILoadingLayer","UIToast"],function(e,t,n,r,i){return _.inherit(e,{header:null,propertys:function($super){$super(),this.openShadowDom=!1;var e=$.extend({},this.commonEvents,this.events);this.addEvents(e)},resetPropery:function($super){$super();var e=0,t=0,n;if(this.APP&&this.APP.interface)for(e=0,t=this.APP.interface.length;e<t;e++)n=this.APP.interface[e],_.isFunction(this.APP[n])&&(this[n]=$.proxy(this.APP[n],this.APP))},commonEvents:{"click #J_down_tip":"closeDownTip","click [data-link]":"goLink"},addEvent:function($super){$super(),this.on("onCreate",function(){this.onCreate&&this.onCreate()}),this.on("onShow",function(){console.log(1234),this._createHeader(),this.initHeader();var e=new n;e.checkStatus(),this.onShow&&this.onShow()}),this.on("onHide",function(){this.mask&&this.mask.hide()}),this.on("onDestroy",function(){this.mask&&this.mask.destroy()})},_createHeader:function(){var e=$(".header-wrapper");this.header=new t({wrapper:e})},initHeader:function(){var e=this},updateTitle:function(e){document.title=e||"好食期"},closeDownTip:function(e){var t=$(e.currentTarget);t.hide()},showLoading:function(e){Blade.loading.show()},hideLoading:function(e){Blade.loading.hide()},showToast:function(e,t){var e=e||"正在处理中...",t=t||2e3;this.__toast?(this.__toast.content=e,this.__toast.hideSec=t):this.__toast=new i({content:e,hideSec:t}),this.__toast.show()},goLink:function(e){var t=$(e.currentTarget),n=t.data("link");Blade.forward(n)}})}),define("views/index",["View",getViewTemplatePath("index")],function(e,t){return _.inherit(e,{propertys:function($super){$super(),this.addEvents(this._events)},pageName:"index",_events:{"click .j_test":"jTest"},onCreate:function(){this.$el.html(t),this.els={};var e=this.$el.find(".tpl_hsq_box");this.tpls={tpl_hsq_box:e.html()},e.remove()},onShow:function(){var e=this,t={back:!1,center:{tagname:"title",value:["好食期首页"]}};this.header.set(t),this.header.show(),this.initPage()},onHide:function(){},initPage:function(){},ajaxRequest:function(){},jTest:function(e){var t=$(e.currentTarget),n=t.data("type");switch(n){case"toast":console.log(1111),this.showToast("测试");break;default:}}})}),define("text!views/index.html",[],function(){return'\n<ul class="link-list">\n  <li data-link="index">首页</li>\n  <li data-link="list">列表页</li>\n</ul>\n\n<ul class="link-list">\n  <li class="j_test" data-type="toast">showToast</li>\n</ul>\n'}),define("views/list",["View",getViewTemplatePath("list")],function(e,t){return _.inherit(e,{pageName:"list",onCreate:function(){this.$el.html(t),this.els={};var e=this.$el.find(".tpl_hsq_box");this.tpls={tpl_hsq_box:e.html()},e.remove()},onShow:function(){var e=this,t={center:{tagname:"title",value:["列表页"]},back:{tagname:"back",callback:function(){e.back("index")}}};this.header.set(t),this.header.show(),this.initPage()},onHide:function(){},initPage:function(){var e=this},ajaxRequest:function(){},renderPage:function(){}})}),define("text!views/list.html",[],function(){return'<ul class="link-list">\n  <li data-link="detail?pid=63">详情页 pid 2</li>\n  <li data-link="detail?sid=120">详情页 sid 120</li>\n</ul>\n'}),define("views/detail",["View","AppModel","Swiper","UISwiper","LazyLoad",getViewTemplatePath("detail")],function(e,t,n,r,i,s){var o=t.getDetailDesc.getInstance(),u=t.getDetailArticle.getInstance();return _.inherit(e,{propertys:function($super){$super(),this.addEvents({"click .swiper-wrapper":"demo02"})},hashChangeParamsRefresh:!0,addEvent:function($super){$super()},initElement:function(){this.$el.html(s),this.$el.$errorDom=this.$el.find(".J_error_box"),this.$el.$showViewDom=this.$el.find(".J_showview_box"),this.$tplbox={detail_desc:this.$el.find("#tplbox_detail"),detail_article:this.$el.find("#tplbox_detail_article")},this.$tpl={detail_desc:this.$el.find("#tpl_detail").html(),detail_article:this.$el.find("#tpl_detail_article").html()}},initHeader:function(){var e=this,t={center:{tagname:"title",value:["商品详情"]},back:{tagname:"back",callback:function(){e.back("list")}}};this.header.set(t),this.header.show()},onShow:function(){this.clearPreInit(),this.initPage()},dealParams:function(e){for(var t in e)e[t]||delete e[t];return e},initPage:function(){this.fullWidth=$(document).width();var e=this;this.errorTip();var t=_.getUrlParam();o.param={productId:t.pid,skuId:t.sid},this.dealParams(o.param),this.showLoading(),o.execute(function(t){this.hideLoading(),console.log(t);var n=t.data;n._offline_times=n.expired_date-n.offline_before_expired,this.timestamp=t.timestamp,n.timestamp=t.timestamp,n._offline_times<t.timestamp&&(n.timestamp=n._offline_times),n._humanTimes=e.humanTimes,this.renderPage(n),this.productId=n.product_id,this.getDetailArticle()},function(e){console.log(e),this.errorTip(e.errmsg)},this)},errorTip:function(e){var t="";e?(t="<p>"+e+"</p>",this.$el.$showViewDom.hide(),this.$el.$errorDom.html(t).show()):(this.$el.$showViewDom.show(),this.$el.$errorDom.html(t).hide())},renderPage:function(e){console.log("渲染页面"),this.updateTitle(e.name),e._deal_stock=this.dealStock(e)._deal_stock,e._format_price=this.dealPrice(e)._format_price;var t=this.$el.find(".swiper-container");t.css({height:this.fullWidth});var n=e.pics||[];n.length>5&&(n.length=5),this.swiper=new r(t,n);var i=_.template(this.$tpl.detail_desc)(e);this.$tplbox.detail_desc.html(i),this.$priceDom=this.$tplbox.detail_desc.find("#J_price_box"),this.$stockDom=this.$tplbox.detail_desc.find("#J_stock_box"),this.countDownPrice(e),this.countDownStock(e)},humanTimes:function(e){this.today||(this.today=_.dateUtil.format(this.timestamp*1e3,{format:"Y-M-D"}));var t=_.dateUtil.format(e*1e3,{format:"Y-M-D H:F:S"});return t.replace(this.today,"今天")},clearPreInit:function(){this.swiper&&this.swiper.destroy(),this.clear_price_countdown&&clearTimeout(this.clear_price_countdown),this.clear_stock_countdown&&clearTimeout(this.clear_stock_countdown)},countDownPrice:function(e){var t=this,n=e._deal_price;t.clear_price_countdown=setTimeout(function(){n=e._deal_price;var r;n>e.lowest_price&&e._diff_m_price&&(n-=e._diff_m_price,n<e.lowest_price&&(clearTimeout(t.clear_price_countdown),r=t.formatPrice(e.lowest_price,6,4),t.$priceDom.html(r)),r=t.formatPrice(n,6,4),e._deal_price=n,e._format_price=r,t.$priceDom.html(r),e.timestamp+=1,t.countDownPrice(e))},1e3)},countDownStock:function(e){var t=this,n=this.need_countdown_stock;if(!n)return;e._left_times>=3660?blankTimes=6e4:blankTimes=1e3;var r=t.dealStock(e,!0)._deal_stock;t.$stockDom.html(r),t.clear_stock_countdown=setTimeout(function(){if(e._left_times<0||!t.need_countdown_stock){clearTimeout(t.clear_stock_countdown);return}e._left_times-=blankTimes*.001,t.countDownStock(e)},blankTimes)},dealStock:function(e,t){var n="",r;return e._left_times&&t?r=e._left_times:(r=e._offline_times-e.timestamp,e._left_times=r),this.need_countdown_stock=!1,e.left_stock>30&&r<604800?r>=86400?n=_.dateUtil.format(r*1e3,{type:"countdown",format:"剩D天H小时停售"}):r>=3600?(this.need_countdown_stock=!0,n=_.dateUtil.format(r*1e3,{type:"countdown",format:"剩H小时F分停售"})):r>=1?(this.need_countdown_stock=!0,n=_.dateUtil.format(r*1e3,{type:"countdown",format:"剩F分S秒停售"})):n="已停售":e.left_stock<1?n="已售完":n="仅剩"+e.left_stock+"件",e._deal_stock=n,e},dealPrice:function(e,t){var n=e.price-e.lowest_price,r,i;e._offline_times-e.seller_time<=0?(r=0,i=n):(r=n*1/(e._offline_times-e.seller_time),i=(e.timestamp-e.seller_time)*r);var s=(e.price-i).toFixed(6),o=this.formatPrice(s,6,4);return e._diff_m_price=r,e._deal_price=s,e._format_price=o,e},formatPrice:function(e,t){var n=parseFloat(e)*.01;if(isNaN(n))return e;var r=n<1&&n>=0;r&&(n+=1),t=t||2;var i=i||"round",s=Math[i](n*Math.pow(10,t)).toString(),o=s.length-t,u=s.substr(0,o);return r&&(u=parseInt(u)-1),u+"."+s.substr(o,2)+"<i>"+s.substr(o+2)+"</i>"},getDetailArticle:function(){u.param={productId:this.productId},u.execute(function(e){console.log(e);var t=e.data;this.renderDetailArticle(t)},function(e){console.log(e),console.log(e.errmsg)},this)},renderDetailArticle:function(e){var t=_.template(this.$tpl.detail_article)(e),n=$('<div id="temp"></div>');n.html(t),n.find("img").forEach(function(e){var t=$(e).attr("src");$(e).addClass("lazy").attr("data-src",t).attr("src","data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEXCwsK592mkAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==")});var r=n.html();this.$tplbox.detail_article.html(r),$("img.lazy").scrollLoading({})}})}),define("text!views/detail.html",[],function(){return'\n<div class="J_error_box"></div>\n<div class="J_showview_box">\n  <div class="swiper-container" data-space-between=\'10\'></div>\n\n  <div class="tplbox_box" id="tplbox_detail">\n    <script type="text/template" id="tpl_detail">\n    <!--产品描述-->\n    <div class="hsq-card mb10 detail-desc">\n      <ul class="list group-list">\n        <li>\n          <div class="tit"><%=name%></div>\n          <p class="info-line">\n            <span id="J_stock_box" class="num fr"><%=_deal_stock%></span>\n            <dfn class="price">&yen; <span class="price_num" id="J_price_box"><%=_format_price%></span></dfn>\n            <del><%=(market_price*0.01).toFixed(2)%></del>\n          </p>\n        </li>\n        <li><span class="label">保质期至：<%=_.dateUtil.format(expired_date*1000, {format: \'Y年M月D日\'})%></span></li>\n        <%if(attrs.length){%>\n        <li><span class="label">口味/净含量：<%=_.pluck(attrs, \'value\').join(\'、\')%></span></li>\n        <%}%>\n        <%if(labels.length){%>\n          <li>\n            <%labels.forEach(function(item){%>\n            <span class="ib-label"><img class="icon-label" src="<%=item.icon%>"> <%=item.text%></span>\n            <%})%>\n          </li>\n        <%}%>\n      </ul>\n    </div>\n\n    <!--评价晒单-->\n    <% if (ugcBrief.totalCnt){%>\n    <div class="hsq-card mb10 card-comments">\n      <div class="card-title">\n        <span class="link-more fr"><%=ugcBrief.totalCnt%>条评论</span>\n        <div class="tit">评价晒单</div>\n      </div>\n      <ul class="group-list list-comments">\n        <%ugcBrief.list.forEach(function(item){%>\n        <li>\n          <p class="c-info">\n            <span class="stars fr stars-score-<%=item.score%>"><i class="icon icon-star"></i><i class="icon icon-star"></i><i class="icon icon-star"></i><i class="icon icon-star"></i><i class="icon icon-star"></i></span>\n            <span class="author"><%=item.username%></span>\n            <span class="time"><%=_humanTimes(item.created_at)%></span>\n          </p>\n          <div class="c-text">\n            <%=item.content%>\n          </div>\n        </li>\n        <%})%>\n      </ul>\n    </div>\n    <%}%>\n    </script>\n  </div>\n\n  <div id="tplbox_detail_article">\n    <script type="text/template" id="tpl_detail_article">\n    <!--图文详情-->\n    <div class="hsq-card detail-article">\n      <div class="card-title">\n        <div class="tit">图文详情</div>\n      </div>\n      <div class="main-article">\n        <%=graphicDetail%>\n      </div>\n    </div>\n    </script>\n  </div>\n</div>\n'});