define('test-runner', ['caution', 'events'], function (caution, events) {
	function addEvent(obj, event, handler) {
		obj.addEventListener(event, handler);
	}
	function removeEvent(obj, event, handler) {
		obj.removeEventListener(event, handler);
	}
	
	function Test(name, func, suite) {
		if (func.length === 0) {
			var syncFunc = func;
			func = function (done) {
				syncFunc();
				done();
			};
		}
	
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
				error = error || event.error || new Error('Event not available (might occur in cross-origin script): ' + event.message);
				event.preventDefault();
				setTimeout(done, 0);
				return true;
			};
			addEvent(window, 'error', globalErrorHandler);
			this.emit('start');
			var startTime = Date.now();
			var done = function (err) {
				var durationMs = Date.now() - startTime;
				clearTimeout(doneTimeout);
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
					// We can't use the actual error object because it doesn't serialise (JSON or postMessage)
					error: !error ? null : {
						message: error.message,
						stack: error.stack || error.message
					}
				});
			}
			var doneTimeout = setTimeout(function () {
				done(new Error('Timeout'));
			}, 2000);
			
			this.func(function () {
				done();
			});
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
		run: function (runFunction, callback) {
			var thisSuite = this;
			if (!callback) {
				callback = runFunction;
				runFunction = function (test, index, callback) {
					test.run(callback);
				};
			}
			
			var tests = this.tests.slice(0);
			var testReports = [];
			function next() {
				if (!tests.length) {
					var passCount = 0, failCount = 0;
					testReports.forEach(function (report) {
						if (!report) {
							// Do nothing
						} else if (report.error) {
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
				
				// Run the tests
				var test = tests.shift();
				
				thisSuite.emit('beforetest', test);
				
				var testIndex = testReports.length;
				runFunction(test, testIndex, function (report) {
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
		run: function (runFunction, callback) {
			var thisRunner = this;
			if (!callback) {
				callback = filterFunction;
				runFunction = function (test, suiteNumber, testNumber, callback) {
					test.run(callback);
				};
			}
			
			var suites = this.suites.slice(0);
			var suiteReports = [];
			function next() {
				if (!suites.length) {
					if (callback) callback(suiteReports);
					return thisRunner.emit('end');
				}
				var suite = suites.shift();
				thisRunner.emit('beforesuite', suite);
				var suiteIndex = suiteReports.length;
				suite.run(function (test, testIndex, callback) {
					runFunction(test, suiteIndex, testIndex, callback);
				}, function (report) {
					thisRunner.emit('aftersuite', suite);
					suiteReports.push(report);
					next();
				});
			}
			setTimeout(function () {
				thisRunner.on('start');
				next();
			}, 0);
		}
	};
	events.eventify(TestRunner.prototype);
	
	return TestRunner;
});