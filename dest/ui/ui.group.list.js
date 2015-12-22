define(["UIView","text!T_UIGroupList","text!C_UIGroupList"],function(a,b,c){"use strict";return _.inherit(a,{propertys:function($super){$super(),this.template=b,this.addUIStyle(c),this.data=[],this.filter="name",this.setUIType("grouplist"),this._expandedClass="expanded",this.addEvents({"click .js_group":"groupAction","click .js_items>li":"itemAction"}),this.onGroupClick=function(){},this.onItemClick=function(){0}},getViewModel:function(){return this._getDefaultViewModel(["data","filter"])},itemAction:function(a){var b=$(a.currentTarget),c=b.attr("data-group"),d=b.attr("data-index"),e=this.data[c].data[d];this.onItemClick&&this.onItemClick.call(this,e,c,d,a)},groupAction:function(a){var b=$(a.currentTarget).parent(),c=b.attr("data-groupindex"),d=this.data[c];b.hasClass(this._expandedClass)?b.removeClass(this._expandedClass):b.addClass(this._expandedClass),this.onGroupClick&&this.onGroupClick.call(this,c,d,a)},getFilterList:function(a){var b=this.$('li[data-filter*="'+a+'"]');return b.clone()},initElement:function(){this.groups=this.$(".js_group")},initialize:function($super,a){$super(a)}})});