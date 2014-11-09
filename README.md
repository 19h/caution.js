# caution.js

This defines a secure JavaScript module loader with an [AMD-compatible API](https://github.com/amdjs/amdjs-api/blob/master/AMD.md).  It sets up a `define()` function, as well as the `caution` module.

Loaded scripts are checked against a list of valid SHA-256 hashes.  The `caution` module can also generate HTML-page `data:` URLs for creating secure-boot web-apps, containing the `define()` and enough logic to verify loaded modules using SHA-256.

## `define()`

The `define()` function follows the [Asynchronous Module Definition](https://github.com/amdjs/amdjs-api/blob/master/AMD.md) spec.

However, it performs **no automatic fetching** due to the security model of the module loader.  The `caution` module provides hooks (see `caution.pending()`), so you can write your own automatic-fetching logic as a separate module.

The value of `define.amd` is `{caution: VERSION}`, where VERSION is the version of the `caution` module used to generate it.

## Caution API

This is the API for the `caution` module.

Hash values are SHA-256 hashes, written as hexadecimal.  When comparing hashes, they are prefix-matched (so they can be truncated, and `""` will match anything).

### `caution.get(url, validation, function (error, text, hash) {...})`

This is a basic text-only method to fetch resources.  If one of the hashes matches, then the content is returned (without error) - otherwise, a truthy value is returned as the error.

`validation ` must be one of:

* a SHA-256 hash
* an array of SHA-256 hashes
* a function returning `true` if valid: `function (text, hash, httpStatusCode) {...}`

The `hash` argument in the callback is the hash of the content

**Warning:** this method (used by `caution.load()` and others) normalises newlines to `\n` (Unix) before calculating the hash.

### `caution.load(moduleName, hashes)`

This loads a module, checking against a list of acceptable hash values.

### `caution.loadShim(moduleName, hashes, ?returnValue, ?dependencies)`

For modules that don't support AMD syntax, this wraps them in a `define()` call.

The optional `returnValue` argument specifies JavaScript code to return at the end - this defaults to `moduleName`.

### `caution.getFirst(urls, hashes, function (error, text, hash, url) {...})`

This method is similar to `caution.get()`, except it tries a series of URLs in sequence.  The successful URL is returned to the callback.

### `caution.addUrls(urls)`

This adds a place to look for modules.  `urls` must be one of:

* a URI template (string), where `{}` is replaced by the module name (e.g. `/modules/{}.js`)
* a map (object) from module names to URLs (string or list)
* a function returning a list of possible URLs, given two arguments: the module name and a list of allowed hashes

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

This returns the hash value for the currently-loaded version of a module.

If `moduleName` is omitted, it returns a map from all known modules to their hashes.

### `caution.pending(?handler)`

If no handler is supplied, this returns a list of all module names that have not yet been resolved.

If a handler is supplied, then it is called when a module is referenced that is not yet defined.

If a supplied handler returns `true`, then that module is marked as handled, and no other handler is notified.