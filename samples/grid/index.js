/* global $ */
/* global Parse */
/* global DevExpress */

this.initDataBase()
    .done(function () {
        $("#gridContainer").dxDataGrid({
            height: "500px",
            dataSource: new DevExpress.data.DataSource({
                store: new DevExpress.data.ParseStore({
                    className: "Employee"
                }),
                include: "State"
            }),
            paging: {
                enabled: false
            },
            filterRow: {
                visible: true
            },
            grouping: {
                autoExpandAll: true,
                allowCollapsing: true,
            },
            groupPanel: {
                visible: true,
                allowColumnDragging: true
            },
            editing: {
                mode: "row",
                allowAdding: true,
                allowUpdating: true,
                allowDeleting: true
            },
            columns: [
                {
                    dataField: "Prefix",
                    caption: "Title",
                    width: 130
                },
                "FirstName",
                "LastName",
                {
                    dataField: "Position"
                },
                {
                    dataField: "State.id",
                    caption: "State",
                    width: 125,
                    lookup: {
                        dataSource: new DevExpress.data.ParseStore({
                            className: "State"
                        }),
                        displayExpr: "Name",
                        valueExpr: "id"
                    }
                },
                {
                    dataField: "BirthDate",
                    dataType: "date",
                    width: 125
                }
            ],
            onRowUpdating: function (e) {
                var id = e.newData.State.id;
                e.newData.State = new Parse.Object("State");
                e.newData.State.id = id;
            },
            onRowInserting: function (e) {
                var id = e.data.State.id;
                e.data.State = new Parse.Object("State");
                e.data.State.id = id;
            }
        });
    });