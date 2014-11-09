define([], function () {
	var inlineJs = INLINE;
	
	if (typeof caution !== 'object') {
		var func = new Function(inlineJs + 'return caution;');
		caution = func();
	}
	
	caution.inlineJs = function (config, customCode) {
		var js = inlineJs;
		js = js.replace(/urls\:.*?\}/, function (def) {
			var sequence = config.paths.map(function (entry) {
				if (typeof entry === 'string') {
					return '[' + entry.split(/\{.*?\}/g).map(function (part) {
						return JSON.stringify(part);
					}).join('+m+') + ']';
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