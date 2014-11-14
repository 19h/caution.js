var assert = require('chai').assert;

describe('optional: async require()', function () {
	it('can use true instead of callback', function (done) {
		require(['A'], true);

		var defined = false;
		define('A', [], function () {
			defined = true;
			return 'foo';
		});
		
		setTimeout(function () {
			assert.isTrue(defined);
			done();
		}, 10);
	});
});