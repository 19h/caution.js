define([], function () {
	function runnerToDom(runner, targetDiv, options) {
		
		runner.suites.forEach(function (suite) {
			// Add suite header
			var suiteDiv = document.createElement('div');
			suiteDiv.className = 'test-suite waiting';
			
			var suiteName = document.createElement('div');
			suiteName.className = 'test-suite-name';
			suiteName.appendChild(document.createTextNode(suite.name));
			suiteDiv.appendChild(suiteName);
			
			suite.on('start', function () {
				suiteDiv.className = 'test-suite running';
			});
			suite.on('pass', function () {
				suiteDiv.className = 'test-suite passed';
			});
			suite.on('fail', function () {
				suiteDiv.className = 'test-suite failed';
			});

			suite.tests.forEach(function (test) {
				var testDiv = document.createElement('div');
				testDiv.className = 'test waiting';
				
				var testName = document.createElement('span');
				testName.className = 'test-name';
				testName.appendChild(document.createTextNode(test.name));
				testDiv.appendChild(testName);

				var testTime = document.createElement('span');
				testTime.className = 'test-duration';
				testDiv.appendChild(testTime);

				var testResult = document.createElement('span');
				testResult.className = 'test-result';
				testResult.innerHTML = 'waiting';
				testDiv.appendChild(testResult);
				
				var testError = document.createElement('span');
				testError.className = 'test-error';
				testDiv.appendChild(testError);

				test.on('start', function () {
					testDiv.className = 'test running';
					testResult.innerHTML = 'running';
					testError.innerHTML = testTime.innerHTML = '';
				});
				test.on('pass', function (ms) {
					if (ms > 100) {
						testDiv.className = 'test passed slow';
					} else {
						testDiv.className = 'test passed';
					}
					testResult.innerHTML = 'passed';
					testTime.innerHTML = parseFloat(ms) + "ms";
				});
				test.on('fail', function (error) {
					testDiv.className = 'test failed';
					var reportText = error.stack || error.message;
					var pre = document.createElement('pre');
					pre.appendChild(document.createTextNode(reportText));
					testError.appendChild(pre);
					testResult.innerHTML = 'failed';
				});

				suiteDiv.appendChild(testDiv);
			});

			targetDiv.appendChild(suiteDiv);
		});
	};
	
	return runnerToDom;
});