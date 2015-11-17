/* global ToDo */
ToDo.feed = function () {
    var vm = {
        searchQuery: ko.observable("")
            .extend({ throttle: 500 }),

        dataSource: new DevExpress.data.DataSource({
            store: ToDo.db.todos,
            select: ["Title", "Description", "Done"],
            group: "Done"
        }),

        handleLogOutClick: function () {
            Parse.User.logOut()
                .fail(function (error) {
                    ToDo.notifyError(error.message);
                })
                .done(function () {
                    ToDo.notifySuccess("You've successfully loged out");
                })
                .always(function () {
                    ToDo.app.navigate("enter");
                });
        }
    };

    vm.searchQuery.subscribe(function (value) {
        vm.dataSource.filter(null);

        if(value)
            vm.dataSource.filter("Title", "contains", value);

        vm.dataSource.load();
    });

    vm.viewDisposing = function() {
        ToDo.db.todos.off("modified", handleModified);
    };

    function handleModified() {
        vm.dataSource.load();
    }

    ToDo.db.todos.on("modified", handleModified);

    return vm;
};