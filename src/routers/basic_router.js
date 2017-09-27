var path = require('path');
var request = require('request');
var nodemailer = require('nodemailer');
var pdf_builder = require('../../src/pdf-builder/pdf-builder');
var fs = require('fs');
var https = require('https');
var md5 = require("nodejs-md5");


module.exports = function (express, db_client) {

    function printIP(req) {
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        //console.log('IP: ' + ip);
    }

    function sendChangeMail(request, successCb, errorCb) { //send mail to verify an email change
        var string = Math.random().toString(36).slice(3, 15);
        db_client.query("UPDATE t_users SET f_restore_string=$1, f_pending_email=$2 WHERE f_id=$3", [string, request.newEmail, request.id]);
        var htmlString = "<a href='http://www.mh2.co.il/#/changemail?string=" + string + "&email=" + request.newEmail + "'>Verify Email</a>";
        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'mhashekel@gmail.com', // Your email id
                pass: 'zflp6g43' // Your password
            }
        });
        var mailOptions = {
            from: 'mhashekel@gmail.com', // sender address
            to: request.newEmail, // list of receivers
            subject: 'Email verification from MHashekel', // Subject line
            //  text: "restoration email" //, // plaintext body
            html: htmlString // You can choose to send an HTML body instead
        };
		
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                errorCb(error);
            } else {
                //console.log('Message sent: ' + info.response);
                successCb();
            };
        });
    }
    function sendXlsxEmail(filepath, to, cb) { //send mail containing excel sheet
        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'mhashekel@gmail.com', // Your email id
                pass: 'zflp6g43' // Your password
            }
        });
        var mailOptions = {
            from: 'mhashekel@gmail.com', // sender address
            to: to, // list of receivers
            subject: 'הודעה חדשה ממחצית השקל', // Subject line
            html: "<h2>מצורף קובץ אקסל של התרומות שהתבקשו</h2>",
            //text: textMail //, // plaintext body
            attachments: [{
                    filename: 'list.xlsx',
                    path: filepath,
                }]
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                cb();
            } else {
                //console.log('Message sent: ' + info.response);
                cb();
            }
        });
    };

    function sendContactEmail(mail, successCb, errorCb) { //send mail from form of Contact page
        var htmlMail = "<div style='text-align:center; direction:rtl;'><h2>הודעה חדשה מאת</h2><h2>" + mail.email + "</2><h3>" + mail.subject + "</h3><p>" + mail.content + "</p></div>";
        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'mhashekel@gmail.com', // Your email id
                pass: 'zflp6g43' // Your password
            }
        });
        var mailOptions = {
            from: 'mhashekel@gmail.com', // sender address
            to: 'MahatzitHashekel@gmail.com', // list of receivers
            subject: 'הודעה חדשה ממחצית השקל', // Subject line
            html: htmlMail
                    //text: textMail //, // plaintext body
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                errorCb(error);
            } else {
                //console.log('Message sent: ' + info.response);
                successCb();
            }
        });
    }

    function sendConfirmationMail(donation, receipt_number) {  //send receipt for a donation. can also be used to restore receipt since function actually creates the pdf and then deletes it

        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'mhashekel@gmail.com', // Your email id
                pass: 'zflp6g43' // Your password
            }
        });
        var htmlMail = "";
        var htmlMailCopy = "";
        var sendMail = function (htmlMail, pdf_file_name, msg_format, to, cb) {
            pdf_builder.createPDF(htmlMail, pdf_file_name, function (err, filepath) {
                var pdfSuccess = false;
                var mailOptions = {};
                if (err) {
                    console.log("error from pdf: " + err + ". Sending receipt as HTML");
                    mailOptions = {
                        from: 'mhashekel@gmail.com', // sender address
                        to: to, // list of receivers
                        subject: 'קבלה חדשה ממחצית השקל!', // Subject line
                        html: htmlMail
                                //text: textMail //, // plaintext body
                    };
                } else {
                    pdfSuccess = true;
                    //console.log("pdf done");
                    //console.log(filepath);
                    mailOptions = {
                        from: 'mhashekel@gmail.com', // sender address
                        to: to, // list of receivers
                        subject: 'קבלה חדשה ממחצית השקל!', // Subject line
                        //html: '<h2 style="text-align:center">תודה על תרומתך דרך אתר מחצית השקל!</h2><h3 style="text-align:center">קבלה מצורפת למייל זה</h3>',
                        html: msg_format,
                        attachments: [{
                                filename: 'receipt.pdf',
                                path: filepath,
                                contentType: 'application/pdf'
                            }]
                                //text: textMail //, // plaintext body
                    };
                }
                transporter.sendMail(mailOptions, function (error, info) {
                    if (pdfSuccess === true) {
                        fs.unlink(filepath);
                    }
                    if (error) {
                        console.log(error);
                    } else {
                        //console.log('Message sent: ' + info.response);
                    }
                    cb();
                });
            });
        };

        db_client.query("SELECT f_name, f_association_id, f_section46, f_manager, f_contact_mail FROM t_synagogues WHERE f_id=$1", [donation.synagogue], function (err, result) {
            var date = new Date();
            var formatDate = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
            var synName = result.rows[0].f_name;
            var assoc = result.rows[0].f_association_id;
            var section46html = '';
            if (result.rows[0].f_section46 === true) {
                section46html = "<h4 style='text-align:center'>מוכר לפי סעיף 46</h4>";
            } else {
                section46html = '<br>';
            }
            htmlMail = "<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0' ></head><body> <h1 style='text-align:center;width:50%;margin:auto'>בית כנסת " + synName + "</h1><h4 style='text-align:center;width:50%;margin:auto'>מספר עמותה " + assoc + "</h4> " + section46html + "<hr><div style='float:right;font-weight:bold;font-size:large'>-מסמך ממוחשב-</div><div style='float:left;font-weight:bold;font-size:large'>מקור</div><br><div style='direction:rtl'><br> <u>לכבוד</u><br><br>" + donation.full_name + "<br><h2 style='text-align:center'>קבלה מספר " + receipt_number + "</h2><br><br><p>תאריך: " + formatDate + "</p><p>סכום: " + donation.sum + " ₪</p><p>עבור תרומה ל: " + donation.for + "</p><p>שולם באמצעות: כרטיס אשראי</p><p>אסמכתא: " + donation.Tempref + "</p><p style='text-align:center'>תודה על תרומתך!</p></div></body>";
            htmlMailCopy = "  <h1 style='text-align:center;width:50%;margin:auto'>בית כנסת " + synName + "</h1><h4 style='text-align:center;width:50%;margin:auto'>מספר עמותה " + assoc + "</h4> " + section46html + "<hr><div style='float:right;font-weight:bold;font-size:large'>-מסמך ממוחשב-</div><div style='float:left;font-weight:bold;font-size:large'>העתק</div><br><div style='direction:rtl'><br> <u>לכבוד</u><br><br>" + donation.full_name + "<br><h2 style='text-align:center'>קבלה מספר " + receipt_number + "</h2><br><br><p>תאריך: " + formatDate + "</p><p>סכום: " + donation.sum + " ₪</p><p>עבור תרומה ל: " + donation.for + "</p><p>שולם באמצעות: כרטיס אשראי</p><p>אסמכתא: " + donation.Tempref + "</p><p style='text-align:center'>תודה על תרומתך!</p></div>";
            var pdf_file_name = donation.Tempref + '.pdf';
            var pdf_file_name_copy = donation.Tempref + 'COPY.pdf';
            var msgFormat = '<h2 style="text-align:center">!תודה על תרומתך דרך אתר מחצית השקל</h2><h3 style="text-align:center">קבלה מצורפת למייל זה</h3>';
            sendMail(htmlMail, pdf_file_name, msgFormat, donation.name, function () {
                var to = ['MahatzitHashekel@gmail.com'];
                if (result.rows[0].f_contact_mail && result.rows[0].f_contact_mail!== '') {
                    to.push([result.rows[0].f_contact_mail]);
                }
                msgFormat = "<body style='direction:rtl;'><h2 style='text-align:center'>התקבלה תרומה חדשה</h2><h4 style='text-align:center'>גבאי יקר מצורף בזאת העתק קבלה,<br> זכור להעביר קבלה זו להנהלת חשבונות!</h4></body>";
                sendMail(htmlMailCopy, pdf_file_name_copy, msgFormat, to, function () {
                    //console.log('done');
                });
            });
        });
    }
	
  /*   function notify(body, cb) { //notify the server of a donation both successfull and failed
        var expparsed = body.expmonth + body.expyear;
        if (body.Response === '000') { //000=success
            if (!body.for || body.for === '') {
                body.for = "תרומה";
            }
            var receipt_number = 0;
            db_client.query("SELECT f_receipt FROM t_synagogues WHERE f_id=$1", [body.synagogue], function (err, result) {
                receipt_number = result.rows[0].f_receipt;
                sendConfirmationMail(body, receipt_number);
                var date = new Date();
                db_client.query("INSERT INTO t_donations(f_name,f_sum,f_synagogue_key,f_date,f_receipt_number,f_for,f_tempref,f_synagogue,f_full_name) values($1,$2,$3,$4,$5,$6,$7,$8,$9)", [body.name, body.sum, body.synagogue, date.toJSON(), receipt_number, body.for, body.Tempref, body.synagogue_name, body.full_name]);
                receipt_number = receipt_number + 1;
                db_client.query("UPDATE t_synagogues SET f_receipt=$1 WHERE f_id=$2", [receipt_number, body.synagogue]);
            });
            console.log('Donation completed successfully');
            if (body.save && body.save === "on") {
                db_client.query("UPDATE t_users SET f_token=$1, f_expdate=$2 WHERE f_name=$3", [body.TranzilaTK, expparsed, body.name]);
            }
            cb();
        } else {
            console.log('Donation failed! response error:' + body.Response);
            var blah = "status: " + body.Response;
            cb(new Error(blah));
        }
    }; */
	
    var router = express.Router(); // get an instance of the express Router  

	router.get('/getImage/:name', function (req, res) { //route to create a link to images uploaded to openshit data dir
		//console.log(req.params.name);
		db_client.query("SELECT f_img, f_imgurl FROM t_synagogues WHERE f_id = $1", [req.params.name], function (err, result) {
			if (result.rows[0] && result.rows[0].f_img && result.rows[0].f_img !== "") {
				var buffer1 = new Buffer(result.rows[0].f_img, 'base64');
				res.set('Content-Type', result.rows[0].f_imgurl);
				res.send(buffer1);
			} else {
				res.send('not found');
			}
		});
    });
	
    router.get('/refreshUser', function (req, res) {
            db_client.query("SELECT * FROM t_users WHERE f_name=$1",[req.session.user], function (err, result) {
            if (err) {
                res.sendStatus(500);
            } else {
                res.json(result.rows[0]);
            }
        });
    });
	
    router.get('/getContent', function (req, res) {
        db_client.query("SELECT * FROM t_content", function (err, result) {
            if (err) {
                res.sendStatus(500);
            } else {
                res.json(result.rows);
            }
        });
    });
	
    router.post('/contact', function (req, res) {
        sendContactEmail(req.body, function () {
            res.sendStatus(200);
        }, function (err) {
            res.status(500).send(err);
        });
    });
	
    router.post('/insertNewMail', function (req, res) { //update user mail after changing
        var obj = req.body;
        db_client.query("SELECT * from t_users WHERE f_name=$1", [obj.email], function (err, result) {
            if (err) {
                res.status(500).send(err);
            } else {
                if (result.rows.length > 0) {
                    res.status(500).send('User already exists!!!!!');
                } else {
                    if (!obj.email || !obj.string) {
                        res.status(500).send('Missing data');
                    } else {
                        db_client.query("SELECT * from t_users WHERE f_pending_email=$1", [obj.email], function (error, result) {
                            if (error) {
                                res.status(500).send('Data incorrect');
                            } else {
                                var user = result.rows[0];
                                if (user.f_restore_string === obj.string) {
                                    db_client.query("UPDATE t_users SET f_name=$1,f_pending_email=null WHERE f_restore_string=$2 AND f_pending_email=$3", [obj.email, obj.string, obj.email], function (err, result) {
                                        if (err) {
                                            res.status(500).send(err);
                                        } else {
                                            res.sendStatus(200);
                                        }
                                    });
                                } else {
                                    res.status(500).send('Data incorrect');
                                }
                            }
                        });
                    }
                }
            }
        });
    });
	
    router.get('/getmail', function (req, res) { //this route creates a receipt with the details as set in the sendConfirmationMail funct. can be used to create a receipt restoration system
        //console.log('getmail');
        sendConfirmationMail({Response: '000', name: 'ory.tabak@gmail.com', sum: '10', synagogue: '2', Tempref: '345242342', for : 'תרומה', full_name: 'אורי טבק'}, '53634534534');
        res.status(200).send('done');
    });
	
    router.get('/deleteUser', function (req, res) { //user can only delete himself as saved in session in server-side
        var user = req.session.user;
        //console.log(user);
        db_client.query("DELETE FROM t_users WHERE f_name=$1", [user], function (err, result) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.sendStatus(200);
            }
        });
    });
	
    router.get('/get_ses', function (req, res) { //print session
        //console.log("Cookies: ");
        //console.log(req.cookies);
        //console.log("Session: ");
        //console.log(req.session);
        if (req.session && req.session.authenticated) {
            res.json({status: 'ok'});
        } else {
            res.json({status: 'failed'});
        }
    });
	
    router.get('/initUserDonations', function (req, res) {
        var obj = {};
        var user = req.session.user;
        db_client.query("SELECT * FROM t_donations WHERE f_name=$1", [user], function (err, result) {
            obj.donations = result.rows;
            db_client.query("SELECT * FROM t_users WHERE f_name=$1", [user], function (err, result) {
                obj.user = result.rows;
                res.json(obj);
            });
        });
    });
	
    router.post('/mailPref', function (req, res) { //change mail prefrence for user
        var pref = req.body.allow;
        db_client.query("UPDATE t_users SET f_accept_mail=$1 WHERE f_name=$2", [pref, req.session.user], function (err, result) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.sendStatus(200);
            }
        });
    });
	
    router.post('/excel', function (req, res) { //create excel workbook from req.body
        var donations = req.body;
        var Excel = require('exceljs');
        var workbook = new Excel.Workbook();
        workbook.creator = 'Me';
        workbook.lastModifiedBy = 'Me';
        workbook.created = new Date();
        workbook.modified = new Date();
        var worksheet = workbook.addWorksheet(req.session.user);
        worksheet.columns = [
            {header: '#', key: 'id', width: 10},
            {header: 'אימייל', key: 'email', width: 32},
            {header: 'בית כנסת', key: 'synagogue', width: 32},
            {header: 'סכום', key: 'sum', width: 32},
            {header: 'תאריך', key: 'date', width: 32},
            {header: 'מספר קבלה', key: 'receipt_number', width: 32}
        ];
        for (var i = 0; i < donations.length; i++) {
            worksheet.addRow({id: donations[i].f_id, email: donations[i].f_name, sum: donations[i].f_sum, date: donations[i].f_date.slice(0, 10), receipt_number: donations[i].f_receipt_number, synagogue: donations[i].f_synagogue});
        }
        workbook.xlsx.writeFile("temp.xlsx")
                .then(function () {

                    sendXlsxEmail("temp.xlsx", req.session.user, function () {
                        fs.unlink("temp.xlsx");
                        //console.log('done');
                        res.sendStatus(200);

                    });
                });
    });

    router.get('/removeToken', function (req, res) {
        var userName = req.session.user;
        db_client.query("UPDATE t_users SET f_token=null WHERE f_name=$1", [userName], function (err, result) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.sendStatus(200);
            }
        });
    });
	
    router.post('/getDonations', function (req, res) {
        db_client.query("SELECT * FROM t_donations WHERE f_name=$1", [req.body.f_name], function (err, result) {
            res.json(result.rows);
        });
    });

    router.post('/follow', function (req, res) {
        var request = req.body;
        db_client.query("update t_users set f_synagogue_list = array_append(f_synagogue_list,$1) where f_id = $2", [request.syn, request.user]);
        res.json('Done');
    });
	
    router.post('/unfollow', function (req, res) {
        var request = req.body;
        db_client.query("update t_users set f_synagogue_list = array_remove(f_synagogue_list,$1) where f_id = $2", [request.syn, request.user]);
        res.json('Done');
    });
	
    router.post('/changeEmail', function (req, res) { //request to send verification email for email change
        var sess = req.session;
        var request = req.body;
        db_client.query("SELECT * from t_users WHERE f_name=$1", [request.newEmail], function (err, result) {
            if (err) {
                res.status(500).send(err);
            } else {
                if (result.rows.length > 0) {
                    res.status(500).send('User already exists!!!!!');
                } else {
                    if (sess.user === request.oldEmail) {
                        sendChangeMail(request, function () {
                            res.status(200).send('Email Sent');
                        }, function (err) {
                            res.status(500).send('Error' + err);
                        });
                    } else {
                        res.status(500).send("Not authorized");
                    }
                }
            }
        });
    });
	
    router.post('/changePass', function (req, res) {
        var obj = req.body;
        //console.log(obj);
        db_client.query('SELECT * FROM t_users WHERE f_id=$1', [obj.id], function (err, result) {
            if (err || result.rows.length === 0) {
                res.sendStatus(500);
            } else {
                var user = result.rows[0];
                if (obj.oldPass !== user.f_password) {
                    res.status(500).send('INCORRECT PASSWORD');
                } else {
                    db_client.query('UPDATE t_users SET f_password=$1 WHERE f_name=$2', [obj.newPass, req.session.user], function (err, result) {
                        if (err) {
                            res.sendStatus(500);
                        } else {
                            res.status(200).send("Password changed successfully!");
                        }
                    });
                }
            }
        });
    });
	
    router.post('/updateUser', function (req, res) {
        var user = req.body;
        db_client.query("update t_users set f_full_name = $1 where f_id = $2", [user.f_full_name, user.f_id]);
        res.json('Done');
    });

    router.post('/dateFilter', function (req, res) {
        var dates = req.body;
        var startDate = dates.startDate.split('T')[0] + 'T00:00:00.001Z';
        var endDate = dates.endDate.split('T')[0] + 'T23:59:59.999Z';
        if (dates.synagogue) {
            db_client.query("SELECT * FROM t_donations WHERE f_name=$1 AND f_synagogue_key=$4 AND (f_date, f_date) OVERLAPS ($2, $3)", [dates.user, startDate, endDate, dates.synagogue], function (err, result) {
                if (err) {
                    console.log(err);
                    res.status(500).send(err);
                } else {
                    res.json(result);
                }
            });
        } else {
            db_client.query("SELECT * FROM t_donations WHERE f_name=$1 AND (f_date, f_date) OVERLAPS ($2, $3)", [dates.user, startDate, endDate], function (err, result) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.json(result);
                }
            });
        }
    });
	
    router.post('/postform', function (req, res) {
        //console.log(req.body);
        res.redirect('/#/success');
    });

    router.post('/success', function (req, res) { //for tranzila
        //console.log("success: " + Date(Date.now()));
        //console.log(req.body);
        res.sendFile(path.join(__dirname + '/../../public/templates/success.html'));
    });
	
	router.post('/failure', function (req, res) { //for tranzila
        //console.log("failure: " + Date(Date.now()));
        //console.log(req.body);
        res.sendFile(path.join(__dirname + '/../../public/templates/failure.html'));
    });
	
	/* router.post('/donateToken', function (req, res) {
        function QueryStringToJSON(str) {
            var pairs = str.slice(1).split('&');
            var result = {};
            pairs.forEach(function (pair) {
                pair = pair.split('=');
                result[pair[0]] = decodeURIComponent(pair[1] || '');
            });
            return JSON.parse(JSON.stringify(result));
        }
        var token = '';
        var expdate = '';
        var donation = req.body;
        var userName = req.session.user;
        db_client.query("SELECT f_token, f_expdate, f_full_name FROM t_users WHERE f_name=$1", [userName], function (err, result) {
            token = result.rows[0].f_token;
            expdate = result.rows[0].f_expdate;
            request({
				url: "https://preprod.paymeservice.com/api/generate-sale",
                qs: {
                    buyer_key: token
                },
                method: "POST"
            }, function (err, response, body) {
                if (err) {
                    console.log("Error in PAYME response:");
                    console.log(err);
                    console.log(response);
                    console.log(body);
                    res.status(500).send(err);
                } else {
                    response.body = "?" + response.body;
                    var resObj = QueryStringToJSON(response.body);
                    console.log("Response.body:");
                    console.log(resObj);

                    notify(resObj, function (err) {
                        if (err) {
                            res.status(500).send(err);
                        } else {
                            res.json(resObj);
                        }
                    });
                }
            });
        });
    });
	
    router.post('/notify', function (req, res) {
        notify(req.body, function (err) {
            if (err) {
                res.sendStatus(500);
            } else {
                res.sendStatus(200);
            }
        });
    }); */
	
	router.post('/getPaymeToken', function(req, res) {
		    db_client.query("SELECT f_token, f_expdate, f_full_name FROM t_users WHERE f_name=$1", [req.body.user], function (err, result) {
				if (err) {
					res.sendStatus(500);
				} else {
					if (result.rows[0] && result.rows[0].f_token && result.rows[0].f_token !== "") {
						token = result.rows[0].f_token;
						//expdate = result.rows[0].f_expdate;
						//res.json({"status":0, "payme_token": token, "expdate": expdate});
						res.json({"status":0, "payme_token": token});
					} else {
						res.json({"status": 1});
					}
				}
			});
	});
	
	router.post('/payme', function (req, res) {
		var signature = md5.string.quiet(("mahatzithashekel_YeUMzH0N" + "00QKCDdHVENvsDQT" + req.body.payme_transaction_id + req.body.payme_sale_id));
		if (signature !== req.body.payme_signature) {
			console.log("PAYME - PROBLEM IN SIGNATURE");
			return;
		}
		request({
			url: "https://ng.paymeservice.com/api/get-sales",
			qs: {
				"payme_client_key": "mahatzithashekel_YeUMzH0N",
				"sale_payme_id": req.body.payme_sale_id
			}, 
			json: true,
			headers: {
				"content-type": "application/json",
				"charset": "utf-8"
			},
			method: "POST"
		}, function (err, response, body) {
			if (err) { 
				console.log("ERROR IN PAYME GET SALE RESPONSE");
				console.log(err);
				res.status(500).send(err);
			} else {
				if (response.body.status_code == 1) {
					res.status(500).send(response.body);
					return;
				}
				var seller_payme_id = response.body.items[response.body.items.length-1].seller_payme_id;
				var for_donate = response.body.items[response.body.items.length-1].sale_description;
				var date = response.body.items[response.body.items.length-1].sale_created;		
				var syn_id = 0;
				db_client.query("SELECT f_id FROM t_synagogues WHERE f_seller_payme_id=$1", [seller_payme_id], function (err, result) {
					if (err) {
						res.status(500).send(err);
					} else {
						syn_id = result.rows[0].f_id;
						if (req.body.status_code === '0' && req.body.payme_status === "success") {  
							var receipt_number = 0;
							db_client.query("SELECT f_receipt, f_name, f_id FROM t_synagogues WHERE f_id=$1", [syn_id], function (err, result) {
								receipt_number = result.rows[0].f_receipt;
								db_client.query("INSERT INTO t_donations(f_name,f_sum,f_synagogue_key,f_date,f_receipt_number,f_for,f_tempref,f_synagogue,f_full_name,f_sale_payme_id) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)", [req.body.buyer_email, req.body.price / 100, result.rows[0].f_id, date, receipt_number, for_donate, req.body.payme_transaction_auth_number, result.rows[0].f_name, req.body.buyer_name, req.body.payme_sale_id], function (err, result) {
									if (err) {
										console.log("FAILED INSERT T_DONATIONS");
										res.status(500).send(err);
									}
								});
								receipt_number = receipt_number + 1;
								db_client.query("UPDATE t_synagogues SET f_receipt=$1 WHERE f_id=$2", [receipt_number, result.rows[0].f_id]);
								if (req.body.buyer_key && req.body.buyer_key != '') {
									db_client.query("UPDATE t_users SET f_token=$1 WHERE f_name=$2", [req.body.buyer_key, req.body.buyer_email]);
								}
							});
						  /*   if (body.save && body.save === "on") {
								db_client.query("UPDATE t_users SET f_token=$1, f_expdate=$2 WHERE f_name=$3", [body.TranzilaTK, expparsed, body.name]);
							}
							cb(); */
						}
						else {
							console.log('Donation failed! response error:' + body.Response);
							var blah = "status: " + body.Response;
							cb(new Error(blah));
						}
						res.sendStatus(200);
					}
				});   
			}
		});
	});
		/*
	router.post('/saveSale' , function (req, res) {
		console.log(req.body);
		db_client.query("INSERT INTO t_sales(f_syn_id, f_seller_payme_id, f_sale_
_id) values($1, $2, $3)", [req.body.syn_id, req.body.seller_payme_id, req.body.payme_sale_id]);
	});
	*/

    router.get('/SynagogueList', function (req, res) {
        db_client.query("SELECT f_id,f_name,f_manager_list,f_address,f_content,f_imgurl,f_messages,f_association_name,f_association_id,f_section46,f_contact_mail, f_times , f_seller_payme_id FROM t_synagogues ORDER BY f_id", function (err, result) {
            res.json(result);
        });
    });
	
    router.post('/updateSynList', function (req, res) {
        db_client.query("UPDATE t_users SET f_synagogue_list=$1 WHERE f_id=$2", [req.body.synList, req.body.user]);
        res.sendStatus(200);
    });

    router.get('/set_ses', function (req, res) {
        //console.log("set_ses: ");
        //console.log("Cookies: ");
        //console.log(req.cookies);
        //console.log("Session: ");
        var sess = req.session;
        //console.log(sess);
        sess.authenticated = true;
        res.json({status: 'ok'});
    });

    router.post('/FaceBookLogin', function (req, res) {
        var stat = req.body.stat;
        var path = "/me?fields=email,name&access_token=" + req.body.shortToken;
        var inReq = https.request({
            host: 'graph.facebook.com',
//          path: '/oauth/access_token', //in order to extend token (short one - 2hours for long one - 60 days
            path: path,
            method: 'GET'
        }, function (result) {
            result.setEncoding('utf8');
            result.on('data', function (chunk) {
                var ans = JSON.parse(chunk);
                var facepass = ans.email + ans.id;
                if (!ans.email || ans.email === '') {
                    res.status(500).send('Must have email to register');
                } else {
                    db_client.query("SELECT * FROM t_users WHERE f_name=$1", [ans.email], function (err, result) {
                        if (err) {
                            res.status(500).send(err);
                        } else {
                            if (result.rows.length === 0) {
                                db_client.query("INSERT INTO t_users(f_name, f_password, f_status, f_accept_mail, f_facebook_password, f_full_name) values($1, $2, $3, TRUE, $4, $5)", [ans.email, 'somepass', 1, facepass, ans.name]);
                                req.session.status = 1;
                                req.session.user = ans.email;
                                res.json({f_name: ans.email, f_status: 1});
                            } else {
                                var user = result.rows[0];
                                if (user.f_facebook_password && user.f_facebook_password != '') {
//                     
                                    if (user.f_facebook_password != facepass) {
                                        res.status(500).send('authentication error');
                                    } else {
                                        req.session.status = user.f_status;
                                        req.session.user = user.f_name;
                                        res.json(user);
                                    }
                                } else {
                                    if (!user.f_full_name || user.f_full_name === '') {
                                        db_client.query("UPDATE t_users SET f_full_name=$1 WHERE f_name=$2", [ans.name, user.f_name]);
                                    }
                                    db_client.query("UPDATE t_users SET f_facebook_password=$1 WHERE f_name=$2", [facepass, user.f_name]);
                                    req.session.status = user.f_status;
                                    req.session.user = user.f_name;
                                    res.json(user);
                                }
                            }
                        }
                    });
                }
                //res.json({email: ans.email, number: ans.id, name: ans.name});
            });
            result.on('end', function () {
            });
        }, function (err) {
            console.log(err);
            res.status(500).send(err);
        });
        inReq.end();
    });

    return router;
};