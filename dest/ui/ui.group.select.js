define(["UILayer","text!T_UIGroupSelect","text!C_UIGroupSelect","UISelect"],function(a,b,c,d){return _.inherit(a,{propertys:function($super){$super(),this.template=b,this.addUIStyle(c),this.scrollCreated=!1,this.title="",this.tips="",this.btns=[{name:"取消",className:"cui-btns-cancel js_cancel"},{name:"确定",className:"cui-btns-ok js_ok"}],this.data=[],this.indexArr=[0,0,0],this.idArr=[],this.scrollArr=[],this.changedArr=[function(){},function(){},function(){}],this.onOkAction=function(){},this.onCancelAction=function(){this.hide()},this.displayNum=5,this.addEvents({"click .js_ok":"okAction","click .js_cancel":"cancelAction"})},getViewModel:function(){return this._getDefaultViewModel(["title","tips","btns"])},okAction:function(){var a=[];for(i=0,len=this.scrollArr.length;len>i;i++)a.push(this.scrollArr[i].getSelected());this.onOkAction.call(this,a)},cancelAction:function(){var a=[];for(i=0,len=this.scrollArr.length;len>i;i++)a.push(this.scrollArr[i].getSelected());this.onCancelAction.call(this,a)},initElement:function(){this.scrollWrapper=this.$(".js_wrapper"),this.tips=this.$(".js_tips")},_initScroll:function(){if(!this.scrollCreated){this.scrollCreated=!0;var a,b,c,e;for(a=0,b=this.data.length;b>a;a++)c=this.data[a],e=this.changedArr[a]||function(){},this.scrollArr[a]=new d({data:c,index:this.indexArr[a],key:this.idArr[a],onCreate:function(){this.$root.addClass("cm-scroll-select-wrap")},displayNum:this.displayNum,changed:$.proxy(e,this),wrapper:this.scrollWrapper}),0==a&&3==b&&this.scrollArr[a].on("onShow",function(){}),this.scrollArr[a].show()}},setTips:function(a){this.tips=a,this.tips.html(a)},_destroyScroll:function(){var a,b;for(a=0,b=this.data.length;b>a;a++)this.scrollArr[a]&&(this.scrollArr[a].destroy(),this.scrollArr[a]=null);this.scrollCreated=!1},initialize:function($super,a){$super(a)},addEvent:function($super){$super(),this.on("onShow",function(){this._initScroll()},1),this.on("onHide",function(){},1)}})});