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
			throw 1;
		}
	};
	var define = global.define = function define(name, deps, factory) {
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
		// Hook for later, so the caution module gets notified when anything happens with define() or require()
		// This has to be after pending.push(), so caution can inspect everything
		if (define._d) define._d();
	
		// Scan for modules ready to evaluate
		for (var pendingIndex = 0; pendingIndex < pending.length; pendingIndex++) {
			var item = pending[pendingIndex];
			var name = item[0];
			if (!name || isRequired[name]) {
				var deps = item[1];
				var factory = item[2];

				var args = [];
				for (var j = 0; j < deps.length; j++) {
					var dep = deps[j];
					args[j] = modules[dep];
					// Use item as a flag for whether we're ready to go
					item = (dep in modules) && item;
					if (!isRequired[dep]) {
						pendingIndex = isRequired[dep] = -1;
					}
				}
				if (item) { // Ready to evaluate
					pending.splice(pendingIndex, 1);
					item = (typeof factory === 'function') ? factory.apply(global, args) : factory;
					if (name) {
						modules[name] = item;
					}
					pendingIndex = -1;
				}
			}
		}
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