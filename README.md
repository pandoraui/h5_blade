# hsq

好食期

## 结构划分

```
dist
  index.html
  d.html
  favicon.png

  assets/
    |- common/       // 公共部分
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

发布版整体结构大体就这样了，不过都需要打包上 md5 哈希值，使用增量发布(上一次压缩输出的 hash 文件不立即删除，隔段时间(暂定一个月)后删除)。

## 更新历史及问题

- 2015-01-04[已处理]目前 hsq.js 和 blade.js 的模块是按需加载的，还未打包到一起，正在处理中...


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
```

### 发布

1. 自动调用 `NODE_ENV=production gulp` 构建生产环境代码到 `dist` 目录;
2. 将刚构建的 `dist` 目录提交到 `gh-pages` 分支;
3. 将当前开发分支提交到 `release` 分支;            //待完成
4. 给 `release`、`gh-pages` 分支打最新发布的标签;  //待完成
5. 调用外部命令 `cap deploy` 发布到生产服务器。     //待完成

注：标签格式为 `release_20151231`，每次稳定的发布都要打标签，非稳定发布，要适时移除或更新标签。

只给 `gh-pages` 发布版本打标签是不 OK 的（非开发版无意义，只能回滚使用），必须对应稳定的开发版本，每次发布要提交到 `release` 分支并要打标签。

```
<!-- gulp publish -->
gulp deploy
```
