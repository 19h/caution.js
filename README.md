# caution.js - a secure AMD implementation

This defines a secure JavaScript module loader with an [AMD-compatible API](https://github.com/amdjs/amdjs-api/blob/master/AMD.md).  It sets up a `define()` function, as well as the `caution` module.

Loaded scripts are checked against a list of safe SHA-256 hashes (or other validity criteria you define).  The `caution` module can also generate JavaScript code (or HTML-page `data:` URLs) for secure-boot web-apps, containing `define()` and a set of SHA-256 hashes for the initial scripts.

Automatic module-fetching can be added using `caution.missingModules()`, `caution.load()` and `caution.addSafe()` - see "Automatic module fetching" below.

## The `define()` function

The `define()` function follows the [Asynchronous Module Definition](https://github.com/amdjs/amdjs-api/blob/master/AMD.md) spec.

The value of `define.amd` is `{caution: VERSION}`, where VERSION is the version of the `caution` module used to generate it.

## The `caution` API

```javascript
define(['caution'], function (caution) {
	...
});
```

Hash values are SHA-256 hashes, written as hexadecimal.  When comparing hashes, they are prefix-matched (so they can be truncated, and `""` will match anything).

**Warning:** fetched resources have newlines normalised to `\n` (Unix) before calculating the hash.

### `caution.load(moduleName, version)`

Loads a module, checking `caution.isSafe(moduleSource)` before executing.

### `caution.loadShim(moduleName, versions, ?returnValue, ?dependencies)`

For modules that don't support AMD syntax, this wraps them in a `define()` call.

The optional `returnValue` argument specifies JavaScript code to return at the end (considered to be the result of loading the module).  This defaults to the value of `moduleName`.

### `caution.get(url, validation, function (error, text, hash) {...})`

This is a basic text-only method to fetch resources.  If the fetched version is safe, then the content is returned (without error) - otherwise, a truthy value is returned as the error.

`validation` can be anything you might for use with `caution.addSafe()`, or `null` (defaults to `caution.isSafe()`) or `true` (always succeeds).

### `caution.getFirst(urls, validation, function (error, text, hash, url) {...})`

Similar to `caution.get()`, except it tries a series of URLs in sequence.  The successful URL is returned to the callback.

### `caution.urls(moduleName, versions)`

Returns a list of possible URLs for a given module.

`versions` is a list of module versions.  It may be empty, or contain hashes, semver identifiers (e.g. `v1.0.3`) or anything else.  These values have no effect on whether the result is considered valid or not - they are just useful for possible places to look.

### `caution.addUrls(urls)`

This adds a place to look for modules.  `urls` must be one of:

* a URI template (string), where `{}` is replaced by the module name (e.g. `/modules/{}.js`)
* a map (object) from module names to URLs (string or list)
* a function returning a list of possible URLs, given two arguments (same as `caution.urls()`)

### `caution.isSafe(text, ?hash)`

Returns whether the given text is considered "safe" or not.  If `hash` is not supplied, it is calculated from `text`.

The return value is the hash of the content.

### `caution.addSafe(validation)`

Adds a new set of conditions for safe content.  `validation` may be:

* a hash (string)
* an array of hashes
* a function returning a truthy if valid: `function (text, hash, httpStatusCode) {...}`

### `caution.dataUrl(config, ?customCode)`

This returns a `data:` URL for a secure-boot HTML page.  `config` must be an object of the form:

```json
{
	"paths": [...], // entries must be objects or strings, same form as caution.addUrls()
	"load": {
		"module-name": [...] // list of allowed hashes
	}
}
```

If present, `customCode` must be a string (JavaScript code), or an object that will be converted into global variables (e.g. `{globalState: 12345}`).

### `caution.inlineJs(config, ?customCode)`

Like `caution.dataUrl()`, except it returns just the inline JS instead of a `data:` URL.

### `caution.moduleHash(?moduleName)`

This returns the hash value for the currently-loaded version of a given module.

If `moduleName` is omitted, it returns a map from all known modules to their hashes.

### `caution.missingModules(?handler)`

If no handler is supplied, this returns a list of all module names that have not yet been resolved.  If a `handler` function is supplied, then it is called when a module is referenced that is not yet defined (including once for all existing missing modules).

If a handler returns `true` (or calls `caution.load()` for that module), then that module is marked as handled, and no other handler is notified.

## Automatic module fetching

On its own, `caution` doesn't attempt automatic fetching - you have to explicitly load every module you want to use:

```javascript
define(['caution'], function (caution) {
	// Minified version of marked@0.3.2
	caution.addSafe('8208dd7d61227d3caeece575cfe01fcd60fce360fa7103abb0dc7f6329217eba');
	caution.load('marked', ['0.3.2']); // Hint the version so we can look it up on CDNs
});
```

However, if you have some way to verify the security (e.g. public-key, or a big list), adding automatic fetching is simple:

```javascript
define(['caution'], function (caution) {
	caution.addSafe(function (text, hash) {
		// Check it against a big list of safe hashes
		return (hash in giantHashLookup);
	});

	caution.missingModules(function (moduleName) {
		caution.load(moduleName);
	});
});
```

If you have fancy rules for where to search for modules, just add them with `caution.addUrls()`:

```javascript
define(['caution'], function (caution) {
	caution.addUrls(function (moduleName, versions) {
		if (/^some-prefix\//.test(moduleName)) {
			return [...];
		} else {
			return versions.map(function (version) {
				return 'http://my-app/js/' + moduleName + '@' + version + '.js';
			});
		}
	});
});
```