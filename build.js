var fs = require('fs'), path = require('path');
var uglify = require('uglify-js');
var sha256 = require('tiny-sha256');

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

var moduleCode = fs.readFileSync(__dirname + '/src/caution-main.js', {encoding: 'utf-8'});
moduleCode = moduleCode.replace('JS_SEED_CAUTION', JSON.stringify(minifiedSeed));
moduleCode = moduleCode.replace('JS_SEED_CORE', JSON.stringify(minifiedInline));
fs.writeFileSync(__dirname + '/modules/caution.js', moduleCode);

/**** Assemble list of tests ****/
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
	});
	return result;
}

var testList = walkDirectory('tests', __dirname + '/test', function (filename, isDirectory) {
	return /\.js$/.test(filename) || isDirectory;
});
console.log('found ' + testList.length + ' tests');
fs.writeFileSync(__dirname + '/test/test-list.json', JSON.stringify(testList, null, '\t'));

/**** other commands ****/

var command = process.argv[2];
var args = process.argv.slice(3);

if (command === 'release') {
	var nextVersion = args[0] || version.replace(/\.[^.]+$/, function (finalComponent) {
		return '.' + (parseInt(finalComponent.substring(1)) + 1);
	});
	
	['bower.json', 'package.json'].forEach(function (packageFile) {
		packageFile = path.join(__dirname, packageFile);
		var json = fs.readFileSync(packageFile, {encoding: 'utf-8'});
		json = json.replace(/\"version\"\s*\:\s[^,]+/, '"version": ' + JSON.stringify(nextVersion));
		fs.writeFileSync(packageFile, json);
	});
	var moduleFile = __dirname + '/releases/caution-' + nextVersion + '.js';
	fs.writeFileSync(moduleFile, moduleCode);
	var moduleMinFile = __dirname + '/releases/caution-' + nextVersion + '.min.js';
	var minifiedModuleCode = minify([moduleFile], 'main module');
	fs.writeFileSync(moduleMinFile, minifiedModuleCode);
	
	// Add hashes
	var releases = {};
	try {
		release = JSON.parse(fs.readFileSync(__dirname + '/releases/releases.json', {encoding: 'utf-8'}));
	} catch (e) {
		console.error('releases/releases.json not found: creating new one');
	}
	releases[nextVersion] = [sha256(moduleCode.replace(/\n\r/g, '\n')), sha256(minifiedModuleCode.replace(/\n\r/g, '\n'))];
	fs.writeFileSync(__dirname + '/releases/releases.json', JSON.stringify(releases, null, '\t'));
	
	require('child_process').exec('git add releases/');
	
	console.log('released version: ' + nextVersion);
} else {
	console.log('(latest release: ' + version + ')');
}