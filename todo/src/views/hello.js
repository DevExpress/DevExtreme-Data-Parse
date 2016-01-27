/* global ToDo */
ToDo.hello = function (params) {
    return {
        appID: ko.observable(""),
        jsKey: ko.observable(""),
        handleConnectClick: function (params) {
            var result = params.validationGroup.validate();
            if (!result.isValid)
                return;

            Parse.initialize(this.appID(), this.jsKey());
            ToDo.app.navigate("enter", { target: "current" });
        }
    };
};