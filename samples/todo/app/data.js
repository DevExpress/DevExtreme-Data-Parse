/* global ToDo */
(function ($, DX, undefined) {

    Parse.initialize("ApplicationID", "JavascriptKey");

    ToDo.db = {
        todos: new DevExpress.data.ParseStore({
            className: "ToDo"
        })
    };
})(jQuery, DevExpress);