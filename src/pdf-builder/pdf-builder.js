var spawn = require('child_process').spawn;
var path = require('path');
module.exports = {
    createPDF: function (htmlString, fileName, callback) {
        if (typeof callback !== "function") {
            throw 'Callback function must be provided. sinature function(err , filePath)';
        }
        if (typeof htmlString !== "string") {
            throw 'htmlString must be a string';
        }
        if (typeof fileName !== "string") {
            throw 'fileName must be a string';
        }
        var debug = false;
        try {
            if (process.env.OPENSHIFT_NODEJS_IP) {
                if (debug)
                    console.log('prod');
                //phantom_binary_path = process.env.OPENSHIFT_DATA_DIR + 'bin/phantomjs';
                phantom_binary_path = path.resolve(__dirname + '/bin/linux/phantomjs');
                phantom_output_path = process.env.OPENSHIFT_DATA_DIR + 'tmp';
            } else {
                if (debug)
                    console.log('dev');
                phantom_binary_path = path.resolve(__dirname + '/bin/win/');
                phantom_output_path = __dirname + '/tmp';
            }

            var phantom_args = [path.resolve(__dirname + '/phantom-script/pdf_a4_portrait.js')];
            var child_process;
            if (process.env.OPENSHIFT_NODEJS_IP) {
                child_process = spawn(phantom_binary_path, phantom_args);
            } else {
                child_process = spawn('phantomjs', phantom_args, {cwd: phantom_binary_path});
            }

            var timeout = setTimeout(function () {
                child_process.stdin.end();
                child_process.kill();
                callback(new Error("timeout occured - pdf-builder take more time that needed!"));
            }, 10000);

            child_process.stdout.on('data', function (data) {
                if (debug)
                    console.log("phantom child process stdout data :");
                var data_utf8 = data.toString('utf8');
                var message = JSON.parse(data_utf8);
                if (debug)
                    console.log((message));
                if (message.status && message.status === 'ready') {
                    var res = JSON.stringify({html: htmlString, options: {filename: path.resolve(phantom_output_path + '/' + fileName)}});
                    if (debug)
                        console.log('res');
                    if (debug)
                        console.log(res);
                    child_process.stdin.write(res + '\n', 'utf8');
                } else if (message.status && message.status === 'done') {
                    clearTimeout(timeout);
                    callback(null, path.resolve(phantom_output_path + '/' + fileName));
                }

            });
            child_process.stderr.on('data', function (data) {
                console.log('phantom child process stderr data:');
                console.log(data.toString('utf8'));
            });
            child_process.on('exit', function (code) {
                if (debug)
                    console.log("phantom child process exited with code [" + code + "]");
            });
            child_process.on('error', function (error) {
                console.log('phantom child process error:');
                console.log(error);
                clearTimeout(timeout);
                callback(error);
            });
        } catch (error) {
            console.log(error);
            callback(error);
        }
    }
};