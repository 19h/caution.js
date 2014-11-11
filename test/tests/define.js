describe('Test environment', function () {
	it('includes assert()', function () {
		assert.isTrue(true);
	});
	
	it('doesn\'t execute synchronously', function () {
		assert.equal(contextVar, 12345);
		contextVar = 67890;
		assert.equal(contextVar, 67890);
	});

	var contextVar = 12345;
	
	it('runs each test in a separate environment', function () {
		assert.equal(contextVar, 12345);
	});
});

describe('Basic define()', function () {
	it('defines modules', function (done) {
		define('A', [], function () {
			return {foo: 'bar'}
		});
		
		define(['A'], function (A) {
			if (A.foo !== "bar") throw new Error();
			done();
		});
	});

	it('defines modules asynchronously', function (done) {
		define(['A'], function (A) {
			if (A.foo !== "bar") throw new Error();
			done();
		});

		define('A', [], function () {
			return {foo: 'bar'}
		});
	});

	it('passes dependencies as arguments', function (done) {
		define('A', [], function () {
			return {foo: 'bar'};
		});

		define('B', ['A'], function (A) {
			return {A: A};
		});

		define(['B'], function (B) {
			if (B.A.foo !== "bar") throw new Error();
			done();
		});
	});
})