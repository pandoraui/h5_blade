define(["UILayer","text!T_UIAlert"],function(a,b){return _.inherit(a,{propertys:function($super){$super()},resetDefaultProperty:function($super){$super(),this.maskToHide=!1,this.template=b,this.title="",this.content="",this.btns=[{name:"知道了",className:"js_ok"}],this.addEvents({"click .js_ok":"okAction","click .js_cancel":"cancelAction"}),this.okAction=function(){this.hide()},this.cancelAction=function(){this.hide()}},getViewModel:function(){return this._getDefaultViewModel(["title","content","btns"])},initialize:function($super,a){$super(a)},addEvent:function($super){$super(),this.on("onCreate",function(){})},setDatamodel:function(a,b,c){a||(a={}),_.extend(this.datamodel,a),b&&(this.okAction=b),c&&(this.cancelAction=c),this.refresh()}})});