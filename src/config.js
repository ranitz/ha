module.exports = {
    setup: function () {
        //getting env vars
        var cfg = {
            port: '5432',//process.env.OPENSHIFT_NODEJS_PORT || 8085,
            ip: '172.30.173.189'//process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'
        };
        //getting 
        //if (cfg.ip === "127.0.0.1") {
        //    cfg.db_url = 'postgresql://admintgqlmic:byFzDLkEpdSf@127.0.0.1:55916/has';
        //} else {
            //cfg.db_url = 'postgresql://admintgqlmic:byFzDLkEpdSf@' + process.env.OPENSHIFT_POSTGRESQL_DB_HOST + ':' + process.env.OPENSHIFT_POSTGRESQL_DB_PORT + '/has';
        //}
		cfg.db_url = 'postgresql://admintgqlmic:byFzDLkEpdSf@' + '10.128.71.54' + ':' + '5432' + '/has';

        function terminator(sig) {
            if (typeof sig === "string") {
                console.log('%s: Received %s - terminating sample app ...', Date(Date.now()), sig);
                process.exit(1);
            }
            console.log('%s: Node server stopped.', Date(Date.now()));
        }
        process.on('exit', function () { //  Process on exit and signals.
            terminator();
        });
        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
            'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function (element, index, array) {
            process.on(element, function () {
                terminator(element);
            });
        });
        return cfg;
    }
};



       