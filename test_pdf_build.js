var spawn = require('child_process').spawn;
var path = require('path');
var phantom_binary_path;
var phantom_output_path;
var root_path = __dirname;
if (process.env.OPENSHIFT_NODEJS_IP) {
    console.log('prod');
//    phantom_binary_path = process.env.OPENSHIFT_DATA_DIR + 'bin/phantomjs';
    phantom_binary_path = path.resolve(root_path + '/bin/linux/phantomjs');
    phantom_output_path = process.env.OPENSHIFT_DATA_DIR + 'tmp';

} else {
    console.log('dev');
    phantom_binary_path = path.resolve(root_path + '/bin/win/');
    phantom_output_path = root_path + '/tmp';
}
var phantom_args = [path.normalize(root_path + '/bin/pdf_a4_portrait.js')];
var test_html = "<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0' ></head><body> <h1 style='text-align:center;width:50%;margin:auto'>בית כנסת נחלת יצחק</h1><h4 style='text-align:center;width:50%;margin:auto'>מספר עמותה 453543541</h4> <h4 style='text-align:center'>מוכר לפי סעיף 46</h4><hr><div style='float:right;font-weight:bold;font-size:large'>-מסמך ממוחשב-</div><div style='float:left;font-weight:bold;font-size:large'>מקור</div><br><div style='direction:rtl'><br> <u>לכבוד</u><br><br>אורי טבק<br><h2 style='text-align:center'>קבלה מספר 53634534534</h2><br><br><p>תאריך: 25/5/2016</p><p>סכום: 10 ₪</p><p>עבור תרומה ל: תרומה</p><p>שולם באמצעות: כרטיס אשראי</p><p>אסמכתא: 345242342</p><p style='text-align:center'>תודה על תרומתך!</p></div></body>";
console.log('phantom_binary_path: ' + phantom_binary_path);
console.log('phantom_output_path: ' + phantom_output_path);
console.log('phantom_args: ' + phantom_args);

var child_process;
if (process.env.OPENSHIFT_NODEJS_IP) {
    child_process = spawn(phantom_binary_path, phantom_args);
} else {
    child_process = spawn('phantomjs', phantom_args, {cwd: phantom_binary_path});
}
child_process.stdout.on('data', function (data) {
    console.log("phantom child process stdout data :");
    var data_utf8 = data.toString('utf8');
    var message = JSON.parse(data_utf8);
    console.log((message));
    if (message.status && message.status === 'ready') {
        var res = JSON.stringify({html: test_html, options: {filename: path.resolve(phantom_output_path + '/' + 'test_file' + '.pdf')}});
        console.log('res');
        console.log(res);
        child_process.stdin.write(res + '\n', 'utf8');
    }

});
child_process.stderr.on('data', function (data) {
    console.log('phantom child process stderr data:');
    console.log(data.toString('utf8'));
});
child_process.on('exit', function (code) {
    console.log("phantom child process exited with code [" + code + "]");
});
child_process.on('error', function (error) {
    console.log('phantom child process error:');
    console.log(error);
});
