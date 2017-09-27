#!/bin/env node

var http = require('http');
var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var pg = require('pg');
var morgan = require('morgan');
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var expressjwt     = require("express-jwt");


var HasApp = function () {
    var self = this;
    self.app = express();
    //self.apiRoutes = express.Router();

    self.setupVariables = function () {
        self.app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 8080);
        self.app.set('ip', process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1');
    };

//    self.populateCache = function () {
//        if (typeof self.zcache === "undefined") {
//            self.zcache = {'index.html': ''};
//        }
//        self.zcache['index.html'] = fs.readFileSync("index.html");  //Local cache for static content.
//    };
//
//    self.cache_get = function (key) {
//        return self.zcache[key];
//    };

    self.initializeServer = function () {
        self.app.use(express.static('public'));
        self.app.use(cookieParser()); // read cookies (needed for auth)
        self.app.use(bodyParser.urlencoded({extended: true})); // get information from request
        self.app.use(bodyParser.json());
    };

    self.terminator = function (sig) {
        if (typeof sig === "string") {
            console.log('%s: Received %s - terminating sample app ...', Date(Date.now()), sig);
            process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()));
    };

    self.setupTerminationHandlers = function () {
        process.on('exit', function () { //  Process on exit and signals.
            self.terminator();
        });
        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
            'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function (element, index, array) {
            process.on(element, function () {
                self.terminator(element);
            });
        });
    };

    self.initialize = function () {
        self.setupVariables();
        //self.populateCache();
        self.setupTerminationHandlers();
        //self.initializePostgresql();
        self.initializeServer();
    };

    self.initializePostgresql = function () {
        if (self.app.get('ip') === "127.0.0.1") {
            self.db_url = 'postgresql://admintgqlmic:byFzDLkEpdSf@127.0.0.1:55916/';
        } else {
            self.db_url = 'postgresql://admintgqlmic:byFzDLkEpdSf@' + process.env.OPENSHIFT_POSTGRESQL_DB_HOST + ':' + process.env.OPENSHIFT_POSTGRESQL_DB_PORT + '/';
        }
        self.app.client = new pg.Client(self.db_url);
    };

//    self.attachRouters = function () {
////        self.app.get('/', function (req, res) {
////            //res.setHeader('Content-Type', 'text/html');
////            //res.send(self.cache_get('index.html'));
////            res.sendFile(__dirname + "/" + "index.html");
////        });
////        self.app.get('/index.html', function (req, res) {
////            //res.setHeader('Content-Type', 'text/html');
////            //res.send(self.cache_get('index.html'));
////            res.sendFile(__dirname + "/" + "index.html");
////        });
//        self.apiRoutes.get('/partial-about.html', function (req, res) {
//            res.sendFile(__dirname + "/" + "partial-about.html");
//        });
//        self.apiRoutes.get('/SynagogueList', function (req, res) {
//            var query = self.client.query("SELECT f_name FROM t_synagogues", function (err, result) {
////               res.send(result); 
//                res.json(result.rows);
//            });
//        });
//        self.apiRoutes.get('/index.html', function (req, res) {
//            //res.setHeader('Content-Type', 'text/html');
//            //res.send(self.cache_get('index.html'));
//            res.sendFile(__dirname + "/" + "index.html");
//        });
//        self.apiRoutes.get('/', function (req, res) {
//            //res.setHeader('Content-Type', 'text/html');
//            //res.send(self.cache_get('index.html'));
//            res.sendFile(__dirname + "/" + "index.html");
//        });
//        self.apiRoutes.get('/authenticate', function (req, res) {
//            var query = self.client.query("SELECT f_password FROM t_users WHERE f_name = 'Gil'", function (err, result) {
////               res.send(result); 
//                if (result.rows.length === 0) {
//                    res.json({success: false, message: 'Authentication failed. User not found.'});
//                } else {
////                    var token = jwt.sign(result, self.app.get('superSecret'), {
////                        expiresInMinutes: 1440 // expires in 24 hours
////                    });
////                    res.json({
////                        success: true,
////                        message: 'Enjoy your token!',
////                        token: token
////                    });
//                    res.json(result.rows);
//                }
//            });
//        });
//    };

    self.start = function () {
//        self.apiRoutes.get('/SynagogueList', function (req, res) {
//            var query = self.client.query("SELECT f_name FROM t_synagogues", function (err, result) {
////               res.send(result); 
//                 res.json(result.rows);
//            });
//        });
        //self.app.use('/', self.apiRoutes);
        require("./Routers/router_setup")(self.app).createRoutes(self.app);
        self.app.set('superSecret', 'ilovescotchyscotch'); 
        self.app.client.connect(function (err) {
            if (err) {
                console.error('could not connect to postgres', err);
                process.exit(1);
            } else {
                console.log("####################CONNECTED TO POSTGRESQL####################");
//                var query = self.app.client.query("SELECT f_name FROM t_users", function (err, result) {
//                    console.log(result.rows[0]);
//                    console.log(result.rows[1]);
//                });
                http.createServer(self.app).listen(self.app.get('port'), self.app.get('ip'), function () {
                    console.log('Express server listening on port ' + self.app.get('port'));
                });
                //require("./Routers/router_setup")(self.app).createRoutes(self.app);
            }
        });
    };

//    self.app.get('/index.html', function (req, res) {
//        res.sendFile(__dirname + "/" + "index.html");
//    });
//
//    self.app.get('/', function (req, res) {
//        res.sendFile(__dirname + "/" + "index.html");
//    });

//    http.createServer(app).listen(app.get('port'), app.get('ip'), function () {
//        console.log('Express server listening on port ' + app.get('port'));
//    });
};

var hasapp = new HasApp();
hasapp.initialize();
hasapp.initializePostgresql();
//hasapp.attachRouters();
hasapp.start();

//
////  OpenShift sample Node application
//var express = require('express');
////var mongoose = require('mongoose');
//var pg = require('pg');
//var fs = require('fs');
//var async = require('async');
//var morgan = require('morgan');
//var cookieParser = require('cookie-parser');
//var bodyParser = require('body-parser');
////var session = require('express-session');
//var methodOverride = require('method-override');
////var MongoStore = require('connect-mongo/es5')(session);
//var serveStatic = require('serve-static');
///**
// *  Define the sample application.
// */
//var SampleApp = function () {
//
//    //  Scope.
//    var self = this;
//
//    self.isStarted = false;
//    self.isDBconnected = true;
//    self.db_url = "";
//
//    /*  ================================================================  */
//    /*  Helper functions.                                                 */
//    /*  ================================================================  */
//
//    /**
//     *  Set up server IP address and port # using env variables/defaults.
//     */
//    self.setupVariables = function () {
//        //  Set the environment variables we need.
//        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
//        self.port = process.env.OPENSHIFT_NODEJS_PORT || 80;
//
//        if (typeof self.ipaddress === "undefined") {
//            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
//            //  allows us to run/test the app locally.
//            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
//            self.ipaddress = "127.0.0.1";
//        }
//        ;
//    };
//
//
//    /**
//     *  Populate the cache.
//     */
//    self.populateCache = function () {
//        if (typeof self.zcache === "undefined") {
//            self.zcache = {'index.html': ''};
//        }
//
//        //  Local cache for static content.
////        self.zcache['index.html'] = fs.readFileSync('./index.html');
//    };
//
//
//    /**
//     *  Retrieve entry (content) from cache.
//     *  @param {string} key  Key identifying content to retrieve from cache.
//     */
//    self.cache_get = function (key) {
//        return self.zcache[key];
//    };
//
//
//    /**
//     *  terminator === the termination handler
//     *  Terminate server on receipt of the specified signal.
//     *  @param {string} sig  Signal to terminate on.
//     */
//    self.terminator = function (sig) {
//        if (typeof sig === "string") {
//            console.log('%s: Received %s - terminating sample app ...',
//                    Date(Date.now()), sig);
//            process.exit(1);
//        }
//        console.log('%s: Node server stopped.', Date(Date.now()));
//    };
//
//
//    /**
//     *  Setup termination handlers (for exit and a list of signals).
//     */
//    self.setupTerminationHandlers = function () {
//        //  Process on exit and signals.
//        process.on('exit', function () {
//            self.terminator();
//        });
//
//        // Removed 'SIGPIPE' from the list - bugz 852598.
//        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
//            'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
//        ].forEach(function (element, index, array) {
//            process.on(element, function () {
//                self.terminator(element);
//            });
//        });
//    };
//
//
////    /*  ================================================================  */
////    /*  App server functions (main app logic here).                       */
////    /*  ================================================================  */
////
////    /**
////     *  Create the routing table entries + handlers for the application.
////     */
////    self.createRoutes = function () {
////        self.routes = {};
////
////        self.routes['/asciimo'] = function (req, res) {
////            var link = "http://i.imgur.com/kmbjB.png";
////            res.send("<html><body><img src='" + link + "'></body></html>");
////        };
////
////        self.routes['/'] = function (req, res) {
////            res.setHeader('Content-Type', 'text/html');
////            res.send(self.cache_get('index.html'));
////        };
////    };
//
//
//    /**
//     *  Initialize the server (express) and create the routes and register
//     *  the handlers.
//     */
//    self.initializeServer = function () {
////        self.createRoutes();
//        self.app = express();
//        self.app.use(cookieParser()); // read cookies (needed for auth)
//        self.app.use(bodyParser.urlencoded({// get information from request url
//            extended: true
//        }));
//        self.app.use(bodyParser.json()); // get information from html forms
//        self.app.use(serveStatic(__dirname + '/public'));
//        self.app.get('/test', function (req, res) {
//            res.send('hello world!');
//        });
//        //self.app.use(session({
//        //    secret: 'foo'
////            store: new MongoStore({
////                url: self.db_url,
////                ttl: 14 * 24 * 60 * 60 // = 14 days. Default 
////            })
//        //}));
//
////        var mongoStore = require('connect-mongo')(session);
//
//
//        //  Add handlers for the app (from the routes).
////        for (var r in self.routes) {
////            self.app.get(r, self.routes[r]);
////        }
//    };
//    /**
//     *  Initialize the connecttion to MongoDB
//     */
//
//    self.initializePostgresql = function () {
//        if (self.ipaddress === "127.0.0.1") {
//            //self.db_url = 'mongodb://admin:jc1ZbzUYeqke@127.0.0.1:46181/';
//            self.db_url = 'postgresql://admin:byFzDLkEpdSf@127.0.0.1:55916/';
//        } else {
//            //self.db_url = 'mongodb://admin:jc1ZbzUYeqke@' + process.env.OPENSHIFT_MONGODB_DB_HOST + ':' + process.env.OPENSHIFT_MONGODB_DB_PORT + '/';
//            self.db_url = 'postgresql://admin:byFzDLkEpdSf@' + process.env.OPENSHIFT_POSTGRESQL_DB_HOST + ':' + process.env.OPENSHIFT_POSTGRESQL_DB_PORT + '/';
//        }
//        //console.log(self.db_url);
//        var client = new pg.Client(self.db_url);
//        client.connect();
////        var query = client.query("SELECT f_name FROM t_users", function(err, result) {
////            console.log(result.rows[0].name);
////        });
//        //mongoose.connect(self.db_url);
//        //var db = mongoose.connection;
//
//        //db.on('error', console.error);
//        //db.once('open', function () {
//        self.isDBconnected = true;
//        console.log("connected to DB");
//        if (self.isStarted) {
//            self.initializeServer();
//            self.app.get('/test1', function (req, res) {
//                res.send('hello world1');
//            });
//            self.app.listen(self.port, self.ipaddress, function () {
//                console.log('%s: Node server started on %s:%d ...',
//                        Date(Date.now()), self.ipaddress, self.port);
//            });
//        }
//
//        //});
//    };
//
////    self.initializeDB = function () {
////        if (self.ipaddress === "127.0.0.1") {
////            self.db_url = 'mongodb://admin:jc1ZbzUYeqke@127.0.0.1:46181/';
////            //self.db_url = 'postgresql://admin:byFzDLkEpdSf@127.0.0.1:46181/';
////        } else {
////            self.db_url = 'mongodb://admin:jc1ZbzUYeqke@' + process.env.OPENSHIFT_MONGODB_DB_HOST + ':' + process.env.OPENSHIFT_MONGODB_DB_PORT + '/';
////        }
////        console.log(self.db_url);
////        mongoose.connect(self.db_url);
////        var db = mongoose.connection;
////
////        db.on('error', console.error);
////        db.once('open', function () {
////            self.isDBconnected = true;
////            console.log("connected to DB");
////            if (self.isStarted) {
////                self.initializeServer();
////                self.app.listen(self.port, self.ipaddress, function () {
////                    console.log('%s: Node server started on %s:%d ...',
////                            Date(Date.now()), self.ipaddress, self.port);
////                });
////            }
////
////        });
////    };
//
//
//    /**
//     *  Initializes the sample application.
//     */
//    self.initialize = function () {
//
//        self.setupVariables();
//        self.populateCache();
//        self.setupTerminationHandlers();
//        self.initializePostgresql();
//        // Create the express server and routes.
//        //self.initializeDB();
//    };
//
//
//    /**
//     *  Start the server (starts up the sample application).
//     */
//    self.start = function () {
//        //  Start the app on the specific interface (and port).
//        self.isStarted = true;
//        if (self.isDBconnected) {
//            self.initializeServer();
//            self.app.listen(self.port, self.ipaddress, function () {
//                console.log('%s: Node server started on %s:%d ...',
//                        Date(Date.now()), self.ipaddress, self.port);
//            });
//        }
//    };
//
//};   /*  Sample Application.  */
//
//
//
///**
// *  main():  Main code.
// */
//
//
//
//
//
//
//
////var User = require('./src/db_mng/schemas/user');
////User.find(function (err, users) {
////    if (err)
////        return console.error(err);
////    console.log(users[0]._user_name);
////});
////    var first_admin = new User ({
////        _user_name: "ran",
////        _type: "admin",
////        _password: "12345",
////        email: "dsfdsfds@gmail.com",
////        birth_date: Date.now()
////    });
////
////    first_admin.save(function (err) {
////        if (err)
////            return console.error(err);
////        console.log(first_admin);
////    });
//
//
//
//
//
//var zapp = new SampleApp();
//zapp.initialize();
//zapp.start();




