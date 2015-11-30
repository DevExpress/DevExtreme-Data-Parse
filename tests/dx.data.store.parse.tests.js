(function ($, DX, undefined) {
    var dataNs = DX.data;
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

    function createParseStore(options) {
        return new dataNs.ParseStore($.extend({
            className: CLASS_NAME_STUB,
            normalizeResponse: true
        }, options || {}));
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

    QUnit.module("[Store:tests]", {
        beforeEach: setupXhrMock,
        afterEach: teardownXhrMock
    });

    QUnit.test("ctor", function (assert) {
        var store = createParseStore();

        assert.equal(store.key(), "id");
        assert.equal(store.keyOf({ id: "value" }), "value");

        assert.equal(store.className(), CLASS_NAME_STUB);
        assert.equal(store.normalizationEnabled(), true);
    });

    QUnit.test("load", function (assert) {
        var done = assert.async();

        this.server.respondWith([
            HTTP_STATUSES.OK,
            HTTP_RESPONSE_HEADERS,
            JSON.stringify({
                results: [{ foo: 1 }, { foo: 2 }]
            })
        ]);

        createParseStore()
            .load()
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (results) {
                assert.equal(results.length, 2);
                assert.equal(results[0].foo, 1);
                assert.equal(results[1].foo, 2);
            })
            .always(done);
    });

    QUnit.test("load: with options", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                include: "bar",
                order: "-foo",
                keys: "foo",
                where: {
                    foo: { $gt: 0 }
                },

            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: [{ foo: 1, bar: {} }, { foo: 2, bar: {} }]
                }));

        });

        createParseStore()
            .load({
                sort: {
                    field: "foo",
                    desc: true
                },
                filter: [
                    "foo",
                    ">",
                    0
                ],
                include: [
                    "bar"
                ],
                select: [
                    "foo"
                ]
            })
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (results) {
                assert.equal(results.length, 2);

                assert.equal(results[0].foo, 1);
                assert.deepEqual(results[0].bar, {});

                assert.equal(results[1].foo, 2);
                assert.deepEqual(results[1].bar, {});
            })
            .always(done);
    });

    QUnit.test("totalCount", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                count: 1,
                limit: 0,
                where: {}
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    count: 42
                }));

        });

        createParseStore()
            .totalCount()
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (count) {
                assert.equal(count, 42);
            })
            .always(done);
    });

    QUnit.test("totalCount: with options", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                count: 1,
                limit: 0,
                where: {
                    foo: true
                }
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    count: 42
                }));
        });

        createParseStore()
            .totalCount({ filter: ["foo"] })
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (count) {
                assert.equal(count, 42);
            })
            .always(done);
    });

    QUnit.test("byKey", function (assert) {
        var done = assert.async();

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                limit: 1,
                where: { objectId: "keyValue" }
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    results: [{ foo: 1 }]
                }));
        });

        createParseStore()
            .byKey("keyValue")
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (obj) {
                assert.equal(obj.foo, 1);
            })
            .always(done);
    });

    QUnit.test("byKey: without normalization", function (assert) {
        var done = assert.async();

        this.server.respondWith([
            HTTP_STATUSES.OK,
            HTTP_RESPONSE_HEADERS,
            JSON.stringify({
                results: [{ foo: 1 }]
            })
        ]);

        createParseStore({ normalizeResponse: false })
            .byKey("keyValue")
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (obj) {
                assert.ok(obj instanceof Parse.Object);
            })
            .always(done);
    });

    QUnit.test("update", function (assert) {
        var done = assert.async(),
            counter = 0, // 1 - byKey request, 2 - update request
            _values = { foo: 1 },
            _keyValue = "key";

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            if (++counter > 2)
                assert.ok(false, NO_PASARAN_MESSAGE);

            if (counter == 1) {

                assert.deepEqual(normalizedBody, {
                    limit: 1,
                    where: { objectId: _keyValue }
                });

                request.respond(
                    HTTP_STATUSES.OK,
                    HTTP_RESPONSE_HEADERS,
                    JSON.stringify({
                        results: [{ foo: 1 }]
                    }));
            }
            else {
                assert.deepEqual(normalizedBody, _values);

                request.respond(
                    HTTP_STATUSES.OK,
                    HTTP_RESPONSE_HEADERS,
                    JSON.stringify({
                        updatedAt: new Date().toISOString()
                    }));
            }
        });

        createParseStore()
            .update(_keyValue, _values)
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (key, values) {
                assert.equal(key, _keyValue);
                assert.deepEqual(values, _values);
            })
            .always(done);
    });

    QUnit.test("update: with ACL", function (assert) {
        var done = assert.async(),
            counter = 0, // 1 - byKey request, 2 - update request
            _values = { foo: 1, ACL: new Parse.ACL() },
            _keyValue = "key";

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            if (++counter > 2)
                assert.ok(false, NO_PASARAN_MESSAGE);

            if (counter == 1) {

                assert.deepEqual(normalizedBody, {
                    limit: 1,
                    where: { objectId: _keyValue }
                });

                request.respond(
                    HTTP_STATUSES.OK,
                    HTTP_RESPONSE_HEADERS,
                    JSON.stringify({
                        results: [{ foo: 1 }]
                    }));
            }
            else {
                assert.deepEqual(normalizedBody, {
                    ACL: {},
                    foo: 1
                });

                request.respond(
                    HTTP_STATUSES.OK,
                    HTTP_RESPONSE_HEADERS,
                    JSON.stringify({
                        updatedAt: new Date().toISOString()
                    }));
            }
        });

        createParseStore()
            .update(_keyValue, _values)
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (key, values) {
                assert.equal(key, _keyValue);
                assert.deepEqual(values, _values);
            })
            .always(done);
    });

    QUnit.test("insert", function (assert) {
        var done = assert.async(),
            _values = { foo: 1 },
            _keyValue = "keyValue",
            _createdAtValue = new Date;

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, _values);

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    objectId: _keyValue,
                    createdAt: _createdAtValue.toISOString()
                }));
        });

        createParseStore()
            .insert(_values)
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (values, key) {
                assert.deepEqual(values, _values);
                assert.equal(key, _keyValue);
            })
            .always(done);
    });

    QUnit.test("insert: with ACL", function (assert) {
        var done = assert.async(),
            _values = { foo: 1, ACL: new Parse.ACL() },
            _keyValue = "keyValue",
            _createdAtValue = new Date;

        this.server.respondWith(function (request) {
            var normalizedBody = normalizeParseRequestBody(request.requestBody);

            assert.deepEqual(normalizedBody, {
                foo: 1,
                ACL: {}
            });

            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({
                    objectId: _keyValue,
                    createdAt: _createdAtValue.toISOString()
                }));
        });

        createParseStore({ normalizeResponse: false })
            .insert(_values)
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (values, key) {
                assert.deepEqual(values, _values);
                assert.equal(key, _keyValue);
            })
            .always(done);
    });

    QUnit.test("remove", function (assert) {
        var done = assert.async(),
            keyValue = "keyValue";

        this.server.respondWith(function (request) {
            request.respond(
                HTTP_STATUSES.OK,
                HTTP_RESPONSE_HEADERS,
                JSON.stringify({}));
        });

        createParseStore()
            .remove(keyValue)
            .fail(function () {
                assert.ok(false, NO_PASARAN_MESSAGE);
            })
            .done(function (key) {
                assert.equal(key, keyValue);
            })
            .always(done);
    });

})(jQuery, DevExpress);