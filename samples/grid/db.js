(function () {

    Parse.initialize("ApplicationID", "JavascriptKey");

    function rand(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    function createTable(name, data) {
        var d = $.Deferred();

        new Parse.Query(name)
            .find()
            .fail(d.reject)
            .done(function (results) {
                if (results.length > 0)
                    d.resolve(results);
                else {
                    Parse.Promise.when(data.map(function (attrs) {
                        return new Parse.Object(name, attrs)
                            .save();
                    })).fail(d.reject).done(function () {
                        d.resolve([].slice.call(arguments, 0));
                    });
                }
            });

        return d.promise();
    }

    function createStatesTable() {
        return createTable("State", [
            "Alabama",
            "Alaska",
            "Arizona",
            "Arkansas",
            "California",
            "Colorado",
            "Connectictu",
            "Delaware",
            "District of Columbia",
            "Florida",
            "Georgia",
            "Hawaii",
            "Idaho",
            "Illinois",
            "Indiana",
            "Iowa",
            "Kansas",
            "Kentucky",
            "Louisiana",
            "Maine",
            "Maryland",
            "Massachusetts",
            "Michigan",
            "Minnesota",
            "Mississippi",
            "Missouri",
            "Montana",
            "Nebraska",
            "Nevada",
            "New Hampshire",
            "New Jersey",
            "New Mexico",
            "New York",
            "North Carolina",
            "Ohio",
            "Oklahoma",
            "Oregon",
            "Pennsylvania",
            "Rhode Island",
            "South Carolina",
            "South Dakota",
            "Tennessee",
            "Texas",
            "Utah",
            "Vermont",
            "Virginia",
            "Washington",
            "West Virginia",
            "Wisconsin",
            "Wyoming",
            "North Dakota"
        ].map(function (name) {
            return { Name: name };
        }));
    }

    function createEmployeesTable(states) {
        return createTable("Employee", [
            {
                "FirstName": "John",
                "LastName": "Heart",
                "Prefix": "Mr.",
                "Position": "CEO",
                "BirthDate": new Date(1964, 2, 16),
                "HireDate": new Date(1995, 0, 15),
                "Notes": "John has been in the Audio/Video industry since 1990. He has led DevAv as its CEO since 2003.\r\n\r\nWhen not working hard as the CEO, John loves to golf and bowl. He once bowled a perfect game of 300.",
                "Address": "351 S Hill St.",
            }, {
                "FirstName": "Olivia",
                "LastName": "Peyton",
                "Prefix": "Mrs.",
                "Position": "Sales Assistant",
                "BirthDate": new Date(1981, 5, 3),
                "HireDate": new Date(2012, 4, 14),
                "Notes": "Olivia loves to sell. She has been selling DevAV products since 2012. \r\n\r\nOlivia was homecoming queen in high school. She is expecting her first child in 6 months. Good Luck Olivia.",
                "Address": "807 W Paseo Del Mar",
            }, {
                "FirstName": "Robert",
                "LastName": "Reagan",
                "Prefix": "Mr.",
                "Position": "CMO",
                "BirthDate": new Date(1974, 8, 7),
                "HireDate": new Date(2002, 10, 8),
                "Notes": "Robert was recently voted the CMO of the year by CMO Magazine. He is a proud member of the DevAV Management Team.\r\n\r\nRobert is a championship BBQ chef, so when you get the chance ask him for his secret recipe.",
                "Address": "4 Westmoreland Pl.",
            }, {
                "FirstName": "Greta",
                "LastName": "Sims",
                "Prefix": "Ms.",
                "Position": "HR Manager",
                "BirthDate": new Date(1977, 10, 22),
                "HireDate": new Date(1998, 3, 23),
                "Notes": "Greta has been DevAV's HR Manager since 2003. She joined DevAV from Sonee Corp.\r\n\r\nGreta is currently training for the NYC marathon. Her best marathon time is 4 hours. Go Greta.",
                "Address": "1700 S Grandview Dr.",
            }, {
                "FirstName": "Brett",
                "LastName": "Wade",
                "Prefix": "Mr.",
                "Position": "IT Manager",
                "BirthDate": new Date(1968, 11, 1),
                "HireDate": new Date(2009, 2, 6),
                "Notes": "Brett came to DevAv from Microsoft and has led our IT department since 2012.\r\n\r\nWhen he is not working hard for DevAV, he coaches Little League (he was a high school pitcher).",
                "Address": "1120 Old Mill Rd.",
            }, {
                "FirstName": "Sandra",
                "LastName": "Johnson",
                "Prefix": "Mrs.",
                "Position": "Controller",
                "BirthDate": new Date(1974, 10, 11),
                "HireDate": new Date(2005, 5, 11),
                "Notes": "Sandra is a CPA and has been our controller since 2008. She loves to interact with staff so if you've not met her, be certain to say hi.\r\n\r\nSandra has 2 daughters both of whom are accomplished gymnasts.",
                "Address": "4600 N Virginia Rd.",
            }, {
                "FirstName": "Kevin",
                "LastName": "Carter",
                "Prefix": "Mr.",
                "Position": "Shipping Manager",
                "BirthDate": new Date(1978, 0, 9),
                "HireDate": new Date(2009, 7, 11),
                "Notes": "Kevin is our hard-working shipping manager and has been helping that department work like clockwork for 18 months.\r\n\r\nWhen not in the office, he is usually on the basketball court playing pick-up games.",
                "Address": "424 N Main St.",
            }, {
                "FirstName": "Cynthia",
                "LastName": "Stanwick",
                "Prefix": "Ms.",
                "Position": "HR Assistant",
                "BirthDate": new Date(1985, 5, 5),
                "HireDate": new Date(2008, 2, 24),
                "Notes": "Cindy joined us in 2008 and has been in the HR department for 2 years. \r\n\r\nShe was recently awarded employee of the month. Way to go Cindy!",
                "Address": "2211 Bonita Dr.",
            }, {
                "FirstName": "Kent",
                "LastName": "Samuelson",
                "Prefix": "Dr.",
                "Position": "Ombudsman",
                "BirthDate": new Date(1972, 8, 11),
                "HireDate": new Date(2009, 3, 22),
                "Notes": "As our ombudsman, Kent is on the front-lines solving customer problems and helping our partners address issues out in the field.    He is a classically trained musician and is a member of the Chamber Orchestra.",
                "Address": "12100 Mora Dr",
            }, {
                "FirstName": "Taylor",
                "LastName": "Riley",
                "Prefix": "Mr.",
                "Position": "Network Admin",
                "BirthDate": new Date(1982, 7, 14),
                "HireDate": new Date(2012, 3, 14),
                "Notes": "If you are like the rest of us at DevAV, then you've probably reached out for help from Taylor. He does a great job as a member of our IT department.",
                "Address": "7776 Torreyson Dr",
            }
        ]);
    }

    this.initDataBase = function () {
        var d = $.Deferred();

        createStatesTable()
            .fail(d.reject)
            .done(function (states) {
                createEmployeesTable(states)
                    .fail(d.reject)
                    .done(function (employees) {
                        var promises = employees
                            .map(function (employee) {
                                if (employee.get("State"))
                                    return $.Deferred().resolve().promise();

                                employee.set("State", states[rand(0, states.length)]);
                                return employee.save();
                            });

                        Parse.Promise.when(promises)
                            .fail(d.reject)
                            .done(d.resolve);
                    });
            });

        return d.promise();
    };
})();