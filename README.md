# caution.js

This defines a secure JavaScript module loader with an [AMD-compatible API](https://github.com/amdjs/amdjs-api/blob/master/AMD.md).

Possible locations are added using a URI template based on the module name (unquoted):

```javascript
caution.loc('/modules/{}.js');
caution.loc({
	"module-name": ...
});
```

Modules are then loaded by supplying a list of acceptable SHA-256 hashes (hex-encoded) of their contents:

```javascript
// The supplied hash may be truncated
caution.load('main', ['2c38d1ca6c43184c49e3c71d77af359ddaf88ce8f44f6c1455ff69393b129cb7']);
```

Modules themselves can just use the familiar `define()` syntax:

```javascript
define(['depA'], function (moduleA) {
	return {...};
});
```

## Why?

The idea is to be small enough to reasonably fit in a `data:` URL, allowing secure-boot of a web-app.

Although this could be achieved with a single SHA256-verified JS resource (which itself could contain a module loader), having the module-loader in the `data:` URL gives more flexibility when resources have moved - for example, the user could be prompted to provide alternative locations to search for modules.

## Inline API

These are the basic API calls, called "inline" because they are intended to be included in `data:`URLs.

### `define()`

This is a `define()` function as described in the [Asynchronous Module Definition](https://github.com/amdjs/amdjs-api/blob/master/AMD.md) spec.

Due to the security model of the module loader, missing modules will not be automatically fetched (because the hash cannot be known), so dependencies still need to be specified using `caution.load()`.

### `caution.load(moduleName, hashes)`

This loads a module, supplying a list of acceptable SHA-256 hash values (as hexadecimal).

### `caution.get(url, hashes, callback)`

This is a very simplistic text-only method to fetch resources.  If one of the hashes matches, then the content is returned (without error) - otherwise, a truthy value is returned as the error.

## Full/module API

There is a `caution` module, which enhances the inline API with more methods.

This module is not essential, and it's possible to use caution.js without it - however it is required to generate new `data:` URLs containing the inline API.

### `caution.config()`

This returns an object representing the currently-loaded set of templates, modules and hashes, e.g.:

```json
{
	"template": [...],
	"hash": {
		"moduleName": [...]
	}
}
```

### `caution.dataUrl(config)`

This returns a `data:` URL for an HTML page containing JavaScript code for the inline API and the config.

This is intended for when an update is available, or alternative locations have been supplied, and the user wishes to persist the change by generating (and re-bookmarking) another URL.

### `caution.hashShim(moduleName, url, hashes, ?returnValue)`

For modules that don't support AMD syntax, this wraps them in a `define()` call.

The optional `returnValue` argument specifies JavaScript code to return at the end.  This defaults to `moduleName`.