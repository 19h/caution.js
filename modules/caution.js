(function (global) {
	var inlineJs = "var define=function n(r,e,t){var o=n._p=n._p||[],a=n._m=n._m||{};t||(t=e||r,e=e&&r||[],r=n._n||Math.random()),o.push([r,e,t]),n._d&&n._d(e);for(var f=0;f<o.length;f++){for(var i=o[f],e=i[1],u=0,u=0;u<e.length;u++)i=e[u]in a&&i;if(i){for(var t=i[2],s=[],u=0;u<e.length;u++)s[u]=a[e[u]];o.splice(f,1),a[i[0]]=\"function\"==typeof t?t.apply(window,s):t,f=-1}else;}};define.amd={caution:\"0.3.1\"};var caution={_m:{},fail:function(n,r){alert(\"Missing safe module: \"+n+\"\\n\"+r.join(\"\\n\"))},urls:function(){return[]},get:function(n,r,e){var t=new XMLHttpRequest;t.open(\"GET\",n),t.onreadystatechange=function(){if(4==t.readyState){for(var n=t.responseText.replace(/\\r/g,\"\"),o=sha256(encodeURI(n).replace(/%../g,function(n){return String.fromCharCode(\"0x\"+n[1]+n[2]-0)})),a=0;a<r.length;a++)if(!(t.status/100^2)&&o.substring(0,r[a].length)==r[a])return e(null,n,o);e(1)}};try{t.send()}catch(o){e(o)}},load:function(n,r){function e(f,i,u){f?a.length?o.get(t=a.shift(),r,e):o.missing(n,r):(define._n=n,o._m[n]=[t,u],eval(i),define._n=\"\")}var t,o=this,a=o.urls(n,r);o._m[n]||(o._m[n]=[],e(1))}},sha256=function r(n){function e(n,r){return n>>>r|n<<32-r}for(var t,o,a=Math.pow,f=a(2,32),i=\"length\",u=\"push\",s=\"\",c=[],l=8*n[i],h=r.h=r.h||[],d=r.k=r.k||[],g=d[i],p={},v=2;64>g;v++)if(!p[v]){for(t=0;313>t;t+=v)p[t]=v;h[g]=a(v,.5)*f|0,d[g++]=a(v,1/3)*f|0}for(n+=\"\\x80\";n[i]%64-56;)n+=\"\\x00\";for(t=0;t<n[i];t++){if(o=n.charCodeAt(t),o>>8)return;c[t>>2]|=o<<(3-t)%4*8}for(c[u](l/f|0),c[u](l),o=0;o<c[i];){var _=c.slice(o,o+=16),m=h;for(h=h.slice(0,8),t=0;64>t;t++){var y=_[t-15],w=_[t-2],M=h[0],S=h[4],x=h[7]+(e(S,6)^e(S,11)^e(S,25))+(S&h[5]^~S&h[6])+d[t]+(_[t]=16>t?_[t]:_[t-16]+(e(y,7)^e(y,18)^y>>>3)+_[t-7]+(e(w,17)^e(w,19)^w>>>10)|0),C=(e(M,2)^e(M,13)^e(M,22))+(M&h[1]^M&h[2]^h[1]&h[2]);h=[x+C|0].concat(h),h[4]=h[4]+x|0}for(t=0;8>t;t++)h[t]=h[t]+m[t]|0}for(t=0;8>t;t++)for(o=3;o+1;o--){var E=h[t]>>8*o&255;s+=(16>E?0:\"\")+E.toString(16)}return s};";
	
	var func = new Function(inlineJs + 'return {caution: caution, define: define};');
	var result = func.call(global);

	// Set up the global "define" if it doesn't already exist
	if (typeof define !== 'function' || !define.amd.caution) {		
		define = global.define = result.define;
	}
	caution = global.caution = result.caution;
	
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
	
	global.define._d = function (deps) {
		for (var i = 0; i < deps.length; i++) {
			var moduleName = deps[i];
			if (!knownModules[moduleName]) {
				knownModules[moduleName] = true;
				for (var j = 0; j < missingHandlers.length; j++) {
					var func = missingHandlers[j];
					if (func(moduleName)) {
						caution._m[key] = [];
						break;
					}
				}
			}
		}
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
		for (var key in config.load) {
			js += 'caution.load(' + JSON.stringify(key) + ',' + JSON.stringify(config.load[key]) + ');';
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
	
	caution.getFirst = function (urls, hashes, callback) {
		var i = 0;
		function next(error, text, hash) {
			if (!error) return callback(null, text, hash, urls[i]);
			if (i >= urls.length) return callback(error);
			
			caution.get(urls[i++], hashes, next);
		}
		next(new Error('No URLs supplied'));
	};
	
	caution.loadShim = function (name, hashes, returnValue, deps) {
		var urls = caution.urls(name);
		caution._m[name] = name;
		deps = deps || [];

		caution.getFirst(urls, hashes, function (error, js, hash, url) {
			if (error) return caution.missing(name, hashes);

			caution._m[name] = [url, hash];
			
			// Hide define(), in case the code tries to call it
			code = 'var define = null;\n';
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
	
	define('caution', [], caution);
})(this || window);