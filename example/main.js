define(['A'], function (a) {
	console.log('A:', a);
});

define('A', [], function () {
	return JSON.stringify('A');
});