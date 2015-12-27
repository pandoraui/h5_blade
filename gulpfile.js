/**
 *  Starter Kit
 */

/**
npm install gulp gulp-load-plugins gulp-md5-plus del run-sequence browser-sync browserify watchify vinyl-source-stream vinyl-buffer gulp-sass gulp-cache gulp-rename gulp-autoprefixer gulp-size gulp-csso gulp-replace gulp-copy2  --save-dev
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
var isProduction = process.env.NODE_ENV === "production";

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
    fonts: appPath + 'dist/fonts',
    img: appPath + 'dist/img',
    css: ['src/styles/hsqapp.scss', appPath + 'scss/hsq.scss'],
    venders: appPath + 'venders',
    js: appPath + 'js',
  },
  dist: {
    base: appDist,
    fonts: appDist + 'assets/fonts',
    img: appDist + 'assets/img',
    css: appDist + 'assets/css',
    venders: appDist + 'assets/venders',
    js: appDist + 'assets/js',
  },
  quoteSrc: [appDist + 'index.html', appDist + 'debug.html',],//, 'dist/index.html.twig'
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
      {src: appPath + 'index.html', dest: appDist},
      {src: appPath + 'debug.html', dest: appDist},
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
    .pipe($.sass())
    .pipe($.autoprefixer({browsers: AUTOPREFIXER_BROWSERS}))
    .pipe(gulp.dest(paths.dist.css))
  );
  return !isProduction ? s : s.pipe($.csso())
    .pipe($.rename({suffix: '.min'}))
    .pipe(md5(10, paths.quoteSrc))
    .pipe(gulp.dest(paths.dist.css))
    .pipe($.size({title: 'styles'}));
});

// 打包 Common JS 模块
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
// if (!isProduction) {
//   b = watchify(b);
// }
//
// // 如果想把 React 打包进去，可以把下面一行注释掉
// b.transform('browserify-shim', {global: true});
//
//
// var bundle = function() {
//   var s = (
//     b.bundle()
//       .on('error', $.util.log.bind($.util, 'Browserify Error'))
//       .pipe(source('app.js'))
//       .pipe(buffer())
//       // .pipe($.sourcemaps.init())
//       // .pipe($.sourcemaps.write("."))
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
//     b.on('update', bundle).on('log', $.util.log);
//   }
//
//   return bundle();
// });

// 压缩 HTML
gulp.task('html', function () {
  return gulp.src('app/**/*.html')
    //.pipe($.minifyHtml())
    .pipe($.replace(/\{\{__VERSION__\}\}/g, isProduction ? '.min' : ''))
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'html'}));
});

// 洗刷刷
gulp.task('clean', function(cb) {
  return del([
    'dist/*',
    //'!dist/fonts',
    '!dist/venders',
    // '!dist/blade',
    '!dist/.git'
  ], {dot: true}, cb);
});

// 监视源文件变化自动cd编译
gulp.task('watch', function() {
  // gulp.watch(appPath + '/**/*.html', ['html']);
  gulp.watch('blade/**/*', ['copy']);
  gulp.watch(appPath + '/**/*', ['copy']);
  gulp.watch(appPath + '/scss/**/*.scss', ['styles']);
  gulp.watch('src/styles/**/*.scss', ['styles']);
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
});

// 默认任务
gulp.task('default', function (cb) {
  console.log('生产环境：' + isProduction);
  //runSequence('clean', ['styles', 'jshint', 'html', 'images', 'copy', 'browserify'], cb);
  runSequence('clean', ['copy', 'styles'], cb);
  // runSequence('clean', ['styles', 'html', 'images', 'copy', 'browserify'], cb);
});


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
