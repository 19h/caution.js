var define = define || function define(name, deps, factory) {
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
	version: VERSION,
	missing: function (name, hash) {
		alert('Missing safe ' + name + '\n' + hash);
	},
	add: function (name, hash, urls) {
		var cautionRef = caution;
		var modules = cautionRef._m = cautionRef._m || {};
		var module = modules[name] = modules[name] || {h: [], u: []};
		module.h.push(hash);
		module.u = module.u.concat(urls);

		while (urls.length) {
			var request = new XMLHttpRequest;
			request.open("GET", urls.shift(), false);
			request.send();
			var c = request.responseText;
			var hash = sha256(c);
			for (var i = 0; i < module.h.length; i++) {
				var expectedHash = module.h[i];
				if (!expectedHash || hash.substring(0, expectedHash.length) == expectedHash) {
					define._n = name;
					EVAL(c); // Hack - UglifyJS refuses to mangle variable names when eval() is used, so this is replaced after minifying
					return define._n = null;
				}
			}
		}
		this.missing(name, hash);
	}
};
