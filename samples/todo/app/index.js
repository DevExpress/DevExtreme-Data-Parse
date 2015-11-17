/* global ToDo */
DevExpress.devices.current("genericPhone");

$(function () {
    var app = new DevExpress.framework.html.HtmlApplication({
        mode: "mobileApp",
        namespace: ToDo,
        navigation: ToDo.config.navigation,
        layoutSet: DevExpress.framework.html.layoutSets[ToDo.config.layoutSet]
    });

    var shallNotPass = function (uri) {
        var info = app.router.parse(uri),
            params = app.getViewTemplateInfo(info.view);

        return !("safe" in params) && !Parse.User.current();
    };

    app.router.register("enter/:backUri");
    app.router.register(":view", { view: "feed" });
    app.router.register(":view/:id", { view: "edit", id: undefined });

    app.on("navigating", function (e) {
        if (shallNotPass(e.uri)) {
            e.cancel = true;
            app.navigate({
                view: "enter",
                backUri: e.uri
            });
        }
    });

    $.extend(ToDo, {
        app: app,
        notifyError: function (message) {
            DevExpress.ui.notify(message, "error", 3000);
        },
        notifySuccess: function (message) {
            DevExpress.ui.notify(message, "success", 3000);
        }
    });

    app.navigate("feed", { root: true });
});