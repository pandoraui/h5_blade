/**
 *  Starter Kit
 */

/**
npm install gulp gulp-load-plugins gulp-md5-plus del run-sequence browser-sync browserify watchify vinyl-source-stream vinyl-buffer gulp-sass gulp-cache gulp-rename gulp-autoprefixer gulp-size gulp-csso gulp-replace gulp-copy2  --save-dev

npm install fs gulp-concat gulp-jshint jshint-stylish gulp-amd-optimizer gulp-uglify --save-dev
*/

'use strict';

var gulp = require('gulp');
var copy2 = require('gulp-copy2');
var $ = require('gulp-load-plugins')();
var md5 = require('gulp-md5-plus');
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var reload = browserSync.reload;

//
var fs = require('fs');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
// var amdOptimize = require('gulp-amd-optimizer');
var amdOptimize = require('amd-optimize');

var isProduction = process.env.NODE_ENV === "production";

/**
关于从命令行传递参数，也可以这样写
//npm install --save-dev gulp gulp-if gulp-uglify minimist

var gulp = require('gulp');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');

var minimist = require('minimist');

var knownOptions = {
  string: 'env',
  default: { env: process.env.NODE_ENV || 'production' }
};

var options = minimist(process.argv.slice(2), knownOptions);

gulp.task('scripts', function() {
  return gulp.src('*.js')
    .pipe(gulpif(options.env === 'production', uglify())) // 仅在生产环境时候进行压缩
    .pipe(gulp.dest('dist'));
});

使用如下：
gulp scripts --env development
*/

var requireConfig = require('./blade/gulpcfg').requirejs;

var styleThemes = 'src/styles/themes/';

var AUTOPREFIXER_BROWSERS = [
  'ie >= 9',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 2.3',
  'bb >= 10'
];

var appPath = 'hsq/';
var appDist = 'dist/';
var paths = {
  entry: {
    html: appPath + 'index.html',
    fonts: appPath + 'dist/fonts',
    img: appPath + 'dist/img',
    // css: [styleThemes + 'hsq/hsqapp.scss', appPath + 'scss/hsq.scss'],
    css: ['src/styles/hsqapp.scss', appPath + 'scss/hsq.scss'],
    venders: appPath + 'venders',
    js: appPath + 'js',
  },
  dist: {
    base: appDist,
    html: appDist,
    fonts: appDist + 'assets/fonts',
    img: appDist + 'assets/img',
    css: appDist + 'assets/css',
    venders: appDist + 'assets/venders',
    js: appDist + 'assets/js',
    libs: 'blade/libs',
  },
  quoteSrc: [
    appDist + 'index.html',
    // appDist + 'debug.html'
  ],//, 'dist/index.html.twig'
  venders: {
    src: [
      // './node_modules/react/dist/react-with-addons.min.js',
      //'./node_modules/lodash/index.js',
      // './node_modules/react/dist/react.min.js'
    ],
    app: 'app/venders'
  }
};

// JavaScript 格式校验
// gulp.task('jshint', function () {
//   return gulp.src('app/js/**/*.js')
//     .pipe(reload({stream: true, once: true}))
//     .pipe($.eslint())
//     .pipe($.eslint.format())
//     .pipe($.eslint.failOnError());
// });

// 图片优化
// gulp.task('images', function () {
//   return gulp.src('app/i/**/*')
//     .pipe($.cache($.imagemin({
//       progressive: true,
//       interlaced: true
//     })))
//     .pipe(gulp.dest(paths.dist.img))
//     .pipe($.size({title: 'images'}));
// });

// 指定一个新的 cwd (当前工作目录)
//gulp.src('./some/dir/**/*.js', { cwd: 'public' });

// 拷贝相关外部依赖
gulp.task('copy:venders', function () {
  return gulp.src(
    paths.venders.src, {
    dot: true
  })
  // .pipe($.rename(function(path){
  //   if (path.basename === 'index') {
  //     path.basename = 'lodash';
  //   }
  // }))
  // lodash 太大了，uglify 之后还 51k,所以不全部引用了，按需引用
  // .pipe($.uglify())
  .pipe(gulp.dest(function(file) {
    var filePath = file.path.toLowerCase();
    console.log(filePath)
    // if (filePath.indexOf('lodash/index.js') > -1) {
    //   filePath = filePath.replace('index','lodash')
    // }
    return paths.venders.app;
  }))
    .pipe($.size({title: 'copy:venders'}));
});
// 拷贝相关资源
gulp.task('copy', ['copy:venders'], function () {
  var copyPaths = [
      {src: 'blade/**/*', dest: appDist + 'blade/'},
      // {src: appPath + 'index.html', dest: appDist},
      {src: appPath + 'd.html', dest: appDist},
      {src: appPath + 'main.js', dest: appDist},
      {src: appPath + 'favicon.*', dest: appDist},
      {src: appPath + 'images/*', dest: appDist + 'images/'},
      {src: appPath + 'img/*', dest: appDist + 'assets/img/'},
      {src: appPath + 'ex_mvc/*', dest: appDist + 'ex_mvc/'},
      {src: appPath + 'views/*', dest: appDist + 'views/'},
      {src: appPath + 'model/*', dest: appDist + 'model/'},
  ];
  return copy2(copyPaths);
});

// 编译 SCSS，添加浏览器前缀
gulp.task('styles', function () {
  var s = (
    gulp.src(paths.entry.css)
    .pipe($.sourcemaps.init())
    //.pipe($.plumber())  //自动处理全部错误信息防止因为错误而导致 watch 不正常工作
    .pipe($.sass())
    .pipe($.autoprefixer({browsers: AUTOPREFIXER_BROWSERS}))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest(paths.dist.css))
  );
  return !isProduction ? s : s.pipe($.csso())
    .pipe($.rename({suffix: '.min'}))
    .pipe(md5(10, paths.quoteSrc))
    .pipe(gulp.dest(paths.dist.css))
    .pipe($.size({title: 'styles'}));
});


var jsFiles = [
  // './blade/libs/*.js',
  './blade/libs/require.js',
  './blade/libs/zepto.js',
  './blade/libs/underscore.js',
  './blade/libs/underscore.extend.js',
  // './blade/libs/require.text.js',
  './blade/libs/zepto-adapter.js',
  './blade/libs/fastclick.js',
  './blade/common.js',
];
var options = {};

/*
JS 文件划分成几部分，由于有依赖，需要特殊处理

blade
  libs 核心部分
  extend 扩展部分
  amdConfig
hsq
  js 部分
  template 部分
*/

var libsConfig = requireConfig.libs.options;
var bladeConfig = requireConfig.blade.options;

// var requireConfig = require('./blade/common');

// console.log(libsConfig)


// 编译 JS
gulp.task('libs', ['copy', 'html'], function () {
  var s = (gulp.src(jsFiles)
      // gulp.src('src/*.js', {base: requireConfig.baseUrl})
      // .pipe(tap(function (file, t){
      //     addJSIndent (file, t);
      // }))
      // .pipe($.jshint())
      // .pipe($.jshint.reporter(stylish)) //'default'
      // .pipe($.sourcemaps.init())
      // .pipe(amdOptimize(requireConfig, options))
      //注意要用;间隔一下，不然闭包成()()()之类的，会报错？？？
      .pipe($.concat('libs.js', {newLine: ';'}))  //合并成为一个文件，顺序从前到后，
      // .pipe($.header(f7.banner, { pkg : f7.pkg, date: f7.date } ))
      // .pipe($.sourcemaps.write())
      .pipe(gulp.dest(paths.dist.js))
      .pipe(gulp.dest(paths.dist.libs))
      .pipe($.size({title: 'libs'}))
    );
    // .pipe(connectReload)
    // .on('end', function () {
    //     cb();
    // }));

  return !isProduction ? s : s.pipe($.uglify())
      .pipe($.rename({suffix: '.min'}))
      .pipe(md5(10, paths.quoteSrc))
      .pipe(gulp.dest(paths.dist.js))
      .pipe($.size({
        title: 'libs minify'
      }));
});

// 使用 watchify 加速 browserify 编译 http://www.gulpjs.com.cn/docs/recipes/fast-browserify-builds-with-watchify/

// 打包 Common JS 模块
// 在这里添加自定义 browserify 选项
// var b = browserify({
//   cache: {},
//   packageCache: {},
//   entries: ['./app/js/app.js'],
//   debug: !isProduction,
//   transform: ['babelify']
// });


/*
browserify . -d -o bundle.js

venders: [
  './node_modules/losash/index.js',
  // './node_modules/react/dist/react-with-addons.min.js',
  './node_modules/react/dist/react.min.js'
],

debug: true是告知Browserify在运行同时生成内联sourcemap用于调试。
引入gulp-sourcemaps并设置loadMaps: true是为了读取上一步得到的内联sourcemap，并将其转写为一个单独的sourcemap文件。
vinyl-source-stream用于将Browserify的bundle()的输出转换为Gulp可用的vinyl（一种虚拟文件格式）流。
vinyl-buffer用于将vinyl流转化为buffered vinyl文件（gulp-sourcemaps及大部分Gulp插件都需要这种格式）。
 */

//
//
// if (!isProduction) {
//   b = watchify(b);
// }
//
// // 如果想把 React 打包进去，可以把下面一行注释掉
// // 在这里加入变换操作
// b.transform('browserify-shim', {global: true});
//
//
// var bundle = function() {
//   var s = (
//     b.bundle()
//       .on('error', $.util.log.bind($.util, 'Browserify Error'))   // 如果有错误发生，记录这些错误
//       .pipe(source('app.js'))
//       .pipe(buffer())    //可选项，如果你不需要缓存文件内容，就删除
//       // .pipe($.sourcemaps.init())      // 可选项，如果你不需要 sourcemaps，就删除
//          // 从 browserify 文件载入 map
//          // 在这里将变换操作加入管道
//       // .pipe($.sourcemaps.write("."))  // 写入 .map 文件
//       .pipe(gulp.dest(paths.dist.js))
//       .pipe($.size({title: 'script'}))
//   );
//
//   return !isProduction ? s : s.pipe($.uglify())
//     .pipe($.rename({suffix: '.min'}))
//     .pipe(md5(10, paths.quoteSrc))
//     .pipe(gulp.dest(paths.dist.js))
//     .pipe($.size({
//       title: 'script minify'
//     }));
// };
//
// gulp.task('browserify', function() {
//   if (!isProduction) {
//     b.on('update', bundle)     // 当任何依赖发生改变的时候，运行打包工具
//      .on('log', $.util.log);   // 输出编译日志到终端
//   }
//
//   return bundle();
// });

// 压缩 HTML
gulp.task('html', function () {
  return gulp.src(paths.entry.html)
    //.pipe($.minifyHtml())
    .pipe($.replace(/\{\{__VERSION__\}\}/g, isProduction ? '.min' : ''))
    .pipe(gulp.dest(paths.dist.html))
    .pipe($.size({title: 'html'}));
});

// 洗刷刷
gulp.task('clean', function(cb) {
  return del([
    'dist/*',
    //'!dist/fonts',
    '!dist/venders',
    // '!dist/assets/js/libs.js',
    '!dist/assets',
    // '!dist/blade/libs/*.min_*',
  ], {dot: true}, cb);
});
gulp.task('clean:all', function(cb) {
  return del([
    'dist/*',
  ], {dot: true}, cb);
});

// 监视源文件变化自动cd编译
gulp.task('watch', function() {
  // gulp.watch(appPath + '/**/*.html', ['html']);
  gulp.watch('blade/libs/*', ['libs']);
  gulp.watch([appPath + '/**/*', 'blade/**/*'], ['copy']);
  gulp.watch([appPath + '/scss/**/*.scss', 'src/styles/**/*.scss'], ['styles']);
  // gulp.watch(appPath + '/img/**/*', ['images']);
});

// 启动预览服务，并监视 Dist 目录变化自动刷新浏览器
var times = 0;
gulp.task('dev', ['default', 'watch'], function () {
  browserSync({
    // port: 5000, //默认3000
    // ui: {    //更改默认端口weinre 3001
    //     port: 5001,
    //     weinre: {
    //         port: 9090
    //     }
    // },
    // server: {
    //   baseDir: 'dist/docs'
    // },
    open: "local", //external
    notify: false,
    logPrefix: 'happyCoding' + times++,
    server: 'dist'
  });

  gulp.watch(['dist/**/*'], reload);
  gulp.watch(['blade/**/*'], reload);
  // gulp.watch(['app/scss/*.scss'], {cwd: 'app'}, ['sass']);
});

// gulp.task('sass', function() {
//   return sass('scss/styles.scss')
//     .pipe(gulp.dest('app/css'))
//     .pipe(reload({ stream:true }));
// });


// 默认任务
gulp.task('default', function (cb) {
  console.log('生产环境：' + isProduction);
  //runSequence('clean', ['styles', 'jshint', 'html', 'images', 'copy', 'browserify'], cb);
  runSequence('clean', ['copy', 'html', 'styles', 'libs'], cb);
  // runSequence('clean', ['styles', 'html', 'images', 'copy', 'browserify'], cb);
});



// gulp-git 改变版本号以及创建一个 git tag
// http://www.gulpjs.com.cn/docs/recipes/bump-version-and-create-git-tag/


// 转为 twig 格式发布
var publish = {
  assets: '~/github/iqg/iqianggou_php/src/DWD/WebBundle/Resources/public/stats',
  twig: '~/github/iqg/iqianggou_php/src/DWD/WebBundle/Resources/views/Stats'
};

/*
$.rename({
  dirname: "main/text/ciao",
  basename: "aloha",
  prefix: "bonjour-",
  suffix: "-hola",
  extname: ".md"
})
*/


//
// gulp.task('publish', ['html:twig'], function () {
//   return gulp.src([
//     'dist/**/*',
//     '!dist/index.html',
//     '!dist/manifest.*',
//     '!.DS_Store'
//   ], {
//     dot: true
//   })
//   // .pipe($.rename(function(path){
//   //   console.log(path)
//   //     if (path.basename === 'index' && path.extname === '.html') {
//   //       //path.dirname += "h5/app";
//   //       //path.basename += "index";
//   //       path.extname = ".html.twig";
//   //       return path;
//   //     }
//   //   }))
//   .pipe(gulp.dest(function(file) {
//     var filePath = file.path.toLowerCase();
//     console.log(filePath);
//     if (filePath.indexOf('.html.twig') > -1) {
//       return publish.twig;
//     }
//     return publish.assets;
//   }))
//     .pipe($.size({title: 'publish'}));
// });
//
// //正则标识符g 表示:reg.exec 会扫描到content最后一个匹配项,直到返回null
// var twigVar=/(<!--[\n\r\s]*?)({% set (.+?) %})([\n\r\s]*?-->)/gm
// var link_reg=/(<link(?:.*?)href=[\"\'])(.+?)([\"\'](?!<)(?:.*)\>(?:[\n\r\s]*?)(?:<\/link>)*)/gm;
// var js_reg=/(<script(?:.*?)src=[\"\'])(.+?)([\"\'](?!<)(?:.*)\>(?:[\n\r\s]*?)(?:<\/script>)*)/gm;
// var img_reg=/(<img(?:.*?[\n\r\s]*.*?)src=[\'\"])(.+?)([\'\"](?!<)(?:.*?[\n\r\s]*.*?)\/*>)/gm;
// var twigPath = "$1{{ asset(path ~ '$2') }}$3";
//
// gulp.task('html:twig', function () {
//   return gulp.src('dist/*.html')
//     //.pipe($.minifyHtml())
//     .pipe($.replace(twigVar, '$2'))
//     .pipe($.replace(link_reg, twigPath))
//     .pipe($.replace(js_reg, twigPath))
//     .pipe($.rename('index.html.twig'))
//     .pipe(gulp.dest('dist'))
//     .pipe($.size({title: 'html:twig'}));
// });
//
// gulp.task('shell', $.shell.task('gulp'))












// gulp.task('start', function () {
//   nodemon({
//     script: 'server.js'
//   , ext: 'js html'
//   , env: { 'NODE_ENV': 'production' }
//   })
// })

/*

### 开发

    gulp dev

### 生产环境构建

设置 Node 环境变量为 production 后，HTML 中引用的 CSS 和 JS 会替换为 minify 的版本。

    NODE_ENV=production gulp

### 转化为 twig 格式，发布到生产

    gulp publish

    gulp.task('start', function () {
      nodemon({
        script: 'server.js'
      , ext: 'js html'
      , env: { 'NODE_ENV': 'development' }
      })
    })

    var gulp = require('gulp')
    var shell = require('./')

    var paths = {
      js: ['*.js', 'test/*.js']
    }

    gulp.task('test', shell.task('mocha -R spec'))

    gulp.task('coverage', ['test'], shell.task('istanbul cover _mocha -- -R spec'))

    gulp.task('coveralls', ['coverage'], shell.task('cat coverage/lcov.info | coveralls'))

    gulp.task('lint', shell.task('eslint ' + paths.js.join(' ')))

    gulp.task('default', ['coverage', 'lint'])

    gulp.task('watch', function () {
      gulp.watch(paths.js, ['default'])
    })


    gulp.task('javascript', function () {
      // set up the browserify instance on a task basis
      var b = browserify({
        entries: './entry.js',
        debug: true
      });

      return b.bundle()
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
            // Add transformation tasks to the pipeline here.
            .pipe(uglify())
            .on('error', gutil.log)
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist/js/'));
    });


    {
      "browserify": {
        "transform": [ "browserify-shim" ]
      },
      "browser": {
        "x"    :  "./vendor/x.js",
        "x-ui" :  "./vendor/x-ui.js",
        "y"    :  "./vendor/y.js",
        "z"    :  "./vendor/z.js"
      },
       "browserify-shim": {
        "x"    :  "$",
        "x-ui" :  { "depends": [ "x" ] },
        "y"    :  { "exports": "Y", "depends": [ "x:$" ] },
        "z"    :  { "exports": "zorro", "depends": [ "x:$", "y:YNOT" ] }
      }
    }



    "peerDependencies": {
      "react": "*",
      "chart.js": "*"
    },
    "browser": {},
    "browserify-shim": {
      "react": "global:React",
      "lodash": "global:_",
      "chart": "global:Chart"
    }


    {
      "browserify": {
        "transform": [ "browserify-shim" ]
      },
      "browserify-shim": "./config/shim.js"
    }

    module.exports = {
      '../vendor/x.js'    :  { 'exports': '$' },
      '../vendor/x-ui.js' :  { 'depends': { '../vendor/x.js': null } },
      '../vendor/y.js'    :  { 'exports': 'Y', 'depends': { '../vendor/x.js': '$' } },
      '../vendor/z.js'    :  { 'exports': 'zorro', 'depends': { '../vendor/x.js': '$', '../vendor/y.js': 'YNOT' } }
    }

    //上传到远程服务器任务
    gulp.task('upload', function () {
        return gulp.src('./build/**')
            .pipe($.sftp({
                host: config.sftp.host,
                user: config.sftp.user,
                port: config.sftp.port,
                key: config.sftp.key,
                remotePath: config.sftp.remotePath
            }));
    });


*/
