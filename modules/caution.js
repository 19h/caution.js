define([], function () {
	var inlineJs = "var define=function n(t,e,r){var o=n._p=n._p||[],a=n._m=n._m||{};r||(r=e||t,e=e&&t||[],t=n._n||Math.random()),o.push([t,e,r]);for(var i=0;i<o.length;i++){for(var f=o[i],e=f[1],s=0,s=0;s<e.length;s++)f=e[s]in a&&f;if(f){for(var r=f[2],c=[],s=0;s<e.length;s++)c[s]=a[e[s]];o.splice(i,1),a[f[0]]=\"function\"==typeof r?r.apply(null,c):r,i=-1}else;}},caution={_t:[],_h:{},version:\"0.2.0\",missing:function(n,t){alert(\"Missing safe module: \"+n+\"\\n\"+t.join(\"\\n\"))},get:function(n,t,e){var r=new XMLHttpRequest;r.open(\"GET\",n),r.onreadystatechange=function(){if(4==r.readyState){for(var n=r.responseText.replace(/\\r/g,\"\"),o=sha256(encodeURI(n).replace(/%../g,function(n){return String.fromCharCode(parseInt(n[1]+n[2],16))})),a=0;a<t.length;a++){var i=t[a];if(!(r.status/100^2)&&o.substring(0,i.length)==i)return e(null,n)}e(1)}},r.send()},template:function(n){this._t=this._t.concat(n)},hash:function(n,t){function e(i,f){i?a<o.length?r.get(o[a++].replace(/{.*?}/,n),t,e):r.missing(n,t):(define._n=n,eval(f),define._n=\"\")}var r=this,o=r._t;r._h[n]=t;var a=0;e(1)}},sha256=function t(n){function e(n,t){return n>>>t|n<<32-t}for(var r,o,a=Math.pow,i=a(2,32),f=\"length\",s=\"push\",c=\"\",h=[],u=8*n[f],l=t.h=t.h||[],g=t.k=t.k||[],p=g[f],v={},_=2;64>p;_++)if(!v[_]){for(r=0;313>r;r+=_)v[r]=_;l[p]=a(_,.5)*i|0,g[p++]=a(_,1/3)*i|0}for(n+=\"\\x80\";n[f]%64-56;)n+=\"\\x00\";for(r=0;r<n[f];r++){if(o=n.charCodeAt(r),o>>8)return;h[r>>2]|=o<<(3-r)%4*8}for(h[s](u/i|0),h[s](u),o=0;o<h[f];){var d=h.slice(o,o+=16),m=l;for(l=l.slice(0,8),r=0;64>r;r++){var y=d[r-15],M=d[r-2],S=l[0],C=l[4],E=l[7]+(e(C,6)^e(C,11)^e(C,25))+(C&l[5]^~C&l[6])+g[r]+(d[r]=16>r?d[r]:d[r-16]+(e(y,7)^e(y,18)^y>>>3)+d[r-7]+(e(M,17)^e(M,19)^M>>>10)|0),I=(e(S,2)^e(S,13)^e(S,22))+(S&l[1]^S&l[2]^l[1]&l[2]);l=[E+I|0].concat(l),l[4]=l[4]+E|0}for(r=0;8>r;r++)l[r]=l[r]+m[r]|0}for(r=0;8>r;r++)for(o=3;o+1;o--){var R=l[r]>>8*o&255;c+=(16>R?0:\"\")+R.toString(16)}return c};";
	
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
			template: caution._t.slice(0),
			hash: {}
		};
		for (var key in caution._h) {
			result.hash[key] = caution._h[key].slice(0);
		}
		return result;
	};
	
	caution.dataUrl = function (config, customCode) {
		config = config || this.config();
		var js = inlineJs;
		js += 'caution.template(' + JSON.stringify(config.template) + ');';
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