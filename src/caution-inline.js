var define = function define(name, deps, factory) {
	var pending = define._p = define._p || [];
	var modules = define._m = define._m || {};

	if (!factory) {
		factory = deps || name;
		deps = (deps && name) || [];
		name = define._n;
	}
	pending.push([name, deps, factory]);
	
	// Scan for modules ready to evaluate
	for (var i = 0; i < pending.length; i++) {
		var item = pending[i];
		var deps = item[1];
		var j = 0;
		for (var j = 0; j < deps.length; j++) {
			item = (deps[j] in modules) && item;
		}
		if (item) { // Ready to evaluate
			var factory = item[2];
			var args = [];
			for (var j = 0; j < deps.length; j++) {
				args[j] = modules[deps[j]];
			}
			pending.splice(i, 1);
			modules[item[0]] = (typeof factory === 'function') ? factory.apply(null, args) : factory;
			i = -1;
			continue;
		}
	}
};

var caution = {
	_t: [], // Set of URI Templates
	_h: {}, // Set of allowed module hashes
	version: VERSION, // Replaced as part of build
	missing: function (name, hashes) {
		alert('Missing safe module: ' + name + '\n' + hashes.join('\n'));
	},
	get: function (url, hashes, callback) {
		var request = new XMLHttpRequest;
		request.open("GET", url);
		request.onreadystatechange = function () {
			if (request.readyState == 4) {
				var content = request.responseText.replace(/\r/g, ''); // Normalise for consistent behaviour across webserver OS
				var hash = sha256(content);
				for (var i = 0; i < hashes.length; i++) {
					var expectedHash = hashes[i];
					if (!((request.status/100)^2) && hash.substring(0, expectedHash.length) == expectedHash) {
						return callback(null, content);
					}
				}
				callback(1);
			}
		};
		request.send();
	},
	template: function (t) {
		this._t = this._t.concat(t);
	},
	hash: function (name, hashes) {
		var thisCaution = this;
		var templates = thisCaution._t;
		thisCaution._h[name] = hashes;
		var i = 0;
		function next(error, js) {
			if (error) {
				if (i < templates.length) {
					thisCaution.get(templates[i++].replace(/{.*?}/, name), hashes, next);
				} else {
					thisCaution.missing(name, hashes);
				}
			} else {
				define._n = name;
				EVAL(js); // Hack - UglifyJS refuses to mangle variable names when eval() is used, so this is replaced after minifying
				define._n = '';
			}
		}
		next(1);
	}
};
