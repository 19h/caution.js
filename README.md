# caution.js

This defines a secure JavaScript module loader with an [AMD-compatible API](https://github.com/amdjs/amdjs-api/blob/master/AMD.md).  It sets up a `define()` function, as well as the `caution` module.

Loaded scripts are checked against a list of SHA-256 hashes (or  other validity criteria you define).  The `caution` module can also generate HTML-page `data:` URLs for creating secure-boot web-apps, containing `define()` and a set of SHA-256 hashes for the initial scripts.

The `define()` function and `caution` module don't include automatic fetching, as unless you explicitly load a module it has no way to identify a secure version.  However, using `caution.missingModules()` and `caution.addSafe()` you can define automatic-fetching logic with custom security criteria (e.g. public-key signatures).

## `define()`

The `define()` function follows the [Asynchronous Module Definition](https://github.com/amdjs/amdjs-api/blob/master/AMD.md) spec.

The value of `define.amd` is `{caution: VERSION}`, where VERSION is the version of the `caution` module used to generate it.

## Caution API

This is the API for the `caution` module.

Hash values are SHA-256 hashes, written as hexadecimal.  When comparing hashes, they are prefix-matched (so they can be truncated, and `""` will match anything).

**Warning:** fetched resources have newlines normalised to `\n` (Unix) before calculating the hash.

### `caution.get(url, validation, function (error, text, hash) {...})`

This is a basic text-only method to fetch resources.  If the fetched version is safe, then the content is returned (without error) - otherwise, a truthy value is returned as the error.

`validation` can be anything you might for use with `caution.addSafe()`, or `null` (defaults to `caution.isSafe()`) or `true` (always succeeds).

### `caution.getFirst(urls, validation, function (error, text, hash, url) {...})`

Similar to `caution.get()`, except it tries a series of URLs in sequence.  The successful URL is returned to the callback.

### `caution.load(moduleName, version)`

Loads a module, checking against a list of acceptable hash values.

### `caution.loadShim(moduleName, versions, ?returnValue, ?dependencies)`

For modules that don't support AMD syntax, this wraps them in a `define()` call.

The optional `returnValue` argument specifies JavaScript code to return at the end (considered to be the result of loading the module).  This defaults to the value of `moduleName`.

### `caution.urls(moduleName, versions)`

Returns a list of possible modules.

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

If no handler is supplied, this returns a list of all module names that have not yet been resolved.

If a handler is supplied, then it is called when a module is referenced that is not yet defined.

If a supplied handler returns `true`, then that module is marked as handled, and no other handler is notified.
