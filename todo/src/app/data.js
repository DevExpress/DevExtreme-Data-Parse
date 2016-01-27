/* global ToDo */
(function ($, DX, undefined) {
    ToDo.db = {
        todos: new DevExpress.data.ParseStore({
            className: "ToDo"
        })
    };
})(jQuery, DevExpress);