# caution.js - a module loader for tamper-proof websites

Caution.js is a module loader, making it easy to have web web-apps which:

* perform secure verification of their own resources (e.g. JS/CSS)
* use fallback locations if verification fails

AMD syntax (`define()`) is supported initially, but support for CommonJS modules is being developed, and ES6 module support is planned.

Code is on [BitBucket](https://bitbucket.org/geraintluff/caution.js).  API docs are [here](doc/api.md).  There are some tests (mostly for `define()`/`require()`) in the `test/` directory of the repo.

## Motivation and principles

### For some applications, securing the connection is not enough.

If your web-app makes promises about security or privacy (e.g. "we never see unencrypted content"), then users might want to know when the behaviour of the web-app changes. What if one of the servers is compromised, and starts serving bad content? What if you have a rogue sysadmin?

### To monitor the server's content, you can't start with what the server gives you

If your starting-point is a web-page that the server gives you, you can't trust any verification that page performs because it might already be broken.  However, if you start from a "known-good" HTML file, you can bootstrap secure verification of resources from there.

### Data URLs are a neat place to store a secure starting-page

A Data URL is a URL that contains its own content, e.g. [`data:text/html,Hello%20<h1>hello</h1>%20hello`](data:text/html,Hello%20<h1>hello</h1>%20hello).
All modern browsers support these, and they can be bookmarked like any other URL - this means users can keep the "known-good" HTML in their bookmarks without downloading anything.

### There should be fallback locations for resources/modules

A failed verification should not break everything - ideally there should be more than one place to look for resources, and the option for the user to supply a location themselves without compromising security.

## What's in caution.js?

There are two parts to caution.js:

* the "inline code" (to be included in the secure starting-page) that loads and verifies an initial set of resources
* the `caution` module, which allows you to specify security criteria, perform automatic fetching of modules, etc.

### The inline code

The inline code includes:

* the [SHA-256 hash function](https://github.com/geraintluff/sha256/blob/gh-pages/sha256.js) (~850 bytes minified)
* an implementation of AMD's [`define()` and `require()` functions](https://bitbucket.org/geraintluff/caution.js/src/master/src/caution-inline-amd.js) (~580 bytes minified)
* logic to load/verify an initial set of resources

This inline code is produced by the `caution` module, so your web apps can always generate new `data:` URLs.

### The `caution` module

The API for this module can be viewed [here](doc/api.md).

The goal of this module is to make specifying the security requirements simple, while

## Example

```javascript
// Main loading logic
//	- this could be included with the inline code, or loaded as one of the initial modules
require(['caution', 'verify-signature'], function (caution, verifySignature) {
	caution.addUrls([
		"http://my-site/modules/{}.js",
		"http://backup-site/modules/{}.js",
		{"some-particular-module": "http://..."},
		function (moduleName, versions} {return [...]}
	]);
	
	// Provide our own safety criteria
	caution.addSafe(function (text, hash) {
		if (hash in bigListOfSafeHashes) {
			return true;
		}
		return verifySignature(text, ...);
	});
	
	// Automatically fetch missing modules
	caution.missingModules(function (moduleName) {
		caution.load(moduleName);
	});
	
	// Load some initial scripts to get going
	caution.load('lets-get-this-party-started');
});
```

## Next steps

This project is in the early stages of development, so there's a lot left to do.  Some things I'm looking forward to:

### CommonJS and ES6 module support

I started with AMD syntax because the API is straightforward and understood, but the asynchronous nature is important to the functionality I wanted - apps should be able to fall back to fetching the individual modules from CDNs or other servers if validation fails for the primary set of resources (which could be a single compiled JS file).

However, many people are more used to CommonJS syntax (although often modules support both).  This syntax can still be made asynchronous by scanning for `require('some-module')` in the code (much like Browserify does), but this is much easier if the AMD system is already working.

I'm thinking of adding support for the other module formats as modules themselves - e.g. if you were expecting to use CommonJS modules, your inline code would include `caution-commonjs` as one of the initial modules, and your loading code might look something like:

```javascript
require(['caution', 'caution-commonjs'], function (caution, commonJs) {
	commonJs.addToCaution(caution);

	// Loading logic, as above
	...

	caution.load('some-commonjs-module');
});
```

An ES6-compatability module could work similarly, using a shim to transform the syntax.

### caution.js *as* an ES6 module

I'm not sure on the details, but it seems like it could work, and share much of the API with the AMD/CommonJS loader.

What I'm expecting: the inline code would use the Module Loader API to add the initial security checks.  The `caution` ES6 module could then be loaded to add more sophisticated controls, very similar to the example above.