/**
 * @File c.page.view.js
 * @Description:多数UI View的基类，提供基础方法，以及自建事件机
 * @author shbzhang@ctrip.com
 * @date 2014-09-30 15:23:20
 * @version V1.0
 */
/**
 *  ListView提供了列表的分次加载功能
 *  @namespace View.cListView
 *  @example
 *  defined('cListView',function(cListView){
 *    var listView = cListView.extend({
 *      //底部刷新
 *      onBottomPull:function(){
 *      },
 *
 *      //顶部刷新
 *      onTopPull:function(){
 *        //用法1:使用默认loading
 *        var self = this;
 *        //显示loading
 *        this.showTopLoading();
 *        setTimeout(function(){
 *          self.hideRefreshLoading();
 *        },500)
 *
 *        //用法2:不使用默认loading的时候调用
 *        //this.endPull();
 *      }
 *    });
 *  });_
 *
 */
define(['cPageList', 'PageView'], function (cPageList, PageView) {
    "use strict";

    // var PageView = PageView.extend(options);
    var PageList = $.extend(cPageList, PageView);
    return PageList;
  });
