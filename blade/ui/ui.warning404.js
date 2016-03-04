/*
  404页面
*/
define(['UIView'], function (UIView) {

  var template = [
    ''
  ].join('');



  return _.inherit(UIView, {
    propertys: function ($super) {
      $super();
      this.template = template;

      // this.addEvents({
      //   'click #J_down_tip': 'hide',
      // });
    },
    initialize: function () {
      this.propertys();

    },
  });

});
