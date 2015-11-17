[![Build Status](https://img.shields.io/shippable/560bf3e81895ca447419135b.svg)](https://app.shippable.com/projects/560bf3e81895ca447419135b)

# DevExtreme.data.Parse

The [DevExtreme data layer](http://js.devexpress.com/Documentation/Guide/#Data_Layer) extension contains classes used to access data via the [Parse JavaScript SDK](https://parse.com/docs/js/guide) enables your DevExtreme application to work with a [Parse](https://parse.com/) back-end service accessed via the JavaScript SDK.  

The extension includes the `ParseStore` class that wraps the Parse JavaScript SDK functionality with the [Store interface](http://js.devexpress.com/Documentation/Guide/Data_Layer/Data_Layer/#Data_Layer_Data_Layer_Creating_DataSource_What_Are_Stores) accepted within the DevExtreme data layer.

## Setup
To create a `ParseStore` instance, perform the following steps.
* include a minified or full version of `dx.data.parse.js` from the [dist](https://github.com/DevExpress/DevExtreme-Data-Parse/tree/v15.2/dist) folder to the `index.html` file immediately after the Parse JavaScript SDK script;
* call the [Parse.initialize](https://parse.com/docs/js/api/classes/Parse.html#methods_initialize) method and pass the `applicationId` and `javascriptKey` to it.

Then call the the `ParseStore` constructor and pass the required configuration object to it.
The configuration object may contain the following fields:
* `className` (required)
Type: `String`
A name of the required class of [Parse.Object](https://parse.com/docs/js/api/classes/Parse.Object.html).
* `normalizeResponse` (optional)
Type: `Boolean`
Specifies whether or not to convert every instance of [Parse.Object](https://parse.com/docs/js/api/classes/Parse.Object.html) in response to object literal representation. Any other types, such as [Parse.GeoPoint](https://parse.com/docs/js/api/classes/Parse.GeoPoint.html), [Parse.Relation](https://parse.com/docs/js/api/classes/Parse.Relation.html), will be represented as is. The default value is `true`.

## API

Besides the [standard Store methods](http://js.devexpress.com/Documentation/Guide/Data_Layer/Data_Layer/#Data_Layer_Data_Layer_Creating_DataSource_What_Are_Stores), `ParseStore` contains several specific methods.
* `normalizationEnabled()` - indicates whether or not normalization is enabled.
* `className()` - returns the name of the Parse entity associated with this `ParseStore` instance.

## Here is a code sample:
### `className` constructor option
```javascript
var parseStore = new DevExpress.data.ParseStore({ className: "Product" });
// Now you're able to read or modify data
parseStore.load()
    .done(function(data) {
        // process data
    })
    .fail(function(error) {
        // process error
    });

// Or, bind the parseStore instance to any DevExtreme Collection widget instance:
$("#dx-list").dxList({
    pullRefreshEnabled: true,
    dataSource: new DevExpress.data.DataSource(parseStore)
});
```
### `normalizeResponse` constructor option.
```javascript
// Consider that the Product entity type has 2 fields: Name and Price.
// Thus, after normalization it will look as follows.
var parseStore = new DevExpress.data.ParseStore({
    className: "Product"
});

parseStore.load()
    .done(function(data) {
        assert.deepEqual(data[0], {
            id: "keyValue", // stub
            createdAt: new Date("2014-10-20T18:22:40.361Z"), // stub
            modifiedAt: new Date("2015-10-20T18:22:40.361Z"), // stub
            Name: "ProductName",
            Price: 15.22
        }); // success
    });

// To overcome this behavior, assign false to the normalizeResponse constructor option.

var parseStore = new DevExpress.data.ParseStore({
    className: "Product",
    normalizeResponse: false
});

parseStore.load()
    .done(function(data) {
        assert.ok(data[0] instanceof Parse.Object); // success
    });
```
### Modify `ACL` property.
You can read and modify data associated with the current `ParseStore` instance in the same way as data associated with any other `Store` only with a single difference - the `ACL` property.

To set `ACL` of the inserted/modified object, pass the [Parse.ACL](https://parse.com/docs/js/api/classes/Parse.ACL.html) instance to the `ACL` property of the values object.
```javascript
var acl = new Parse.ALC();
acl.setPublicReadAccess(false);
acl.setPublicWriteAccess(false);
acl.setReadAccess(Parse.User.current(), true);
acl.setWriteAccess(Parse.User.current(), true);

var parseStore = new DevExpress.data.ParseStore({
    className: "Product"
});

parseStore.insert({
    Name: "New product",
    ACL: acl
});
// Or
parseStore.update("keyValue", {
    Name: "New name of product",
    ACL: acl
});
```

## Samples
There are two samples in [samples dir](https://github.com/DevExpress/DevExtreme-Data-Parse/tree/v15.2/samples).  
One is a basic ToDo application demonstrating  a Parse back-end and a DevExtreme application working together, and the other demonstrates how to bind data obtained from a Parse back-end to a `dxDataGrid` instance.  

To make them work, clone the repo and run the `npm install` command on it.  
Then replace the stub values of `applicationId` and `javaScriptKey` (in [index.js](https://github.com/DevExpress/DevExtreme-Data-Parse/blob/v15.2/samples/grid/index.js) for a grid sample and in the [app/data.js](https://github.com/DevExpress/DevExtreme-Data-Parse/blob/v15.2/samples/todo/app/data.js) for the ToDo one) with actual ones.
