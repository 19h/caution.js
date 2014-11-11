define('test-runner', ['caution', 'events'], function (caution, events) {
	function addEvent(obj, event, handler) {
		obj.addEventListener(event, handler);
	}
	function removeEvent(obj, event, handler) {
		obj.removeEventListener(event, handler);
	}
	
	function Test(name, func, suite) {
		this.name = name;
		this.func = func;
		this.suite = suite;
	}
	Test.prototype = {
		run: function (callback) {
			var thisTest = this;
			var error = null;
			var globalErrorHandler = function (event) {
				// Assume all errors while we are running are our fault
				error = error || event.error;
				event.preventDefault();
				setTimeout(done, 0);
				return true;
			};
			addEvent(window, 'error', globalErrorHandler);
			var startTime = Date.now();
			var done = function (err) {
				var durationMs = Date.now() - startTime;
				removeEvent(window, 'error', globalErrorHandler);
				error = error || err;
				if (error) {
					thisTest.emit('fail', error);
				} else {
					thisTest.emit('pass', durationMs);
				}
				done = function () {}; // Do nothing
				thisTest.emit('end');
				callback({
					name: thisTest.name,
					ms: durationMs,
					error: error
				});
			}
			this.emit('start');
			setTimeout(function () {
				done(new Error('Timeout'));
			}, 2000);
			
			var func = this.func;
			if (func.length > 0) {
				func(function () {
					done();
				});
			} else {
				func();
				done();
			}
		}
	};
	events.eventify(Test.prototype);
	
	function TestSuite(name) {
		this.name = name;
		this.tests = [];
	}
	TestSuite.prototype = {
		it: function (name, func) {
			if (!func) {
				func = name;
				name = '(anonymous)';
			}
			this.tests.push(new Test(name, func));
		},
		run: function (callback) {
			var thisSuite = this;
			var tests = this.tests.slice(0);
			var testReports = [];
			function next() {
				if (!tests.length) {
					var passCount = 0, failCount = 0;
					testReports.forEach(function (report) {
						if (report.error) {
							failCount++;
						} else {
							passCount++;
						}
					})
					var report = {
						name: thisSuite.name,
						tests: testReports,
						passed: passCount,
						failed: failCount
					};
					if (failCount) {
						thisSuite.emit('fail');
					} else {
						thisSuite.emit('pass');
					}
					thisSuite.emit('end');
					return callback(report);
				}
				var test = tests.shift();
				thisSuite.emit('beforetest', test);
				test.run(function (report) {
					testReports.push(report);
					thisSuite.emit('aftertest', test);
					setTimeout(next, 0);
				});
			}
			setTimeout(function () {
				thisSuite.emit('start');
				next();
			}, 0);
		}
	};
	events.eventify(TestSuite.prototype);
	
	function TestRunner() {
		this.suites = [];
		this.currentLoadingSuite = null;
	}
	TestRunner.prototype = {
		load: function (url, callback) {
			var thisRunner = this;
			var urls = [].concat(url);
			
			if (!urls.length) return callback(null);
			
			var thisRunner = this;
			caution.get(urls.shift(), null, function (error, js) {
				if (error) {
					return callback(error);
				}
				try {
					Function('describe', 'it', js)(thisRunner.describe.bind(thisRunner), thisRunner.it.bind(thisRunner));
				} catch (error) {
					return callback(error);
				}
				thisRunner.load(urls, callback);
			});
		},
		describe: function (name, func) {
			if (!func) {
				func = name;
				name = '(anonymous test)';
			}
			var suite = new TestSuite(name);
			this.suites.push(suite);
			this.loadSuiteTests(suite, func);
		},
		loadSuiteTests: function (suite, func) {
			this.currentLoadingSuite = suite;
			func();
			this.currentLoadingSuite = null;
		},
		it: function () {
			if (this.currentLoadingSuite) {
				this.currentLoadingSuite.it.apply(this.currentLoadingSuite, arguments);
			} else {
				throw new Error('Cannot use it() outside of describe()');
			}
		},
		run: function (callback) {
			var thisRunner = this;
			var suites = this.suites.slice(0);
			var suiteReports = [];
			function next() {
				if (!suites.length) {
					if (callback) callback(suiteReports);
					return thisRunner.emit('end');
				}
				var suite = suites.shift();
				thisRunner.emit('beforesuite', suite);
				suite.run(function (report) {
					thisRunner.emit('aftersuite', suite);
					suiteReports.push(report);
					setTimeout(next, 0);
				});
			}
			setTimeout(function () {
				thisRunner.on('start');
				next();
			}, 0);
		}
	};
	events.eventify(TestRunner.prototype);
	
	addEvent(window, 'message', function (message) {
		console.log('message', message);
	});
	
	return TestRunner;
});