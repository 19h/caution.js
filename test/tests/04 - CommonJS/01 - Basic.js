var assert = require('chai').assert;

describe('CommonJS support', function () {

	it('can add', function (done) {
		require(['caution-commonjs'], function (caution) {
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
	});
	
	it('doesn\'t break AMD', function (done) {
		require(['caution-commonjs'], function (caution) {
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
	
	it('defines special "module" module', function (done) {
		require(['caution-commonjs'], function (caution) {
			caution.addLoad(function (name, versions, callback) {
				if (name === 'A') return callback(null, "define(['module'], function (module) {\n\tmodule.exports = {a: 'A'};\n});");
				callback(true);
			});
		
			require(['A'], function (A) {
				assert.equal(A.a, 'A');
				done();
			});
		});
	});

	it('defines special "exports" module', function (done) {
		require(['caution-commonjs'], function (caution) {
			caution.addLoad(function (name, versions, callback) {
				if (name === 'A') return callback(null, "define(['exports'], function (exports) {\n\texports.a = 'A';\n});");
				callback(true);
			});
		
			require(['A'], function (A) {
				assert.equal(A.a, 'A');
				done();
			});
		});
	});

	it('defines special "require" module', function (done) {
		require(['caution-commonjs'], function (caution) {
			caution.addLoad(function (name, versions, callback) {
				if (name === 'A1/sub') return callback(null, "define(function (require, exports, module) {\n\texports.foo = 'bar';\n});");
				if (name === 'A1') return callback(null, "define(['require', 'A1/sub'], function (require) {\n\treturn {sub: require('./sub')};\n});");
				callback(true);
			});
		
			require(['A1'], function (A) {
				assert.equal(A.sub.foo, 'bar');
				done();
			});
		});
	});
	
	it('handles require() dependencies', function (done) {
		require(['caution-commonjs'], function (caution) {
			var caution = require('caution');
			caution.addLoad(function (name, versions, callback) {
				if (name === 'A') return callback(null, "module.exports = {B: require('B')};");
				if (name === 'B') return callback(null, "module.exports = {foo: 'bar'};");
				callback(true);
			});
		
			require(['A'], function (A) {
				assert.equal(A.B.foo, 'bar');
				done();
			});
		});
	});
	
	it('ignores require() inside define()', function (done) {
		require(['caution-commonjs'], function (caution) {
			var caution = require('caution');
			caution.addLoad(function (name, versions, callback) {
				if (name === 'A') return callback(null, "define('A', ['B'], function () {return {B: require('B')};});define('B', [], {foo:'bar'});");
				callback(true);
			});
		
			require(['A'], function (A) {
				assert.equal(A.B.foo, 'bar');
				done();
			});
		});
	});
});