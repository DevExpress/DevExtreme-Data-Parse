/* global ToDo */
ToDo.enter = function (params) {
    function handleFail(error) {
        ToDo.notifyError(error.message);
    }

    function handleDone() {
        ToDo.app.navigate(params.backUri || "feed");
    }

    function welcomeAbroad() {
        ToDo.notifySuccess("Welcome aboard, " + Parse.User.current().get("username") + "!");
    }

    var vm = {};

    vm.views = [
        { template: "signIn" },
        { template: "signUp" }
    ];

    vm.signIn = {
        username: ko.observable(""),
        password: ko.observable(""),
        handleSignInClick: function (params) {
            var result = params.validationGroup.validate();
            if (!result.isValid)
                return;

            Parse.User.logIn(this.username(), this.password())
                .fail(handleFail)
                .done(handleDone);
        }
    };

    vm.signUp = {
        email: ko.observable(""),
        username: ko.observable(""),
        password: ko.observable(""),
        handleSignUpClick: function (params) {
            var result = params.validationGroup.validate();
            if (!result.isValid)
                return;

            Parse.User.signUp(this.username(), this.password(), { email: this.email() })
                .fail(handleFail)
                .done(welcomeAbroad)
                .done(handleDone);
        }
    };

    vm.selectedIndex = ko.observable(0);
    vm.showSignInForm = function () {
        vm.selectedIndex(0);
        return false;
    };
    vm.showSignUpForm = function () {
        vm.selectedIndex(1);
        return false;
    };

    vm.viewShown = function () {
        if (Parse.User.current())
            ToDo.app.back();
    };

    return vm;
};