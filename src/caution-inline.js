// Hack - UglifyJS refuses to mangle variable names when eval() or Function are used
//	therefore we use EVAL and FUNCTION, and replace them after minifying

(function (global) {
	var require = global.require = function (nameOrDeps, func) {
		if (func) {
			for (var i = 0; i < nameOrDeps.length; i++) {
				isRequired[nameOrDeps[i]] = 1;
			}
			return define(0, nameOrDeps, func)
		} else {
			isRequired[nameOrDeps] = 1;
			scan();
			if (nameOrDeps in define._m) return define._m[nameOrDeps];
			throw nameOrDeps;
		}
	};
	var define = global.define = function (name, deps, factory) {
		if (!factory) {
			factory = deps;
			deps = name || [];
			name = define._n || Math.random();
		}
		pending.push([name, deps, factory]);
	
		scan();
	};
	var isRequired = define._r = {};
	var pending = define._p = [];
	var modules = define._m = {};
	
	function scan() {
		// Scan for modules ready to evaluate
		var item;
		for (var pendingIndex = 0; item = pending[pendingIndex]; pendingIndex++) {
			var name = item[0];
			if (!name || isRequired[name]) {
				var deps = item[1];
				var value = item[2];

				var args = [];
				var depName;
				for (var j = 0; j < deps.length; j++) {
					args[j] = modules[depName = deps[j]];
					// Use item as a flag for whether we're ready to go
					item = (depName in modules) && item;
					// Mark all our dependencies as required, restarting if necessary
					if (!isRequired[depName]) {
						// Set pendingIndex to -1 to restart the sweep
						pendingIndex = isRequired[depName] = -1;
					}
				}
				if (item) { // Ready to evaluate
					pending.splice(pendingIndex, 1);
					value = (typeof value === 'function') ? value.apply(global, args) : value;
					if (name) {
						modules[name] = value;
					}
					// Set pendingIndex to -1 to restart the sweep
					pendingIndex = -1;
				}
			}
		}

		// Hook for later, so the caution module gets notified when anything happens with define() or require()
		if (define._d) define._d();
	};
	define.amd = {caution: VERSION};

	// This is the inline seed of the caution module - _m, fail() and urls() are kept on for continuity
	define._c = {
		_m: {}, // Existing modules, (name -> [url, hash]) - pending modules should have truthy values
		fail: function (name, versions, error) {
			alert('Missing safe module: ' + name + '\n' + versions.join('\n'));
		},
		urls: function (moduleName, versions, error) {
			return [];
		},
		_init: function (name, versions, hashes) {
			var thisCaution = this;
			var urls = thisCaution.urls(name, versions);
		
			hashes = hashes || versions;
		
			if (!thisCaution._m[name]) {
				thisCaution._m[name] = [];
			
				function next(error) {
					if (urls.length) {
						// AJAX request with next URL
						var request = new XMLHttpRequest;
						var url = urls.shift();
						request.open("GET", url);
						request.onreadystatechange = function () {
							if (request.readyState > 3) {
								var statusNotOK = ((request.status/100)^2);
								var content = request.responseText.replace(/\r/g, ''); // Normalise for consistent behaviour across webserver OS

								// Check validity against supplied hashes
								var hash = statusNotOK || sha256(encodeURI(content).replace(/%../g, function (part) {
									return String.fromCharCode('0x' + part[1] + part[2] - 0);
								}));
								var match = 0;
								var expected;
								while (expected = hashes.pop()) {
									match |= (EVAL('/^' + expected + '/').test(hash));
								}
							
								if (!statusNotOK && match) {
									// It maches - load it!
									define._n = name;
									thisCaution._m[name] = [url, hash];
									FUNCTION(content)();
									define._n = '';
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
						thisCaution.fail(name, versions, error);
					}
				}
				next();
			}
		}
	};
})(this);