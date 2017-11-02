var gulp = require("gulp"),
    plumber = require("gulp-plumber"),
    less = require("gulp-less"),
    sourceMaps = require("gulp-sourcemaps"),
    rename = require("gulp-rename")
    autoprefixer = require("gulp-autoprefixer"),
    browserSync = require("browser-sync"),
    uglify = require("gulp-uglify"),
    ts = require("gulp-typescript");
    del = require("del"),
    runSequence = require("run-sequence");


var config = {
    stylesDir: __dirname + "/styles",
    publicDir: __dirname + "/public",
    appDir: __dirname + "/app"
}

gulp.task("css", function() {
    gulp.src(config.stylesDir + "/index.less")
        .pipe(plumber())
        .pipe(sourceMaps.init())
        .pipe(less({ paths: [config.stylesDir]}))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
        }))
        .pipe(rename("style.css"))
        .pipe(sourceMaps.write("."))
        .pipe(gulp.dest(config.publicDir))
        .pipe(browserSync.stream());
});

gulp.task("compile-js", function() {
    console.log(config.appDir + "/application.ts");
    gulp.src(config.appDir + "/application.ts")
        .pipe(plumber())
        .pipe(ts({
            noImplicitAny: true,
            outFile: 'application.js'
        }))
        // .pipe(uglify())
        .pipe(gulp.dest(config.publicDir))
        .on('end', browserSync.reload);
});

gulp.task("server", function() {
    browserSync.init({
        server: {
            baseDir: "./public"
        }
    })
});

gulp.task("watch", function() {
    gulp.watch(config.stylesDir + "/*", ["css"]);
    gulp.watch(config.appDir + "/*", ["compile-js"]);
    gulp.watch(config.publicDir + "/*.html", browserSync.reload);
});

gulp.task("clear", function() {
    del(config.publicDir + "/*css*");
    del(config.publicDir + "/*.js");
})

gulp.task("build", function() {
    runSequence("clear", "css", "server", "compile-js", "watch");
})

gulp.task("default", ["build"]);