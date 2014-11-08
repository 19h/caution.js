# caution.js

This defines a secure JavaScript module loader with an [AMD-compatible API](https://github.com/amdjs/amdjs-api/blob/master/AMD.md).

Locations are added using a URI template based on the module name (unquoted):

```javascript
caution.template('/modules/{}.js');
```

Modules are then loaded by supplying a list of acceptable SHA-256 hashes (hex-encoded) of their contents:

```javascript
var hash = '2c38d1ca6c43184c49e3c71d77af359ddaf88ce8f44f6c1455ff69393b129cb7';
caution.add('main', hash);
```

Modules themselves can just use the familiar `define()` syntax:

```javascript
define(['depA', function (moduleA) {
	return {...};
});
```

## Why?

The idea is to be small enough to reasonably fit in a `data:` URL, allowing secure-boot of a web-app.

Although this could be achieved with a single SHA256-verified JS resource (which itself could contain a module loader), having the module-loader in the `data:` URL gives more flexibility when resources have moved - for example, the user could be prompted to provide alternative locations to search for modules.

## API

### `define()`

This is the `define()` function as defined in the [Asynchronous Module Definition](https://github.com/amdjs/amdjs-api/blob/master/AMD.md) spec.

### `caution.template(uriTemplate)`

This adds a template to the list of possible locations for modules.  This is not a proper URI Template, but rather a string of the form `/modules/{}.js`, where `{}` is replaced by the module name (unescaped).

These templates must be added *before* calls to `caution.add()`.

### `caution.add(moduleName, hashes)`

This registers a set of valid SHA-256 hash values for a given module.

It also prompts fetching of the modules using whatever templates are available.

### `caution.get(url, hashes, callback)`

This is a very simplistic text-only (in fact ASCII-only) method to fetch resources.  If one of the hashes matches, then the content is returned (without error) - otherwise, a truthy value is returned as the error.