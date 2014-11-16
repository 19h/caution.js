var assert = require('chai').assert;

describe('CommonJS support', function () {
	var caution = require('caution');
	caution.addLoadTransform(function (moduleName, js) {
		var code = '(function () {\n';
		code += 'var module = ' + JSON.stringify({
			exports: {}
		}, null, '\t') + ';\n';
		code += 'var exports = module.exports;\n\n';
		code += js;
		code += '\nif (!(' + JSON.stringify(moduleName) + ' in define._m)) {\n';
		code += '	define(' + JSON.stringify(moduleName) + ', module.exports);\n';
		code += '}';
		code += '})();\n';
		return code;
	});

	it('can add', function (done) {
		var caution = require('caution');
		caution.addLoad(function (name, versions, callback) {
			if (name === 'A') return callback(null, "module.exports = {a: 'A'};");
			callback(true);
		});
		
		require(['A'], function (A) {
			assert.equal(A.a, 'A');
			done();
		});
	});
	
	it('doesn\'t break AMD', function (done) {
		var caution = require('caution');
		caution.addLoad(function (name, versions, callback) {
			if (name === 'A') return callback(null, "define([], {a: 'A'});");
			callback(true);
		});
		
		require(['A'], function (A) {
			assert.equal(A.a, 'A');
			done();
		});
	});
});