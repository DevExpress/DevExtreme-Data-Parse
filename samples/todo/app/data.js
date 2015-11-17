/* global ToDo */
(function ($, DX, undefined) {

    Parse.initialize("applicationId", "javaScriptKey");

    ToDo.db = {
        todos: new DevExpress.data.ParseStore({
            className: "ToDo"
        })
    };
})(jQuery, DevExpress);