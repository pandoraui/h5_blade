/**
 *  Starter Kit
 */

/**
npm install gulp gulp-load-plugins gulp-md5-plus del run-sequence browser-sync browserify watchify vinyl-source-stream vinyl-buffer gulp-sass gulp-cache gulp-rename gulp-autoprefixer gulp-size gulp-csso gulp-replace gulp-copy2  --save-dev

npm install fs gulp-concat gulp-jshint jshint-stylish gulp-amd-optimizer gulp-uglify --save-dev

npm install gulp-shell gulp-git gulp-gh-pages lodash gulp-qndn --save-dev

*/

'use strict';

var gulp = require('gulp');
var copy2 = require('gulp-copy2');
var $ = require('gulp-load-plugins')();
var md5 = require('gulp-md5-plus');
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

// var git = require("gulp-git");
var fs = require('fs');
var _ = require('lodash');
// var concat = require('gulp-concat');
// var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
// var amdOptimize = require('gulp-amd-optimizer');
var amdOptimize = require('amd-optimize');
var requirejsOptimize = require('gulp-requirejs-optimize');
var minifyCss = require('gulp-minify-css');


var isProduction = process.env.NODE_ENV === "production";

var requireConfig = require('./blade/gulpcfg').requirejs;
var hsqjsConfig = require('./hsq/gulpcfg');

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

//七牛存储

// upload docs assets to Qiniu
// 配置应该可以，一个配置使用多个对应，如图片以及 js、css 对应关系
var hsqQnConfig = require('./qnConfig').hsq;
var qnOptions = {
  accessKey: hsqQnConfig.qnAK,
  secretKey: hsqQnConfig.qnSK,
  bucket: hsqQnConfig.qnBucketUIS,
  origin: hsqQnConfig.qnDomainUIS
};

var appPath = 'hsq/';
var appDist = 'dist/';
var paths = {
  entry: {
    html: [
      appPath + 'index.html',
      appPath + 'zhuti/*.html',
    ],
    fonts: appPath + 'dist/fonts',
    img: appPath + 'dist/img',
    // css: [styleThemes + 'hsq/hsqapp.scss', appPath + 'scss/hsq.scss'],
    css: ['src/styles/hsqapp.scss', appPath + 'scss/hsq.scss'],
    venders: appPath + 'venders',
    jsfiles: [
      // './blade/libs/*.js',
      './blade/libs/require.js',
      './blade/libs/zepto.js',
      './blade/libs/underscore.js',
      // './blade/libs/require.text.js',
      './blade/libs/zepto-adapter.js',
      './blade/libs/zepto-stack.js',

      './blade/libs/backbone.js',
      // './blade/libs/underscore.extend.js',
      './blade/libs/fastclick.js',
      './blade/common.js',
    ],
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
      // {src: '.gitignore', dest: appDist},
      {src: appPath + 'd.html', dest: appDist},
      {src: appPath + 'help.html', dest: appDist},
      {src: appPath + 'jump.html', dest: appDist},
      {src: appPath + 'main.js', dest: appDist},
      {src: appPath + 'favicon.*', dest: appDist},
      {src: appPath + 'images/*', dest: appDist + 'images/'},
      {src: appPath + 'img/*', dest: appDist + 'assets/img/'},
      {src: appPath + 'zhuti/*', dest: appDist + 'zhuti/'},
      {src: appPath + 'ex_mvc/*', dest: appDist + 'ex_mvc/'},
      {src: appPath + 'common/*', dest: appDist + 'common/'},
      {src: appPath + 'views/*', dest: appDist + 'views/'},
      {src: appPath + 'model/*', dest: appDist + 'model/'},
  ];
  return copy2(copyPaths);
});

// 编译 SCSS，添加浏览器前缀
gulp.task('styles', function () {
  var s = (
    gulp.src(paths.entry.css)
    .pipe( $.if(!isProduction, $.sourcemaps.init() ) )
    //.pipe($.plumber())  //自动处理全部错误信息防止因为错误而导致 watch 不正常工作
    .pipe($.sass())
    .pipe($.autoprefixer({browsers: AUTOPREFIXER_BROWSERS}))
    .pipe( $.if(!isProduction, $.sourcemaps.write() ) )
    .pipe(gulp.dest(paths.dist.css))
  );
  return !isProduction ? s : s
  // 这个 csso 压缩 css 出问题了，莫名的问题，到时 swiper  组件在部分浏览器下出 bug
  // 因为 csso 把老代码干掉了(但传入空对象参数，就 OK 了，奇怪？？，具体参数觉得应该是property，重复的属性是否合并)
  // 如.swiper-wrapper: display: flex; 由autoprefixer 转化的 display: -webkit-box;给删除了，手动书写的，也会删除
    .pipe($.csso({}))
    // .pipe(minifyCss())
    .pipe($.rename({suffix: '.min'}))
    .pipe(md5(10, paths.quoteSrc))
    .pipe(gulp.dest(paths.dist.css))
    .pipe($.size({title: 'styles'}));
});

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
// var jsFiles = './blade/**.js';
var jsFiles = './blade/common.js';
// var requireConfig = require('./blade/common');
// console.log(libsConfig)

gulp.task('blade', function () {
  var s = (gulp.src(jsFiles)
      // gulp.src('src/*.js', {base: requireConfig.baseUrl})
      // .pipe(tap(function (file, t){
      //     addJSIndent (file, t);
      // }))
      // .pipe($.jshint())
      // .pipe($.jshint.reporter(stylish)) //'default'
      // .pipe($.sourcemaps.init())
      // .pipe(amdOptimize(requireConfig, options))
      // .pipe(amdOptimize('common', bladeConfig))
      .pipe(requirejsOptimize(bladeConfig))
      //注意要用;间隔一下，不然闭包成()()()之类的，会报错？？？
      .pipe($.concat('blade.js', {newLine: ';'}))  //合并成为一个文件，顺序从前到后，
      // .pipe($.header(f7.banner, { pkg : f7.pkg, date: f7.date } ))
      // .pipe($.sourcemaps.write())
      .pipe(gulp.dest(paths.dist.js))
      .pipe($.size({title: 'blade'}))
    );
    // .pipe(connectReload)
    // .on('end', function () {
    //     cb();
    // }));

  return !isProduction ? s : s//.pipe($.uglify())
      .pipe($.rename({suffix: '.min'}))
      .pipe(md5(10, paths.quoteSrc))
      .pipe(gulp.dest(paths.dist.js))
      .pipe($.size({
        title: 'blade minify'
      }));
});


// hsqjsConfig.paths = _.extend({}, hsqjsConfig.paths, bladeConfig.paths );
// 打包 hsqjs 时，需要依赖 blade 的模块，提示找不到？怎么办，暂时先把 blade 的 config 引入进来，这样 paths中就有了
for(var key in bladeConfig.paths){
  hsqjsConfig.paths[key] =  ('../blade/' + bladeConfig.paths[key]);
}

hsqjsConfig.exclude = bladeConfig.include;

hsqjsConfig.exclude.forEach(function(item, i){
  if( /^text!/.test(item) ){
    hsqjsConfig.exclude[i] = hsqjsConfig.exclude[i].replace(/text!(.*)/g, 'text!../blade/$1');
  }
});

gulp.task('hsqjs', function () {
  var s = (gulp.src('./hsq/main.js')
      // gulp.src('src/*.js', {base: requireConfig.baseUrl})
      // .pipe(tap(function (file, t){
      //     addJSIndent (file, t);
      // }))
      // .pipe($.jshint())
      // .pipe($.jshint.reporter(stylish)) //'default'
      // .pipe($.sourcemaps.init())
      // .pipe(amdOptimize(requireConfig, options))
      // .pipe(amdOptimize('common', bladeConfig))
      .pipe(requirejsOptimize(hsqjsConfig))
      // .pipe(requirejsOptimize({
      //   baseUrl: "./hsq/",
      //   dir: "../dist/assets/js/",
      //   optimize: "uglify",
      //   // optimizeCss: "standard.keepLines",
      //   mainConfigFile: "./hsq/main.js",
      //   // removeCombined: true,
      //   fileExclusionRegExp: /^\./,
      //   shim: {},
      //   paths: {},
      //   modules: [],
      //   include: [],
      //   exclude: [],
      // }))
      //注意要用;间隔一下，不然闭包成()()()之类的，会报错？？？
      .pipe($.concat('hsq.js', {newLine: ';'}))  //合并成为一个文件，顺序从前到后，
      // .pipe($.header(f7.banner, { pkg : f7.pkg, date: f7.date } ))
      // .pipe($.sourcemaps.write())
      .pipe(gulp.dest(paths.dist.js))
      .pipe($.size({title: 'hsq:js'}))
    );
    // .pipe(connectReload)
    // .on('end', function () {
    //     cb();
    // }));

  return !isProduction ? s : s //.pipe($.uglify())
      .pipe($.replace(/\\n\s*/g, '')) //TODO：还可以去掉 html 注释等
      .pipe($.rename({suffix: '.min'}))
      .pipe(md5(10, paths.quoteSrc))
      .pipe(gulp.dest(paths.dist.js))
      .pipe($.size({
        title: 'hsq:js minify'
      }));
});

// 编译 JS
gulp.task('libs', ['copy', 'html'], function () {
  var s = (gulp.src(paths.entry.jsfiles)
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
      // .pipe($.replace(/\\n\s*/g, ''))  //这里放开会报错
      .pipe($.rename({suffix: '.min'}))
      .pipe(md5(10, paths.quoteSrc))
      .pipe(gulp.dest(paths.dist.js))
      .pipe($.size({
        title: 'libs minify'
      }));
});

// 压缩 HTML
var isUsingQn = false;
gulp.task('html', function () {
  return gulp.src(paths.entry.html)
    //.pipe($.minifyHtml())
    .pipe($.replace(/\{\{__VERSION__\}\}/g, isProduction ? '.min' : ''))
    .pipe($.replace(/\{\{__DOMAIN__\}\}/g, isUsingQn ? qnOptions.origin : ''))
    .pipe(gulp.dest(paths.dist.html))
    .pipe($.size({title: 'html'}));
});

// 洗刷刷
gulp.task('clean:dev', function(cb) {
  return del([
    'dist/*',
    //'!dist/fonts',
    '!dist/venders',
    // '!dist/assets/js/libs.js',
    '!dist/assets',
    // '!dist/blade/libs/*.min_*',
  ], {dot: true}, cb);
});
gulp.task('clean', function(cb) {
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
gulp.task('serve', ['watch'], function () {
  browserSync({
    // port: 80, //默认3000
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
    logPrefix: 'happyCoding',
    server: 'dist'
  });

  gulp.watch(['dist/**/*'], reload);
  gulp.watch(['blade/**/*'], reload);
  // gulp.watch(['app/scss/*.scss'], {cwd: 'app'}, ['sass']);
});
gulp.task('dev', ['default'], function (cb) {
  runSequence('serve', cb);
});

// gulp.task('sass', function() {
//   return sass('scss/styles.scss')
//     .pipe(gulp.dest('app/css'))
//     .pipe(reload({ stream:true }));
// });
gulp.task('scripts', function (cb) {
  runSequence('libs', 'blade', 'hsqjs', cb);
  // runSequence('libs', 'blade', cb);
});


// 默认任务
gulp.task('default', function (cb) {
  isUsingQn = false;
  console.log('生产环境：' + isProduction);
  runSequence('clean', ['copy', 'html', 'styles', 'scripts'], cb);
});
gulp.task('qn:tasks', function (cb) {
  isUsingQn = true;
  console.log('生产环境：' + isProduction);
  runSequence('clean', ['copy', 'html', 'styles', 'scripts'], 'qn', cb);
});

gulp.task('qn', function() {
  gulp.src([
    "dist/assets/**/*",
    "!dist/*.html",
  ]).pipe($.qndn.upload({
      prefix: 'assets/',
      qn: qnOptions
    }));
});
