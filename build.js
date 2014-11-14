var fs = require('fs'), path = require('path');
var uglify = require('uglify-js');

function minify(input, name) {
	var minified = uglify.minify(input);

	/* Hack for debugging
	minified = {
		code: input.map(function (f) {
			return fs.readFileSync(f, {encoding: 'utf-8'});
		}).join('\n\n')
	};
	//*/

	var code = minified.code;
	code = code.replace(/\u0080/g, '\\x80').replace(/EVAL/g, 'eval').replace(/FUNCTION/g, 'Function');

	console.log(name + ':\t' + code.length + ' chars');
	return code;
}

/*****/

var packageInfo = require('./package.json');
var version = packageInfo.version;

minify([__dirname + '/src/caution-inline-amd.js'], 'amd');
minify([__dirname + '/node_modules/tiny-sha256/sha256.js'], 'sha256');
var minifiedSeed = minify([__dirname + '/src/caution-inline-seed.js'], 'caution seed');
var minifiedInline = minify([__dirname + '/src/caution-inline-amd.js', __dirname + '/node_modules/tiny-sha256/sha256.js'], 'amd+sha256');

minifiedInline = minifiedInline.replace('VERSION', JSON.stringify(version));
fs.writeFileSync(__dirname + '/inline.js', minifiedInline);
fs.writeFileSync(__dirname + '/inline-seed.js', minifiedSeed);

var main = fs.readFileSync(__dirname + '/src/caution-main.js', {encoding: 'utf-8'});
main = main.replace('JS_SEED_CAUTION', JSON.stringify(minifiedSeed));
main = main.replace('JS_SEED_CORE', JSON.stringify(minifiedInline));
fs.writeFileSync(__dirname + '/modules/caution.js', main);

function walkDirectory(dir, prefix, filterFunction) {
	var combined = path.join(prefix || '', dir);
	var entries = fs.readdirSync(combined);
	entries.sort();
	var result = [];
	entries.forEach(function (entry) {
		entry = path.join(dir, entry);
		if (entry[0] === '.') return;
		var stats = fs.statSync(path.join(prefix || '', entry));
		var isDir = stats.isDirectory();
		if (filterFunction(entry, isDir)) {
			if (isDir) {
				result = result.concat(walkDirectory(entry, prefix, filterFunction));
			} else {
				result.push(entry.replace(/\\/g, '/'));
			}
		}
	})
	return result;
}

var testList = walkDirectory('tests', __dirname + '/test', function (filename, isDirectory) {
	return /\.js$/.test(filename) || isDirectory;
});
console.log('found ' + testList.length + ' tests');
fs.writeFileSync(__dirname + '/test/test-list.json', JSON.stringify(testList, null, '\t'));