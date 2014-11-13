var assert = require('chai').assert;

describe('Async require()', function () {
	it('loads module', function (done) {
		define('A', [], function () {
			return 'foo';
		});
		
		require(['A'], function (A) {
			assert.equal(A, 'foo');
			done();
		})
	});
});