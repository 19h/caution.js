define([], function () {
	var inlineJs = "var define=function n(t,e,r){var i=n._p=n._p||[],o=n._m=n._m||{};r||(r=e||t,e=e&&t||[],t=n._n),i.push([t,e,r]);for(var a=0;a<i.length;a++){for(var f=i[a],e=f[1],s=0,s=0;s<e.length;s++)f=e[s]in o&&f;if(f){for(var r=f[2],h=[],s=0;s<e.length;s++)h[s]=o[e[s]];i.splice(a,1),o[f[0]]=\"function\"==typeof r?r.apply(null,h):r,a=-1}else;}},caution={_t:[],_h:{},version:\"0.1.0\",missing:function(n,t){alert(\"Missing safe module: \"+n+\"\\n\"+t.join(\"\\n\"))},get:function(n,t,e){var r=new XMLHttpRequest;r.open(\"GET\",n),r.onreadystatechange=function(){if(4==r.readyState){for(var n=r.responseText.replace(/\\r/g,\"\"),i=sha256(n),o=0;o<t.length;o++){var a=t[o];if(!(r.status/100^2)&&i.substring(0,a.length)==a)return e(null,n)}e(1)}},r.send()},template:function(n){this._t=this._t.concat(n)},hash:function(n,t){function e(a,f){a?o<i.length?r.get(i[o++].replace(/{.*?}/,n),t,e):r.missing(n,t):(define._n=n,eval(f),define._n=\"\")}var r=this,i=r._t;r._h[n]=t;var o=0;e(1)}},sha256=function t(n){function e(n,t){return n>>>t|n<<32-t}for(var r,i,o=Math.pow,a=o(2,32),f=\"length\",s=\"push\",h=\"\",u=[],c=8*n[f],l=t.h=t.h||[],g=t.k=t.k||[],p=g[f],v={},_=2;64>p;_++)if(!v[_]){for(r=0;313>r;r+=_)v[r]=_;l[p]=o(_,.5)*a|0,g[p++]=o(_,1/3)*a|0}for(n+=\"\\x80\";n[f]%64-56;)n+=\"\\x00\";for(r=0;r<n[f];r++){if(i=n.charCodeAt(r),i>>8)return;u[r>>2]|=i<<(3-r)%4*8}for(u[s](c/a|0),u[s](c),i=0;i<u[f];){var d=u.slice(i,i+=16),m=l;for(l=l.slice(0,8),r=0;64>r;r++){var y=d[r-15],E=d[r-2],M=l[0],S=l[4],k=l[7]+(e(S,6)^e(S,11)^e(S,25))+(S&l[5]^~S&l[6])+g[r]+(d[r]=16>r?d[r]:d[r-16]+(e(y,7)^e(y,18)^y>>>3)+d[r-7]+(e(E,17)^e(E,19)^E>>>10)|0),w=(e(M,2)^e(M,13)^e(M,22))+(M&l[1]^M&l[2]^l[1]&l[2]);l=[k+w|0].concat(l),l[4]=l[4]+k|0}for(r=0;8>r;r++)l[r]=l[r]+m[r]|0}for(r=0;8>r;r++)for(i=3;i+1;i--){var x=l[r]>>8*i&255;h+=(16>x?0:\"\")+x.toString(16)}return h};";

	caution.current = function () {
		var result = {
			template: caution._t.slice(0),
			hash: {}
		};
		for (var key in caution._h) {
			result.hash[key] = caution._h[key].slice(0);
		}
		return result;
	};
	
	caution.dataUrl = function (state) {
		var js = inlineJs;
		js += 'caution.template(' + JSON.stringify(state.template) + ');';
		for (var key in state) {
			if (key !== 'template') {
				for (var name in state[key]) {
					js += 'caution.' + key + '(' + JSON.stringify(name) + ',' + JSON.stringify(state[key][name]) + ');';
				}
			}
		}
		console.log(js);
		var html = '<!DOCTYPE html><html><body><script>' + js + '</script></body></html>';
		
		if (typeof btoa === 'function') {
			return 'data:text/html;base64,' + btoa(html);
		} else {
			return 'data:text/html,' + encodeURI(html);
		}
	};
	
	return caution;
});