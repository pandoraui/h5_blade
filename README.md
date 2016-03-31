# H5_Blade 项目

引入 王磊的 blade项目，用于好食期项目，有调整改动。

注意，此项目依赖 smacss-extend 的项目，因为其为非稳定版本，暂使用软链接引入使用。另准备集成 iqg 项目，需接入 wechat JSSDK 等。

    //命令如下：
    //ln –s 源文件 目标文件
    ln -s ~/github/.../smacss-extend/src ./src

## 结构划分

发布结构如下：

```
dist
  index.html
  d.html
  favicon.png

  + assets/
    |- + common/       // 公共部分
    |  |- libs.js    // 外部依赖打包为 libs
    |  |- blade.js   // blade框架部分 打包为 blade
    |  |- hsqapp.css    // scss模块部分
    |
    |- js             |- main.js |
    |  |- hsq.js  ----|- views/  |---- 合并成 hsq.js
    |                 |- model/  |
    |- css
    |  |- hsq.css    //hsq的自定义 css
    |
    |- img/          //logo等图片
```

开发结构如下：

```
h5_blade
  README.md
  gulpfile.js
  qnConfig.js

  + blade/    //项目组件
  + hsq/      //好食期项目
    |- index.html
    |- main.js
    |- ex_mvc/
    |- views/
    |- model/
    |- model/
    |
    |- scss/
    |- img/

  + iqg/      //爱抢购项目
  + src/      //项目资源引用，scss等
  + dist/     //编译目录，内同发布结构

  + demo/
  + deploy/   //发布任务
```

发布版整体结构大体就这样了，不过都需要打包上 md5 哈希值，使用增量发布(上一次压缩输出的 hash 文件不立即删除，隔段时间(暂定一个月)后删除)。由于项目拆分，框架独立发布，所以删除过期文件时，需注意。

## 更新历史及问题

- 2016-03-31 [todo] 进行项目拆分（如何拆分以及更新发布？），构建为独立项目blade + 多个应用[hsq、iqg]
- 2016-03-30 [done] 提取公共模块功能于 h5_blade 项目，便于扩展新项目使用
- 2016-03-30 [done] 将 h5_hsq 项目迁移至 h5_blade 项目，并完成提取页面模版
- 2016-03-23 [done] 计划要提取页面模板（c.page.view 以及 c.page.list），置于 blade 项目中，用于继承，精简自定义项目的设定
- 2016-03-23 [todo] 内存存储，在手机端隐身模式，无法使用 localStorage，需要存在缓存里
- 2016-03-22 [todo] 实现 ajax 请求数据结果(成功的结果)的缓存存储
- 2016-03-21 [done] 实现列表页下拉加载更多功能
- 2016-03-21 [done] 页面切换存在滚动条定位问题，需要解决（完美方案：开启 keepScrollPos 则保留定位）;
- 2016-03-18 [done] 新增百度统计，统计pv，平台，宿主，以及自定义事件（登录、注册、下单、支付...）等等
- 2016-03-14 [done] 主题活动页面，是否要独立？不独立，暂时在项目中，依赖项目接口、配置以及交互组件
- 2016-03-12 [done] 解决 showToast 的内容更新问题
- 2016-03-10 [done] 页面加载 loading 以及 ajaxLoading效果处理，引入 waitAjax 参数配置
- 2016-03-08 [done] 解决 model 的公共参数问题（每次请求前，要用最新数据更新公共参数，如登录状态）
- 2016-03-05 [done] 新增倒计时组件
- 2016-03-04 [done] 缓存机制，解决 store 存储以及时效性问题
- 2016-03-01 [!!!todo] 计划任务：目前发布流程，直接当前分支编译打包到 dist 目录，然后将 dist 目录发布到 gh-pages 分支，这样不便于插入任务的更新，流程应该改为，凡发布，都要[创建]稳定版本 release 分支发布，发布完成后，合并到 master 分支。
- 2016-02-23 [done] 新需求制作，逐步完善框架功能
- 2016-01-06 [done] 解决 model 请求加载数据问题
- 2015-01-05 [done] 集成 cap deploy 命令到 gulp 任务中
- 2015-12-31 [done] 更新测试打包命令，将原发布整个分支修改为只发布 dist 目录，且发布到 gh-pages 分支
- 2015-12-30 [done] 测试完成 requireJS 模块的打包
- 2016-12-22 [done] 目前 hsq.js 和 blade.js 的模块是按需加载的
- 2015-12-22 [done] 迁移 blade 项目

### 关于项目拆分以及拆分后更新及发布问题

- 如何拆分
  - 拆分为独立的 blade 框架项目，另加多个应用项目，如[hsq, iqg]等
  - 组建，应用项目需要依赖框架项目，样式项目(这个原本就独立)
- 拆分后更新及发布问题
  - 若独立发布，则存在项目引用版本的问题，增量发布不受影响[👍]。
  - 若项目独立包含发布，无谓的浪费资源了，不建议

综上，暂定独立发布。

## 使用及发布

### 全局安装 gulp：

```
npm install gulp -g
```

### 安装开发依赖

1. 克隆或下载本项目；
2. 进入项目目录，执行 `npm install`；

### 开发

```
gulp dev
```

### 生产环境构建

设置 Node 环境变量为 `production` 后，HTML 中引用的 CSS 和 JS 会替换为 minify 的版本。

```
NODE_ENV=production gulp

//由于集成了命令自动化任务，可以直接使用，效果同上
gulp pro
```

### 发布

1. 自动调用 `NODE_ENV=production gulp` 构建生产环境代码到 `dist` 目录;
2. 使用 `gulp publish` 将刚构建的 `dist` 目录提交到 gh-pages 分支;
3. 将当前开发分支提交到 release 分支;            //待完成
4. 给 release、gh-pages 分支打最新发布的标签;    //待完成
5. 使用 `gulp cap:deploy` 调用外部命令 `cap deploy` 将 gh-pages 分支发布到生产服务器（需要授权 ssh-key）。

注：标签格式为 `release_20151231`，每次稳定的发布都要打标签，非稳定发布，要适时移除或更新标签。

只给 `gh-pages` 发布版本打标签是不 OK 的（非开发版无意义，只能回滚使用），必须对应稳定的开发版本，每次发布要提交到 `release` 分支并要打标签。

```
//这个操作需谨慎，会直接发布到生产服务器
//这个流程要更改！！！
gulp deploy       //发布到测试环境
gulp deploy:dist  //发布到生产环境
```
