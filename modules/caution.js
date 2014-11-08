define([], function () {
	var inlineJs = "var define=function n(r,e,t){var o=n._p=n._p||[],a=n._m=n._m||{};t||(t=e||r,e=e&&r||[],r=n._n||Math.random()),o.push([r,e,t]);for(var i=0;i<o.length;i++){for(var f=o[i],e=f[1],s=0,s=0;s<e.length;s++)f=e[s]in a&&f;if(f){for(var t=f[2],c=[],s=0;s<e.length;s++)c[s]=a[e[s]];o.splice(i,1),a[f[0]]=\"function\"==typeof t?t.apply(null,c):t,i=-1}else;}},caution={_t:[],_h:{},_m:{},version:\"0.2.0\",missing:function(n,r){alert(\"Missing safe module: \"+n+\"\\n\"+r.join(\"\\n\"))},get:function(n,r,e){var t=new XMLHttpRequest;t.open(\"GET\",n),t.onreadystatechange=function(){if(4==t.readyState){for(var n=t.responseText.replace(/\\r/g,\"\"),o=sha256(encodeURI(n).replace(/%../g,function(n){return String.fromCharCode(parseInt(n[1]+n[2],16))})),a=0;a<r.length;a++){var i=r[a];if(!(t.status/100^2)&&o.substring(0,i.length)==i)return e(null,n,o)}e(1)}};try{t.send()}catch(o){e(o)}},hash:function(n,r){function e(f,s,c){f?i<o.length?(a=\"string\"==typeof o[i]?o[i++].replace(/{.*?}/,n):o[i++][n],a?t.get(a,r,e):e(f)):t.missing(n,r):(define._n=n,t._m[n]=[a,c],eval(s),define._n=\"\")}var t=this,o=t._t;t._h[n]=r;var a,i=0;e(1)}},sha256=function r(n){function e(n,r){return n>>>r|n<<32-r}for(var t,o,a=Math.pow,i=a(2,32),f=\"length\",s=\"push\",c=\"\",h=[],u=8*n[f],l=r.h=r.h||[],g=r.k=r.k||[],p=g[f],v={},_=2;64>p;_++)if(!v[_]){for(t=0;313>t;t+=_)v[t]=_;l[p]=a(_,.5)*i|0,g[p++]=a(_,1/3)*i|0}for(n+=\"\\x80\";n[f]%64-56;)n+=\"\\x00\";for(t=0;t<n[f];t++){if(o=n.charCodeAt(t),o>>8)return;h[t>>2]|=o<<(3-t)%4*8}for(h[s](u/i|0),h[s](u),o=0;o<h[f];){var d=h.slice(o,o+=16),m=l;for(l=l.slice(0,8),t=0;64>t;t++){var y=d[t-15],M=d[t-2],S=l[0],C=l[4],E=l[7]+(e(C,6)^e(C,11)^e(C,25))+(C&l[5]^~C&l[6])+g[t]+(d[t]=16>t?d[t]:d[t-16]+(e(y,7)^e(y,18)^y>>>3)+d[t-7]+(e(M,17)^e(M,19)^M>>>10)|0),I=(e(S,2)^e(S,13)^e(S,22))+(S&l[1]^S&l[2]^l[1]&l[2]);l=[E+I|0].concat(l),l[4]=l[4]+E|0}for(t=0;8>t;t++)l[t]=l[t]+m[t]|0}for(t=0;8>t;t++)for(o=3;o+1;o--){var R=l[t]>>8*o&255;c+=(16>R?0:\"\")+R.toString(16)}return c};";
	
	if (typeof caution !== 'object') {
		var func = new Function(inlineJs + 'return caution;');
		caution = func();
	}
	
	caution.utf8 = function (content) {
		return encodeURI(content).replace(/%../g, function (part) {
			return String.fromCharCode(parseInt(part[1] + part[2], 16));
		});
	};
	
	caution.config = function () {
		var result = {
			template: this._t.slice(0),
			hash: {}
		};
		for (var key in this._h) {
			result.hash[key] = this._h[key].slice(0);
		}
		return result;
	};
	
	caution.dataUrl = function (config, customCode) {
		config = config || this.config();
		var js = inlineJs.replace('_t:[]', '_t:' + JSON.stringify(config.template));
		for (var key in config) {
			if (key !== 'template') {
				for (var name in config[key]) {
					js += 'caution.' + key + '(' + JSON.stringify(name) + ',' + JSON.stringify(config[key][name]) + ');';
				}
			}
		}
		customCode = customCode || '';
		if (typeof customCode === 'object') {
			var vars = [];
			for (var key in customCode) {
				vars.push(key + '=' + JSON.stringify(customCode[key]));
			}
			customCode = 'var ' + vars.join(',') + ';';
		}
		js += customCode;
		var html = '<!DOCTYPE html><html><body><script>' + js + '</script></body></html>';
		
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
	
	caution.hashes = function (name) {
		if (name) return (caution._m[name] || [])[1];
		
		var result = {};
		for (var key in caution._m) {
			result[key] = caution._m[key][1];
		}
		return result;
	};
	
	return caution;
});