var fs = require('fs');
var uglify = require('uglify-js');

function minify(input, name) {
	var minified = uglify.minify(input);

	var code = minified.code;
	code = code.replace(/\u0080/g, '\\x80').replace('EVAL', 'eval');

	console.log(name + ':\t' + code.length + ' chars');
	return code;
}

function dataUrl(code, type) {
	var codeBuffer = new Buffer(code, 'utf-8');
	return 'data:' + (type || 'text/html') + ';base64,' + codeBuffer.toString('base64');
}

/*****/

var packageInfo = require('./package.json');
var version = packageInfo.version;

minify([__dirname + '/src/caution-inline.js'], 'inline only')
var minified = minify([__dirname + '/src/caution-inline.js', __dirname + '/node_modules/tiny-sha256/sha256.js'], 'inline+sha');
minified = minified.replace('VERSION', JSON.stringify(version));
fs.writeFileSync('inline.js', minified);

var main = fs.readFileSync(__dirname + '/src/caution.js', {encoding: 'utf-8'});
main = main.replace('INLINE', JSON.stringify(minified));
fs.writeFileSync('caution.js', main);

var exampleCode = minified + 'caution.add("main", "2c38d1ca6c43184c49e3c71d77af359ddaf88ce8f44f6c1455ff69393b129cb7", ["main.js"]);';

var html = '<script>' + exampleCode + '</script>';
var dataUrl = dataUrl(html);
console.log('Data URL: ' + dataUrl.length + ' chars');