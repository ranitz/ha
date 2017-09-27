module.exports = {
    getIP: function (req) {
        return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    },
    
    
//    authenticate: function (req, res, next) {
//        var sess = req.session;
//        if(sess.status) {
//            req.usertype=sess.status;
//        } else {
//            req.usertype=0; 
//        }
//        next();
//    }
};