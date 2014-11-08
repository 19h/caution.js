define([], function () {
	var inlineJs = INLINE;

	caution.config = function () {
		var result = {
			template: caution._t.slice(0),
			hash: {}
		};
		for (var key in caution._h) {
			result.hash[key] = caution._h[key].slice(0);
		}
		return result;
	};
	
	caution.dataUrl = function (state) {
		var js = inlineJs;
		js += 'caution.template(' + JSON.stringify(state.template) + ');';
		for (var key in state) {
			if (key !== 'template') {
				for (var name in state[key]) {
					js += 'caution.' + key + '(' + JSON.stringify(name) + ',' + JSON.stringify(state[key][name]) + ');';
				}
			}
		}
		var html = '<!DOCTYPE html><html><body><script>' + js + '</script></body></html>';
		
		if (typeof btoa === 'function') {
			return 'data:text/html;base64,' + btoa(html);
		} else {
			return 'data:text/html,' + encodeURI(html);
		}
	};
	
	return caution;
});