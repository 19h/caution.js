define(['caution'], function (caution) {
	define._commonJsWrapper = function (moduleName, func) {
		var module = {};
		// TODO: decision about module.filename, module.loaded, module.parent and module.children
		module.id = moduleName;
		module.exports = {};
		module.require = function (path, func) {
			return require(resolve(path), func);
		};
		
		function resolve(name) {
			if (name.charAt(0) === '.') {
				name = moduleName + '/' + name + '/';
				name = name.replace(/\/\.\//g, '/').replace(/[^\/]+\/\.\.\//g, '').replace(/\/*$/, '');
			}
			return name;
		};
		
		function newDefine(name, deps, factory) {
			if (name + "" === name && !factory) {
				factory = deps;
				deps = null;
				// Specified name and factory
			} else if (!factory && !deps) {
				deps = name;
				name = null;
			}
			if (name + "" !== name) {
				factory = deps;
				deps = name;
				name = null;
			}
			deps = deps || ['require', 'exports', 'module'];
			
			var special = {
				'module': module,
				'exports': module.exports,
				'require': module.require
			};
			
			var filteredDeps = [];
			for (var i = 0; i < deps.length; i++) {
				if (!(deps[i] in special)) {
					filteredDeps.push(deps[i]);
				}
			}
			if (typeof factory === 'function') {
				var actualFactory = factory;
				factory = function () {
					var argIndex = 0;
					var expandedDeps = [];
					for (var i = 0; i < deps.length; i++) {
						if (deps[i] in special) {
							expandedDeps.push(special[deps[i]]);
						} else {
							expandedDeps.push(arguments[argIndex++]);
						}
					}
					return actualFactory.apply(this, expandedDeps) || module.exports;
				};
			}
			
			name = name ? resolve(name) : moduleName;

			return define(name ? name : filteredDeps, name ? filteredDeps : factory, name ? factory : undefined);
		}
		
		func(newDefine, module.require, module.exports, module);
		
		// Fallback for CommonJS case (no define() use)
		var hasDefinition = (moduleName in define._m);
		var pending = define._p;
		for (var i = 0; !hasDefinition && i < pending.length; i++) {
			var triple = pending[i];
			hasDefinition = (triple[0] === moduleName);
		}
		if (!hasDefinition) {
			define(moduleName, [], module.exports);
		}
	};
	
	caution.addLoadTransform(function (moduleName, js) {
		var code = 'define._commonJsWrapper(' + JSON.stringify(moduleName) + ', function (define, require, exports, module) {\n';
		code += js;
		code += '\n});\n';
		console.log(code);
		return code;
	});
	
	return caution;
});