describe('Sync require()', function () {
	it('loads defined module', function () {
		define('A', [], function () {
			return {foo: 'bar'};
		});
		
		var A = require('A');
		if (A.foo !== 'bar') throw new Error('A.foo');
	});
	
	it('throws on undefined module', function () {
		var threw = false;
		try {
			var x = require('some module that doesn\'t exist');
		} catch (e) {
			threw = true;
		}
		if (!threw) throw new Error('Should throw');
	})
});