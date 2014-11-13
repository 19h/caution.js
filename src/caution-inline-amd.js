// Hack - UglifyJS refuses to mangle variable names when eval() or Function are used
//	therefore we use EVAL and FUNCTION, and replace them after minifying

(function (global) {
	var require = global['require'] = function (nameOrDeps, func) {
		if (func) {
			for (var i = 0; i < nameOrDeps.length; i++) {
				isRequired[nameOrDeps[i]] = 1;
			}
			return define(0, nameOrDeps, func)
		} else {
			isRequired[nameOrDeps] = 1;			
			// For efficiency, don't scan if we already have a result - costs us ~10 bytes, but probably worth it
			if (!define._m[nameOrDeps]) {
				scanForReadyModules();
			}
			if (nameOrDeps in define._m) return define._m[nameOrDeps];
			throw nameOrDeps;
		}
	};
	var counter = 0;
	var define = global['define'] = function (name, deps, factory) {
		if (!name || (name + "" === name)) {
			// We were given a name (or a falsy value to indicate no module name at all)
			if (!factory) {
				factory = deps;
				deps = [];
			}
		} else {
			factory = deps || name;
			// Two arguments -> actual deps in the name, otherwise only one argument
			deps = deps ? name : [];
			name = define._n || ('_anon' + counter++);
		}
		pending.push([name, deps, factory]);
	
		scanForReadyModules();
	};
	var isRequired = define._r = {};
	var pending = define._p = [];
	var modules = define._m = {};
	
	function scanForReadyModules() {
		var item;
		for (var pendingIndex = 0; item = pending[pendingIndex]; pendingIndex++) {
			var name = item[0];
			if (!name || isRequired[name]) {
				var deps = item[1];
				var value = item[2];

				var args = [];
				var depName;
				for (var j = 0; j < deps.length; j++) {
					args[j] = modules[depName = deps[j]];
					// Use item as a flag for whether we're ready to go
					item = (depName in modules) && item;
					// Mark all our dependencies as required, restarting if necessary
					if (!isRequired[depName]) {
						pendingIndex = isRequired[depName] = -1;
					}
				}
				if (item) { // Ready to evaluate
					pending.splice(pendingIndex, 1);
					value = (typeof value === 'function') ? value.apply(global, args) : value;
					if (name) {
						modules[name] = value;
					}
					pendingIndex = -1;
				}
			}
		}

		// Hook for later, so the caution module gets notified when anything happens with define() or require()
		if (define._d) define._d();
	};
	define.amd = {caution: VERSION};
})(this);