'use strict';

const gulp   = require('gulp');
const insert = require('gulp-insert');
const fs     = require('fs');
const exec   = require('child_process').exec;

// Lê o conteúdo do arquivo de remapeamento
const remap = fs.readFileSync('src/common/src/cordova-remap.js', 'utf-8');

// Função auxiliar para chamar o webpack com uma determinada configuração
function webpackTask(config, callback) {
  exec(__dirname + '/node_modules/.bin/webpack --config ' + config, (error, stdout, stderr) => {
    console.log(stdout);
    console.log(stderr);
    callback(error);
  });
}

// Tarefa "prepack"
function prepack(cb) {
  webpackTask('webpack.prepack.config.js', cb);
}

// Tarefa "webpack-cordova" que depende de "prepack"
function webpackCordova(cb) {
  webpackTask('webpack.cordova.config.js', cb);
}
const webpackCordovaSeries = gulp.series(prepack, webpackCordova);

// Tarefa "dist" que depende de "prepack"
function dist(cb) {
  webpackTask('webpack.library.config.js', cb);
}
const distSeries = gulp.series(prepack, dist);

// Tarefa "remap" que depende de "webpack-cordova"
function remapTask() {
  return gulp.src(['dist/plugin.min.js', 'dist/www.min.js'])
    .pipe(insert.prepend(remap))
    .pipe(gulp.dest('dist'));
}
const remapSeries = gulp.series(webpackCordovaSeries, remapTask);

// Tarefa "plugin" que depende de "remap"
function pluginTask() {
  return gulp.src(['dist/plugin.min.js'])
    .pipe(gulp.dest('src/browser'));
}
const pluginSeries = gulp.series(remapSeries, pluginTask);

// Tarefa "www" que depende de "remap"
function wwwTask() {
  return gulp.src(['dist/www.min.js'])
    .pipe(gulp.dest('www'));
}
const wwwSeries = gulp.series(remapSeries, wwwTask);

// Tarefa "default": executa em paralelo "dist", "plugin" e "www"
const defaultTask = gulp.parallel(distSeries, pluginSeries, wwwSeries);

// Registra as tarefas no gulp
gulp.task('prepack', prepack);
gulp.task('webpack-cordova', webpackCordovaSeries);
gulp.task('dist', distSeries);
gulp.task('remap', remapSeries);
gulp.task('plugin', pluginSeries);
gulp.task('www', wwwSeries);
gulp.task('default', defaultTask);

// Exporta a tarefa default
exports.default = defaultTask;
