(function (global) {
	var inlineJs = "var define=function n(r,e,t){var o=n._p=n._p||[],i=n._m=n._m||{};t||(t=e||r,e=e&&r||[],r=n._n||Math.random()),o.push([r,e,t]),n._d&&n._d(e);for(var a=0;a<o.length;a++){for(var f=o[a],e=f[1],s=0,s=0;s<e.length;s++)f=e[s]in i&&f;if(f){for(var t=f[2],u=[],s=0;s<e.length;s++)u[s]=i[e[s]];o.splice(a,1),i[f[0]]=\"function\"==typeof t?t.apply(window,u):t,a=-1}else;}};define.amd={caution:\"0.3.1\"};var caution={_m:{},missing:function(n,r){alert(\"Missing safe module: \"+n+\"\\n\"+r.join(\"\\n\"))},urls:function(){return[]},get:function(n,r,e){var t=new XMLHttpRequest;t.open(\"GET\",n),t.onreadystatechange=function(){if(4==t.readyState){for(var n=t.responseText.replace(/\\r/g,\"\"),o=sha256(encodeURI(n).replace(/%../g,function(n){return String.fromCharCode(\"0x\"+n[1]+n[2]-0)})),i=0;i<r.length;i++)if(!(t.status/100^2)&&o.substring(0,r[i].length)==r[i])return e(null,n,o);e(1)}};try{t.send()}catch(o){e(o)}},load:function(n,r){function e(a,f,s){a?i.length?o.get(t=i.shift(),r,e):o.missing(n,r):(define._n=n,o._m[n]=[t,s],eval(f),define._n=\"\")}var t,o=this,i=o.urls(n,r);o._m[n]||(o._m[n]=[],e(1))}},sha256=function r(n){function e(n,r){return n>>>r|n<<32-r}for(var t,o,i=Math.pow,a=i(2,32),f=\"length\",s=\"push\",u=\"\",c=[],h=8*n[f],l=r.h=r.h||[],g=r.k=r.k||[],d=g[f],p={},v=2;64>d;v++)if(!p[v]){for(t=0;313>t;t+=v)p[t]=v;l[d]=i(v,.5)*a|0,g[d++]=i(v,1/3)*a|0}for(n+=\"\\x80\";n[f]%64-56;)n+=\"\\x00\";for(t=0;t<n[f];t++){if(o=n.charCodeAt(t),o>>8)return;c[t>>2]|=o<<(3-t)%4*8}for(c[s](h/a|0),c[s](h),o=0;o<c[f];){var _=c.slice(o,o+=16),m=l;for(l=l.slice(0,8),t=0;64>t;t++){var y=_[t-15],w=_[t-2],M=l[0],S=l[4],x=l[7]+(e(S,6)^e(S,11)^e(S,25))+(S&l[5]^~S&l[6])+g[t]+(_[t]=16>t?_[t]:_[t-16]+(e(y,7)^e(y,18)^y>>>3)+_[t-7]+(e(w,17)^e(w,19)^w>>>10)|0),C=(e(M,2)^e(M,13)^e(M,22))+(M&l[1]^M&l[2]^l[1]&l[2]);l=[x+C|0].concat(l),l[4]=l[4]+x|0}for(t=0;8>t;t++)l[t]=l[t]+m[t]|0}for(t=0;8>t;t++)for(o=3;o+1;o--){var E=l[t]>>8*o&255;u+=(16>E?0:\"\")+E.toString(16)}return u};";
	
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
			
			// Hack, in case the code actually uses define()
			var code = 'define._n = ' + JSON.stringify(name) + ';\n';
			code += js;
			code += '\n;define._n = "";\n';
			code += 'return define._m[' + JSON.stringify(name) + '] || (' + (returnValue || name) + ');';
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