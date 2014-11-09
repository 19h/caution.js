var define = function define(name, deps, factory) {
	var pending = define._p = define._p || [];
	var modules = define._m = define._m || {};

	if (!factory) {
		factory = deps || name;
		deps = (deps && name) || [];
		name = define._n || Math.random();
	}
	pending.push([name, deps, factory]);
	
	// Hook for later, so the caution module can tell when a module is mentioned
	if (define._d) define._d(deps);
	
	// Scan for modules ready to evaluate
	for (var i = 0; i < pending.length; i++) {
		var item = pending[i];
		var deps = item[1];
		var j = 0;
		for (var j = 0; j < deps.length; j++) {
			item = (deps[j] in modules) && item;
		}
		if (item) { // Ready to evaluate
			var factory = item[2];
			var args = [];
			for (var j = 0; j < deps.length; j++) {
				args[j] = modules[deps[j]];
			}
			pending.splice(i, 1);
			modules[item[0]] = (typeof factory === 'function') ? factory.apply(window, args) : factory;
			i = -1;
			continue;
		}
	}
};

var caution = {
	_m: {}, // Existing modules, (name -> [url, hash])
	fail: function (name, versions) {
		alert('Missing safe module: ' + name + '\n' + versions.join('\n'));
	},
	urls: function (moduleName, versions) {
		return [];
	},
	get: function (url, isValid, callback) {
		var thisCaution = this;
		var request = new XMLHttpRequest;
		request.open("GET", url);
		request.onreadystatechange = function () {
			if (request.readyState == 4) {
				var content = request.responseText.replace(/\r/g, ''); // Normalise for consistent behaviour across webserver OS
				if (!((request.status/100)^2) && isValid(content)) {
					return callback(null, content);
				} else {
					callback(1);
				}
			}
		};
		try {
			request.send();
		} catch (e) {
			callback(e);
		}
	},
	init: function (name, versions, hashes) {
		function isValid(text) {
			var hash = sha256(encodeURI(text).replace(/%../g, function (part) {
				return String.fromCharCode('0x' + part[1] + part[2] - 0);
			}));
			var expected;
			while (expected = hashes.pop()) {
				if (hash.substring(0, expected.length) == expected) return 1;
			}
			return 0;
		}
		hashes = hashes || versions;

		var thisCaution = this;
		var urls = thisCaution.urls(name, versions);
		var i = 0;
		var url;
		
		if (!thisCaution._m[name]) {
			thisCaution._m[name] = [];
			function next(error, js, hash) {
				if (error) {
					if (urls.length) {
						thisCaution.get(url = urls.shift(), isValid, next);
					} else {
						thisCaution.fail(name, versions);
					}
				} else {
					define._n = name;
					thisCaution._m[name] = [url, hash];
					EVAL(js); // Hack - UglifyJS refuses to mangle variable names when eval() is used, so this is replaced after minifying
					define._n = '';
				}
			}
			next(1);
		}
	}
};
define.amd = {caution: VERSION};
