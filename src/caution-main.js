(function (global) {
	// JS code for the inline seed
	var inlineJs = INLINE;

	// Evaluate the seed (we need sha256() anyway), but we don't replace define() unless we need to
	var func = new Function(inlineJs + 'return {define: define, sha256: sha256};');
	var result = func.call(global);
	
	// Set up the global "define" if it doesn't already exist
	if (typeof define !== 'function' || !define.amd || !define.amd.caution) {		
		define = global.define = result.define;
	}
	// Extract the seed - we keep existing definitions for _m, urls(), and fail(), but everything else is defined here
	var caution = define._c; // Yeah, that's a bit bad
	
	var sha256 = result.sha256;
	function sha256unicode(text) {
		var encoded = encodeURI(text).replace(/%../g, function (part) {
			return String.fromCharCode('0x' + part[1] + part[2] - 0);
		});
		return sha256(encoded);
	}
	
	function asap(func) {
		var args = Array.prototype.slice.call(arguments, 1);
		setTimeout(function () {
			func.apply(this, args);
		}, 4);
	}

	// Converts a string/object (for URLs) into a JS expression (string or array result)
	function templateToCode(entry) {
		if (typeof entry === 'string') {
			return '[' + entry.split(/\{.*?\}/g).map(function (part) {
				return JSON.stringify(part);
			}).join('+m+') + ']';
		} else {
			return JSON.stringify(entry) + '[m]||[]';
		}
	}
	
	/**** Methods ****/
	
	caution.get = function (url, isSafe, callback) {
		if (typeof callback[0] === 'string') throw new Error('!!!');
		var request = new XMLHttpRequest;
		isSafe = isSafe || caution.isSafe;
		if (typeof isSafe === 'string' || typeof isSafe === 'object') {
			var hashes = [].concat(isSafe);
			isSafe = function (text, hash) {
				for (var i = 0; i < hashes.length; i++) {
					if (hash.substring(0, hashes[i].length) == hashes[i]) return hash;
				}
				return false;
			};
		} else if (isSafe === true) {
			isSafe = function (text, hash) {
				return hash;
			};
		}
		
		request.open("GET", url);
		request.onreadystatechange = function () {
			if (request.readyState == 4) {
				var content = request.responseText.replace(/\r/g, ''); // Normalise for consistent behaviour across webserver OS
				var hash;
				if (request.status < 200 || request.status >= 300) {
					asap(callback, new Error('Response code not OK (' + request.status + '): ' + url));
				} else if (hash = isSafe(content, sha256unicode(content))) {
					asap(callback, null, content, hash);
				} else {
					asap(callback, new Error('Content was not safe: ' + url));
				}
				// Chrome (maybe others?) does weird things when trying to request a file:// resource
				// It first calls this callback, and *then* throws, so the callback is sent out twice
				callback = function () {};
			}
		};
		try {
			request.send();
		} catch (e) {
			asap(callback, e);
		}
	};
	
	caution.getFirst = function (urls, isSafe, callback) {
		var i = 0;
		var errors = [], errorMessages = [];;
		var url;
		function next(error, text, hash) {
			if (!error) return callback(null, text, hash, url);

			errors.push(error);
			errorMessages.push(error.message);
			if (i >= urls.length) {
				errors.shift();
				errorMessages.shift();
				var error = new Error('Error fetching (' + errors.length + ' attempts)\n\t' + errorMessages.join('\n\t'));
				error.errors = errors;
				return callback(error);
			}
			url = urls[i++];
			caution.get(url, isSafe, next);
		}
		next(new Error('No URLs supplied'));
	};
	
	var pendingDebugLoads = [];
	function runNextDebugLoad() {
		if (pendingDebugLoads.length) {
			var func = pendingDebugLoads[0];
			func(function () {
				pendingDebugLoads.shift();
				runNextDebugLoad();
			});
		}
	}
	function addDebugLoad(func) {
		pendingDebugLoads.push(func);
		if (pendingDebugLoads.length === 1) {
			runNextDebugLoad();
		}
	}

	var codeTransformFunctions = [];
	caution.addLoadTransform = function (func) {
		codeTransformFunctions.push(func);
	};
	
	function transformCode(name, js) {
		for (var i = 0; i < codeTransformFunctions.length; i++) {
			var func = codeTransformFunctions[i];
			js = func(name, js) || js;
		}
		return js;
	}
	
	function loadModuleJs(name, js, hash, url) {
		var originalJs = caution.DEBUG && js;
		js = transformCode(name, js);
		if (url && caution.DEBUG && originalJs === js) {
			// Loading via <script> is not secure (the server could return a different version second time), but it allows inspection
			console.log('caution.load() success: ', name);
			addDebugLoad(function (callback) {
				var oldName = define._n;
				define._n = name;
				var script = document.createElement('script');
				script.src = url;
				script.onload = function () {
					// We're about to execute
					setTimeout(function () {
						define._n = oldName;
						caution._m[name] = [url, hash];
						callback();
					}, 10);
				};
				document.head.appendChild(script);
			});
		} else {
			var oldName = define._n;
			define._n = name;
			caution._m[name] = [url, hash];
			Function(js)();
			define._n = oldName;
		}
	}
	
	var cacheSaveFunctions = [], cacheLoadFunctions = [];
	caution.addLoad = function (loadFunction) {
		cacheLoadFunctions.push(loadFunction);
	};
	caution.addSave = function (saveFunction) {
		cacheSaveFunctions.push(saveFunction);
	};
	
	/*
	// Try using localStorage;
	var ls;
	try {
		ls = localStorage;
	} catch (e) {
		// Do nothing
		console.log('localStorage not available');
	}
	if (ls) {
		caution.addCache(function (name, js) {
			ls['cautionModule:' + name] = js;
		}, function (name, versions, callback) {
			var js = ls['cautionModule:' + name];
			if (typeof js === 'string') {
				callback(null, js);
			} else {
				callback(true);
			}
		});
	}
	*/
	
	caution.load = function (name, versions, noCache) {
		if (caution._m[name]) return;
		caution._m[name] = [];

		versions = versions ? [].concat(versions) : [];

		var options = noCache ? [] : cacheLoadFunctions.slice(0);
		function next() {
			if (options.length) {
				// Try alternative fetching functions first
				var func = options.shift();
				func(name, versions, function (error, js, hash) {
					if (!error && (hash = caution.isSafe(js, hash))) {
						loadModuleJs(name, js, hash, null);
					} else {
						next();
					}
				});
			} else {
				// Fetch via AJAX
				var urls = caution.urls(name, versions);
				caution.getFirst(urls, null, function (error, js, hash, url) {
					if (error) {
						if (!define._m[name]) {
							caution.fail(name, versions);
						}
					} else {
						for (var i = 0; i < cacheSaveFunctions.length; i++) {
							var func = cacheSaveFunctions[i];
							func(name, js, hash, url);
						}
						loadModuleJs(name, js, hash, url);
					}
				});
			}
		}
		next();
	};
	
	caution.loadShim = function (name, versions, returnValue, deps) {
		versions = versions ? [].concat(versions) : [];
		var urls = caution.urls(name, versions);
		caution._m[name] = name;
		deps = deps || [];

		caution.getFirst(urls, null, function (error, js, hash, url) {
			if (error) return caution.fail(name, versions);

			caution._m[name] = [url, hash];
			
			// Hide define(), in case the code tries to call it
			code = 'var define = undefined;\n';
			code += js;
			code += 'return ' + (returnValue || name) + ';';
			var func = Function.apply(null, deps.concat(code));
			define(name, deps, func);
		});
	};
	
	/* caution.urls() is defined in the inline seed */

	caution.addUrls = function (funcs) {
		funcs = [].concat(funcs);
		for (var i = 0; i < funcs.length; i++) {
			if (typeof funcs[i] !== 'function') {
				// Might as well use the code-generation logic, as it's already defined
				funcs[i] = new Function('m', 'h', 'return [].concat(' + templateToCode(funcs[i]) + ')');
			}
		}
		funcs.unshift(caution.urls); // Old function
		caution.urls = function (m, h) {
			var result = [];
			for (var i = 0; i < funcs.length; i++) {
				var func = funcs[i];
				result = result.concat(func(m, h));
			}
			return result;
		};
	};
	
	var validationFunctions = [];
	caution.isSafe = function (text, hash) {
		hash = hash || sha256unicode(text);
		for (var i = 0; i < validationFunctions.length; i++) {
			var func = validationFunctions[i];
			if (func(text, hash)) return hash;
		}
		return false;
	};
	caution.addSafe = function (func) {
		if (typeof func !== 'function') {
			var hashes = [].concat(func); // array of hashes
			func = function (text, hash) {
				for (var i = 0; i < hashes.length; i++) {
					if (hash.substring(0, hashes[i].length) == hashes[i]) return true;
				}
				return false;
			};
		}
		validationFunctions.push(func);
	};
	caution.addSafe(caution.hashes || []);
	
	caution.dataUrl = function (config, customCode) {
		var html = '<!DOCTYPE html><html><body><script>' + caution.inlineJs(config, customCode) + '</script></body></html>';
		
		if (typeof btoa === 'function') {
			return 'data:text/html;base64,' + btoa(html);
		} else {
			return 'data:text/html,' + encodeURI(html);
		}
	};
	
	caution.inlineJs = function (config, customCode) {
		var js = inlineJs;
		js = js.replace(/urls\:[^\}]*?\}/, function (def) {
			var code = config.paths.map(templateToCode);
			return 'urls:function(m){return[].concat(' + code.join(',') + ')}';
		});
		js = js.replace(/return VERIFICATION\((.*?)\)/, function (block, hashVar) {
			var hashes = config.hashes || [];
			var code = hashes.map(function (hash) {
				hash = hash.toLowerCase().replace(/[^0-9a-f]/g, '');
				return '/' + hash + '/.test(' + hashVar + ')';
			}).join('||');
			if (code) {
				return 'return' + code;
			} else {
				return 'return 0';
			}
		});
		if (config.DEBUG) {
			js += 'define._c.DEBUG=true;';
		}
		for (var key in config.load) {
			js += 'define._c._init(' + JSON.stringify(key) + ',' + JSON.stringify([].concat(config.load[key])) + ');';
		}
		
		customCode = customCode || '';
		if (typeof customCode === 'object') {
			var vars = [];
			for (var key in customCode) {
				vars.push(key + '=' + JSON.stringify(customCode[key]));
			}
			customCode = 'var ' + vars.join(',') + ';';
		}
		return js + customCode;
	};
	
	caution.moduleHash = function (moduleName) {
		if (moduleName) return (caution._m[moduleName] || [])[1];
		
		var result = {};
		for (var key in caution._m) {
			result[key] = caution._m[key][1];
		}
		return result;
	};
	
	/**** hack for missing dependencies ****/
	
	var knownModules = {};
	var missingHandlers = [];
	caution.missingModules = function (func) {
		if (!func) {
			var result = [];
			for (var key in knownModules) {
				// Known but not yet handled
				if (!caution._m[key] && !define._m[key]) result.push(key);
			}
			return result;
		} else {
			asap(function () {
				var missing = caution.missingModules();
				for (var i = 0; i < missing.length; i++) {
					if (func(missing[i])) {
						// Mark as handled
						caution._m[key] = caution._m[key] || true;
					}
				}
				missingHandlers.unshift(func);
			});
		}
	};
	
	function scanDependencies(deps) {
		var pending = global.define._p || [];
		for(var j = 0; j < pending.length; j++) {
			deps = pending[j][1];
			for (var i = 0; i < deps.length; i++) {
				var moduleName = deps[i];
				if (moduleName && !knownModules[moduleName]) {
					knownModules[moduleName] = true;
					// Call the handlers in sequence
					for (var j = 0; j < missingHandlers.length; j++) {
						if (caution._m[moduleName] || define._m[moduleName]) break;
						var func = missingHandlers[j];
						if (func(moduleName)) {
							// Mark it as handled
							caution._m[moduleName] = caution._m[moduleName] || [];
							break;
						}
					}
				}
			}
		}
	}
	
	// Hacky hook into define() so we get told about every dependency
	global.define._d = function () {
		var pending = global.define._p || [];
		if (!pending.length) return;
		
		var triplet = pending[pending.length - 1];
		var name = triplet[0];
	
		if (name) {
			knownModules[name] = true;
			caution._m[name] = caution._m[name] || [null, null];
		}
		asap(scanDependencies);
	};
	// We already know about currently-defined and pending modules
	var pending = global.define._p || [];
	for (var moduleName in global.define._m) {
		knownModules[moduleName] = true;
	}
	for (var i = 0; i < pending.length; i++) {
		knownModules[pending[i][0]] = true;
	}
	// Loop through pending entries to find missing dependencies
	scanDependencies();
	
	define('caution', [], caution);
})(this || window);