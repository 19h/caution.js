// This is the inline seed of the caution module - _m, fail() and urls() are kept on for continuity
define._c = {
	_m: {}, // Existing modules, (name -> [url, hash]) - pending modules should have truthy values
	fail: function (name, versions, error) {
		var message ='Missing safe module: ' + name + '\n' + versions.join('\n');
		alert(message);
		throw new Error(message);
	},
	urls: function (moduleName, versions, error) {
		return [];
	},
	load: function (name, versions, hashes) {
		var cautionSeed = this;
		var urls = cautionSeed.urls(name, versions);
	
		hashes = hashes || versions;
	
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
							var hash = statusNotOK || sha256(encodeURI(content).replace(/%../g, function (part) {
								return String.fromCharCode('0x' + part[1] + part[2] - 0);
							}));
							var match = 0;
							var i = 0;
							while (hashes[i]) {
								match |= (EVAL('/^' + hashes[i++] + '/').test(hash));
							}
						
							if (!statusNotOK && match) {
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