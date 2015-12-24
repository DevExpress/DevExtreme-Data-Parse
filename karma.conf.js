/* global process */
module.exports = function (config) {
    var isDebug = process.argv.some(function (x) {
        return x === "--debug";
    });

    var options = {
        basePath: "",

        frameworks: [
            "qunit"
        ],

        files: [
            "lib/sinon.js",
            "lib/jquery.js",
            "lib/globalize.js",
            "lib/parse-sdk.js",
            "lib/devextreme/dx.all.debug.js",

            "src/dx.data.parse.js",

            "tests/dx.data.query.parse.tests.js",
            "tests/dx.data.store.parse.tests.js"
        ],

        plugins: [
            "karma-qunit",
            "karma-coverage",
            "karma-junit-reporter",
            "karma-phantomjs-launcher"
        ],

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
    };

    if (!isDebug) {
        options.preprocessors = ["coverage"];
    }

    config.set(options);
};