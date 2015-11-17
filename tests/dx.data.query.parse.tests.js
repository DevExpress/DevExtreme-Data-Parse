(function ($, DX, undefined) {
    var NO_PASARAN_MESSAGE = "Shouldn't reach this point";

    var CLASS_NAME_STUB = "OBJECT";
    var APP_ID_STUB = "APPLICATION_ID";
    var JS_KEY_STUB = "JAVASCRIPT_KEY";

    var HTTP_STATUSES = {
        OK: 200,
        ACCEPTED: 202,
        NOT_FOUND: 404,
        SERVER_UNAVAIBLE: 500
    };

    var HTTP_RESPONSE_HEADERS = { "Content-Type": "application/json" };

    function normalizeParseRequestBody(requestBody) {
        var ret = $.parseJSON(requestBody);

        delete ret._ApplicationId;
        delete ret._JavaScriptKey;
        delete ret._ClientVersion;
        delete ret._InstallationId;
        delete ret._method;

        return ret;
    }

    function createParseQuery(options) {
        return DX.data.query(null, $.extend({
            adapter: "parse",
            className: CLASS_NAME_STUB
        }, options));
    }

    function setupXhrMock() {
        this.server = sinon.fakeServer.create({
            respondImmediately: true
        });

        Parse.CoreManager
            .getRESTController()
            ._setXHR(XMLHttpRequest);
    }

    function teardownXhrMock() {
        this.server.restore();

        Parse.CoreManager
            .getRESTController()
            ._setXHR(XMLHttpRequest);
    }

    if (!("Parse" in window))
        throw new Error("Parse JavaScript SDK is required");

    Parse.initialize(APP_ID_STUB, JS_KEY_STUB);

    QUnit.module("[Query:tests]", {
        beforeEach: setupXhrMock,
        afterEach: teardownXhrMock
    });

    QUnit.test("works", 2, function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedUrl = decodeURIComponent(request.url),
                requestBody = $.parseJSON(request.requestBody);

            assert.equal(normalizedUrl, Parse.serverURL + "/1/classes/" + CLASS_NAME_STUB);

            assert.deepEqual(requestBody, {
                _ApplicationId: APP_ID_STUB,
                _JavaScriptKey: JS_KEY_STUB,
                _ClientVersion: "js" + Parse.CoreManager.get("VERSION"),
                _InstallationId: function () {
                    var id = null;

                    // NOTE: It's synchronous operation
                    Parse.CoreManager.getInstallationController()
                        .currentInstallationId()
                        .done(function (result) { id = result; })
                        .fail(function () {
                            assert.ok(false, NO_PASARAN_MESSAGE);
                            done();
                        });

                    return id;
                } (),
                _method: "GET",
                where: {}
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: []
                }));
        });

        createParseQuery()
            .enumerate()
            .always(done);
    });

    QUnit.test("normalizeResponse: true", 8, function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: [{
                        objectId: "keyValue",
                        createdAt: "2014-10-20T18:22:40.361Z",
                        updatedAt: "2015-10-20T18:23:40.361Z",
                        geo: {
                            "__type": "GeoPoint",
                            "latitude": 64.0,
                            "longitude": 177.0
                        },
                        array: [1, 2, 3],
                        object: { "foo": "bar" },
                        pointer: {
                            "__type": "Object",
                            "className": "Another",
                            "objectId": "keyValue",
                            "createdAt": "2014-10-20T18:22:40.361Z",
                            "updatedAt": "2015-10-20T18:23:40.361Z",
                            "foo": 1
                        },
                        relation: {
                            "__type": "Relation",
                            "className": "Related"
                        }
                    }]
                }));
        });

        createParseQuery({ normalizeResponse: true })
            .enumerate()
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (results) {
                var actual = results[0];

                assert.equal(actual.id, "keyValue");
                assert.deepEqual(actual.createdAt, new Date("2014-10-20T18:22:40.361Z"));
                assert.deepEqual(actual.updatedAt, new Date("2015-10-20T18:23:40.361Z"));
                assert.ok(actual.geo instanceof Parse.GeoPoint);
                assert.deepEqual(actual.array, [
                    1,
                    2,
                    3
                ]);
                assert.deepEqual(actual.object, {
                    foo: "bar"
                });
                assert.deepEqual(actual.pointer, {
                    id: "keyValue",
                    createdAt: new Date("2014-10-20T18:22:40.361Z"),
                    updatedAt: new Date("2015-10-20T18:23:40.361Z"),
                    foo: 1
                });
                assert.ok(actual.relation instanceof Parse.Relation);
            })
            .always(done);
    });

    QUnit.test("normalizeResponse: false", 1, function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: [{ foo: 1 }]
                }));
        });

        createParseQuery({ normalizeResponse: false })
            .enumerate()
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (results) {
                assert.ok(results.shift() instanceof Parse.Object);
            })
            .always(done);
    });

    QUnit.test("sortBy: descending", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: {},
                order: "-foo"
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: []
                }));
        });

        createParseQuery()
            .sortBy("foo", true)
            .enumerate()
            .always(done);
    });

    QUnit.test("sortBy: ascending", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: {},
                order: "-foo"
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: []
                }));
        });

        createParseQuery()
            .sortBy("foo", true)
            .enumerate()
            .always(done);
    });

    QUnit.test("thenBy", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: {},
                order: "-foo,bar"
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: []
                }));
        });

        createParseQuery()
            .sortBy("foo", true)
            .thenBy("bar")
            .enumerate()
            .always(done);
    });

    QUnit.test("slice", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: {},
                skip: 15,
                limit: 51
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: []
                }));
        });

        createParseQuery()
            .slice(15, 51)
            .enumerate()
            .always(done);
    });

    QUnit.test("select: one", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: {},
                keys: "foo"
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: []
                }));
        });

        createParseQuery()
            .select("foo")
            .enumerate()
            .always(done);
    });

    QUnit.test("select: many", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: {},
                keys: "foo,bar"
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: []
                }));
        });

        $.when.apply($, [
            createParseQuery()
                .select("foo", "bar")
                .enumerate(),

            createParseQuery()
                .select(["foo", "bar"])
                .enumerate()
        ]).fail(function () { assert.ok(false, NO_PASARAN_MESSAGE); }).done(done);
    });

    QUnit.test("include", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: {},
                include: "Pointer,Pointer.AnotherPointer"
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: []
                }));
        });

        createParseQuery({ include: ["Pointer", "Pointer.AnotherPointer"] })
            .enumerate()
            .always(done);
    });

    QUnit.test("filter: one criterion", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: { bool: true }
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: []
                }));
        });

        createParseQuery()
            .filter("bool", true)
            .enumerate()
            .always(done);
    });

    QUnit.test("filter: AND condition", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: { bool: true, anotherBool: false }
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: []
                }));
        });

        $.when.apply($, [
            createParseQuery()
                .filter("bool", true)
                .filter("anotherBool", false)
                .enumerate(),

            createParseQuery()
                .filter([["bool", true], ["anotherBool", false]])
                .enumerate(),

            createParseQuery()
                .filter([["bool", true], "and", ["anotherBool", false]])
                .enumerate()
        ]).fail(function () { assert.ok(false, NO_PASARAN_MESSAGE); }).done(done);
    });

    QUnit.test("filter: OR condition", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: { $or: [{ prop: 1 }, { prop: 2 }, { prop: 3 }] }
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: []
                }));
        });

        createParseQuery()
            .filter([
                ["prop", 1],
                "or",
                ["prop", 2],
                "or",
                ["prop", 3]
            ])
            .enumerate()
            .always(done);
    });

    QUnit.test("filter: OR and AND condition", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: {
                    foo: "bar",
                    bar: { $ne: "foo" },
                    $or: [
                        { buz: 1 },
                        { buz: 2 },
                        { buz: 3 }
                    ]
                }
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: []
                }));
        });

        createParseQuery()
            .filter([
                ["foo", "=", "bar"],
                ["bar", "<>", "foo"],
                [
                    ["buz", 1],
                    "or",
                    ["buz", 2],
                    "or",
                    ["buz", 3]
                ]
            ])
            .enumerate()
            .always(done);
    });

    QUnit.test("filter: all operations", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: {
                    prop1: true,
                    prop2: false,
                    prop3: true,
                    prop4: { $ne: true },
                    prop5: { $lt: 1 },
                    prop6: { $gt: 1 },
                    prop7: { $lte: 1 },
                    prop8: { $gte: 1 },
                    prop9: { $regex: "\\Qbar\\E$" },
                    prop10: { $regex: "^\\Qbar\\E" },
                    prop11: { $regex: "\\Qbar\\E" },

                    // NOTE: Fat
                    prop12: {
                        $notInQuery: {
                            className: CLASS_NAME_STUB,
                            where: { prop12: { $regex: "\\Qbar\\E" } }
                        }
                    }
                }
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: []
                }));
        });

        createParseQuery()
            .filter([
                ["prop1"],
                ["prop2", false],
                ["prop3", "=", true],
                ["prop4", "<>", true],
                ["prop5", "<", 1],
                ["prop6", ">", 1],
                ["prop7", "<=", 1],
                ["prop8", ">=", 1],
                ["prop9", "endswith", "bar"],
                ["prop10", "startswith", "bar"],
                ["prop11", "contains", "bar"],
                ["prop12", "notcontains", "bar"]
            ])
            .enumerate()
            .always(done);
    });

    QUnit.test("filter: mixing of AND/OR is not allowed inside a single group", 4, function (assert) {
        this.server.respondWith(function (request) {
            assert.ok(false, NO_PASARAN_MESSAGE);
        });

        function check(filterValue) {
            return createParseQuery()
                .filter(filterValue)
                .enumerate()
                .done(function () {
                    assert.ok(false, NO_PASARAN_MESSAGE);
                })
                .fail(function () {
                    assert.ok(true);
                });
        }

        check([
            ["foo"],
            ["bar"],
            "or",
            ["foobar"]
        ]);

        check([
            ["foo"],
            "&&",
            ["bar"],
            "||",
            ["foobar"]
        ]);

        check([
            ["foo"],
            "or",
            ["bar"],
            ["foobar"]
        ]);

        check([
            ["foo"],
            "or",
            ["bar"],
            "and",
            ["foobar"]
        ]);
    });

    QUnit.test("count", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                count: 1,
                limit: 0,
                where: { foo: true }
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    count: 42
                }));
        });

        createParseQuery()
            .sortBy("foo")
            .filter("foo")
            .slice(1, 2)
            .count()
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (count) {
                assert.equal(count, 42);
            })
            .always(done);
    });

    QUnit.test("client fallbacks: functional sort", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: {}
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: [
                        { foo: 2, objectId: "key#1", createdAt: "2014-10-20T18:22:40.361Z", updatedAt: "2015-10-20T18:22:40.361Z" },
                        { foo: 1, objectId: "key#2", createdAt: "2014-10-20T18:22:40.361Z", updatedAt: "2015-10-20T18:22:40.361Z" },
                    ]
                }));
        });

        createParseQuery()
            .sortBy(function (i) {
                return i["foo"];
            })
            .enumerate()
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (results) {
                assert.equal(results[0].foo, 1);
                assert.equal(results[1].foo, 2);
            })
            .always(done);
    });

    QUnit.test("client fallbacks: sort after slice", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: {},
                limit: 1,
                skip: 1
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: [
                        { foo: 1 }
                    ]
                }));
        });

        createParseQuery()
            .slice(1, 1)
            .sortBy("foo")
            .enumerate()
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (results) {
                assert.equal(results.length, 1);
                assert.equal(results[0].foo, 1);
            })
            .always(done);
    });

    QUnit.test("client fallbacks: functional filter", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: {}
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: [
                        { foo: 2 },
                        { foo: 1 }
                    ]
                }));
        });

        createParseQuery()
            .filter(function (i) {
                return i["foo"] < 2;
            })
            .enumerate()
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (results) {
                assert.equal(results.length, 1);
                assert.equal(results[0].foo, 1);
            })
            .always(done);
    });

    QUnit.test("client fallbacks: functional selector", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: {}
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: [
                        { foo: 2 },
                        { foo: 1 }
                    ]
                }));
        });

        createParseQuery()
            .select(function (i) {
                return i["foo"];
            })
            .enumerate()
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (results) {
                assert.deepEqual(results, [2, 1]);
            })
            .always(done);
    });

    QUnit.test("client fallbacks: slice after slice", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: {},
                skip: 1,
                limit: 3
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: [{ name: "foo" }, { name: "bar" }, { name: "foobar" }]
                }));
        });

        createParseQuery()
            .slice(1, 3)
            .slice(1, 1)
            .enumerate()
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (results, extra) {
                assert.equal(results.length, 1);
                assert.equal(results[0].name, "bar");
            })
            .always(done);
    });

    QUnit.test("client fallbacks: selector after selector", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: {},
                keys: "foo,bar"
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: [
                        { foo: 2, bar: 1 },
                        { foo: 1, bar: 1 }
                    ]
                }));
        });

        createParseQuery()
            .select("foo", "bar")
            .select("foo")
            .enumerate()
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (results) {
                assert.deepEqual(results, [
                    { foo: 2 },
                    { foo: 1 }
                ]);
            })
            .always(done);
    });

    QUnit.test("client fallbacks: filter after slice", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: {},
                limit: 2
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: [
                        { foo: 2, bar: 1 },
                        { foo: 1, bar: 1 }
                    ]
                }));
        });

        createParseQuery()
            .slice(0, 2)
            .filter(["foo", "<>", 2])
            .enumerate()
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (results) {
                assert.equal(results.length, 1);
                assert.equal(results[0].foo, 1);
                assert.equal(results[0].bar, 1);
            })
            .always(done);
    });

    QUnit.test("client fallbacks: groupBy", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: {}
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: [
                        { foo: 2, bar: 1 },
                        { foo: 1, bar: 1 }
                    ]
                }));
        });

        createParseQuery()
            .groupBy("foo")
            .enumerate()
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (results) {
                assert.equal(results.length, 2);

                assert.equal(results[0].key, 2);
                assert.equal(results[0].items.length, 1);
                assert.equal(results[0].items[0].foo, 2);
                assert.equal(results[0].items[0].bar, 1);

                assert.equal(results[1].key, 1);
                assert.equal(results[1].items.length, 1);
                assert.equal(results[1].items[0].foo, 1);
                assert.equal(results[1].items[0].bar, 1);
            })
            .always(done);
    });

    QUnit.test("client fallbacks: aggregate", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                where: {}
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: [
                        { foo: 2, bar: 1 },
                        { foo: 1, bar: 1 }
                    ]
                }));
        });

        $.when(
            createParseQuery()
                .max("foo")
                .done(function (result) { assert.equal(result, 2) }),

            createParseQuery()
                .min("foo")
                .done(function (result) { assert.equal(result, 1); }),

            createParseQuery()
                .sum("foo")
                .done(function (result) { assert.equal(result, 3); }),

            createParseQuery()
                .avg("foo")
                .done(function (result) { assert.equal(result, 1.5); }),

            createParseQuery()
                .aggregate(
                    [],
                    function (accumulator, i) { return accumulator.concat([i.foo]) },
                    function (accumulator) { return accumulator.join(); }
                )
                .done(function (result) { assert.equal(result, "2,1"); })

            ).fail(function () { assert.ok(false, NO_PASARAN_MESSAGE); }).always(done);
    });

    QUnit.test("error handling", function (assert) {
        var done = assert.async();

        var log = [];
        var attempts = Parse.CoreManager.get("REQUEST_ATTEMPT_LIMIT");

        function createErrorHandler(name) {
            return function () {
                log.push(name);
                assert.equal(arguments.length, 1);
                assert.ok(arguments[0] instanceof Error);
            };
        }

        Parse.CoreManager.set("REQUEST_ATTEMPT_LIMIT", 1);
        DX.data.errorHandler = createErrorHandler("global");

        this.server.respondWith(function (request) {
            request.respond(
                HTTP_STATUSES.SERVER_UNAVAIBLE,
                HTTP_RESPONSE_HEADERS,
                ""
                );
        });

        createParseQuery({ errorHandler: createErrorHandler("optional") })
            .enumerate()
            .done(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .fail(createErrorHandler("direct"))
            .fail(function () {
                assert.deepEqual(log, ["optional", "global", "direct"]);
            })
            .always(function () {
                DX.data.errorHandler = null;
                Parse.CoreManager.set("REQUEST_ATTEMPT_LIMIT", attempts);
            })
            .always(done);
    });

})(jQuery, DevExpress);