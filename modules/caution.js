(function (global) {
	// JS code for the seed
	var jsSeedCore = "!function(r){function n(){for(var n,o=0;n=i[o];o++){var e=n[0];if(!e||t[e]){for(var u,c=n[1],h=n[2],v=[],_=0;_<c.length;_++)v[_]=a[u=c[_]],n=u in a&&n,t[u]||(o=t[u]=-1);n&&(i.splice(o,1),h=\"function\"==typeof h?h.apply(r,v):h,e&&(a[e]=h),o=-1)}}f._d&&f._d()}var o=(r.require=function(r,o){if(o){for(var i=0;i<r.length;i++)t[r[i]]=1;return f(0,r,o)}if(t[r]=1,f._m[r]||n(),r in f._m)return f._m[r];throw r},0),f=r.define=function(r,t,a){r&&r+\"\"!==r?(a=t||r,t=t?r:[],r=f._n||\"_anon\"+o++):a||(a=t,t=[]),i.push([r,t,a]),n()},t=f._r={},i=f._p=[],a=f._m={};f.amd={caution:\"0.6.0\"}}(this);var sha256=function r(n){function o(r,n){return r>>>n|r<<32-n}for(var f,t,i=Math.pow,a=i(2,32),e=\"length\",u=\"\",c=[],h=8*n[e],v=r.h=r.h||[],_=r.k=r.k||[],l=_[e],p={},s=2;64>l;s++)if(!p[s]){for(f=0;313>f;f+=s)p[f]=s;v[l]=i(s,.5)*a|0,_[l++]=i(s,1/3)*a|0}for(n+=\"\\x80\";n[e]%64-56;)n+=\"\\x00\";for(f=0;f<n[e];f++){if(t=n.charCodeAt(f),t>>8)return;c[f>>2]|=t<<(3-f)%4*8}for(c[c[e]]=h/a|0,c[c[e]]=h,t=0;t<c[e];){var d=c.slice(t,t+=16),m=v;for(v=v.slice(0,8),f=0;64>f;f++){var g=d[f-15],k=d[f-2],w=v[0],y=v[4],S=v[7]+(o(y,6)^o(y,11)^o(y,25))+(y&v[5]^~y&v[6])+_[f]+(d[f]=16>f?d[f]:d[f-16]+(o(g,7)^o(g,18)^g>>>3)+d[f-7]+(o(k,17)^o(k,19)^k>>>10)|0),q=(o(w,2)^o(w,13)^o(w,22))+(w&v[1]^w&v[2]^v[1]&v[2]);v=[S+q|0].concat(v),v[4]=v[4]+S|0}for(f=0;8>f;f++)v[f]=v[f]+m[f]|0}for(f=0;8>f;f++)for(t=3;t+1;t--){var x=v[f]>>8*t&255;u+=(16>x?0:\"\")+x.toString(16)}return u};";
	var jsSeedCaution = "define._c={_m:{},fail:function(e,n){alert(\"Missing safe module: \"+e+\"\\n\"+n.join(\"\\n\"))},urls:function(){return[]},load:function(e,n,t){function r(f){if(i.length){var o=new XMLHttpRequest,s=i.shift();o.open(\"GET\",s),o.onreadystatechange=function(){if(o.readyState>3){for(var n,i=o.status/100^2,f=o.responseText.replace(/\\r/g,\"\"),c=i||sha256(encodeURI(f).replace(/%../g,function(e){return String.fromCharCode(\"0x\"+e[1]+e[2]-0)})),u=0;n=t.pop();)u|=eval(\"/^\"+n+\"/\").test(c);!i&&u?(a._m[define._n=e]=[s,c],Function(f)(),define._n=\"\"):r(1)}};try{o.send()}catch(c){r(c)}}else a.fail(e,n,f)}var a=this,i=a.urls(e,n);t=t||n,a._m[e]||(a._m[e]=[],r())}};";

	// Evaluate the seed (we need sha256() anyway), but we don't replace define() unless we need to
	var func = new Function(jsSeedCore + jsSeedCaution + 'return {define: define, sha256: sha256};');
	var result = func.call(global);
	
	// Set up the global "define" if it doesn't already exist
	if (typeof define !== 'function' || !define.amd || !define.amd.caution) {		
		define = global.define = result.define;
	}
	// Extract the seed - we keep existing definitions for _m, urls(), and fail(), but everything else is defined here
	var caution = define._c || {};
	
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
			isSafe = function (text, hash, url) {
				for (var i = 0; i < hashes.length; i++) {
					if (hash.substring(0, hashes[i].length) == hashes[i]) return hash;
				}
				return false;
			};
		} else if (isSafe === true) {
			isSafe = function (text, hash, url) {
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
				} else if (hash = isSafe(content, sha256unicode(content), url)) {
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
	
	caution.load = function (name, versions, isSafe) {
		if (caution._m[name]) return;
		caution._m[name] = [];

		versions = versions ? [].concat(versions) : [];

		var options = cacheLoadFunctions.slice(0);
		function next() {
			if (options.length) {
				// Try alternative fetching functions first
				var func = options.shift();
				func(name, versions, function (error, js, hash, url) {
					if (!error && (hash = caution.isSafe(js, hash, url || null))) {
						loadModuleJs(name, js, hash, url || null);
					} else {
						next();
					}
				});
			} else {
				// Fetch via AJAX
				var urls = caution.urls(name, versions);
				caution.getFirst(urls, isSafe || null, function (error, js, hash, url) {
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
	caution.isSafe = function (text, hash, url) {
		hash = hash || sha256unicode(text);
		for (var i = 0; i < validationFunctions.length; i++) {
			var func = validationFunctions[i];
			if (func(text, hash, url)) return hash;
		}
		return false;
	};
	caution.addSafe = function (func) {
		if (typeof func !== 'function') {
			var hashes = [].concat(func); // array of hashes
			func = function (text, hash, url) {
				for (var i = 0; i < hashes.length; i++) {
					if (hash.substring(0, hashes[i].length) == hashes[i]) return true;
				}
				return false;
			};
		}
		validationFunctions.push(func);
	};
	
	caution.dataUrl = function (config, customCode) {
		customCode = config.init || '';
		if (typeof customCode === 'object') {
			var vars = [];
			for (var key in customCode) {
				vars.push(key + '=' + JSON.stringify(customCode[key]));
			}
			customCode = 'var ' + vars.join(',') + ';';
		}

		var html = '<!DOCTYPE html><html><body><script>' + caution.inlineJs(config) + '</script><script id="init">' + customCode + '</script></body></html>';
		
		if (typeof btoa === 'function') {
			return 'data:text/html;base64,' + btoa(html);
		} else {
			return 'data:text/html,' + encodeURI(html);
		}
	};
	
	caution.inlineJs = function (config) {
		var customCaution = jsSeedCaution.replace(/urls\:[^\}]*?\}/, function (def) {
			var code = config.paths.map(templateToCode);
			return 'urls:function(m){return[].concat(' + code.join(',') + ')}';
		});
		var js = jsSeedCode + customCaution;
		if (config.DEBUG) {
			js += 'define._c.DEBUG=true;';
		}
		for (var key in config.load) {
			js += 'define._c.load(' + JSON.stringify(key) + ',' + JSON.stringify([].concat(config.load[key])) + ');';
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
	caution.missing = function (func) {
		if (!func) {
			var result = [];
			for (var key in knownModules) {
				// Known but not yet handled
				if (!caution._m[key] && !define._m[key]) result.push(key);
			}
			return result;
		} else {
			asap(function () {
				var missing = caution.missing();
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