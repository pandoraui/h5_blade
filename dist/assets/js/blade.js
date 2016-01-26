/**
 * @license RequireJS text 2.0.5+ Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/text for details
 */

/*!
 * jquery.scrollLoading.js
 * by zhangxinxu  http://www.zhangxinxu.com
 * 2010-11-19 v1.0
 * 2012-01-13 v1.1 偏移值计算修改 position → offset
 * 2012-09-25 v1.2 增加滚动容器参数, 回调参数
 * 2015-11-17 v1.3 只对显示元素进行处理
*/

define("cAjax",[],function(){function t(e,t,n,r){return{url:e,data:t,callback:n,error:r}}function r(e,n,r,i){var s=t(e,n,r,i);return s.type="GET",a(s)}function i(e,r,i,s){var o=r.contentType;r=JSON.stringify(r);var u=t(e,r,i,s);return u.type="POST",u.dataType="json",u.timeout=3e4,u.contentType=n(o)||"application/json",a(u)}function s(e,n,r,i){var s=t(e,n,r,i);return s.type="GET",s.dataType="jsonp",s.crossDomain=!0,a(s)}function o(e,r,i,s,o){var u=i.contentType;r.toLowerCase()!=="get"&&(i=JSON.stringify(i));var f=t(e,i,s,o);return f.type=r,f.dataType="json",f.crossDomain=!0,f.data=i,f.contentType=n(u)||"application/json",a(f)}function u(e,n,r,i){var s=null,o="";typeof n=="string"?s=$("#"+n):s=$(n),s&&s.length>0&&(o=s.serialize());var u=t(e,o,r,i);return a(u)}function a(e){var t=(new Date).getTime(),n={url:e.url,type:e.type,dataType:e.dataType,data:e.data,contentType:e.contentType,timeout:e.timeout||5e4,success:function(t){t&&t.errno===0?e.callback(t):e.error&&e.error(t)},error:function(e){}};return delete n.data.contentType,delete n.contentType,e.url.indexOf(window.location.host)===-1&&(n.crossDomain=!!e.crossDomain),$.ajax(n)}var e={json:"application/json; charset=utf-8",jsonp:"application/json"},n=function(t){return t&&(t=e[t]?e[t]:t),t};return{get:r,post:i,jsonp:s,cros:o,form:u}}),define("UIView",[],function(){"use strict";var e=function(){var e=3e3;return function(t){return t+ ++e}}();return _.inherit({propertys:function(){this.wrapper=$("body"),this.id=_.uniqueId("ui-view-"),this.uiStyle=[],typeof style!="undefined"&&style&&(this.uiStyle=[style]),this.formateStyle="",this.shadowStyle=null,this.shadowRoot=null,this.openShadowDom=!1,this.needEmptyWrapper=!1,this.template="",this.events={},this.eventArr={},this.status="init",this.uiType=["abstractView"],this.needAnimat=!1,this.animateShowAction=null,this.animateHideAction=null},setUIType:function(e){_.isString(e)&&this.uiType.push(e)},getViewModel:function(){return _.isObject(this.datamodel)?this.datamodel:{}},_getDefaultViewModel:function(e){var t,n,r,i={};for(n=0,r=e.length;n<r;n++)t=e[n],i[t]=this[t];return i},addEvents:function(e){_.isObject(e)&&_.extend(this.events,e)},addUIStyle:function(e){this.uiStyle.push(e)},_preventDefault:function(e){e.preventDefault()},on:function(e,t,n){this.eventArr[e]||(this.eventArr[e]=[]),n?this.eventArr[e].splice(0,0,t):this.eventArr[e].push(t)},off:function(e,t){if(!this.eventArr[e])return;t?this.eventArr[e]=_.without(this.eventArr[e],t):this.eventArr[e]=[]},trigger:function(e){var t=Array.prototype.slice,n=t.call(arguments,1),r=this.eventArr,i=[],s,o;if(r[e])for(s=0,o=r[e].length;s<o;s++)i[i.length]=r[e][s].apply(this,n);return i},createRoot:function(e){this.$root=$('<div class="view" style="display: none; " id="'+this.id+'"></div>'),this.formateStyle=this.getInlineStyle(),this.shadowStyle=$(this.formateStyle),this.$el=$('<div class="js_shadow_root">'+e+"</div>"),this.openShadowDom?(this.shadowRoot=$(this.$root[0].createShadowRoot()),this.shadowRoot.append(this.shadowStyle),this.shadowRoot.append(this.$el)):this.$root.append(this.$el)},getInlineStyle:function(){if(!this.uiStyle||!_.isArray(this.uiStyle))return"";var e=this.uiStyle.join(""),t=this.id;return this.openShadowDom||(e=e.replace(/(\s*)([^\{\}]+)\{/g,function(e,n,r){return n+r.replace(/([^,]+)/g,"#"+t+" $1")+"{"})),'<style class="js_shadow_style">'+e+"</style>"},_isAddEvent:function(e){return e=="onCreate"||e=="onPreShow"||e=="onShow"||e=="onRefresh"||e=="onHide"?!0:!1},setOption:function(e){for(var t in e){if(t=="events"){_.extend(this[t],e[t]);continue}if(this._isAddEvent(t)){this.on(t,e[t]);continue}this[t]=e[t]}},initialize:function(e){this.propertys(),this.setOption(e),this.resetPropery(),this.addEvent(),this.create(),this.initElement()},addSysEvents:function(){if(typeof this.availableFn!="function")return;this.removeSysEvents(),this.$el.on("click.system"+this.id,$.proxy(function(e){this.availableFn()||(e.preventDefault(),e.stopImmediatePropagation&&e.stopImmediatePropagation())},this))},removeSysEvents:function(){this.$el.off(".system"+this.id)},$:function(e){return this.$el.find(e)},resetPropery:function(){this.uiStyle||(this.openShadowDom=!1),this.wrapper[0].createShadowRoot||(this.openShadowDom=!1)},addEvent:function(){},create:function(){this.trigger("onPreCreate"),this.createRoot(this.render()),this.status="create",this.trigger("onCreate")},initElement:function(){},render:function(e){var t=this.getViewModel()||{},n=this.template;return this.template?(_.isFunction(this.template)?n=this.template(t):n=_.template(this.template)(t),typeof e=="function"&&e.call(this),n):""},refresh:function(e){this.resetPropery(),e?this.create():this.$el.html(this.render()),this.initElement(),this.status!="hide"&&this.show(),this.trigger("onRefresh")},show:function(){if(!this.wrapper[0]||!this.$root[0])return;$.contains(this.wrapper[0],this.$root[0])||(this.needEmptyWrapper&&this.wrapper.html(""),this.wrapper.append(this.$root)),this.trigger("onPreShow"),this.needAnimat&&_.isFunction(this.animateShowAction)&&this.status!="show"?this.animateShowAction.call(this,this.$root):this.$root.show(),this.status="show",this.addSysEvents(),this.bindEvents(),this.trigger("onShow")},hide:function(){if(!this.$root||this.status!=="show")return;this.trigger("onPreHide"),this.needAnimat&&_.isFunction(this.animateHideAction)&&this.status!="hide"?this.animateHideAction.call(this,this.$root):this.$root.hide(),this.status="hide",this.unBindEvents(),this.removeSysEvents(),this.trigger("onHide")},hasAnimationProperty:function(e){var t=[$.fx.cssPrefix+"animation-name"],n=$("<div></div>");return n.attr("class",e),$("body").append(n),n.css(t[0])!="none"?(n.remove(),!0):(n.remove(),!1)},destroy:function(){this.status="destroy",this.unBindEvents(),this.removeSysEvents(),this.$root.remove(),this.trigger("onDestroy"),delete this},setzIndexTop:function(t,n){t||(t=this.$root);if(!n||n>10)n=0;n*=1e3,t.css("z-index",e(n))},bindEvents:function(){var e=this.events;if(!e&&!(e=_.result(this,"events")))return this;this.unBindEvents();var t=/^(\S+)\s*(.*)$/,n,r,i,s,o;for(n in e){r=e[n],_.isFunction(r)||(r=this[e[n]]);if(!r)continue;i=n.match(t),s=i[1],o=i[2],r=_.bind(r,this),s+=".delegateUIEvents"+this.id,o===""?this.$el.on(s,r):this.$el.on(s,o,r)}return this},unBindEvents:function(){return this.$el.off(".delegateUIEvents"+this.id),this}})}),define("text",["module"],function(e){"use strict";var t,n,r,i,s=["Msxml2.XMLHTTP","Microsoft.XMLHTTP","Msxml2.XMLHTTP.4.0"],o=/^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,u=/<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,a=typeof location!="undefined"&&location.href,f=a&&location.protocol&&location.protocol.replace(/\:/,""),l=a&&location.hostname,c=a&&(location.port||undefined),h=[],p=e.config&&e.config()||{};t={version:"2.0.5+",strip:function(e){if(e){e=e.replace(o,"");var t=e.match(u);t&&(e=t[1])}else e="";return e},jsEscape:function(e){return e.replace(/(['\\])/g,"\\$1").replace(/[\f]/g,"\\f").replace(/[\b]/g,"\\b").replace(/[\n]/g,"\\n").replace(/[\t]/g,"\\t").replace(/[\r]/g,"\\r").replace(/[\u2028]/g,"\\u2028").replace(/[\u2029]/g,"\\u2029")},createXhr:p.createXhr||function(){var e,t,n;if(typeof XMLHttpRequest!="undefined")return new XMLHttpRequest;if(typeof ActiveXObject!="undefined")for(t=0;t<3;t+=1){n=s[t];try{e=new ActiveXObject(n)}catch(r){}if(e){s=[n];break}}return e},parseName:function(e){var t,n,r,i=!1,s=e.indexOf("."),o=e.indexOf("./")===0||e.indexOf("../")===0;return s!==-1&&(!o||s>1)?(t=e.substring(0,s),n=e.substring(s+1,e.length)):t=e,r=n||t,s=r.indexOf("!"),s!==-1&&(i=r.substring(s+1)==="strip",r=r.substring(0,s),n?n=r:t=r),{moduleName:t,ext:n,strip:i}},xdRegExp:/^((\w+)\:)?\/\/([^\/\\]+)/,useXhr:function(e,n,r,i){var s,o,u,a=t.xdRegExp.exec(e);return a?(s=a[2],o=a[3],o=o.split(":"),u=o[1],o=o[0],(!s||s===n)&&(!o||o.toLowerCase()===r.toLowerCase())&&(!u&&!o||u===i)):!0},finishLoad:function(e,n,r,i){r=n?t.strip(r):r,p.isBuild&&(h[e]=r),i(r)},load:function(e,n,r,i){if(i.isBuild&&!i.inlineText){r();return}p.isBuild=i.isBuild;var s=t.parseName(e),o=s.moduleName+(s.ext?"."+s.ext:""),u=n.toUrl(o),h=p.useXhr||t.useXhr;!a||h(u,f,l,c)?t.get(u,function(n){t.finishLoad(e,s.strip,n,r)},function(e){r.error&&r.error(e)}):n([o],function(e){t.finishLoad(s.moduleName+"."+s.ext,s.strip,e,r)})},write:function(e,n,r,i){if(h.hasOwnProperty(n)){var s=t.jsEscape(h[n]);r.asModule(e+"!"+n,"define(function () { return '"+s+"';});\n")}},writeFile:function(e,n,r,i,s){var o=t.parseName(n),u=o.ext?"."+o.ext:"",a=o.moduleName+u,f=r.toUrl(o.moduleName+u)+".js";t.load(a,r,function(n){var r=function(e){return i(f,e)};r.asModule=function(e,t){return i.asModule(e,f,t)},t.write(e,a,r,s)},s)}};if(p.env==="node"||!p.env&&typeof process!="undefined"&&process.versions&&!!process.versions.node)n=require.nodeRequire("fs"),t.get=function(e,t){var r=n.readFileSync(e,"utf8");r.indexOf("﻿")===0&&(r=r.substring(1)),t(r)};else if(p.env==="xhr"||!p.env&&t.createXhr())t.get=function(e,n,r,i){var s=t.createXhr(),o;s.open("GET",e,!0);if(i)for(o in i)i.hasOwnProperty(o)&&s.setRequestHeader(o.toLowerCase(),i[o]);p.onXhr&&p.onXhr(s,e),s.onreadystatechange=function(t){var i,o;s.readyState===4&&(i=s.status,i>399&&i<600?(o=new Error(e+" HTTP status: "+i),o.xhr=s,r(o)):n(s.responseText))},s.send(null)};else if(p.env==="rhino"||!p.env&&typeof Packages!="undefined"&&typeof java!="undefined")t.get=function(e,t){var n,r,i="utf-8",s=new java.io.File(e),o=java.lang.System.getProperty("line.separator"),u=new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(s),i)),a="";try{n=new java.lang.StringBuffer,r=u.readLine(),r&&r.length()&&r.charAt(0)===65279&&(r=r.substring(1)),n.append(r);while((r=u.readLine())!==null)n.append(o),n.append(r);a=String(n.toString())}finally{u.close()}t(a)};else if(p.env==="xpconnect"||!p.env&&typeof Components!="undefined"&&Components.classes&&Components.interfaces)r=Components.classes,i=Components.interfaces,Components.utils["import"]("resource://gre/modules/FileUtils.jsm"),t.get=function(e,t){var n,s,o={},u=new FileUtils.File(e);try{n=r["@mozilla.org/network/file-input-stream;1"].createInstance(i.nsIFileInputStream),n.init(u,1,0,!1),s=r["@mozilla.org/intl/converter-input-stream;1"].createInstance(i.nsIConverterInputStream),s.init(n,"utf-8",n.available(),i.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER),s.readString(n.available(),o),s.close(),n.close(),t(o.value)}catch(a){throw new Error((u&&u.path||"")+": "+a)}};return t}),define("text!T_UIHeader",[],function(){return"\n<div class=\"cm-header\">\n<%\n\nvar i = 0, len = 0, j = 0, jj = 0;\nvar left = left;\nvar center = center;\nvar right =  right.reverse();\nvar item = null;\nvar outhtml = ''\nvar dir;\nvar btnObj = null;\n\n%>\n\n<%for(jj=0; jj < 2; jj++) { %>\n  <%\n    if(jj == 0) { dir = 'fl'; btnObj = left; } else { dir = 'fr'; btnObj = right; }\n  %>\n  <% for(i = 0, len = btnObj.length; i < len; i++) { %>\n    <% item = btnObj[i]; %>\n    <%if(typeof item.itemFn == 'function') { %>\n      <%=item.itemFn() %>\n    <%} else { %>\n      <span class=\" cm-header-<%=(item.value ? 'btn' : 'icon') %> <%=dir %>  js_<%=item.tagname %>\" >\n        <% if(item.value) { %>\n          <%=item.value %>\n        <% } else { %>\n          <i class=\"icon-<%=item.tagname %>\"></i>\n        <% } %>\n      </span>\n    <%} %>\n  <%} %>\n<%} %>\n\n<% item = center; %>\n<%if(typeof item.itemFn == 'function') { %>\n  <%=item.itemFn() %>\n<%} else if(item.tagname=='title' ||  item.tagname=='subtitle') { %>\n  <div class=\"cm-page-title js_<%=item.tagname %>\" >\n    <%if(_.isArray(item.value) && item.value.length == 2) { %>\n      <span class=\"cm-title-l\"><%=item.value[0]%></span>\n      <span class=\"cm-title-s\"><%=item.value[1]%></span>\n    <%} else { %>\n      <%=item.value || item.value[0]%>\n    <%} %>\n  </div>\n<%} else if(item.tagname=='select'){ %>\n  <div class=\"cm-page-select-title js_<%=item.tagname %>\" >\n    <%=item.value %>\n  </div>\n<%} else if(item.tagname=='tabs') { %>\n  <div class=\"cm-page-tabs-title js_<%=item.tagname %>\" >\n    <%for(j = 0; j < item.data.items.length; j ++) { %>\n      <span data-key=\"<%=item.data.items[j].id %>\" data-index=\"<%=j %>\" class=\"<%if(item.data.index==j){ %>active<%} %>\" ><%=item.data.items[j].name %></span>\n    <% } %>\n  </div>\n<% } else{ %>\n\n<%} %>\n\n</div>\n"}),define("UIHeader",["UIView","text!T_UIHeader"],function(e,t){return _.inherit(e,{propertys:function($super){$super(),this.viewScope,this.datamodel={left:[],right:[],center:{}},this.template=t,this.openShadowDom=!1,this.needEmptyWrapper=!0,this.events={}},resetPropery:function($super){$super(),this.root&&this.root[0]&&(this.wrapper=this.root)},set:function(e){this.setOption(e),this._originData=e;if(typeof e!="object")return;e.events||(e.events={}),e.view&&(this.viewScope=e.view);var t={left:[],right:[],center:{}},n={};e.back!==!1&&(_.isObject(e.back)?t.left.push(e.back):_.isString(e.backtext)?(n.tagname="back",n.value=e.backtext,_.isFunction(e.events.returnHandler)&&(n.callback=e.events.returnHandler),t.left.push(n)):_.find(e.left,function(e){return e.tagname=="back"})||t.left.push({tagname:"back",callback:e.events.returnHandler})),_.isObject(e.tel)&&t.right.push({tagname:"tel",number:e.tel.number,callback:e.events.telHandler}),e.home&&t.right.push({tagname:"home",callback:e.events.homeHandler}),_.isObject(e.btn)&&t.right.push({tagname:"commit",value:e.btn.title,classname:e.btn.classname,data:e.btn.data,callback:e.events.commitHandler}),_.isArray(e.moreMenus)&&t.right.push({tagname:"list",data:e.moreMenus});var r={};_.isString(e.title)&&(r.tagname="title",r.value=e.title),_.isString(e.subtitle)&&(r.tagname="subtitle",r.value=[e.title,e.subtitle]),_.isString(e.citybtn)&&(r.tagname="select",r.value=e.citybtn,r.callback=e.events.citybtnHandler),_.isObject(e.title)&&(r=e.title),t.center=r,e.left&&(t.left=e.left.concat(t.left)),e.right&&(t.right=e.right.concat(t.right));var i=_.groupBy(t.right,function(e){return e.tagname=="list"?"a":"b"});t.right=(i.b||[]).concat(i.a||[]),_.isObject(e.center)&&(t.center=e.center),this.handleSpecialParam(t),this.datamodel=t,this.setEventsParam(),this.datamodel.left[0]&&_.isFunction(this.datamodel.left[0].callback)&&(this.lastReturnHandler=this.datamodel.left[0].callback),this.refresh(!0),this.show()},listDefaultCallback:function(e){var t,n,r=_.find(this.datamodel.right,function(e){return e.tagname=="list"});if(!r)return;this.sidebar||(this.sidebar=new UIBubbleLayer({datamodel:{data:r.data,wrapperClass:"cm-pop--user-nav",itemFn:function(e){var t=e.iconname||e.tagname;return'<i class="icon-'+t+'"></i>'+e.value}},triangleRight:"16px",triggerEl:$(e.currentTarget),width:"128px",onCreate:function(){this.mask.$el.addClass("cm-overlay--transparent"),this.mask.$el.removeClass("cui-mask")},onClick:function(e,t,n){_.isFunction(e.callback)&&e.callback.call(this.viewScope,e,t,n),this.hide()}})),this.sidebar.status=="show"?this.sidebar.hide():this.sidebar.show()},backDefaultCallback:function(){if(this.lastReturnHandler){this.lastReturnHandler.call(this.viewScope);return}console.log("默认back回调"),Blade.back()},setEventsParam:function(){var e,t=null,n=this.datamodel.left.concat(this.datamodel.right).concat(this.datamodel.center);for(var r=0,i=n.length;r<i;r++)e=n[r],_.isFunction(this[e.tagname+"DefaultCallback"])&&(t=this[e.tagname+"DefaultCallback"]),_.isFunction(e.callback)&&(t=$.proxy(e.callback,this.viewScope)),t&&(this.events["click .js_"+e.tagname]=t),t=null},handleSpecialParam:function(e){var t,n,r,i;for(t in e)if(_.isArray(e[t]))for(n=0,r=e[t].length;n<r;n++)i=e[t][n],this["customtHandle_"+i.tagname]&&this["customtHandle_"+i.tagname](e[t][n],t)},_getDir:function(e){var t={left:"fl",right:"fr"};return t[e]},customtHandle_tel:function(e,t){t=this._getDir(t),e.itemFn=function(){return'<a href="tel:'+e.number+'" class="cm-header-icon __hreftel__ '+t+" js_"+e.tagname+' " ><i class="icon-'+e.tagname+'"></i></a>'}},addEvent:function(){this.on("onShow",function(){this.wrapper.height("44px"),this.$el.removeClass("cm-header--no-right"),this.datamodel.right.length===0&&this.$el.addClass("cm-header--no-right")})},updateHeader:function(e,t){_.isObject(e)?this.set(_.extend(this._originData,e)):_.isObject(this._originData)?this.set(_.extend(this._originData,_.object([e],[t]))):this.set(_.object([e],[t]))}})}),define("UIMask",["UIView"],function(e){"use strict";return _.inherit(e,{propertys:function($super){$super(),this.setUIType("mask"),this.resetDefaultProperty()},resetDefaultProperty:function(){this.events={},this.animateOutClass="cm-overlay-out",this.addEvents({touchmove:"_preventDefault"})},setRootStyle:function(){var e=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight);this.$el.addClass("cm-overlay"),this.$el.css({height:e+"px"}),this.$root.css({position:"fixed",width:"100%",left:"0px",top:"0px"})},addEvent:function($super){$super(),this.on("onShow",function(){this.setRootStyle(),this.setzIndexTop()})}})}),define("UILayer",["UIView","UIMask"],function(e,t){"use strict";return _.inherit(e,{propertys:function($super){$super(),this.mask=new t,this.setUIType("layer"),this.resetDefaultProperty()},resetDefaultProperty:function(){this.mask.resetDefaultProperty(),this.needMask=!0,this.needAnimat=!0,this.maskToHide=!0,this.needReposition=!0,this.historyBack=!1,this.animateInClass="cm-up-in",this.animateOutClass="cm-up-out",this.animateShowAction=null,this.animateHideAction=null,this.addEvents({touchmove:"_preventDefault"})},resetPropery:function($super){$super(),this._setAnimat(),this._setMaskEvent()},_setAnimat:function(){var e=this;this.needAnimat&&(this.animateShowAction||(this.animateShowAction=function(t){e._safeAnimat(t,e.animateInClass,"show")}),this.animateHideAction||(this.animateHideAction=function(t){e._safeAnimat(t,e.animateOutClass,"hide")})),this.animateHideAction?(this.mask.needAnimat=!0,this.mask.animateHideAction=function(t){e._safeAnimat(t,e.mask.animateOutClass,"hide")}):this.mask.animateHideAction=null},_safeAnimat:function(e,t,n){var r=!1;n=="show"&&e.show(),e.addClass(t),e.one($.fx.animationEnd,function(){r=!0,e.removeClass(t),n=="hide"&&e.hide()}),setTimeout(function(){if(r)return;e.removeClass(t),e.off($.fx.animationEnd),n=="hide"&&e.hide()},350)},_setMaskEvent:function(){var e=this;this.needMask&&this.maskToHide&&this.mask.addEvents({click:function(){e.hide()}})},addEvent:function(){this.on("onCreate",function(){this.$el.addClass("cui-layer")}),this.on("onPreShow",function(){this.needMask&&this.mask.show()}),this.on("onShow",function(){this.setzIndexTop(),this.needReposition&&this.reposition()}),this.on("onHide",function(){this.mask.hide()}),this.on("onDestroy",function(){this.mask.destroy()})},reposition:function(){this.$root.css({width:"280px"}),this.$root.css({position:"fixed",left:"50%",top:"50%","margin-left":-(this.$root.width()/2)+"px","margin-top":-(this.$root.height()/2)+"px"})}})}),define("text!T_UILoadingLayer",[],function(){return'<%\nvar hasText = (typeof content == \'string\' && content.length > 0);\n%>\n<section class="cm-loading  <%if(closeBtn){ %> cm-loading--close<% } %>">\n  <span class="preloader"></span>\n  <%if(closeBtn){ %><i class="icon-close js_close"></i><% } %>\n  <%if(hasText){ %><p class="cm-loading-text">\n    <%=content %></p>\n  <% } %>\n</section>\n'}),define("UILoadingLayer",["UILayer","text!T_UILoadingLayer"],function(e,t){"use strict";return _.inherit(e,{propertys:function($super){$super(),this.setUIType("loading"),this.resetDefaultProperty()},resetDefaultProperty:function($super){$super(),this.template=t,this.closeBtn=!1,this.content="",this.addEvents({"click .js_close":"closeAction"}),this.maskToHide=!1,this.hasPushState=!1,this.closeAction=function(e){this.hide()}},getViewModel:function(){return this._getDefaultViewModel(["closeBtn","content"])},reposition:function(){var e="60px";if(this.closeBtn||this.content.length>0)e="100px";this.$root.css({width:e}),this.$root.css({position:"fixed",left:"50%",top:"50%","margin-left":-(this.$el.width()/2)+"px","margin-top":-(this.$el.height()/2)+"px"})}})}),define("AbstractApp",["UIHeader","UILoadingLayer"],function(e,t){return _.inherit({propertys:function(){this.viewRootPath="views/",this.defaultView="index",this.request,this.viewId,this.mainframe,this.viewport,this.views={},this.viewMapping={},this.isCreate=!1,this.status="init",this.$wrapper=$("body"),this.$mainframe=$("#root"),this.interface=["forward","back","loadSubView"],this.appmode="mobile",this.loading=new t({content:"加载中...",closeBtn:!1})},initialize:function(e){this.propertys(),this.setOption(e),this.createViewPort(),this.loadViewByUrl(),this.buildEvent()},setOption:function(e){_.extend(this,e)},createViewPort:function(){if(this.isCreate)return;var t="",n='<div class="header-wrapper"></div>',r='<div class="viewport-wrapper"></div>';this.$mainframe[0]||(t=['<div class="main">',"</div>"].join(""),this.$mainframe=$(t),this.$wrapper.append(this.$mainframe)),this.$mainframe.html(n+r),this.$header=this.$mainframe.find(".header-wrapper"),this.$viewport=this.$mainframe.find(".viewport-wrapper"),this.header=new e({wrapper:this.$header}),this.isCreate=!0},buildEvent:function(){this.hasPushState?$(window).bind("popstate",_.bind(this.loadViewByUrl,this)):$(window).bind("hashchange",_.bind(this.loadViewByUrl,this))},loadViewByUrl:function(e){this.parseUrl(),this.switchView(this.viewId)},parseUrl:function(){var e=decodeURIComponent(location.href).toLowerCase(),t=this.getViewIdRule(e);t=t||this.defaultView,this.viewId=t,this.viewPrevUrlPath=e,this.request={viewId:t,path:e}},switchView:function(e){var t=e,n=this.views[t],r=this.curView;r&&r!=n&&(this.lastView=r);if(n){if(n==this.curView){n.hashChangeParamsRefresh&&n._urlHash!==window.location.hash&&(n.trigger("onShow"),n._urlHash=window.location.hash);return}this.curView=n,this.curView.show(),this.lastView&&this.lastView.hide()}else this.loading.show(),this.loadView(e,function(e){if($('[page-url="'+t+'"]').length>0)return;this.curView=new e({APP:this,wrapper:this.$viewport}),this.curView._urlHash=window.location.hash,this.curView.$root.attr("page-url",t).addClass("page-view-"+t),this.views[t]=this.curView;var n=typeof r!="undefined"?r.viewname:null;this.curView.show(),this.lastView&&this.lastView.hide(),this.loading.hide()})},loadView:function(e,t){var n=this;requirejs([this.buildUrl(e)],function(e){t&&t.call(n,e)})},buildUrl:function(e){this.appmode=="ipad"&&(e+=".ipad");var t=this.viewMapping[e];return t?t:this.viewRootPath+e},getViewIdRule:function(e){var t="",n="",r,i;return this.hasPushState?t=_.getUrlParam(e,"viewid"):(t=e.replace(/^[^#]+(#(.+))?/g,"$2").toLowerCase().replace(/^#+/i,""),r=/^([^?&|]*)(.*)?$/i.exec(t),i=r[1]?r[1].split("!"):[],t=(i.shift()||"").replace(/(^\/+|\/+$)/i,"")),t},setUrlRule:function(e,t,n){if(this.hasPushState){var r,i=window.location.href,s="",o="";if(n)for(r in n)s+="&"+r+"="+n[r];o=i.indexOf("?")?i.substr(0,i.indexOf("?"))+"?viewid="+e:i+"?viewid="+e,t?history.replaceState("",{},o+s):history.pushState("",{},o+s)}else t?window.location.replace(("#"+e).replace(/^#+/,"#")):window.location.href=("#"+e).replace(/^#+/,"#")},forward:function(e,t){if(!e)return;t=t||{};var n=t.replace,r=t.isNotAnimat;param=t.param,e=e.toLowerCase(),r&&(this.isAnimat=!1),this.animatName=t.animatName||this.animForwardName,this.setUrlRule(e,n,param),this.hasPushState&&this.loadViewByUrl()},back:function(e,t){t=t||{};var n=t.isNotAnimat;n&&(this.isAnimat=!1),this.animatName=this.animBackwardName,e?(t.animatName=this.animBackwardName,this.forward(e,t)):window.history.length==1?this.forward(this.defaultView,t):history.back()}})}),define("AbstractModel",["cAjax"],function(e){var t=_.inherit({propertys:function(){this.url=null,this.param=null,this.dataformat=null,this.validates=[],this.protocol=window.location.protocol.indexOf("https")>-1?"https":"http",this.contentType="json",this.method="POST",this.timeout=3e4,this.isAbort=!1,this.baseurl={domain:"",path:""}},setOption:function(e){for(var t in e)this[t]=e[t]},assert:function(){if(this.url===null)throw"not override url property";if(this.param===null)throw"not override param property"},initialize:function(e){this.propertys(),this.setOption(e),this.assert()},setAttr:function(e,t){this[e]=t},pushValidates:function(e){typeof e=="function"&&this.validates.push($.proxy(e,this))},setParam:function(e,t){typeof e=="object"&&!t?this.param=e:this.param[e]=t},getParam:function(){return this.param},buildurl:function(){throw"[ERROR]abstract method:buildurl, must be override"},execute:function(t,n,r,i,s){var o=this.buildurl(),u=this,a=$.proxy(function(e){for(var i=0,s=this.validates.length;i<s;i++)if(!this.validates[i](e))return typeof n=="function"?n.call(r||this,e):!1;var o=typeof this.dataformat=="function"?this.dataformat(e):e;typeof t=="function"&&t.call(r||this,o,e)},this),f=$.proxy(function(e){typeof n=="function"&&n.call(r||this,e)},this),s=s||_.clone(this.getParam()||{});s.contentType=this.contentType,this.contentType==="json"?e.cros(o,this.method,s,a,f):this.contentType==="jsonp"?e.jsonp(o,s,a,f):e.post(o,s,a,f)}});return t.getInstance=function(){return this.instance instanceof this?this.instance:this.instance=new this},t}),define("text!../blade/ui/core.header.html",[],function(){return"\n<div class=\"cm-header\">\n<%\n\nvar i = 0, len = 0, j = 0, jj = 0;\nvar left = left;\nvar center = center;\nvar right =  right.reverse();\nvar item = null;\nvar outhtml = ''\nvar dir;\nvar btnObj = null;\n\n%>\n\n<%for(jj=0; jj < 2; jj++) { %>\n  <%\n    if(jj == 0) { dir = 'fl'; btnObj = left; } else { dir = 'fr'; btnObj = right; }\n  %>\n  <% for(i = 0, len = btnObj.length; i < len; i++) { %>\n    <% item = btnObj[i]; %>\n    <%if(typeof item.itemFn == 'function') { %>\n      <%=item.itemFn() %>\n    <%} else { %>\n      <span class=\" cm-header-<%=(item.value ? 'btn' : 'icon') %> <%=dir %>  js_<%=item.tagname %>\" >\n        <% if(item.value) { %>\n          <%=item.value %>\n        <% } else { %>\n          <i class=\"icon-<%=item.tagname %>\"></i>\n        <% } %>\n      </span>\n    <%} %>\n  <%} %>\n<%} %>\n\n<% item = center; %>\n<%if(typeof item.itemFn == 'function') { %>\n  <%=item.itemFn() %>\n<%} else if(item.tagname=='title' ||  item.tagname=='subtitle') { %>\n  <div class=\"cm-page-title js_<%=item.tagname %>\" >\n    <%if(_.isArray(item.value) && item.value.length == 2) { %>\n      <span class=\"cm-title-l\"><%=item.value[0]%></span>\n      <span class=\"cm-title-s\"><%=item.value[1]%></span>\n    <%} else { %>\n      <%=item.value || item.value[0]%>\n    <%} %>\n  </div>\n<%} else if(item.tagname=='select'){ %>\n  <div class=\"cm-page-select-title js_<%=item.tagname %>\" >\n    <%=item.value %>\n  </div>\n<%} else if(item.tagname=='tabs') { %>\n  <div class=\"cm-page-tabs-title js_<%=item.tagname %>\" >\n    <%for(j = 0; j < item.data.items.length; j ++) { %>\n      <span data-key=\"<%=item.data.items[j].id %>\" data-index=\"<%=j %>\" class=\"<%if(item.data.index==j){ %>active<%} %>\" ><%=item.data.items[j].name %></span>\n    <% } %>\n  </div>\n<% } else{ %>\n\n<%} %>\n\n</div>\n"}),function(e){e.fn.scrollLoading=function(t){var n={attr:"data-src",container:e(window),callback:e.noop},r=e.extend({},n,t||{});r.cache=[],e(this).each(function(){var t=this.nodeName.toLowerCase(),n=e(this).attr(r.attr),i={obj:e(this),tag:t,url:n};r.cache.push(i)});var i=function(t){e.isFunction(r.callback)&&r.callback.call(t.get(0))},s=function(){var t=r.container.height();e(window).get(0)===window?contop=e(window).scrollTop():contop=r.container.offset().top,e.each(r.cache,function(e,n){var r=n.obj,s=n.tag,o=n.url,u,a;if(r){u=r.offset().top-contop,a=u+r.height();if(u>=0&&u<t||a>0&&a<=t)o?s==="img"?i(r.attr("src",o)):r.load(o,{},function(){i(r)}):i(r),n.obj=null}})};s(),r.container.bind("scroll",s)}}(Zepto),define("LazyLoad",function(){}),define("UISwiper",[""],function(){var e=['<div class="swiper-wrapper">',"  <%list.forEach(function(imgurl){%>",'    <div class="swiper-slide">','      <img class="swiper-lazy" data-src="<%=imgurl%>" style="width: 100%">','      <div class="preloader"></div>',"    </div>","  <%})%>","</div>",'<div class="swiper-pagination"></div>'].join("");return _.inherit({propertys:function(){this.template=e},initialize:function(e,t){this.propertys(),this.renderSwiper(e,t)},renderSwiper:function(e,t){var n=t.length;if(!n)return;var r="";if(n>1){r=_.template(this.template)({list:t}),e.html(r);var i={pagination:".swiper-pagination",paginationClickable:!0,loop:!0,preloadImages:!1,lazyLoadingInPrevNext:!0,lazyLoading:!0},s=new $.Swiper(e,i);return _.extend(this,s),this}r='<img src="'+t[0]+'" style="width: 100%">',e.html(r)}})}),define("UIDownTip",[],function(){var e="assets/img/logo.png",t=['<div id="J_down_tip" class="down-tip">','  <div class="tip-bg"></div>','  <span class="close">×</span>',"  <p>",'    <img src="'+e+'" width="32" height="32" alt="logo">','    <a href="<%=url%>"><span class="btn fr">立即体验</span><span class="text">专做食品特卖，立即下载抢购吧！</span></a>',"  </p>","</div>"].join(""),n=window.localStorage,r="";return $.os.ios?r="http://pre.im/hsq1":$.os.android?r="http://pre.im/hsq2":r="",_.inherit({propertys:function(){this.template=t},initialize:function(e,t){this.propertys(),this.checkStatus()},checkStatus:function(){this.$downTipDom=$("#J_down_tip"),this.show()},show:function(){var e=this;if(!r)return;var t=_.template(this.template)({url:r});this.$downTipDom.length?this.$downTipDom.show():$("body").append(t),this.$downTipDom.find(".close").click(function(t){e.hide()})},hide:function(){this.$downTipDom.length&&this.$downTipDom.hide()}})}),define("text!../blade/ui/ui.loading.layer.html",[],function(){return'<%\nvar hasText = (typeof content == \'string\' && content.length > 0);\n%>\n<section class="cm-loading  <%if(closeBtn){ %> cm-loading--close<% } %>">\n  <span class="preloader"></span>\n  <%if(closeBtn){ %><i class="icon-close js_close"></i><% } %>\n  <%if(hasText){ %><p class="cm-loading-text">\n    <%=content %></p>\n  <% } %>\n</section>\n'});