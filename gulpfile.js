/* global __dirname */
var gulp = require("gulp"),
    karma = require("karma"),
    bower = require("gulp-bower"),
    rename = require("gulp-rename"),
    concat = require("gulp-concat"),
    minify = require('gulp-minify'),
    ts = require("gulp-typescript");

var __bowerDir = "./bower_components";

var __srcDir = "./src";
var __typingsDir = "./typings";

var __libDir = "./lib";
var __todoLibDir = "./samples/todo/lib";
var __gridLibDir = "./samples/grid/lib";

function __applyInstallTask(options) {
    var promise = gulp.src(options.src);

    if (options.name)
        promise.pipe(rename(options.name));

    options.dests
        .forEach(function (dest) {
            promise.pipe(gulp.dest(dest));
        });

    return promise;
}

gulp.task("bower", function () {
    return bower(__bowerDir);
});

gulp.task("install:sinon", ["bower"], function () {
    return __applyInstallTask({
        src: __bowerDir + "/sinon/index.js",
        name: "sinon.js",
        dests: [__libDir]
    });
});

gulp.task("install:parse", ["bower"], function () {
    return __applyInstallTask({
        src: __bowerDir + "/parse/index.js",
        name: "parse-sdk.js",
        dests: [
            __libDir,
            __gridLibDir,
            __todoLibDir
        ]
    });
});

gulp.task("install:jquery", ["bower"], function () {
    return __applyInstallTask({
        src: __bowerDir + "/jquery/dist/jquery.js",
        dests: [
            __libDir,
            __gridLibDir,
            __todoLibDir
        ]
    });
});

gulp.task("install:knockout", ["bower"], function () {
    return __applyInstallTask({
        src: __bowerDir + "/knockout/dist/knockout.js",
        dests: [
            __gridLibDir,
            __todoLibDir
        ]
    });
});

gulp.task("install:globalize", ["bower"], function () {
    return __applyInstallTask({
        src: __bowerDir + "/globalize/lib/globalize.js",
        dests: [
            __libDir,
            __gridLibDir,
            __todoLibDir
        ]
    });
});

(function () {
    function combineDevExtremePath(basePath, tailPath) {
        return basePath + "/devextreme/" + (tailPath || "");
    }

    gulp.task("install:devextreme:parse", ["bower"], function () {
        return __applyInstallTask({
            src: "./src/*.js",
            dests: [
                combineDevExtremePath(__gridLibDir),
                combineDevExtremePath(__todoLibDir)
            ]
        });
    });

    gulp.task("install:devextreme:styles", ["bower"], function () {
        var outputPath = "/styles/";
        return __applyInstallTask({
            src: combineDevExtremePath(__bowerDir, "/css/**/*.*"),
            dests: [
                combineDevExtremePath(__gridLibDir, outputPath),
                combineDevExtremePath(__todoLibDir, outputPath)
            ]
        });
    });

    gulp.task("install:devextreme:scripts", ["bower"], function () {
        return __applyInstallTask({
            src: combineDevExtremePath(__bowerDir, "/js/dx.all.debug.js"),
            dests: [
                combineDevExtremePath(__libDir),
                combineDevExtremePath(__gridLibDir),
                combineDevExtremePath(__todoLibDir)
            ]
        });
    });

    gulp.task("install:devextreme:layouts", ["bower"], function () {
        var outputPath = "/layouts/";
        return __applyInstallTask({
            src: combineDevExtremePath(__bowerDir, "/layouts/**/*.*"),
            dests: [
                combineDevExtremePath(__gridLibDir, outputPath),
                combineDevExtremePath(__todoLibDir, outputPath)
            ]
        });
    });

    gulp.task("install:devextreme", [
        "bower",
        "install:devextreme:styles",
        "install:devextreme:scripts",
        "install:devextreme:layouts"
    ]);
})("DevExtreme");

gulp.task("install", [
    "bower",
    "install:sinon",
    "install:parse",
    "install:jquery",
    "install:knockout",
    "install:globalize",
    "install:devextreme",
    "install:devextreme:parse"
]);

gulp.task("typescript", ["install"], function () {
    return gulp.src([
        __typingsDir + "/**/*.d.ts",
        __srcDir + "/dx.data.parse.d.ts"
    ]).pipe(ts({ noImplicitAny: true }));
});

gulp.task("run-ci", ["install", "typescript"], function (done) {
    new karma.Server({
        singleRun: true,
        configFile: __dirname + "/karma.conf.js"
    }, done).start();
});