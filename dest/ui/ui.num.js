define(["UIView","text!T_UINum","text!C_UINum"],function(a,b,c){return _.inherit(a,{propertys:function($super){$super(),this.template=b,this.addUIStyle(c),this.min=1,this.max=9,this.curNum=1,this.unit="",this.needText=!1,this.events={"click .js_num_minus":"minusAction","click .js_num_plus":"addAction","focus .js_cur_num":"txtFocus","blur .js_cur_num":"txtBlur"},this.needRootWrapper=!1},getViewModel:function(){return this._getDefaultViewModel(["min","max","curNum","unit","needText"])},initElement:function(){this.$curNum=this.$(".js_cur_num")},txtFocus:function(){this.$curNum.html("")},txtBlur:function(){this.setVal(this.$curNum.html())},addAction:function(){this.setVal(this.curNum+1)},minusAction:function(){this.setVal(this.curNum-1)},changed:function(a){0},getVal:function(){return this.curNum},setVal:function(a){var b=!0,c=this.curNum;""===a&&(a=c),a==parseInt(a)&&(a=parseInt(a),this.curNum=a,a<this.min&&(this.curNum=this.min),a>this.max&&(this.curNum=this.max),this.$curNum.val(this.curNum),b=this.curNum!=c),this.resetNum(b)},resetNum:function(a){this.refresh(),a&&this.changed.call(this,this.curNum)},initialize:function($super,a){$super(a)},resetPropery:function($super){$super(),this.curNum>this.max?this.curNum=this.max:this.curNum<this.min&&(this.curNum=this.min)},addEvent:function($super){$super(),this.on("onShow",function(){this.$root.css("display","inline-block")})}})});