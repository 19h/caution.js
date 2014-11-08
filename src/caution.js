define([], function () {
	var inlineJs = INLINE;
	
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