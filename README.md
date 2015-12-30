# hsq

好食期

## 结构划分

```
dist
  index.html
  d.html
  favicon.png

  static/
    |- common/
    |  |- libs.js    // 外部依赖打包为 libs
    |  |- blade.js   // blade框架部分 打包为 blade
    |  |- app.css    // scss模块部分
    |
    |- js             |- main.js |
    |  |- hsq.js  ----|- views/  |---- 合并成 hsq.js
    |                 |- model/  |
    |- css
    |  |- hsq.css    //自定义 css
    |
    |- img/          //logo等图片
```

整体发布结构大体就这样了，不过都需要打包上 md5 哈希值，使用增量发布。


## 使用说明

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

发布到服务器。

//由于现有服务端用的 php 路由以及 twig 模板，需要转化为 twig 格式形式发布到生产。

```
gulp publish
```
