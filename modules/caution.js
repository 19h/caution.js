(function (global) {
	var inlineJs = "var define=function n(r,t,e){var o=n._p=n._p||[],f=n._m=n._m||{};e||(e=t||r,t=t&&r||[],r=n._n||Math.random()),o.push([r,t,e]),n._d&&n._d(t);for(var i=0;i<o.length;i++){for(var a=o[i],t=a[1],u=0,u=0;u<t.length;u++)a=t[u]in f&&a;if(a){for(var e=a[2],c=[],u=0;u<t.length;u++)c[u]=f[t[u]];o.splice(i,1),f[a[0]]=\"function\"==typeof e?e.apply(window,c):e,i=-1}else;}},caution={_m:{},fail:function(n,r){alert(\"Missing safe module: \"+n+\"\\n\"+r.join(\"\\n\"))},urls:function(){return[]},get:function(n,r,t){var e=new XMLHttpRequest;e.open(\"GET\",n),e.onreadystatechange=function(){if(4==e.readyState){var n=e.responseText.replace(/\\r/g,\"\");if(!(e.status/100^2)&&r(n))return t(null,n);t(1)}};try{e.send()}catch(o){t(o)}},init:function(n,r,t){function e(n){for(var r,e=sha256(encodeURI(n).replace(/%../g,function(n){return String.fromCharCode(\"0x\"+n[1]+n[2]-0)}));r=t.pop();)if(e.substring(0,r.length)==r)return 1;return 0}function o(t,u,c){t?a.length?i.get(f=a.shift(),e,o):i.fail(n,r):(define._n=n,i._m[n]=[f,c],eval(u),define._n=\"\")}t=t||r;var f,i=this,a=i.urls(n,r);i._m[n]||(i._m[n]=[],o(1))}};define.amd={caution:\"0.4.0\"};var sha256=function r(n){function t(n,r){return n>>>r|n<<32-r}for(var e,o,f=Math.pow,i=f(2,32),a=\"length\",u=\"push\",c=\"\",s=[],l=8*n[a],h=r.h=r.h||[],d=r.k=r.k||[],p=d[a],g={},v=2;64>p;v++)if(!g[v]){for(e=0;313>e;e+=v)g[e]=v;h[p]=f(v,.5)*i|0,d[p++]=f(v,1/3)*i|0}for(n+=\"\\x80\";n[a]%64-56;)n+=\"\\x00\";for(e=0;e<n[a];e++){if(o=n.charCodeAt(e),o>>8)return;s[e>>2]|=o<<(3-e)%4*8}for(s[u](l/i|0),s[u](l),o=0;o<s[a];){var _=s.slice(o,o+=16),m=h;for(h=h.slice(0,8),e=0;64>e;e++){var y=_[e-15],w=_[e-2],M=h[0],S=h[4],x=h[7]+(t(S,6)^t(S,11)^t(S,25))+(S&h[5]^~S&h[6])+d[e]+(_[e]=16>e?_[e]:_[e-16]+(t(y,7)^t(y,18)^y>>>3)+_[e-7]+(t(w,17)^t(w,19)^w>>>10)|0),C=(t(M,2)^t(M,13)^t(M,22))+(M&h[1]^M&h[2]^h[1]&h[2]);h=[x+C|0].concat(h),h[4]=h[4]+x|0}for(e=0;8>e;e++)h[e]=h[e]+m[e]|0}for(e=0;8>e;e++)for(o=3;o+1;o--){var E=h[e]>>8*o&255;c+=(16>E?0:\"\")+E.toString(16)}return c};";

	// We execute it (to get sha256), but we don't use caution/define unless we need to
	var func = new Function(inlineJs + 'return {caution: caution, define: define, sha256: sha256};');
	var result = func.call(global);
	
	// Set up the global "define" if it doesn't already exist
	if (typeof define !== 'function' || !define.amd || !define.amd.caution) {		
		define = global.define = result.define;
		// We can't replace the global "caution" module unless we're also replacing define(), otherwise it will refer to the wrong version of define()
		caution = global.caution = result.caution;
	}
	var sha256 = caution.sha256 = result.sha256;

	// We preserve the existing definitions for _m, urls, and fail, but everything else is defined here

	var validationFunctions = [];
	caution.isValid = function (text) {
		// UTF-8 encode before hash
		var hash = sha256(encodeURI(text).replace(/%../g, function (part) {
			return String.fromCharCode('0x' + part[1] + part[2] - 0);
		}));
		for (var i = 0; i < validationFunctions.length; i++) {
			var func = validationFunctions[i];
			if (func(text, hash)) return hash;
		}
		return false;
	};
	caution.addValid = function (func) {
		if (typeof func !== 'function') {
			var hashes = [].concat(func); // array of hashes
			func = function (text, hash) {
				for (var i = 0; i < hashes.length; i++) {
					if (hash.substring(0, hashes[i].length) == hashes[i]) {
						return true;
					}
				}
				return false;
			};
		}
		validationFunctions.push(func);
	};
	caution.addValid(caution.hashes || []);
	
	caution.get = function (url, isValid, callback) {
		if (typeof callback[0] === 'string') throw new Error('!!!');
		var request = new XMLHttpRequest;
		isValid = isValid || caution.isValid;
		if (typeof isValid !== 'function') {
			var constValue = isValid;
			isValid = function () {return constValue;};
		}
		
		request.open("GET", url);
		request.onreadystatechange = function () {
			if (request.readyState == 4) {
				var content = request.responseText.replace(/\r/g, ''); // Normalise for consistent behaviour across webserver OS
				var hash;
				if (request.status >= 200 && request.status < 300 && (hash = isValid(content))) {
					callback(null, content, hash);
				} else {
					callback(new Error('Content was invalid'));
				}
			}
		};
		try {
			request.send();
		} catch (e) {
			setTimeout(function () {
				callback(e);
			}, 0);
		}
	};
	
	caution.load = function (name, versions) {
		if (caution._m[name]) return;
		caution._m[name] = [];
		
		versions = versions ? [].concat(versions) : [];
		var urls = caution.urls(name, versions);
		caution.getFirst(urls, null, function (error, js, hash, url) {
			if (error) {
				caution.fail(name, versions);
			} else {
				define._n = name;
				caution._m[name] = [url, hash];
				eval(js);
				define._n = '';
			}
		});
	};
	
	caution.undefine = function () {
		delete define._m['caution'];
	};
	
	var knownModules = {};
	var missingHandlers = [];
	caution.pending = function (func) {
		if (!func) {
			var result = [];
			for (var key in knownModules) {
				if (!caution._m[key] && !define._m[key]) result.push(key);
			}
			return result;
		} else {
			var missing = caution.missingDeps();
			for (var i = 0; i < missing.length; i++) {
				if (func(missing[i])) {
					caution._m[key] = [];
				}
			}
			missingHandlers.push(func);
		}
	};
	
	var oldD = global.define._d;
	global.define._d = function (deps) {
		var unhandled = [];
		for (var i = 0; i < deps.length; i++) {
			var moduleName = deps[i];
			if (!knownModules[moduleName]) {
				knownModules[moduleName] = true;
				var handled = false;
				for (var j = 0; j < missingHandlers.length; j++) {
					var func = missingHandlers[j];
					if (func(moduleName)) {
						caution._m[key] = [];
						handled = true;
						break;
					}
				}
				if (!handled) unhandled.push(moduleName);
			}
		}
		return oldD ? oldD(unhandled) : unhandled;
	};
	// Call the callback for any pending dependencies
	for (var i = 0; i < (global.define._p || []).length; i++) {
		global.define._d(global.define._p[i][1]);
	}
	
	function templateToCode(entry) {
		if (typeof entry === 'string') {
			return '[' + entry.split(/\{.*?\}/g).map(function (part) {
				return JSON.stringify(part);
			}).join('+m+') + ']';
		} else {
			return JSON.stringify(entry) + '[m]||[]';
		}
	}
	
	caution.inlineJs = function (config, customCode) {
		var js = inlineJs;
		js = js.replace(/urls\:.*?\}/, function (def) {
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
			js += 'caution.init(' + JSON.stringify(key) + ',' + JSON.stringify(config.load[key]) + ');';
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
	
	caution.dataUrl = function (config, customCode) {
		var html = '<!DOCTYPE html><html><body><script>' + caution.inlineJs(config, customCode) + '</script></body></html>';
		
		if (typeof btoa === 'function') {
			return 'data:text/html;base64,' + btoa(html);
		} else {
			return 'data:text/html,' + encodeURI(html);
		}
	};
	
	caution.addUrls = function (func) {
		if (typeof func !== 'function') {
			func = new Function('m', 'h', 'return [].concat(' + templateToCode(func) + ')');
		}
		var oldFunc = caution.urls;
		caution.urls = function (m, h) {
			return func(m, h).concat(oldFunc.call(this, m, h));
		};
	};
	
	caution.getFirst = function (urls, isValid, callback) {
		var i = 0;
		function next(error, text, hash) {
			if (!error) return callback(null, text, hash, urls[i]);
			if (i >= urls.length) return callback(error);
			
			caution.get(urls[i++], isValid, next);
		}
		next(new Error('No URLs supplied'));
	};
	
	caution.loadShim = function (name, returnValue, deps) {
		var urls = caution.urls(name);
		caution._m[name] = name;
		deps = deps || [];

		caution.getFirst(urls, null, function (error, js, hash, url) {
			if (error) return caution.fail(name);

			caution._m[name] = [url, hash];
			
			// Hide define(), in case the code tries to call it
			code = 'var define = undefined;\n';
			code += js;
			code += 'return ' + (returnValue || name) + ';';
			var func = Function.apply(null, deps.concat(code));
			define(name, deps, func);
		});
	};
	
	caution.moduleHash = function (moduleName) {
		if (moduleName) return (caution._m[moduleName] || [])[1];
		
		var result = {};
		for (var key in caution._m) {
			result[key] = caution._m[key][1];
		}
		return result;
	};
	
	// Small improvements
	
	define('caution', [], caution);
})((typeof window === 'window' && window) || this);