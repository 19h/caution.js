(function (global) {
	// JS code for the inline seed
	var inlineJs = "var sha256=function n(r){function t(n,r){return n>>>r|n<<32-r}for(var e,o,f=Math.pow,i=f(2,32),a=\"length\",u=\"\",c=[],s=8*r[a],_=n.h=n.h||[],h=n.k=n.k||[],l=h[a],p={},v=2;64>l;v++)if(!p[v]){for(e=0;313>e;e+=v)p[e]=v;_[l]=f(v,.5)*i|0,h[l++]=f(v,1/3)*i|0}for(r+=\"\\x80\";r[a]%64-56;)r+=\"\\x00\";for(e=0;e<r[a];e++){if(o=r.charCodeAt(e),o>>8)return;c[e>>2]|=o<<(3-e)%4*8}for(c[c[a]]=s/i|0,c[c[a]]=s,o=0;o<c[a];){var d=c.slice(o,o+=16),m=_;for(_=_.slice(0,8),e=0;64>e;e++){var g=d[e-15],y=d[e-2],C=_[0],S=_[4],w=_[7]+(t(S,6)^t(S,11)^t(S,25))+(S&_[5]^~S&_[6])+h[e]+(d[e]=16>e?d[e]:d[e-16]+(t(g,7)^t(g,18)^g>>>3)+d[e-7]+(t(y,17)^t(y,19)^y>>>10)|0),x=(t(C,2)^t(C,13)^t(C,22))+(C&_[1]^C&_[2]^_[1]&_[2]);_=[w+x|0].concat(_),_[4]=_[4]+w|0}for(e=0;8>e;e++)_[e]=_[e]+m[e]|0}for(e=0;8>e;e++)for(o=3;o+1;o--){var E=_[e]>>8*o&255;u+=(16>E?0:\"\")+E.toString(16)}return u};!function(n){function r(){for(var r,t=0;r=f[t];t++){var a=r[0];if(!a||o[a]){for(var u,c=r[1],s=r[2],_=[],h=0;h<c.length;h++)_[h]=i[u=c[h]],r=u in i&&r,o[u]||(t=o[u]=-1);r&&(f.splice(t,1),s=\"function\"==typeof s?s.apply(n,_):s,a&&(i[a]=s),t=-1)}}e._d&&e._d()}var t=(n.require=function(n,t){if(t){for(var f=0;f<n.length;f++)o[n[f]]=1;return e(0,n,t)}if(o[n]=1,e._m[n]||r(),n in e._m)return e._m[n];throw n},0),e=n.define=function(n,o,i){i||(i=o,n+\"\"===n?o=[]:(o=n||[],n=e._n||\"_anon\"+t++)),f.push([n,o,i]),r()},o=e._r={},f=e._p=[],i=e._m={};e.amd={caution:\"0.5.0\"};var a=e._c={_m:{},fail:function(n,r){alert(\"Missing safe module: \"+n+\"\\n\"+r.join(\"\\n\"))},urls:function(){return[]},_init:function(n,r,t){function o(i){if(f.length){var u=new XMLHttpRequest,c=f.shift();u.open(\"GET\",c),u.onreadystatechange=function(){if(u.readyState>3){for(var r,f=u.status/100^2,i=u.responseText.replace(/\\r/g,\"\"),s=f||sha256(encodeURI(i).replace(/%../g,function(n){return String.fromCharCode(\"0x\"+n[1]+n[2]-0)})),_=0;r=t.pop();)_|=eval(\"/^\"+r+\"/\").test(s);!f&&_?(a._m[e._n=n]=[c,s],Function(i)(),e._n=\"\"):o(1)}};try{u.send()}catch(s){o(s)}}else a.fail(n,r,i)}var f=a.urls(n,r);t=t||r,a._m[n]||(a._m[n]=[],o())}}}(this);";

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
					if (hash.substring(0, hashes[i].length) == hashes[i]) return true;
				}
				return false;
			};
		} else if (isSafe === true) {
			isSafe = function () {return true;};
		}
		
		request.open("GET", url);
		request.onreadystatechange = function () {
			if (request.readyState == 4) {
				var content = request.responseText.replace(/\r/g, ''); // Normalise for consistent behaviour across webserver OS
				var hash;
				if (request.status < 200 || request.status >= 300) {
					callback(new Error('Response code not OK: ' + request.status));
				} else if (hash = isSafe(content, sha256unicode(content))) {
					callback(null, content, hash);
				} else {
					callback(new Error('Content was not safe'));
				}
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
		var errors = [];
		var url;
		function next(error, text, hash) {
			if (!error) return callback(null, text, hash, url);

			errors.push(error);
			if (i >= urls.length) {
				var error = new Error('Error fetching: ' + url);
				error.errors = errors.slice(1);
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
			func(runNextDebugLoad);
		}
	}
	
	function loadModuleJs(name, js, hash, url) {
		if (url && caution.DEBUG) {
			// Loading via <script> is not secure (the server could return a different version second time), but it allows inspection
			console.log('caution.load() success: ', name);
			addDebugLoad(function (callback) {
				define._n = name;
				var script = document.createElement('script');
				script.src = url;
				script.onload = function () {
					// We're about to execute
					setTimeout(function () {
						define._n = '';
						callback();
					}, 10);
				};
				document.head.appendChild(script);
			});
		} else {
			define._n = name;
			caution._m[name] = [url, hash];
			Function(js)();
			define._n = '';
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
				if (!knownModules[moduleName]) {
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
	
		knownModules[name] = true;
		caution._m[name] = caution._m[name] || [];
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