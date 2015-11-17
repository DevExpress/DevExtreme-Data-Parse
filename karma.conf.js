/* global process */
module.exports = function (config) {
    var isDebug = process.argv.some(function (x) {
        return x === "--debug";
    });

    var files,
        preprocessors;

    if (isDebug) {
        files = [
            "lib/sinon.js",
            "lib/jquery.js",
            "lib/globalize.js",
            "lib/parse-sdk.js",
            "lib/devextreme/dx.all.debug.js",

            "dist/dx.data.parse.js",

            "tests/dx.data.query.parse.tests.js",
            "tests/dx.data.store.parse.tests.js"
        ];

        preprocessors = [];
    }
    else {
        files = [
            "lib/sinon.js",
            "lib/jquery.js",
            "lib/globalize.js",
            "lib/parse-sdk.js",
            "lib/devextreme/dx.all.debug.js",

            "dist/dx.data.parse-min.js",

            "tests/dx.data.query.parse.tests.js",
            "tests/dx.data.store.parse.tests.js"
        ];

        preprocessors = ["coverage"];
    }

    config.set({
        basePath: "",

        frameworks: [
            "qunit"
        ],

        files: files,

        plugins: [
            "karma-qunit",
            "karma-coverage",
            "karma-junit-reporter",
            "karma-phantomjs-launcher"
        ],

        preprocessors: preprocessors,

        reporters: [
            "coverage",
            "progress",
            "junit",
            "dots"
        ],

        junitReporter: {
            outputDir: "shippable/testresults/",
            outputFile: "test-results.xml"
        },

        coverageReporter: {
            type: "cobertura",
            dir: "shippable/codecoverage/"
        },

        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ["PhantomJS"],
        singleRun: true
    });
};