(function ($, DX, undefined) {
    var dataNs = DX.data,
        normalizeParseErrorResponse = dataNs.utils.parse.normalizeParseErrorResponse,
        normalizeParseSuccessResponse = dataNs.utils.parse.normalizeParseSuccessResponse;

    function ensureNormalized(obj, normalize) {
        if (normalize === false)
            return obj;

        if (obj instanceof Parse.Error)
            return normalizeParseErrorResponse(obj);

        return normalizeParseSuccessResponse(obj);
    }

    function setValues(obj, values) {
        $.each(values, function (key, value) {
            if (key === "ACL") {
                obj.setACL(value);
            }
            else {
                obj.set(key, value);
            }
        });
    }

    var ParseStore = dataNs.Store.inherit({
        ctor: function (options) {
            options = $.extend({
                key: "id"
            }, options || {});

            this.callBase(options);

            this._className = options.className;
            this._normalizeResponse = options.normalizeResponse;
        },

        _ensureNormalized: function (obj) {
            return ensureNormalized(obj, this._normalizeResponse);
        },

        _customLoadOptions: function () {
            return ["include"];
        },

        createQuery: function (loadOptions) {
            loadOptions = loadOptions || {};

            return dataNs.query(null, {
                adapter: "parse",

                include: loadOptions.include,

                className: this.className(),
                errorHandler: this._errorHandler,
                normalizeResponse: this._normalizeResponse
            });
        },

        _byKeyImpl: function (key) {
            var d = $.Deferred(),
                shouldNormalize = this._normalizeResponse;

            function handleFail(error) {
                d.reject(ensureNormalized(error, shouldNormalize));
            }

            function handleDone(obj) {
                d.resolve(ensureNormalized(obj, shouldNormalize));
            }

            this._byKeyCore(key)
                .fail(handleFail)
                .done(handleDone);

            return d.promise();
        },

        _byKeyCore: function (key) {
            return new Parse.Query(this.className()).get(key);
        },

        _updateImpl: function (key, values) {
            var d = $.Deferred(),
                shouldNormalize = this._normalizeResponse;

            function handleFail(error) {
                d.reject(ensureNormalized(error, shouldNormalize));
            }

            function handleDone() {
                d.resolve(key, values);
            }

            this._byKeyCore(key)
                .fail(handleFail)
                .done(function (obj) {

                    setValues(obj, values);

                    obj.save()
                        .fail(handleFail)
                        .done(handleDone);
                });

            return d.promise();
        },

        _insertImpl: function (values) {
            var d = $.Deferred(),
                obj = new Parse.Object(this._className),
                keyGetter = $.proxy(this.keyOf, this),
                shouldNormalize = this._normalizeResponse;

            function handleFail(error) {
                d.reject(ensureNormalized(error, shouldNormalize));
            }

            function handleDone(obj) {
                d.resolve(values, keyGetter(obj));
            }

            setValues(obj, values);

            obj.save()
                .fail(handleFail)
                .done(handleDone);

            return d.promise();
        },

        _removeImpl: function (key) {
            var d = $.Deferred(),
                obj = new Parse.Object(this._className),
                shouldNormalize = this._normalizeResponse;

            function handleFail(error) {
                d.reject(ensureNormalized(error, shouldNormalize));
            }

            function handleDone() {
                d.resolve(key);
            }

            obj.id = key;
            obj.destroy()
                .fail(handleFail)
                .done(handleDone);

            return d.promise();
        },

        className: function () {
            return this._className;
        },

        normalizationEnabled: function () {
            return this._normalizeResponse;
        }
    });

    $.extend(dataNs, {
        ParseStore: ParseStore
    });
})(jQuery, DevExpress);