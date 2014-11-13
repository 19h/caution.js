describe('Basic define()', function () {
	it('defines modules', function (done) {
		define('A', [], function () {
			executed = true;
			return {foo: 'bar'}
		});
		
		require(['A'], function (A) {
			if (A.foo !== "bar") throw new Error('A.foo !== "bar"');
			done();
		});
	});

	it('omit dependencies', function (done) {
		define('A', function () {
			executed = true;
			return {foo: 'bar'}
		});
		
		require(['A'], function (A) {
			if (A.foo !== "bar") throw new Error('A.foo !== "bar"');
			done();
		});
	});

	it('defines modules only when needed', function (done) {
		var defined = false;
		
		define('A', [], function () {
			defined = true;
			executed = true;
			return {foo: 'bar'}
		});
		
		if (defined) throw new Error('Should not be defined until require() call');
		
		require(['A'], function (A) {
			done();
		});
	});

	it('defines modules asynchronously', function (done) {
		require(['A'], function (A) {
			if (A.foo !== "bar") throw new Error('A.foo !== "bar"');
			done();
		});

		define('A', [], function () {
			return {foo: 'bar'}
		});
	});

	it('passes dependencies as arguments', function (done) {
		define('B', ['A'], function (A) {
			return {A: A};
		});

		define('A', [], function () {
			return {foo: 'bar'};
		});

		require(['B'], function (B) {
			if (B.A.foo !== "bar") throw new Error('B.A.foo !== "bar"');
			done();
		});
	});
});