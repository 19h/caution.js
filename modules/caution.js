(function (global) {
	var inlineJs = "var sha256=function n(e){function r(n,e){return n>>>e|n<<32-e}for(var t,o,f=Math.pow,i=f(2,32),a=\"length\",c=\"push\",s=\"\",u=[],h=8*e[a],l=n.h=n.h||[],d=n.k=n.k||[],p=d[a],_={},v=2;64>p;v++)if(!_[v]){for(t=0;313>t;t+=v)_[t]=v;l[p]=f(v,.5)*i|0,d[p++]=f(v,1/3)*i|0}for(e+=\"\\x80\";e[a]%64-56;)e+=\"\\x00\";for(t=0;t<e[a];t++){if(o=e.charCodeAt(t),o>>8)return;u[t>>2]|=o<<(3-t)%4*8}for(u[c](h/i|0),u[c](h),o=0;o<u[a];){var g=u.slice(o,o+=16),m=l;for(l=l.slice(0,8),t=0;64>t;t++){var w=g[t-15],y=g[t-2],C=l[0],M=l[4],S=l[7]+(r(M,6)^r(M,11)^r(M,25))+(M&l[5]^~M&l[6])+d[t]+(g[t]=16>t?g[t]:g[t-16]+(r(w,7)^r(w,18)^w>>>3)+g[t-7]+(r(y,17)^r(y,19)^y>>>10)|0),x=(r(C,2)^r(C,13)^r(C,22))+(C&l[1]^C&l[2]^l[1]&l[2]);l=[S+x|0].concat(l),l[4]=l[4]+S|0}for(t=0;8>t;t++)l[t]=l[t]+m[t]|0}for(t=0;8>t;t++)for(o=3;o+1;o--){var E=l[t]>>8*o&255;s+=(16>E?0:\"\")+E.toString(16)}return s},define=function e(n,r,t){var o=e._p=e._p||[],f=e._m=e._m||{};t||(t=r||n,r=r&&n||[],n=e._n||Math.random()),o.push([n,r,t]),e._d&&e._d(r);for(var i=0;i<o.length;i++){for(var a=o[i],r=a[1],c=0,c=0;c<r.length;c++)a=r[c]in f&&a;if(a){for(var t=a[2],s=[],c=0;c<r.length;c++)s[c]=f[r[c]];o.splice(i,1),f[a[0]]=\"function\"==typeof t?t.apply(window,s):t,i=-1}else;}};define.amd={caution:\"0.4.0\"},define._c={_m:{},fail:function(n,e){alert(\"Missing safe module: \"+n+\"\\n\"+e.join(\"\\n\"))},urls:function(){return[]},_init:function(n,e,r){function t(a){if(i.length){var c=new XMLHttpRequest;c.open(\"GET\",o=i.shift()),c.onreadystatechange=function(){if(4==c.readyState){for(var e,i=c.responseText.replace(/\\r/g,\"\"),a=sha256(encodeURI(i).replace(/%../g,function(n){return String.fromCharCode(\"0x\"+n[1]+n[2]-0)})),s=0;e=r.pop();)s|=eval(\"/^\"+e+\"/\").test(a);c.status/100^2||!s?t(1):(define._n=n,f._m[n]=[o,a],new Function(i)(),define._n=\"\")}};try{c.send()}catch(s){t(s)}}else f.fail(n,e,a)}var o,f=this,i=f.urls(n,e);r=r||e,f._m[n]||(f._m[n]=[],t(1))}};";

	// We execute it (to get sha256), but we don't use caution/define unless we need to
	var func = new Function(inlineJs + 'return {define: define, sha256: sha256};');
	var result = func.call(global);
	
	// Set up the global "define" if it doesn't already exist
	if (typeof define !== 'function' || !define.amd || !define.amd.caution) {		
		define = global.define = result.define;
	}
	var caution = define._c; // Yeah, that's nasty.
	
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
			js += 'define._c._init(' + JSON.stringify(key) + ',' + JSON.stringify(config.load[key]) + ');';
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