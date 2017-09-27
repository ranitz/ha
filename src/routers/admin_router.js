var nodemailer = require('nodemailer');
var request = require('request');

module.exports = function (express, db_client) {
    function auth(req, res, next) { //status authentication
        var sess = req.session;
        var usertype = sess.status || 0;
        if (usertype >= 3) {
            next();
        } else {
            res.status(403).send('Not Authenticated');
        }
    };
	
    var adminRouter = express.Router(); // get an instance of the express Router  
    adminRouter.use(auth);
	
    function sendMailToList(mail, list, cb) {
        var toList = [];
        for (i = 0; i < list.length; i++) {
            toList.push(list[i].f_name);
        }
        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'mhashekel@gmail.com', // Your email id
                pass: 'zflp6g43' // Your password
            }
        });
        var htmlString = "New message from Mahatzit Ha'shekel:<br>" + mail.content + "<br><a href='http://www.mh2.co.il/'>Mahatzit Ha'shekel</a>";
        var mailOptions = {
            from: 'mhashekel@gmail.com', // sender address
            to: toList, // list of receivers
            subject: mail.subject, // Subject line
            html: htmlString
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                cb(error);
            } else {
                cb();
            }
        });
    };
	
    adminRouter.post('/deleteSyn', function (req, res) {
        //console.log(req.body.f_id);
        db_client.query("UPDATE t_users SET f_status=1, f_synagogue=NULL WHERE f_synagogue=$1", [req.body.f_id]);
        db_client.query("DELETE FROM t_synagogues WHERE f_id=$1", [req.body.f_id], function (err, result) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.sendStatus(200);
            }
        });
    });
	
    adminRouter.post('/deleteUser', function (req, res) {
        //console.log(req.body.f_id);
        if (req.body.f_id === 15) {
            res.status(403).send("NOT AUTHORIZED");
        } else {
            db_client.query("DELETE FROM t_users WHERE f_id=$1", [req.body.f_id], function (err, result) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.sendStatus(200);
                }
            });
        }
    });
	
    adminRouter.post('/promote', function (req, res) { //make a user admin
        //console.log(req.body.f_id);
        if (req.body.f_id === 15) {
            res.status(403).send("NOT AUTHORIZED");
        } else {
            db_client.query("UPDATE t_users SET f_status=3, f_synagogue=null WHERE f_id=$1", [req.body.f_id], function (err, result) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.sendStatus(200);
                }
            });
        }
    });
	
    adminRouter.post('/demote', function (req, res) { //remove admin privilage
        //console.log(req.body.f_id);
        if (req.body.f_id === 15) {
            res.status(403).send("NOT AUTHORIZED");
        } else {
            db_client.query("UPDATE t_users SET f_status=1 WHERE f_id=$1", [req.body.f_id], function (err, result) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.sendStatus(200);
                }
            });
        }
    });
    adminRouter.get('/init', function (req, res) { //init admin object

        db_client.query("SELECT * FROM t_users ORDER BY f_id", function (err, result) {
//            console.log(result);
            if (err) {
                res.status(500).send(err);
            }
            var obj = result;
            db_client.query("SELECT * FROM t_donations", function (err1, result1) {
                if (err1) {
                    res.status(500).send(err1);
                }
                obj.donations = result1;
                res.json(obj);
            })

        });
    });
	
    adminRouter.get('/initSyns', function (req, res) {

        db_client.query("SELECT * FROM t_synagogues", function (err, result) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.json(result);
            }
        });
    });
	
    adminRouter.post('/updatePanel', function (req, res) { //update content of site 
        db_client.query("UPDATE t_content SET f_about=$1,f_terms=$2 WHERE f_lang=$3", [req.body.f_about, req.body.f_terms, req.body.f_lang], function (err, result) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.sendStatus(200);
            }
        });
    });
	
    adminRouter.post('/dateFilter', function (req, res) { //get donations by date
        var dates = req.body;
        var startDate = dates.startDate.split('T')[0] + 'T00:00:00.001Z';
        var endDate = dates.endDate.split('T')[0] + 'T23:59:59.999Z';
        db_client.query("SELECT * FROM t_donations WHERE (f_date, f_date) OVERLAPS ($1, $2)", [startDate, endDate], function (err, result) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.json(result);
            }
        });
    });
	
    adminRouter.get('/getAllDonations', function (req, res) {
        db_client.query("SELECT * FROM t_donations", function (err, result) {
            if (err || result.rows.length === 0) {
                res.sendStatus(500);
            } else {
                res.json(result.rows);
            }
        });
    });
	
    adminRouter.post('/getSyn', function (req, res) {
        var syn=req.body.syn;
        if(!syn || syn === '') {
            res.sendStatus(500);
        } else {
            db_client.query("SELECT * FROM t_synagogues WHERE f_id=$1",[syn],function(err,result) {
                if(err || result.rows.length === 0) {
                    res.status(500).send(err);
                } else {
                    res.json(result.rows[0]);
                }
            });
        }
    });
	
    adminRouter.post('/updateStatus', function (req, res) { //change a user status
        var user = req.body;
        db_client.query("UPDATE t_users SET f_status=$1 WHERE f_name=$2", [user.f_status, user.f_name]);
        res.json("Success");

    });
	
	function get_type(thing){
		if(thing===null)return "[object Null]"; // special case
		return Object.prototype.toString.call(thing);
	};
	
	function format_date(date) {
		var d = date.substring(0, 10);
		var dArray = d.split("-");
		var dString = dArray[2] + "/" + dArray[1] + "/" + dArray[0];
		return dString;
	};
	
	adminRouter.post('/addSyn', function (req, res) {
        var newSyn = req.body.newSyn;
		var newSeller = req.body.newSeller;
		var acc = newSyn.acc.split("-");
	 	request({
                url: "https://ng.paymeservice.com/api/create-seller",
                qs: {
                    "payme_client_key": "mahatzithashekel_YeUMzH0N",
					"seller_first_name": newSeller.first_name,
					"seller_last_name": newSeller.last_name,
					"seller_social_id": newSeller.social_id,
					"seller_birthdate": format_date(newSeller.birthdate),
					"seller_social_id_issued": format_date(newSeller.social_id_issued),
					"seller_gender": 0,
					"seller_email": newSyn.manager,
					"seller_phone":+"0" + newSeller.phone_number,
					"seller_bank_code": parseInt(acc[2]),
					"seller_bank_branch": parseInt(acc[1]),
					"seller_bank_account_number": acc[0],
					"seller_description": "Synagogue",
					"seller_site_url": "www.mh2.co.il",
					"seller_person_business_type": 1835,
					"seller_inc": 2,
					"seller_inc_code": "123456",
					"seller_address_city": newSeller.city,
					"seller_address_street": newSeller.street,
					"seller_address_street_number": newSeller.street_number,
					"market_fee": parseFloat(newSeller.market_fee),
					"seller_file_social_id": newSeller.file_social_id,
					"seller_file_cheque": newSeller.file_cheque,
					"seller_file_corporate": newSeller.file_corporate,
					"seller_merchant_name": newSyn.name
                }, 
				json: true,
				headers: {
					"content-type": "application/json",
					"charset": "utf-8"
				},
                method: "POST"
            }, function (err, response, body) {
                if (err) { 
					console.log("ERROR IN PAYME CREATE SELL AJAX CALL");
					console.log(err);
                    res.status(500).send(err);
                } else {
					if (response.body.status_code == 1) {
						console.log("ERROR IN PAYME CREATE SELL RESPONSE");
						res.status(500).send(response.body);
						console.log(response.body);
						return;
					}
					var seller_payme_id = response.body.seller_payme_id;
					var seller_payme_secret = response.body.seller_payme_secret;
					db_client.query("SELECT f_id, f_status FROM t_users WHERE f_name=$1", [newSyn.manager], function (err, result) {
						newSyn.manager_list = [];
						if (!result.rows[0] || !result.rows[0].f_id) {
							res.status(500).send('User does not exist');
						} else {
							if (parseInt(result.rows[0].f_status) > 1) {
								res.status(500).send('User is already a manager');
							} else {
								newSyn.manager_list.push(result.rows[0].f_id);
								var init_receipt = 9000001;
								var address = newSeller.city + ", " + newSeller.street + " " + newSeller.street_number.toString();
								db_client.query("INSERT INTO t_synagogues(f_name,f_manager_list,f_bank_account,f_association_id,f_association_name,f_receipt,f_section46,f_contact_mail,f_manager,f_address) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *", [newSyn.name, newSyn.manager_list, newSyn.acc, newSyn.association, newSyn.associationName, init_receipt, newSyn.section46, newSyn.manager, newSyn.manager, address], function (err, result) {
									if (err) {
										res.status(500).send('problem accessing DB')
									} else {
										var syn_id = result.rows[0].f_id;
										db_client.query("INSERT INTO t_sellers(f_syn_id, f_seller_payme_id, f_seller_first_name, f_seller_last_name, f_seller_social_id, f_seller_birthdate, f_seller_social_id_issued, f_seller_gender, f_seller_email, f_seller_phone, f_seller_description, f_seller_site_url, f_seller_person_business_type, f_seller_inc, f_seller_inc_code, f_seller_address_city, f_seller_address_street, f_seller_address_street_number,f_market_fee,f_seller_file_social_id, f_seller_file_cheque, f_seller_file_corporate,f_seller_merchant_name,f_seller_payme_secret) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)", [syn_id, seller_payme_id, newSeller.first_name, newSeller.last_name, newSeller.social_id, newSeller.birthdate, newSeller.social_id_issued, 0, newSyn.manager, newSeller.phone_number, "Synagogue", "www.mh2.co.il", 1835, 2, 000000, newSeller.city, newSeller.street, newSeller.street_number, newSeller.market_fee, newSeller.file_social_id, newSeller.file_cheque, newSeller.file_corporate, newSyn.name ,seller_payme_secret], function(err, result) {
											if (err) {
												console.log(err);
												res.status(500).send(err);
											} else {
												db_client.query("UPDATE t_synagogues SET f_seller_payme_id=$1 WHERE f_id=$2", [seller_payme_id, parseInt(syn_id)]);
												db_client.query("UPDATE t_users SET f_status=2, f_synagogue=$1 WHERE f_id=$2", [syn_id, newSyn.manager_list[0]]);
												res.json(result.rows);
											}
										});
									}
								});
							}
						}
					});
				}
            }); 
    });
	
    adminRouter.post('/mailList', function (req, res) {
        var obj = req.body;
        sendMailToList(obj.mail, obj.list, function (err) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.sendStatus(200);
            }
        });
    });

    return adminRouter;
};