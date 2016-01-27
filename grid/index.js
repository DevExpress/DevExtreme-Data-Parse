/* global $ */
/* global Parse */
/* global DevExpress */

$(function () {
    var appID = ko.observable(sessionStorage.getItem("ApplicationID")),
        jsKey = ko.observable(sessionStorage.getItem("JavascriptKey"));

    var hasKeys = !(!appID() || !jsKey());

    var initDemo = function () {
        Parse.initialize(appID(), jsKey());
        window.initDataBase()
            .fail(function (e) { DevExpress.ui.notify(e.message, "error"); })
            .done(function () {
                ko.applyBindings({
                    gridDataSource: new DevExpress.data.DataSource({
                        store: new DevExpress.data.ParseStore({
                            className: "Employee"
                        }),

                        include: "State"
                    }),

                    lookupDataSource: new DevExpress.data.ParseStore({
                        className: "State"
                    }),

                    onRowUpdating: function (e) {
                        var id;
                        if (!("State" in e.newData))
                            return;

                        id = e.newData.State.id;
                        e.newData.State = new Parse.Object("State");
                        e.newData.State.id = id;
                    },

                    onRowInserting: function (e) {
                        var id;
                        if (!("State" in e.data))
                            return;

                        id = e.data.State.id;
                        e.data.State = new Parse.Object("State");
                        e.data.State.id = id;
                    }
                }, document.getElementById("gridContainer"));
            });
    };

    // Main
    ko.applyBindings({
        popupVisible: ko.observable(!hasKeys),

        save: ko.observable(false),
        appID: appID,
        jsKey: jsKey,

        handleConnectClick: function (params) {
            var result = params.validationGroup.validate();
            if (!result.isValid)
                return;

            if (this.save()) {
                sessionStorage.setItem("ApplicationID", appID());
                sessionStorage.setItem("JavascriptKey", jsKey());
            }

            this.popupVisible(false);
            initDemo();
        }
    }, document.getElementById("popupContainer"));

    if (hasKeys) {
        initDemo();
    }
});