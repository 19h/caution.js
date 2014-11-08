# caution.js

This defines a secure JavaScript module loader with an [AMD-compatible API](https://github.com/amdjs/amdjs-api/blob/master/AMD.md).

Locations are added using a URI template based on the module name (unquoted):

```javascript
caution.template('/modules/{}.js');
caution.template([...]);
```

Modules are then loaded by supplying a list of acceptable SHA-256 hashes (hex-encoded) of their contents:

```javascript
// The supplied hash may be truncated
caution.hash('main', ['2c38d1ca6c43184c49e3c71d77af359ddaf88ce8f44f6c1455ff69393b129cb7']);
```

Modules themselves can just use the familiar `define()` syntax:

```javascript
define(['depA'], function (moduleA) {
	return {...};
});
```

## Why?

The idea is to be small enough (< 2Kb) to reasonably fit in a `data:` URL, allowing secure-boot of a web-app.

Although this could be achieved with a single SHA256-verified JS resource (which itself could contain a module loader), having the module-loader in the `data:` URL gives more flexibility when resources have moved - for example, the user could be prompted to provide alternative locations to search for modules.

## Inline API

These are the basic API calls, called "inline" because they are intended to be included in `data:`URLs.

### `define()`

This is the `define()` function as defined in the [Asynchronous Module Definition](https://github.com/amdjs/amdjs-api/blob/master/AMD.md) spec.

Due to the security model of this module loader, it will not fetch any modules for which a hash has not been supplied.

### `caution.template(uriTemplate)`

This adds a template (or list of templates) to the set of possible locations for modules.  This is not a proper URI Template, but rather a string of the form `/modules/{}.js`, where `{}` is replaced by the module name (unescaped).

These templates must be added *before* calls to `caution.hash()`.

### `caution.hash(moduleName, hashes)`

This registers a list of valid SHA-256 hash values for a given module.

It also prompts fetching of the modules using whatever templates are available.

### `caution.get(url, hashes, callback)`

This is a very simplistic text-only method to fetch resources.  If one of the hashes matches, then the content is returned (without error) - otherwise, a truthy value is returned as the error.

## Full/module API

There is a `caution` module, which enhances the inline API with more methods.

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