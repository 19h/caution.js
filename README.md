# caution.js

This defines a secure JavaScript module loader with an [AMD-compatible API](https://github.com/amdjs/amdjs-api/blob/master/AMD.md).

Modules are added as a list of possible URLs, along with a SHA-256 hash (hex-encoded) of their contents:

```javascript
var hash = '2c38d1ca6c43184c49e3c71d77af359ddaf88ce8f44f6c1455ff69393b129cb7';
caution.add('main', hash, ["main.js"]);
```

Modules themselves can just use the familiar `define()` syntax:

```javascript
define(['depA', function (moduleA) {
	return {...};
});
```

## Why?

The idea is to be small enough to reasonably fit in a `data:` URL, allowing secure-boot of a web-app.