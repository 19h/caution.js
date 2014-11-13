var assert = require('chai').assert;

describe('caution module', function () {
	it('exists', function () {
		var caution = require('caution');
		
		assert.isObject(caution);
	});

	it('add load method', function (done) {
		var caution = require('caution');
		caution.addLoad(function (name, versions, callback) {
			if (name === 'demo1') return callback(null, "define('demo1', [], {name: 'demo1'});");
			callback(true);
		});
		
		require(['demo1'], function (demo1) {
			assert.equal(demo1.name, 'demo1');
			done();
		});
	});

	it('load supports anonymous modules', function (done) {
		var caution = require('caution');
		caution.addLoad(function (name, versions, callback) {
			if (name === 'demo1') return callback(null, "define([], {name: 'demo1'});");
			callback(true);
		});
		
		require(['demo1'], function (demo1) {
			assert.equal(demo1.name, 'demo1');
			done();
		});
	});
	
	it('load supports anonymous modules without dependencies', function (done) {
		var caution = require('caution');
		caution.addLoad(function (name, versions, callback) {
			if (name === 'demo1') return callback(null, "define({name: 'demo1'});");
			callback(true);
		});
		
		require(['demo1'], function (demo1) {
			assert.equal(demo1.name, 'demo1');
			done();
		});
	});
	
	it('add code-transform method', function (done) {
		var caution = require('caution');
		
		caution.addLoad(function (name, versions, callback) {
			if (name === 'demo1') return callback(null, "define('demo1', [], {name: 'demo1'});");
			callback(true);
		});

		caution.addLoadTransform(function (name, js) {
			if (name === 'demo1') {
				js = js.replace(/name\: 'demo1'/, "name: 'demo2'");
			}
			return js;
		});
		
		require(['demo1'], function (demo1) {
			assert.equal(demo1.name, 'demo2');
			done();
		});
	});
});