describe('Test environment', function () {
	it('doesn\'t execute synchronously', function () {
		if (contextVar !== 12345) throw new Error('Should execute synchronously');
		contextVar = 67890;
		if (contextVar !== 67890) throw new Error('Value should have changed');
	});

	var contextVar = 12345;
	
	it('runs each test in a separate environment', function () {
		if (contextVar !== 12345) throw new Error('Should still hold original value');
	});
	
	it('require(\'chai\')', function () {
		require('chai');
	})
});