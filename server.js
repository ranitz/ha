/*
 rhc port-forward -a has -n raniz
 */

////imports of express midllware
var fs = require('fs'); //filsystem
var path = require('path'); //normalize paths

var myUtils = require('./src/utils'); //add util functions at utlis.js

var express = require('express');
//var morgan = require('morgan');         // not in use currently
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');  
//var methodOverride = require('method-override'); // not in use currently
var serveStatic = require('serve-static'); //make public folder open
var configurator = require('./src/config');  //load env variables, process terminators,db_url

var pg = require('pg'); //postgres
pgSession = require('connect-pg-simple')(session);
var cfg = configurator.setup();

var app = express();
var favicon = require('serve-favicon');

// Enable reverse proxy support in Express. This causes the
// the "X-Forwarded-Proto" header field to be trusted so its
// value can be used to determine the protocol. See 
// http://expressjs.com/api#app-settings for more details.
app.enable('trust proxy');

// Add a handler to inspect the req.secure flag (see 
// http://expressjs.com/api#req.secure). This allows us 
// to know whether the request was via http or https.


app.use (function (req, res, next) {
        if (req.secure) {
        //        // request was via https, so do no special handling
                next();
        } else {
          //      // request was via http, so redirect to https
                res.redirect('https://' + req.headers.host + req.url);
        }
});


app.use(favicon(__dirname + '/public/images/fav.png'));
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({// get information from request url
    extended: true
}));
app.use(bodyParser.json()); // get information from html forms
app.use(serveStatic(__dirname + '/public'));  //make folder public
app.set('superSecret', 'ilovescotchyscotch');
app.use(session({
    store: new pgSession({
        pg: pg, // Use global pg-module 
        conString: cfg.db_url, // Connect using something else than default DATABASE_URL env variable 
        tableName: 'session'               // Use another table-name than the default "session" one 
    }),
    secret: app.get('superSecret'),
    resave: false,
    cookie: {maxAge: 30 * 24 * 60 * 60 * 1000} // 30 days 
}));



app.disable('x-powered-by'); //  removes header with server information
app.client = new pg.Client(cfg.db_url);
console.log(cfg.db_url);
app.client.connect(function (err) {
    if (err) {
        console.error('could not connect to postgres', err);
        process.exit(1);
    } else {
        console.log("####################CONNECTED TO POSTGRESQL####################");
        //sub - routes example
        // all of our routes will be prefixed with /api
        //app.use('/api', router);
        var brouter = require('./src/routers/basic_router')(express, app.client,  __dirname);
        var regrouter = require('./src/routers/registration')(express, app.client);
        var adminrouter = require('./src/routers/admin_router')(express, app.client);
        var gabayrouter = require('./src/routers/gabay_router')(express, app.client);
        app.use('/b',brouter);
        app.use('/gabay',gabayrouter);   
        app.use('/login',regrouter);
        app.use('/admin',adminrouter);
        app.listen(cfg.port, cfg.ip, function () {
            console.log('%s: Node server started on %s:%d ...',
                    Date(Date.now()), cfg.ip, cfg.port);
        });
    }
});


//var spawn = require('child_process').spawn;
//var phantom_binary_path;
//if (process.env.OPENSHIFT_NODEJS_IP) {
//    console.log('prod');
//    phantom_binary_path = path.normalize(__dirname + '/bin/linux');
//} else {
//    console.log('dev');
//    phantom_binary_path = path.normalize(__dirname + '/bin/win');
//}
//var phantom_args = [path.normalize(__dirname + '/bin/pdf_a4_portrait.js')];
//console.log(phantom_binary_path);
//console.log(phantom_args);
//
//
//
//var child_process = spawn('phantomjs', phantom_args, {cwd: phantom_binary_path});
//child_process.stdout.on('data', function (data) {
//    var message = data.toString('utf8');
//    console.log("phantom child process stdout data :");
//    console.log((message));
//});
//child_process.stderr.on('data', function (data) {
//    console.log('phantom child process stderr data:');
//    console.log(data.toString('utf8'));
//});
//child_process.on('exit', function (code) {
//    console.log("phantom child process exited with code [" + code + "]");
//});
//child_process.on('error', function (error) {
//    console.log('phantom child process error:');
//    console.log(error);
//});

