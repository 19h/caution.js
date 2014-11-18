// This is the inline seed of the caution module - _m, fail() and urls() are kept on for continuity
define._c = {
	_m: {},
	fail: function (name, versions, error) {
		var message ='Missing safe module: ' + name + '\n' + versions.join('\n');
		alert(message);
		throw new Error(message);
	}
};

var init = function (config) {
	init = 0;
	
	var cautionSeed = define._c;
	define.urls = function (moduleName, versions) {
		function specToUrls(spec) {
			var result = [];
			var vRegExp = /\{v\}/g;
			if (spec + "" !== spec) {
				if (spec[moduleName]) {
					result = specToUrls(spec[moduleName]);
				}
			} else {
				spec = spec.replace(/\{m?\}/g, moduleName);
				if (vRegExp.test(spec)) {
					for (var i = 0; versions && versions[i]; i++) {
						result.push(spec.replace(vRegExp, versions[i]));
					}
				} else {
					result[0] = spec;
				}
			}
			return result;
		}
		return [].concat.apply([], config.u.map(specToUrls));
	};
			
	for (var key in config.m) {
		var entry = config.m[key];
		load(key, entry.v, entry.s);
	}
	
	function load(name, versions, hashes) {
		versions = versions || [];
		hashes = hashes || versions;

		var urls = cautionSeed.urls(name, versions);

		if (!cautionSeed._m[name]) {
			cautionSeed._m[name] = [];
	
			function next(error) {
				if (urls.length) {
					// AJAX request with next URL
					var request = new XMLHttpRequest;
					var url = urls.shift();
					request.open("GET", url);
					request.onreadystatechange = function () {
						if (request.readyState > 3) {
							var statusNotOK = ((request.status/100)^2);
							var content = request.responseText.replace(/\r/g, ''); // Normalise for consistent behaviour across webserver OS

							// Check validity against supplied hashes
							var hash = statusNotOK || sha256(encodeURI(content).replace(/%(..)/g, function (part, hexPair) {
								return String.fromCharCode('0x' + hexPair - 0);
							}));
						
							var end = '/.test("' + hash + '")';

							if (!statusNotOK
								&& EVAL('/^' + hashes.join(end + '|/^') + end)) {
								// It matches - load it!
								cautionSeed._m[define._n = name] = [url, hash];
								FUNCTION(content)();
								define._n = '';
							} else {
								next(1);
							}
						}
					};
			
					try {
						request.send();
					} catch (e) {
						next(e);
					}
				} else {
					cautionSeed.fail(name, versions, error);
				}
			}
			next();
		}
	}
};