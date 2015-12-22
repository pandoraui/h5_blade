define(["UIView","text!T_UIHeader","text!C_UIHeader"],function(a,b,c){return _.inherit(a,{propertys:function($super){$super(),this.viewScope,this.datamodel={left:[],right:[],center:{}},this.template=b,this.addUIStyle(c),this.openShadowDom=!1,this.needEmptyWrapper=!0,this.events={}},resetPropery:function($super){$super(),this.root&&this.root[0]&&(this.wrapper=this.root)},set:function(a){if(this.setOption(a),this._originData=a,"object"==typeof a){a.events||(a.events={}),a.view&&(this.viewScope=a.view);var b={left:[],right:[],center:{}},c={};a.back!==!1&&(_.isObject(a.back)?b.left.push(a.back):_.isString(a.backtext)?(c.tagname="back",c.value=a.backtext,_.isFunction(a.events.returnHandler)&&(c.callback=a.events.returnHandler),b.left.push(c)):_.find(a.left,function(a){return"back"==a.tagname})||b.left.push({tagname:"back",callback:a.events.returnHandler})),_.isObject(a.tel)&&b.right.push({tagname:"tel",number:a.tel.number,callback:a.events.telHandler}),a.home&&b.right.push({tagname:"home",callback:a.events.homeHandler}),_.isObject(a.btn)&&b.right.push({tagname:"commit",value:a.btn.title,classname:a.btn.classname,data:a.btn.data,callback:a.events.commitHandler}),_.isArray(a.moreMenus)&&b.right.push({tagname:"list",data:a.moreMenus});var d={};_.isString(a.title)&&(d.tagname="title",d.value=a.title),_.isString(a.subtitle)&&(d.tagname="subtitle",d.value=[a.title,a.subtitle]),_.isString(a.citybtn)&&(d.tagname="select",d.value=a.citybtn,d.callback=a.events.citybtnHandler),_.isObject(a.title)&&(d=a.title),b.center=d,a.left&&(b.left=a.left.concat(b.left)),a.right&&(b.right=a.right.concat(b.right));var e=_.groupBy(b.right,function(a){return"list"==a.tagname?"a":"b"});b.right=(e.b||[]).concat(e.a||[]),_.isObject(a.center)&&(b.center=a.center),this.handleSpecialParam(b),this.datamodel=b,this.setEventsParam(),this.datamodel.left[0]&&_.isFunction(this.datamodel.left[0].callback)&&(this.lastReturnHandler=this.datamodel.left[0].callback),this.refresh(!0),this.show()}},listDefaultCallback:function(a){var b=_.find(this.datamodel.right,function(a){return"list"==a.tagname});b&&(this.sidebar||(this.sidebar=new UIBubbleLayer({datamodel:{data:b.data,wrapperClass:"cm-pop--user-nav",itemFn:function(a){var b=a.iconname||a.tagname;return'<i class="icon-'+b+'"></i>'+a.value}},triangleRight:"16px",triggerEl:$(a.currentTarget),width:"128px",onCreate:function(){this.mask.$el.addClass("cm-overlay--transparent"),this.mask.$el.removeClass("cui-mask")},onClick:function(a,b,c){_.isFunction(a.callback)&&a.callback.call(this.viewScope,a,b,c),this.hide()}})),"show"==this.sidebar.status?this.sidebar.hide():this.sidebar.show())},backDefaultCallback:function(){return this.lastReturnHandler?void this.lastReturnHandler.call(this.viewScope):(0,void Lizard.goBack())},setEventsParam:function(){for(var a,b=null,c=this.datamodel.left.concat(this.datamodel.right).concat(this.datamodel.center),d=0,e=c.length;e>d;d++)a=c[d],_.isFunction(this[a.tagname+"DefaultCallback"])&&(b=this[a.tagname+"DefaultCallback"]),_.isFunction(a.callback)&&(b=$.proxy(a.callback,this.viewScope)),b&&(this.events["click .js_"+a.tagname]=b),b=null},handleSpecialParam:function(a){var b,c,d,e;for(b in a)if(_.isArray(a[b]))for(c=0,d=a[b].length;d>c;c++)e=a[b][c],this["customtHandle_"+e.tagname]&&this["customtHandle_"+e.tagname](a[b][c],b)},_getDir:function(a){var b={left:"fl",right:"fr"};return b[a]},customtHandle_tel:function(a,b){b=this._getDir(b),a.itemFn=function(){return'<a href="tel:'+a.number+'" class="cm-header-icon __hreftel__ '+b+" js_"+a.tagname+' " ><i class="icon-'+a.tagname+'"></i></a>'}},addEvent:function(){this.on("onShow",function(){this.wrapper.height("44px"),this.$el.removeClass("cm-header--no-right"),0===this.datamodel.right.length&&this.$el.addClass("cm-header--no-right")})},updateHeader:function(a,b){this.set(_.isObject(a)?_.extend(this._originData,a):_.isObject(this._originData)?_.extend(this._originData,_.object([a],[b])):_.object([a],[b]))}})});