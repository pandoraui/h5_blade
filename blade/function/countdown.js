
/*
 * countdown 倒计时功能
**/

// define(['libs'], function (libs){
define([], function (){

  function bind(fn, obj){
    if (typeof obj !== 'object') {
      throw 'obj is not an object';
    }
    var args = Array.prototype.slice.call(arguments, 2);//将arguments转换为数组，并去掉前两项
    return function(){
      /*
      形成一个闭包，在此匿名函数中保持了对嵌套父函数中的参数fn、obj，局部变量args的引用，也体现了js的静态（词法）作用域规则,
      然后利用apply方法可以改变this指向的特点，使fn执行时，其内部如果出现this则代表传入的参数obj.
      */
      fn.apply(obj, args);
    };
   }

  function countdownTimer(endDateParam){
    /*
    初始化部分开始
    */
    if (this == window) {
      return new countdownTimer(endDateParam);
    }

    if (!endDateParam && typeof endDateParam !== 'object') {

      /*
      new Date时，三个参数分别代表年月日，月份是从0开始算的，如一月份，第二个参数是0，所以2011,8,11代表2011-9-11；但是如果一字符串形式"2011,8,11"则不是从0开始，但是ie6、7、8不支持此写法，ie9不知道
      */
      this.endDate = new Date(2011, 8, 11);
    }
    else {
      this.endDate = new Date(endDateParam.year, endDateParam.month - 1, endDateParam.day);
    }

    var days = document.getElementById('days'), hours = document.getElementById('hours'), minutes = document.getElementById('minutes'), seconds = document.getElementById('seconds');

    /*
    初始化部分结束
    */
    this.show = function(daysValue, hoursValue, minutesValue, secondsValue){
      days.innerHTML = daysValue;
      hours.innerHTML = hoursValue;
      minutes.innerHTML = minutesValue;
      seconds.innerHTML = secondsValue;
    };

    return this;
  }

  countdownTimer.prototype = {
    update: function(){

      var nowDate = new Date();

      var endMilliseconds = this.endDate.getTime(), nowMilliseconds = nowDate.getTime();
      var remainingMilliseconds = endMilliseconds - nowMilliseconds;//微妙数值差
      //按照无条件舍去规则转化为各个单位（天、时、分、秒）下的数值分量，如0.2天得到结果为0天

      var remainingDays = Math.floor(remainingMilliseconds / (1000 * 60 * 60 * 24)), remainingHours = Math.floor(remainingMilliseconds / (1000 * 60 * 60)) - remainingDays * 24, remainingMinutes = Math.floor(remainingMilliseconds / (1000 * 60)) - remainingHours * 60 - remainingDays * 24 * 60, remainingSeconds = Math.floor(remainingMilliseconds / 1000) - remainingMinutes * 60 - remainingHours * 60 * 60 - remainingDays * 24 * 60 * 60;

      this.show(remainingDays, remainingHours, remainingMinutes, remainingSeconds);
    },
    start: function(){
      this.timer = setInterval(bind(this.update, this), 1000);
    },
    stop: function(){
      clearInterval(this.timer);
    }
  };

  return countdownTimer;

  // countdownTimer({
  //   year: 2012,
  //   month: 1,
  //   day: 1
  // }).start();

// (function($) {
//     $.fn.countdown = function(options){
  // return function(options){
  //   var defaults = {
  //     // container: $('.countdown'),
  //     format : "dd:hh:mm:ss",   // 时间格式 现支持 dd:hh:mm:ss(默认) hh:mm:ss dd:hh:mm mm:ss 四种格式
  //     prezero : true,  // 前导零
  //     effect : false,  // 支持自定义格式
  //     overtips : "已结束",  // 自定义结束提醒
  //     timeauto : false,   // 默认不自适应格式
  //     timediff : 0   // 调整时间差，单位毫秒
  //   };
  //   var opt = $.extend(true, defaults, options || {});
  //
  //   function timeOver(obj,all){
  //     var time = parseInt(all/1000);
  //     //console.log(obj);
  //
  //     var s = time%60;
  //     time = parseInt(time/60);
  //     var m = time%60;
  //     time = parseInt(time/60);
  //     var h = parseInt(time%24);
  //     var day = parseInt(time/24);
  //     var times = 1000;
  //     var labelleft = "";
  //     var labelright = "";
  //     if(opt.effect){
  //       labelleft = "<i>";
  //       labelright = "</i>";
  //     }
  //
  //     //添加前导0
  //     if(opt.prezero){
  //       m = (m < 10) ? ("0" + m) : m;
  //       h = (h < 10) ? ("0" + h) : h;
  //       s = (s < 10) ? ("0" + s) : s;
  //     }
  //
  //     if(opt.timeauto){
  //       if(all < 86400000){
  //         opt.format = "hh:mm:ss";
  //         if(all < 3600000){
  //           opt.format = "mm:ss";
  //           if(all < 60000){
  //             opt.format = "ss";
  //           }
  //         }
  //       }
  //     }
  //     switch(opt.format){
  //       case "dd:hh:mm:ss":
  //         times = 1000;
  //         obj.innerHTML = labelleft + day + labelright + "天" + labelleft + h + labelright + "时" + labelleft + m + labelright + "分" + labelleft + s + labelright + "秒" ;
  //         break;
  //       case "hh:mm:ss":
  //         times = 1000;
  //         obj.innerHTML = labelleft + h + labelright + "时" + labelleft + m + labelright + "分" + labelleft + s + labelright + "秒" ;
  //         break;
  //       case "mm:ss":
  //         times = 1000;
  //         obj.innerHTML = labelleft + m + labelright + "分" + labelleft + s + labelright + "秒" ;
  //         break;
  //       case "ss":
  //         times = 1000;
  //         obj.innerHTML = labelleft + s + labelright + "秒" ;
  //         break;
  //       case "dd:hh:mm":
  //         times = 60000;
  //         obj.innerHTML = labelleft + day + labelright + "天" + labelleft + h + labelright + "时" + labelleft + m + labelright + "分" ;
  //         break;
  //       default :
  //         times = 1000;
  //         obj.innerHTML = day+"天"+h+"时"+m+"分"+s+"秒";
  //     }
  //     setTimeout(function(){
  //       all-=times;
  //       if(all>0){
  //         timeOver(obj,all);
  //       }else {
  //         obj.innerHTML = opt.overtips;
  //       }
  //     },times);
  //   }
  //
  //   var all = "";
  //
  //   for(var i = 0, len = this.length; i < len ; i++){
  //     all = $(this[i]).html();
  //
  //     // 若为非数字，直接返回
  //     if(!(/(^-?[1-9]\d*$)/.test(all))){
  //       return;
  //     }
  //
  //     if(parseInt(all) < 0){
  //       this[i].innerHTML = opt.overtips;
  //       return;
  //     }
  //
  //     all = Number(all) + opt.timediff;
  //
  //     timeOver(this[i],all);
  //   }
  //
  // };

// })(Zepto);
});
