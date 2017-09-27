var nodemailer = require('nodemailer');
var request = require('request');
module.exports = function (express, db_client) {
    var mailRouter = express.Router();
    function sendRestorationMail(email, cb) {
        var string = Math.random().toString(36).slice(3, 15);
        db_client.query("UPDATE t_users SET f_restore_string=$1 WHERE f_name=$2", [string, email]);
        var htmlString = "<body style='direction:rtl;'>לשחזור סיסמא <a href='https://www.mh2.co.il/#/restore?string=" + string + "&email=" + email + "'>לחץ כאן</a></body>";
        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'mhashekel@gmail.com', // Your email id
                pass: 'zflp6g43' // Your password
            }
        });
        var mailOptions = {
            from: 'mhashekel@gmail.com', // sender address
            to: email, // list of receivers
            subject: 'שחזור סיסמא מחצית השקל', // Subject line
            //  text: "restoration email" //, // plaintext body
            html: htmlString // You can choose to send an HTML body instead
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                //console.log('Message sent: ' + info.response);
                cb();
            }
            ;
        });
    }
    mailRouter.post('/regMail', function (req, res) { //register verified email using token
        function sendVerificationMail(token, email) {
            var mail = "<body style='direction:rtl;'><a href='http://www.mh2.co.il/#/verify?string=" + token + "'>להפעלת המנוי לחץ כאן</a></body>";
            var transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'mhashekel@gmail.com', // Your email id
                    pass: 'zflp6g43' // Your password
                }
            });
            var mailOptions = {
                from: 'mhashekel@gmail.com', // sender address
                to: email, // list of receivers
                subject: 'מייל אימות משתמש ממחצית השקל', // Subject line
                html: mail //, // plaintext body
                        // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
            };
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                    res.json({yo: 'error'});
                } else {
                    //console.log('Message sent: ' + info.response);
                    res.json({yo: info.response});
                }
            });
        }
        function generateToken() {
            return Math.random().toString(36).substring(10);
        }
        var token = generateToken();
        //console.log(req.body);
        db_client.query("SELECT * FROM t_users WHERE f_name=$1", [req.body.email], function (err, result) {
            if (err) {
                console.log("ERROR! " + err);
            } else {
                //console.log("SUCCESS! " + result.rows[0]);
                if (result.rows[0]) {
                    res.json("Email already registered");
                    //console.log("Email already registered");
                } else {
                    console.log("Email not registered");
                    db_client.query("INSERT INTO t_pendingusers(f_name,f_password,f_token,f_full_name ,f_first_name,f_last_name) values($1,$2,$3, $4,$5,$6)", [req.body.email, req.body.password, token,req.body.first_name +" " + req.body.last_name, req.body.first_name,req.body.last_name]);
                    sendVerificationMail(token, req.body.email);
                }
            }
        });
        //console.log(token);
    });
	
    mailRouter.get('/logout', function (req, res) {
        var sess = req.session;
        sess.status = 0;
        sess.user = '';
        res.json("Logout completed successfully");
    });
    mailRouter.post('/getlogin', function (req, res) { //returns user or failure
        var user = req.body;
        db_client.query("SELECT * FROM t_users WHERE f_name=$1", [user.email], function (err, result) {
            //console.log(result.rows);
            if (result.rows[0] && user.pass === result.rows[0].f_password) {
                var newuser = result.rows[0];
                newuser.action = "success";
                var sess = req.session;
                sess.status = result.rows[0].f_status;
                sess.user = result.rows[0].f_name;
                if (sess.status == 2) {
                    sess.synagogue = result.rows[0].f_synagogue;
                }
                if (sess.status == 3) {
                    sess.synagogue = -1 || result.rows[0].f_synagogue;
                }
                newuser.f_password = '';
                newuser.f_facebook_password = '';
                if (newuser.f_token && newuser.f_token != '') {
                    newuser.f_token = 1;
                }
                res.json(newuser);
            } else {
                res.json("failure");
            }
        });
    });
    mailRouter.post('/verify', function (req, res) { //verify user, remove from pending users
        //console.log(req.body);
        db_client.query("SELECT * FROM t_pendingusers WHERE f_token=$1", [req.body.verify], function (err, result) {
            var newUser = {};
            if (result.rows[0]) {
                newUser = result.rows[0];
            }
            if (newUser && req.body.verify === newUser.f_token) {
                db_client.query("SELECT * FROM t_users WHERE f_name=$1", [newUser.f_name], function (err1, result1) {
                    if (!result1.rows || result1.rows.length === 0) {
                        db_client.query("INSERT INTO t_users(f_name, f_password, f_status, f_accept_mail,f_full_name, f_first_name,f_last_name) values($1, $2, $3, TRUE, $4, $5, $6)", [newUser.f_name, newUser.f_password, 1,newUser.f_first_name + " " + newUser.f_last_name , newUser.f_first_name,newUser.f_last_name]);
                        db_client.query("DELETE FROM t_pendingusers WHERE f_token=($1)", [req.body.verify]);
                        newUser.status = "success";
                        newUser.f_password = '';
                        var sess = req.session;
                        sess.status = 1;
                        sess.user = newUser.f_name;
                        res.json(newUser);
                    } else {
                        db_client.query("DELETE FROM t_pendingusers WHERE f_token=($1)", [req.body.verify]);
                        res.status(500).send("failure; duplicate user");
                    }
                });

            } else {
                res.json("failure");
            }
        });
    });
    mailRouter.post('/changePass', function (req, res) {
        db_client.query("UPDATE t_users SET f_password=$1,f_restore_string='ifyouareseeingthisstringyoucanexploitittochangeuserpasswordsviarestorescreen' WHERE f_restore_string=$2 RETURNING *", [req.body.pass, req.body.string], function (err, result) {
            if (err || result.rowCount === 0) {
//                console.log(err);
//                console.log(result);
                res.status(500).send(err || "Expired link");
            } else {
                //console.log(result);
                res.status(200).send("password changed successfully");
            }
        });
    });
    mailRouter.post('/validateRecaptcha', function (req, res) {
        function QueryStringToJSON(str) {
            var pairs = str.slice(1).split('&');

            var result = {};
            pairs.forEach(function (pair) {
                pair = pair.split('=');
                result[pair[0]] = decodeURIComponent(pair[1] || '');
            });

            return JSON.parse(JSON.stringify(result));
        }
//        console.log(req.body.response);
        if (req.body.response) {
            request({
                url: "https://www.google.com/recaptcha/api/siteverify",
                qs: {
                    secret: '6LdvNSQTAAAAAHPPaI5V-pusBkuFAAx9-9aBxaON',
                    response: req.body.response
                },
                method: "POST"
            }, function (err, response, body) {
//            request(getUrl, function (error, response, body) {

                if (err) {
                    console.log("Error in reCaptcha response:");
                    res.status(500).send(err);
                } else {
//                    response.body = "?" + response.body;
//                    var resObj = QueryStringToJSON(response.body);
//                    console.log("Response.body:");
//                    console.log(resObj);
                    //console.log(body);
                    res.json(body);
                }
            });
        } else {
            res.json({success: false});
        }
    });
    mailRouter.post('/resPass', function (req, res) { //restore password
        var email = req.body.email;
        //console.log(email);

        db_client.query("SELECT * FROM t_users WHERE f_name=$1", [email], function (err, result) {
            if (err) {
                res.status(500).send(err);
            } else {
                //console.log(result);
                if (result.rowCount === 0) {
                    res.json({"msg":1});
                } else {
                    sendRestorationMail(result.rows[0].f_name, function () {
                        res.json({"msg":0});
                    });

                }

            }
        });
    });
    return mailRouter;
};