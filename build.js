var fs = require('fs');
var uglify = require('uglify-js');

function minify(input, output) {
	var minified = uglify.minify(input);

	var code = minified.code;
	code = code.replace(/\u0080/g, '\\x80').replace('EVAL', 'eval');

	console.log(output + ': ' + code.length + ' chars');
	fs.writeFileSync(output, code);
	return code;
}

function dataUrl(code, type) {
	var codeBuffer = new Buffer(code, 'utf-8');
	return 'data:' + (type || 'text/html') + ';base64,' + codeBuffer.toString('base64');
}

minify([__dirname + '/src/caution-inline.js'], 'inline.js')
var minified = minify([__dirname + '/src/caution-inline.js', __dirname + '/node_modules/tiny-sha256/sha256.js'], 'inline.js')

var exampleCode = minified + 'caution.add("main", "2c38d1ca6c43184c49e3c71d77af359ddaf88ce8f44f6c1455ff69393b129cb7", ["main.js"]);';

var html = '<script>' + exampleCode + '</script>';
var dataUrl = dataUrl(html);
console.log('Data URL: ' + dataUrl.length + ' chars');

fs.writeFileSync('index.html', html);
