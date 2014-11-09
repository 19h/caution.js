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
	init: function (name, versions, hashes) {
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
						// AJAX request with next URL
						var request = new XMLHttpRequest;
						request.open("GET", url = urls.shift());
						request.onreadystatechange = function () {
							if (request.readyState == 4) {
								var content = request.responseText.replace(/\r/g, ''); // Normalise for consistent behaviour across webserver OS
								// Check validity
								var hash = sha256(encodeURI(content).replace(/%../g, function (part) {
									return String.fromCharCode('0x' + part[1] + part[2] - 0);
								}));
								var match = 0;
								var expected;
								while (expected = hashes.pop()) {
									match |= (EVAL('/^' + expected + '/').test(hash));
								}
								if (!((request.status/100)^2) && match) {
									return next(null, content);
								} else {
									next(1);
								}
							}
						};
						try {
							request.send();
						} catch (e) {
							next(e);
						}
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
