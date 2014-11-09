define([], function () {
	var inlineJs = "var define=function n(r,e,t){var o=n._p=n._p||[],i=n._m=n._m||{};t||(t=e||r,e=e&&r||[],r=n._n||Math.random()),o.push([r,e,t]),n._d&&n._d(e);for(var a=0;a<o.length;a++){for(var f=o[a],e=f[1],s=0,s=0;s<e.length;s++)f=e[s]in i&&f;if(f){for(var t=f[2],u=[],s=0;s<e.length;s++)u[s]=i[e[s]];o.splice(a,1),i[f[0]]=\"function\"==typeof t?t.apply(null,u):t,a=-1}else;}},caution={_m:{},version:\"0.2.0\",missing:function(n,r){alert(\"Missing safe module: \"+n+\"\\n\"+r.join(\"\\n\"))},urls:function(){return[]},get:function(n,r,e){var t=new XMLHttpRequest;t.open(\"GET\",n),t.onreadystatechange=function(){if(4==t.readyState){for(var n=t.responseText.replace(/\\r/g,\"\"),o=sha256(encodeURI(n).replace(/%../g,function(n){return String.fromCharCode(parseInt(n[1]+n[2],16))})),i=0;i<r.length;i++){var a=r[i];if(!(t.status/100^2)&&o.substring(0,a.length)==a)return e(null,n,o)}e(1)}};try{t.send()}catch(o){e(o)}},load:function(n,r){function e(a,f,s){a?i.length?o.get(i.shift(),r,e):o.missing(n,r):(define._n=n,o._m[n]=[t,s],eval(f),define._n=\"\")}var t,o=this,i=o.urls(n,r);e(1)}},sha256=function r(n){function e(n,r){return n>>>r|n<<32-r}for(var t,o,i=Math.pow,a=i(2,32),f=\"length\",s=\"push\",u=\"\",c=[],l=8*n[f],h=r.h=r.h||[],g=r.k=r.k||[],p=g[f],d={},v=2;64>p;v++)if(!d[v]){for(t=0;313>t;t+=v)d[t]=v;h[p]=i(v,.5)*a|0,g[p++]=i(v,1/3)*a|0}for(n+=\"\\x80\";n[f]%64-56;)n+=\"\\x00\";for(t=0;t<n[f];t++){if(o=n.charCodeAt(t),o>>8)return;c[t>>2]|=o<<(3-t)%4*8}for(c[s](l/a|0),c[s](l),o=0;o<c[f];){var _=c.slice(o,o+=16),m=h;for(h=h.slice(0,8),t=0;64>t;t++){var y=_[t-15],M=_[t-2],S=h[0],C=h[4],E=h[7]+(e(C,6)^e(C,11)^e(C,25))+(C&h[5]^~C&h[6])+g[t]+(_[t]=16>t?_[t]:_[t-16]+(e(y,7)^e(y,18)^y>>>3)+_[t-7]+(e(M,17)^e(M,19)^M>>>10)|0),I=(e(S,2)^e(S,13)^e(S,22))+(S&h[1]^S&h[2]^h[1]&h[2]);h=[E+I|0].concat(h),h[4]=h[4]+E|0}for(t=0;8>t;t++)h[t]=h[t]+m[t]|0}for(t=0;8>t;t++)for(o=3;o+1;o--){var R=h[t]>>8*o&255;u+=(16>R?0:\"\")+R.toString(16)}return u};";
	
	if (typeof caution !== 'object') {
		var func = new Function(inlineJs + 'return caution;');
		caution = func();
	}
	
	caution.inlineJs = function (config, customCode) {
		var js = inlineJs;
		js = js.replace(/urls\:.*?\}/, function (def) {
			var sequence = config.paths.map(function (entry) {
				if (typeof entry === 'string') {
					return entry.split(/\{.*?\}/g).map(function (part) {
						return JSON.stringify(part);
					}).join('+m+');
				} else {
					return JSON.stringify(entry) + '[m]||[]';
				}
			});
			return 'urls:function(m){return[].concat(' + sequence.join(',') + ')}';
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
	
	caution.hashShim = function (name, url, hashes, returnValue) {
		caution.get(url, hashes, function (error, js, hash) {
			if (error) return caution.missing(name, hashes);

			caution._m[name] = [url, hash];
			
			define(name, [], new Function(js + '\n;return ' + (returnValue || name)+ ';'));
		});
	};
	
	caution.hash = function (name) {
		if (name) return (caution._m[name] || [])[1];
		
		var result = {};
		for (var key in caution._m) {
			result[key] = caution._m[key][1];
		}
		return result;
	};
	
	return caution;
});