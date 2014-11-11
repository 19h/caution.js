describe('Demo suite 1', function () {
	it('Pass test (sync)', function () {
		// Pass
	});

	it('Pass test (async)', function (done) {
		setTimeout(function () {
			done();
		}, 10);
	});

	it('Fail test (sync)', function () {
		throw new Error('Thrown error');
	});

	it('Fail test (async)', function (done) {
		setTimeout(function () {
			throw new Error('thrown');
			done();
		}, 10);
	});

	it('Slow test', function (async) {
		setTimeout(function () {
			async();
		}, 1000);
	});

	it('Timeout test', function (async) {
		// Never call async
	});
});

describe('Demo suite 2 (all passes)', function () {
	for (var i = 0; i < 5; i++) {
		it('Test ' + (i + 1), function (done) {
			setTimeout(done, 50);
		})
	}
});