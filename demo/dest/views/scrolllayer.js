define(["View",getViewTemplatePath("scrolllayer"),"UIScrollLayer"],function(a,b,c){return _.inherit(a,{propertys:function($super){$super(),this.template=b,this.addEvents({"click .js_demo01":"demo01"})},addEvent:function($super){$super(),this.on("onShow",function(){this._init()})},_init:function(){this.demo01()},demo01:function(){this.demo_1||(this.demo_1=new c({wrapper:$(".demo1_wrap"),data:[{id:1,name:"中国"},{id:2,name:"美国"},{id:3,name:"英国"}]})),this.demo_1.show()}})});