var fs = require('fs');
var uglify = require('uglify-js');

function minify(input, name) {
	var minified = uglify.minify(input);

	var code = minified.code;
	code = code.replace(/\u0080/g, '\\x80').replace(/EVAL/g, 'eval').replace(/FUNCTION/g, 'Function');

	console.log(name + ':\t' + code.length + ' chars');
	return code;
}

/*****/

var packageInfo = require('./package.json');
var version = packageInfo.version;

minify([__dirname + '/src/caution-inline.js'], 'inline only')
var minified = minify([__dirname + '/src/caution-inline.js', __dirname + '/node_modules/tiny-sha256/sha256.js'], 'inline+sha');
minified = minified.replace('VERSION', JSON.stringify(version));

var main = fs.readFileSync(__dirname + '/src/caution.js', {encoding: 'utf-8'});
main = main.replace('INLINE', JSON.stringify(minified));
fs.writeFileSync('modules/caution.js', main);