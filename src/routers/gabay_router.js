var nodemailer = require('nodemailer');
var multer = require('multer'); //file uploads m-ware
var fs = require('fs');
//FOR DISK STORAGE USING - NOT GOOD FOR SCALABILTY  IN OPENSHIFT
//var storage = multer.diskStorage({//storing files in openshift data_dir - does not work in development
//    destination: function (req, file, cb) {
//        cb(null, process.env.OPENSHIFT_DATA_DIR + '/images/');
//    },
//    filename: function (req, file, cb) {
////    cb(null, file.fieldname + '-' + Date.now()+"."+file.mimetype.split('/')[1])
////    console.log(req.body);
//        cb(null, req.session.user + '-' + Date.now() + "." + file.mimetype.split('/')[1]);
//    }
//});
//var upload = multer({storage: storage});


var storage = multer.memoryStorage();
//var upload = multer({storage: storage});
var upload = multer({storage: storage, limits: {fileSize: 2 * 1024 * 1024}
		/* 	,onFileSizeLimit: function (file) {
				console.log('Failed: ', file.originalname);
				fs.unlink('./' + file.path) // delete the partially written file
			},
			onFileUploadStart: function(file, req, res){
				console.log(file.fieldname + ' fileupload is starting ...');
				if(req.files.file.length > 2 * 1024 * 1024) {
				  console.log(file.fieldname + ' file is too big');
				  return false;
				}
			},
			onFileUploadComplete: function (file) {
				console.log("FINISHED UPLOADING");
			}	 */
});

module.exports = function (express, db_client) {
    function auth(req, res, next) { //auth for user status
        var sess = req.session;
        var usertype = sess.status || 0;
        if (typeof usertype === 'string') {
            usertype = parseInt(usertype);
        }
        if (usertype === 3) {
            next();
        } else {
            if (usertype === 2) { //status>=2 is user over or equal gabay
                if (req.body.synagogue && req.body.synagogue !== '') {
                    var syn = parseInt(req.body.synagogue);
//            console.log(typeof syn);
                    if (parseInt(sess.synagogue) === -1 || parseInt(sess.synagogue) === syn) { // -1 is for admin, number is synagogue id
                        next();
                    } else {
                        res.status(403).send('Not Authenticated');
                    }
                } else {
                    next();
                }
            } else {
                res.status(403).send('Not Authenticated');
            }
        }
    }
    var router = express.Router(); // get an instance of the express Router  
    router.use(auth); //every req goes thru auth function
    function sendMailToList(mail, list, cb) { //mail obj sent to list of users
        var toList = [];
        for (i = 0; i < list.length; i++) {
            toList.push(list[i].f_name);
        }
        //console.log(toList);
        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'mhashekel@gmail.com', // Your email id
                pass: 'zflp6g43' // Your password
            }
        });
        var htmlString = "";

        if (mail.sum) {
            htmlString = "<body style='direction:rtl;'>" + "הודעה חדשה מאת " + mail.syn + ":<br>" + mail.content + "<br><a href='http://www.mh2.co.il/#/donate?synagogue=" + mail.synid + "&sum=" + mail.sum + "'>תרום עכשיו!</a>";
        } else {
            htmlString = "<body style='direction:rtl;'>" + "הודעה חדשה מאת " + mail.syn + ":<br>" + mail.content + "<br><a href='http://www.mh2.co.il/#/donate?synagogue=" + mail.synid + "'>תרום עכשיו!</a>";

        }
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
    }


    router.post('/init', function (req, res) { //init gabay obj from database
//        console.log(req.body);
        var obj = {};
        db_client.query("SELECT * FROM t_donations WHERE f_synagogue_key=$1", [req.body.f_synagogue], function (err, result) {
            obj.donations = result.rows;
            db_client.query("SELECT * FROM t_synagogues WHERE f_id=$1", [req.body.f_synagogue], function (err, result) {
                obj.data = result.rows[0];
                //console.log(result);
                db_client.query("SELECT f_name, f_full_name FROM t_users WHERE $1=any(f_synagogue_list)", [req.body.f_synagogue], function (err, result) {
                    obj.followers = result.rows;
                    db_client.query("SELECT f_name, f_id, f_full_name FROM t_users WHERE f_synagogue=$1", [req.body.f_synagogue], function (err, result) {
                        obj.managers = result.rows;
                        res.json(obj);
                    });
                });
            });
        });
    });
    router.post('/updateSyn', function (req, res) {
        var syn = req.body;
        syn.f_bank_account = syn.f_bank_account[0]+'-'+syn.f_bank_account[1]+'-'+syn.f_bank_account[2];
        db_client.query("UPDATE t_synagogues SET f_address=$1,f_content=$2,f_imgurl=$3,f_bank_account=$4,f_contact_mail=$5, f_association_name=$6, f_association_id=$7, f_times=$8 WHERE f_id=$9", [syn.f_address, syn.f_content, syn.f_imgurl, syn.f_bank_account, syn.f_contact_mail, syn.f_association_name, syn.f_association_id, syn.f_times, syn.f_id]);
        res.json('Success');
    });
    router.post('/addMessage', function (req, res) { //add message to news
        if (!req.body.message || req.body.message === '' || req.body.message.length > 80) {
            res.status(500).send('bad input');
        } else {
            db_client.query("SELECT f_messages FROM t_synagogues WHERE f_id=$1", [req.body.synagogue], function (err, result) {
                if (err) {
                    res.status(500).send('bad input');
                } else {
                    //console.log(typeof result.rows[0].f_messages);

                    if (result.rows[0].f_messages && result.rows[0].f_messages.length > 20) {
                        res.status(500).send('Too many messages');
                    } else {
                        db_client.query("update t_synagogues set f_messages = array_append(f_messages,$1) where f_id = $2", [req.body.message, req.body.synagogue]);
                        res.json('Success');
                    }

                }
            });

        }

    });
    router.post('/removeMessage', function (req, res) {
        db_client.query("update t_synagogues set f_messages = array_remove(f_messages,$1) where f_id = $2", [req.body.message, req.body.synagogue]);
        res.json('Success');
    });
    router.post('/getTotal', function (req, res) { //init function returns total sum of donations to synagogue
        var synId = req.body.synagogue;
        db_client.query("SELECT f_sum FROM t_donations WHERE f_synagogue_key=$1", [synId], function (err, result) {
            if (err) {
                res.status(500).send(err);
            } else {
                var total = 0;
                var donations = result.rows;
                var i = donations.length;
                while (i--) {
                    total += parseInt(donations[i].f_sum);
                }
                res.json(total);
            }
        });
    });
    router.post('/getAllDonations', function (req, res) {
        db_client.query("SELECT * FROM t_donations WHERE f_synagogue_key=$1", [req.body.syn], function (err, result) {
            if (err || result.rows === 0) {
                res.sendStatus(500);

            } else {
                res.json(result.rows);
            }
        });
    });
	
    //router.post('/fileupload', upload.single('file'), function (req, res) {
	router.post('/fileupload', function (req, res) {
        //console.log(req.body);
		upload.single('file')(req, res, function (err) {
			if (err) {
			  // An error occurred when uploading 
			  res.status(500).send(err);
			  return
			}
			// Everything went fine 
			console.log('GOT FILE');
			//console.log(req.file.buffer.toString('base64'));
			//debug
			//res.set('Content-Type', 'image/png');
			//res.send(req.file.buffer);

			db_client.query("SELECT f_synagogue FROM t_users WHERE f_name=$1", [req.session.user], function (err, result) {
				db_client.query("UPDATE t_synagogues SET f_img=$1, f_imgurl=$3 WHERE f_id=$2", [req.file.buffer.toString('base64'), result.rows[0].f_synagogue, req.file.mimetype], function (err, result) {
					if (err) {
						console.log(err);
					} else {
						res.json("File Uploaded Successfully");
					}
					//TODO if err need to response with err
					//res.redirect("back");
				});
			});
	    })
        
		//USING DISK STORAGE - NOT GOOD FOR SCALABILITY IN OPENSHIFT
		//        db_client.query("SELECT f_synagogue FROM t_users WHERE f_name=$1", [req.session.user], function (err, result) {
		//            db_client.query("SELECT f_imgurl FROM t_synagogues WHERE f_id=$1", [result.rows[0].f_synagogue], function (err, tmpres) {
		//                if (tmpres.rows[0] && tmpres.rows[0].f_imgurl && tmpres.rows[0].f_imgurl !== '') {
		//                    fs.unlink(process.env.OPENSHIFT_DATA_DIR + '/images/' + tmpres.rows[0].f_imgurl, function (err) {
		//                        if (err)
		//                            console.log(err);
		//                    });
		//                }
		//                db_client.query("UPDATE t_synagogues SET f_imgurl=$1 WHERE f_id=$2", [req.file.filename, result.rows[0].f_synagogue], function (err, result) {
		//                    res.redirect("back");
		//                });
		//            });
		//        });


    });
	
    router.post('/dateFilter', function (req, res) { //return donations by date
        var dates = req.body;
        //console.log(dates);
        var startDate = dates.startDate.split('T')[0] + 'T00:00:00.001Z';
        //console.log(startDate);
        var endDate = dates.endDate.split('T')[0] + 'T23:59:59.999Z';
        //console.log(endDate);
        db_client.query("SELECT * FROM t_donations WHERE f_synagogue_key=$1 AND (f_date, f_date) OVERLAPS ($2, $3)", [dates.synagogue, startDate, endDate], function (err, result) {
            if (err) {
                res.status(500).send(err);
            } else {
                //console.log(result);
                res.json(result);
            }
        });
    });
	
    router.post('/mailList', function (req, res) {
        var obj = req.body;

        sendMailToList(obj.mail, obj.followers, function (err) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.sendStatus(200);
            }
        });


    });
    router.post('/removeManager', function (req, res) {
        var obj = req.body;
        db_client.query("UPDATE t_users SET f_status=1, f_synagogue=null WHERE f_id=$1", [obj.manager]);
        db_client.query("UPDATE t_synagogues SET f_manager_list = array_remove(f_manager_list,$1) WHERE f_id = $2 RETURNING f_manager_list", [obj.manager, obj.synagogue], function (err, result) {
            res.json(result.rows);
        });

    });
    router.post('/updateManager', function (req, res) { //function for both adding manager and updating main manager
        var obj = req.body;
        var syn = {};
        var user = {};
        db_client.query("SELECT * FROM t_synagogues WHERE f_id=$1", [obj.synagogue], function (err, result) {
            if (result.rows[0].length === 0) {
                res.status(500).send('synagogue does not exist');
            } else {
                syn = result.rows[0];
                db_client.query("SELECT * FROM t_users WHERE f_name=$1", [obj.manager], function (err, result) {
                    if (result.rows.length === 0) {
                        res.status(500).send('user does not exist');
                    } else {
                        user = result.rows[0];
                        if (user.f_status < 2 || syn.f_manager_list.indexOf(user.f_id) >= 0) {
                            db_client.query("UPDATE t_users SET f_status=2, f_synagogue=$1 WHERE f_id=$2", [syn.f_id, user.f_id], function (err, result) {
                                if (syn.f_manager_list && syn.f_manager_list.length) {
                                    var i = syn.f_manager_list.indexOf(user.f_id);
                                    if (i > 0) {
                                        syn.f_manager_list.splice(i, 1);
                                    }
                                    if (obj.main === true) {
                                        syn.f_manager_list.unshift(user.f_id);
                                    } else {
                                        syn.f_manager_list.push(user.f_id);
                                    }

                                } else {
                                    syn.f_manager_list = [user.f_id];
                                }

                                db_client.query("UPDATE t_synagogues SET f_manager_list=$1 WHERE f_id=$2 RETURNING f_manager_list", [syn.f_manager_list, syn.f_id], function (err, result) {
                                    res.json(result.rows);
                                });
                            });
                        } else {
                            res.status(500).send('user is already a manager');
                        }


                    }
                });
            }
        });

    });
    return router;
};