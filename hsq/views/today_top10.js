define(['PageView', getViewTemplatePath('today_top10'), 'AppModel', 'AppStore', 'DealData'],
  function (PageView, viewhtml, AppModel, AppStore, DealData){

    var storeLogin = AppStore.Login.getInstance();
    var modelTodayTop10 = AppModel.todayTop10.getInstance();

    var skuIds = [225, 222, 241, 226, 166, 232, 236, 229, 227, 230];
    // skuIds = [150, 151];
    var top10_list = [
      {
        id: 225,
        name: '【3盒*60g/盒】椒盐什锦蔬菜脆片 60g*1盒 咸香酥脆 清脆爽口 ',
        desc: '优选每一片有机蔬菜，低油低盐低糖，新鲜健康，一口下去咯吱咯吱，清脆爽口，停不下来的健康小食。'
      },{
        id: 222,
        name: '【2袋*120g】snow farms加拿大原装进口樱桃果干',
        desc: '原料取自美丽的加拿大弗雷泽山谷地区，精选新鲜个大的樱桃，加工过程中无工业添加剂，富含矿物质和维生素，美味可口，口感细腻，回味无穷。'
      },{
        id: 241,
        name: '【2袋*120g】snowfarms加拿大原装进口蓝莓果干 ',
        desc: '来自加拿大的蓝宝石，果肉细腻，果味酸甜适度，可当做休闲时刻的小零食，或者拌沙拉制成蓝莓冰淇淋！还可以烘焙做成好吃的面包和饼干食品，既美味又健康哦！'
      },{
        id: 226,
        name: '【3盒*175g/盒】清灵绿豆糕 175g/盒 传统手工糕点 杭州特产 ',
        desc: '在雨水度过之后，在小满来临之前，见见暖起来的空气里，绿豆入口的清冽，童年回忆的味道！'
      },{
        id: 166,
        name: '【5袋*70g】保加利亚进口 玛乐缇（Maretti）披萨味烤面包干',
        desc: '偶尔停下忙碌的脚步，冲杯咖啡，再来上三五块烤面包片，享受慵懒、休闲的时光。'
      },{
        id: 232,
        name: '【3盒*120g/盒】原香鲜鱿丝 12g*10袋/盒 鱿鱼丝 无淀粉 手撕',
        desc: '海洋的味道，素来让人难以拒绝。鲜香怡人的鱿鱼丝，一口接一口，停不下来。徜徉海中，观览鱼群和奇妙的海洋生物从身边游过。'
      },{
        id: 236,
        name: '【3盒*40g/盒】混合水果干 40g/盒 草莓芒果香蕉苹果冻干 酸甜可口无添加',
        desc: '四种幸福果味，一次得到满足！无添加，无防腐。保留水果的原色原味和鲜嫩肉质。犹如新鲜水果，酸甜有味，滋味无穷！'
      },{
        id: 229,
        name: '【3盒*160g/盒】糖雪马蹄 40g*4袋/盒 荸荠 桂花糖水 高温蒸煮',
        desc: '与冬季最相衬的雪白水果。形似小雪球般的玲珑剔透。淡淡的沁甜，与秋日里桂花糖水的香气调和成为初冬晴空里，柔软的雪花。'
      },{
        id: 227,
        name: '【3盒*40g/盒】热浪榴莲干 40g/盒 金枕头泰国原产水果之王冻干',
        desc: '“水果之王”榴莲奇异的香气，来自热带雨季的滋润，四溢的浓香在宇航技术下被紧锁在果肉中。泰国原产上等金枕头榴莲，色泽金黄，浓香四溢，每一口都有细碎的南亚热浪在嘴里翻滚。'
      },{
        id: 230,
        name: '【3盒*40g/盒】阳光草莓干 40g*1盒 冻干果肉切片',
        desc: '草莓香气依旧贮存，味道不失，营养留存。自然红，自然香，完整保留。酸甜的汁液裹挟着大自然的温热在味蕾中翻覆，纵然是阴雨连绵也暖意满满。'
      },
    ];
    top10_list = _.indexBy(top10_list, 'id');

    return _.inherit(PageView, $.extend(DealData, {
      pageName: 'zhuti',
      waitAjax: true,
      events: {
        'click .top10_list .J_go_detail': 'goDetail',
      },
      onCreate: function(){
        // var viewhtml = '下单成功';
        this.$el.html(viewhtml);

        //元素集合
        this.els = {
          "hsq_box": this.$el.find('.hsq_box'),
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
            value: ['每日Top 10']
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
      },
      backAction: function(){
        this.back();
      },
      onShow: function(){
        this.initPage();
      },
      onHide: function(){},
      //初始化页面
      initPage: function(){
        // this.fullWidth = $(document).width();
        var scope = this;

        this.ajaxRequest();
        // var imgPlace = 'https://placeholdit.imgix.net/~text?txtsize=60&txt=640%C3%97380&w=640&h=380';
        // top10_list.forEach(function(item){
        //     item.pic = imgPlace;
        //     item.price = '23.06';
        // });
        //
        // this.renderPage({
        //   title: '零食和看剧更配哦',
        //   subTitle: '吃不胖的美味',
        //   date: '3月23日',
        //   introPic: imgPlace,
        //   intro: '最近,《太阳的后裔》正在热播, 宋仲基老公真是火的不要不要的，让妹纸们瞬间鼻血直喷,疯狂舔屏,哭着喊着要给仲基欧巴生猴子,比起老公的撩妹技能，妹纸们也要准备好各式零食，方能展开最舒服的追剧模式，关键是！这些都是吃不胖的美味！！！',
        //   list: top10_list,
        //   imgPlaceHold: this.imgPlaceHold,
        // });
      },
      ajaxRequest: function(){
        var scope = this;

        this.showLoading();
        modelTodayTop10.param = {
          topicCode: this.params.topic_code || 'test',
          skuIds: this.params.skuids || skuIds.join(','),
        };
        modelTodayTop10.execute(function(res){
          this.hideLoading();
          //成功
          var data = res.data;

          this.timestamp = res.timestamp;

          this.renderPage(data);

        },function(error){
          //失败
          this.showToast(error.errmsg);
        },this);
      },
      dealData: function(data){
        var self = this;
        data.imgPlaceHold = this.imgPlaceHold;

        data.list.forEach(function(item, index){
          var skuId = item.skuInfo.id;
          if(top10_list[skuId]){
            item.skuInfo.desc = top10_list[skuId].desc;
          }
          // if(self.Debug){
          //   item.skuInfo.desc = top10_list['241'].desc;
          // }
          //下线时间
          item.skuInfo._offline_times = item.skuInfo.expired_date - item.skuInfo.offline_before_expired;
          //剩余时间
          item.skuInfo._left_times = item.skuInfo._offline_times - self.timestamp;
          item._format_price = self.dealPrice(item.skuInfo);
        });
        return data;
      },
      renderPage: function(data){
        var top_banner = 'http://7xs7z4.com1.z0.glb.clouddn.com/zhuti/top10/top10_1.jpg';

        if(data.list && data.list.length){
          data = this.dealData(data);
        }
        var top10Data = {
          // fullWidth: this.fullWidth * 0.65,
          title: '零食和看剧更配哦',
          subTitle: '吃不胖的美味',
          date: '3月23日',
          introPic: top_banner,
          intro: '最近,《太阳的后裔》正在热播, 宋仲基老公真是火的不要不要的，让妹纸们瞬间鼻血直喷，疯狂舔屏，哭着喊着要给仲基欧巴生猴子，比起老公的撩妹技能，妹纸们也要准备好各式零食，方能展开最舒服的追剧模式，关键是！这些都是吃不胖的美味！！！',
          list: data.list,
          imgPlaceHold: this.imgPlaceHold,
        };

        var html = _.template(this.tpls.hsq_box)(top10Data);
        this.els.hsq_box.html(html);

        this.imgLazyLoad();
      },
      goDetail: function(e){
        var target = $(e.currentTarget),
            sid = target.data('sid');


        var detailUrl = 'detail?sid=' + sid;
        if(this.Detect.isHsq){
          //如果是好食期 APP 内，则通过 schemaUrl 实现跳转 app 内连接
          this.jumpApp('detail?skuId=' + sid);
        }else{
          this.forward(detailUrl);
        }
      },
    }));
});
