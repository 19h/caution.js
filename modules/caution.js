define([], function () {
	var inlineJs = "var define=function n(e,r,t){var o=n._p=n._p||[],a=n._m=n._m||{};t||(t=r||e,r=r&&e||[],e=n._n||Math.random()),o.push([e,r,t]);for(var i=0;i<o.length;i++){for(var f=o[i],r=f[1],s=0,s=0;s<r.length;s++)f=r[s]in a&&f;if(f){for(var t=f[2],u=[],s=0;s<r.length;s++)u[s]=a[r[s]];o.splice(i,1),a[f[0]]=\"function\"==typeof t?t.apply(null,u):t,i=-1}else;}},caution={_t:[],_h:{},version:\"0.2.0\",missing:function(n,e){alert(\"Missing safe module: \"+n+\"\\n\"+e.join(\"\\n\"))},get:function(n,e,r){var t=new XMLHttpRequest;t.open(\"GET\",n),t.onreadystatechange=function(){if(4==t.readyState){for(var n=t.responseText.replace(/\\r/g,\"\"),o=sha256(encodeURI(n).replace(/%../g,function(n){return String.fromCharCode(parseInt(n[1]+n[2],16))})),a=0;a<e.length;a++){var i=e[a];if(!(t.status/100^2)&&o.substring(0,i.length)==i)return r(null,n)}r(1)}},t.send()},hash:function(n,e){function r(i,f){if(i)if(a<o.length){var s=o[a++];\"string\"==typeof s?t.get(s.replace(/{.*?}/,n),e,r):s[n]?t.get(s[n],e,r):r(i)}else t.missing(n,e);else define._n=n,eval(f),define._n=\"\"}var t=this,o=t._t;t._h[n]=e;var a=0;r(1)}},sha256=function e(n){function r(n,e){return n>>>e|n<<32-e}for(var t,o,a=Math.pow,i=a(2,32),f=\"length\",s=\"push\",u=\"\",h=[],l=8*n[f],c=e.h=e.h||[],g=e.k=e.k||[],p=g[f],v={},d=2;64>p;d++)if(!v[d]){for(t=0;313>t;t+=d)v[t]=d;c[p]=a(d,.5)*i|0,g[p++]=a(d,1/3)*i|0}for(n+=\"\\x80\";n[f]%64-56;)n+=\"\\x00\";for(t=0;t<n[f];t++){if(o=n.charCodeAt(t),o>>8)return;h[t>>2]|=o<<(3-t)%4*8}for(h[s](l/i|0),h[s](l),o=0;o<h[f];){var _=h.slice(o,o+=16),m=c;for(c=c.slice(0,8),t=0;64>t;t++){var y=_[t-15],M=_[t-2],S=c[0],C=c[4],E=c[7]+(r(C,6)^r(C,11)^r(C,25))+(C&c[5]^~C&c[6])+g[t]+(_[t]=16>t?_[t]:_[t-16]+(r(y,7)^r(y,18)^y>>>3)+_[t-7]+(r(M,17)^r(M,19)^M>>>10)|0),I=(r(S,2)^r(S,13)^r(S,22))+(S&c[1]^S&c[2]^c[1]&c[2]);c=[E+I|0].concat(c),c[4]=c[4]+E|0}for(t=0;8>t;t++)c[t]=c[t]+m[t]|0}for(t=0;8>t;t++)for(o=3;o+1;o--){var R=c[t]>>8*o&255;u+=(16>R?0:\"\")+R.toString(16)}return u};";
	
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
		js += customCode || '';
		var html = '<!DOCTYPE html><html><body><script>' + js + '</script></body></html>';
		
		if (typeof btoa === 'function') {
			return 'data:text/html;base64,' + btoa(html);
		} else {
			return 'data:text/html,' + encodeURI(html);
		}
	};
	
	caution.hashShim = function (name, url, hashes, returnValue) {
		caution.get(url, hashes, function (error, js) {
			if (error) return caution.missing(name, hashes);

			define(name, [], new Function(js + '\n;return ' + (returnValue || name)+ ';'));
		});
	};
	
	return caution;
});