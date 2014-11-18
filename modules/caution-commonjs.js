define(['caution'], function (caution) {
	var regex = {
		'WhiteSpace': /[\u0020\t\u000B\u000C\u00A0\uFFFF]/,
		'LineTerminator': /[\u000A\u000D\u2028\u2029]/
	};
	var punctuators = ['>>>=', '===', '!==', '>>>', '<<=', '>>=', '<=', '>=', '==', '==', '!=', '++', '--', '<<', '>>', '&&', '||', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '{', '}', '(', ')', '[', ']', '.', ',', '<', '>', '+', '-', '*', '/', '%', '|', '&', '^', '!', '~', '?', ':', '=', ';'];
	var punctuatorLookup = {};
	for (var i = 0; i < punctuators.length; i++) {
		punctuatorLookup[punctuators[i]] = true;
	}
	
	// A primitive JavaScript tokeniser, used for determining whether a require() call is inside a define() or not
	// It doesn't throw any errors, instead just assuming all code is syntactically correct
	function getTokens(code, callback) {
		var pos = 0;
		var match;
		var allowRegExpNext = true;
		while (pos < code.length) {
			var startPos = pos;
			var chr = code[pos];
			
			if (regex.WhiteSpace.test(chr)) {
				while (regex.WhiteSpace.test(chr)) {
					chr = code[++pos];
				}
				callback('WhiteSpace', startPos, pos);
			} else if (regex.LineTerminator.test(chr)) {
				while (regex.LineTerminator.test(chr)) {
					chr = code[++pos];
				}
				callback('LineTerminator', startPos, pos);
			} else if (chr === '/' && code[pos + 1] === '/') {
				while (!regex.LineTerminator.test(chr)) {
					chr = code[++pos];
				}
				callback('Comment', startPos, pos);
			} else if (chr === '/' && code[pos + 1] === '*') {
				pos += 2;
				while ((code[pos] != '*' || code[pos + 1] != '/') && pos < code.length) {
					pos++;
				}
				pos += 2;
				callback('Comment', startPos, pos);
			} else if (chr === '"' || chr === "'") {
				var start = chr;
				while (code[++pos] !== start && pos < code.length) {
					if (code[pos] === '\\') {
						pos++;
					}
				}
				pos++;
				callback('StringLiteral', startPos, pos);
				allowRegExpNext = false;
			} else if (chr === '0' && code[pos + 1].toLowerCase() === 'x') {
				pos += 2;
				while (/[0-9a-fA-F]/.test(code[pos])) {
					pos++;
				}
				callback('Number', startPos, pos);
				allowRegExpNext = false;
			} else if (/[0-9]/.test(chr) || (chr === '.' && /[0-9]/.test(code[pos + 1]))) {
				// Integer part
				while (/[0-9]/.test(code[pos])) {
					pos++;
				}
				// Fractional part
				if (code[pos] === '.') {
					pos++;
					while (/[0-9]/.test(code[pos])) {
						pos++;
					}
				}
				// Exponent part
				if (code[pos] === 'e' || code[pos] === 'E') {
					pos++;
					if (code[pos] === '+' || code[pos] === '-') {
						pos++;
					}
					while (/[0-9]/.test(code[pos])) {
						pos++;
					}
				}
				callback('Number', startPos, pos);
				allowRegExpNext = false;
			} else if (allowRegExpNext && chr === '/') {
				// Regular expression
				++pos;
				while (code[pos] != '/' && pos < code.length) {
					chr = code[pos++];
					if (chr === '\\') {
						pos++; // skip a character
					} else if (chr === '[') {
						while (code[pos] !== ']' && pos < code.length) {
							if (code[pos] === '\\') pos++;
							pos++;
						}
						pos++; // Skip the closing ]
					}
				}
				pos++;
				while (/[a-zA-Z0-9_\$]/.test(code[pos])) {
					pos++;
				}
				callback('RegularExpression', startPos, pos);
				allowRegExpNext = false;
			} else if (punctuatorLookup[chr]) {
				pos++;
				while (punctuatorLookup[code.substring(startPos, pos + 1)] && pos < code.length) {
					pos++;
				}
				callback('Punctuator', startPos, pos);
				allowRegExpNext = true;
			} else {
				// Just merrily assume everything else is an identifier
				while (!punctuatorLookup[chr] && !regex.WhiteSpace.test(chr) && !regex.LineTerminator.test(chr) && chr !== '"' && chr !="'" && pos < code.length) {
					chr = code[++pos];
				}
				if (startPos === pos) throw new Error('Could not tokenise code at index ' + startPos);
				callback('Identifier', startPos, pos);
				allowRegExpNext = false;
			}
		}
	}

	define._commonJsWrapper = function (moduleName, topLevelDeps, func) {
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
		
		require(topLevelDeps, function () {
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
		});
	};
	
	caution.addLoadTransform(function (moduleName, js) {
		var stackDepth = 0, ignoreAbove = 1e6;

		var topLevelDeps = [];
		
		var nextFunctions = [];
		function next(func) {
			nextFunctions.push(func);
		}
		getTokens(js, function (type, start, end) {
			if (type === 'WhiteSpace' || type === 'LineTerminator' || type === 'Comment') return;

			if (nextFunctions.length) {
				var funcs = nextFunctions;
				nextFunctions = [];
				for (var i = 0; i < funcs.length; i++) {
					funcs[i](type, start, end);
				}
			}

			if (type === 'Punctuator') {
				var value = js.substring(start, end);
				if (value === '(' || value === '{' || value === '[') {
					stackDepth++;
				} else if (value === ')' || value === '}' || value === ']') {
					stackDepth--;
					if (stackDepth <= ignoreAbove) {
						ignoreAbove = 1e6;
					}
				}
			} else if (type === 'Identifier') {
				var value = js.substring(start, end);
				if (value === 'require' && stackDepth <= ignoreAbove) {
					next(function (type, start, end) {
						var value = js.substring(start, end);
						if (value === '(') {
							next(function (type, start, end) {
								if (type === 'StringLiteral') {
									var packageName = eval(js.substring(start, end));
									next(function (type, start, end) {
										var value = js.substring(start, end);
										if (value === ')') {
											topLevelDeps.push(packageName);
										}
									});
								}
							})
						}
					});
				} else if (value === "define" && stackDepth <= ignoreAbove) {
					next(function (type, start, end) {
						var value = js.substring(start, end);
						if (value === '(') {
							ignoreAbove = stackDepth;
						}
					})
				}
			}
		});
		
		var code = 'define._commonJsWrapper(' + JSON.stringify(moduleName) + ', ' + JSON.stringify(topLevelDeps) + ', function (define, require, exports, module) {\n';
		code += js;
		code += '\n});\n';
		console.log(code);
		return code;
	});
	
	return caution;
});