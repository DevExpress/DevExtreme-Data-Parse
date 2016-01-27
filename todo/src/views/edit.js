ToDo.edit = function (params) {
    var isNew = params.id === undefined;

    var vm = {
        done: ko.observable(!!0),
        title: ko.observable(""),
        description: ko.observable(""),
    };

    function getValues() {
        return { Title: vm.title(), Description: vm.description(), Done: vm.done(), ACL: createACL() };
    }

    function insert() {
        return ToDo.db.todos.insert(getValues())
            .fail(function (error) {
                ToDo.notifyError(error.message);
            })
            .done(function (values, id) {
                ToDo.notifySuccess("A new ToDo item were successfully inserted");
            });
    }

    function update() {
        return ToDo.db.todos.update(params.id, getValues())
            .fail(function (error) {
                ToDo.notifyError(error.message);
            })
            .done(function (values, id) {
                ToDo.notifySuccess("The item were successfully updated");
            });
    }

    function createACL() {
        var acl = new Parse.ACL();

        acl.setPublicReadAccess(false);
        acl.setPublicWriteAccess(false);

        acl.setReadAccess(Parse.User.current(), true);
        acl.setWriteAccess(Parse.User.current(), true);

        return acl;
    }

    vm.handleBack = function () {
        if (ToDo.app.canBack())
            ToDo.app.back();
    };

    vm.handleSave = function (params) {
        var result = params.validationGroup.validate();
        if (!result.isValid)
            return;

        (function () {
            if (isNew)
                return insert();

            return update();
        })().done(vm.handleBack);
    };

    vm.viewShown = function () {
        if (isNew)
            return;

        ToDo.db.todos.byKey(params.id)
            .fail(function (error) {
                ToDo.notifyError(error.message);
            })
            .done(function (todo) {
                vm.done(todo.Done || false);
                vm.title(todo.Title);
                vm.description(todo.Description);
            });
    };

    return vm;
};