"use strict";
(function ($, DX, undefined) {
    var dataNs = DX.data,

        utilsNs = DX.require("/utils/utils.common"),
        isArray = utilsNs.isArray,
        isString = utilsNs.isString,
        isDefined = utilsNs.isDefined,
        isFunction = utilsNs.isFunction,

        _Error = DX.require("/data/data.errors").Error;

    function createUnknownFilterOperationError(operationName) {
        return new _Error("E4003", operationName);
    }

    function createMixinGroupOperatorsInsideASingleFilterExprIsNotAllowedError() {
        return new _Error("E4019");
    }

    function normalizeParseSuccessResponse(data) {
        function normalizeParseObject(obj) {
            var hash,
                attrs = obj.attributes;

            if (!attrs)
                return undefined;

            hash = { id: obj.id };
            for (var key in attrs) {
                var value = attrs[key];

                if (value instanceof Parse.Object)
                    value = normalizeParseObject(value);

                hash[key] = value;
            }

            return hash;
        }

        if (data instanceof Parse.Object)
            return normalizeParseObject(data);

        if (isArray(data)) {
            return $.map(data, normalizeParseObject);
        }

        return data;
    }

    function normalizeParseErrorResponse(parseError) {
        return $.extend(new Error(), {
            code: parseError.code,
            message: parseError.message
        });
    }

    function createParseQueryAdapter(options) {
        var _skip,
            _take,
            _select,
            _isCount,
            _sorting,
            _criteria;

        function createQuery() {
            return new Parse.Query(options.className);
        }

        function hasSlice() {
            return _skip || _take !== undefined;
        }

        function hasFunction(criterion) {
            var i = 0;
            for (; i < criterion.length; i++)
                if (isFunction(criterion[i]) || (isArray(criterion[i]) && hasFunction(criterion[i])))
                    return true;

            return false;
        }

        function exec() {
            var d = $.Deferred(),
                q = createQuery();

            function handleAll(promise) {
                return promise
                    .fail(function handleFail(parseError) {
                        if (parseError instanceof Parse.Error && options.normalizeResponse !== false)
                            parseError = normalizeParseErrorResponse(parseError);

                        d.reject(parseError);
                    })
                    .done(function handleDone(data) {
                        if (!_isCount && options.normalizeResponse !== false)
                            data = normalizeParseSuccessResponse(data);

                        d.resolve.call(d, data);
                    });
            }

            function compileSortOption(_, rule) {
                if (rule[1] === true)
                    q.addDescending(rule[0]);

                else q.addAscending(rule[0]);
            }

            function compileFilterOption() {
                function core(q, criteria) {
                    if (isArray(criteria[0]))
                        return group(q, criteria);

                    return binary(q, criteria);
                }

                function binary(q, criteria) {
                    var crit = dataNs.utils.normalizeBinaryCriterion(criteria),
                        expr = crit[0],
                        val = crit[2],
                        op = crit[1].toLowerCase();

                    switch (op) {
                        case "=":
                            return q.equalTo(expr, val);

                        case "<>":
                            return q.notEqualTo(expr, val);

                        case ">":
                            return q.greaterThan(expr, val);

                        case "<":
                            return q.lessThan(expr, val);

                        case ">=":
                            return q.greaterThanOrEqualTo(expr, val);

                        case "<=":
                            return q.lessThanOrEqualTo(expr, val);

                        case "startswith":
                            return q.startsWith(expr, val);

                        case "endswith":
                            return q.endsWith(expr, val);

                        case "contains":
                            return q.contains(expr, val);

                        case "notcontains":
                            return q.doesNotMatchQuery(expr, createQuery().contains(expr, val));

                        default: throw createUnknownFilterOperationError(op);
                    }
                }

                function disjunctive(q, criteria) {
                    var i = 0,
                        queries = [];

                    for (; i < criteria.length; i++) {
                        if (!(i & 1)) {
                            if (!isArray(criteria[i]))
                                throw createMixinGroupOperatorsInsideASingleFilterExprIsNotAllowedError();

                            queries.push(core(createQuery(), criteria[i]));
                        }
                        else if (!dataNs.utils.isDisjunctiveOperator(criteria[i])) {
                            throw createMixinGroupOperatorsInsideASingleFilterExprIsNotAllowedError();
                        }
                    }

                    return q._orQuery(queries);
                }

                function conjunctive(q, criteria) {
                    var i = 0;
                    for (; i < criteria.length; i++)
                        if (isArray(criteria[i]))
                            q = core(q, criteria[i]);

                        else if (!dataNs.utils.isConjunctiveOperator(criteria[i]))
                            throw createMixinGroupOperatorsInsideASingleFilterExprIsNotAllowedError();

                    return q;
                }

                function group(q, criteria) {
                    if (dataNs.utils.isDisjunctiveOperator(criteria[1]))
                        return disjunctive(q, criteria);

                    return conjunctive(q, criteria);
                }

                return core(q, _criteria);
            }

            if (_criteria)
                q = compileFilterOption();

            if (!_isCount) {
                if (_sorting)
                    $.each(_sorting, compileSortOption);

                if (_skip)
                    q.skip(_skip);

                if (_take)
                    q.limit(_take);

                if (_select)
                    q.select(_select);

                if (isDefined(options.include))
                    q.include(options.include);

                handleAll(q.find());
            }
            else handleAll(q.count());

            return d.promise();
        }

        function count() {
            _isCount = true;
        }

        function multiSort(rules) {
            var i,
                expr,
                retRules = [];

            if (hasSlice())
                return false;

            for (i = 0; i < rules.length; i++) {
                expr = rules[i][0];
                if (!isString(expr))
                    return false;

                if (/\./.test(expr))
                    return false;

                retRules.push(rules[i]);
            }

            _sorting = retRules;
        }

        function slice(skip, take) {
            if (hasSlice())
                return false;

            _skip = skip;
            _take = take;
        }

        function select(expr) {
            if (_select)
                return false;

            if (isFunction(expr))
                return false;

            if (!isArray(expr))
                expr = $.makeArray(arguments);

            _select = expr;
        }

        function filter(criterion) {
            if (hasSlice())
                return false;

            if (!$.isArray(criterion))
                criterion = $.makeArray(arguments);

            if (hasFunction(criterion))
                return false;

            if (!_criteria)
                _criteria = [criterion];
            else _criteria.push("and", criterion);
        }

        return {
            exec: exec,
            count: count,
            slice: slice,
            select: select,
            filter: filter,
            multiSort: multiSort
        };
    }

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

    dataNs.ParseStore = dataNs.Store.inherit({
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

    $.extend(true, dataNs, {
        queryAdapters: {
            parse: createParseQueryAdapter
        },

        utils: {
            parse: {
                normalizeParseErrorResponse: normalizeParseErrorResponse,
                normalizeParseSuccessResponse: normalizeParseSuccessResponse
            }
        }
    });
})(jQuery, DevExpress);