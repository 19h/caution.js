document.title = "caution.js";
document.body.innerHTML = 'Loading...';

define(['caution'], function (caution) {
	caution.hashShim('marked', 'http://cdnjs.cloudflare.com/ajax/libs/marked/0.3.2/marked.min.js', ['8208dd7d61227d3caeece575cfe01fcd60fce360fa7103abb0dc7f6329217eba']);
	caution.hashShim('Prism', 'http://cdnjs.cloudflare.com/ajax/libs/prism/0.0.1/prism.min.js', ['e904847187d6817a5f483b70c1d702703dd20d23bac7045968f5c889690d1a08']);
	caution.get('http://cdnjs.cloudflare.com/ajax/libs/prism/0.0.1/prism.min.css', ['b290c340249a46416d21ed64ff3a4162dc8a7c0e813654f23a5d36b65f72aab2'], function (error, css) {
		if (error) return caution.missing('Prism CSS', []);
		var style = document.createElement('style');
		css += 'pre[class*=language-]>code[data-language] {overflow: auto}';
		style.innerText = style.innerHTML = css;
		document.head.appendChild(style);
	});
});

define(['caution', 'marked', 'Prism'], function (caution, marked, Prism) {
	var dataUrl = caution.dataUrl(caution.config());
	console.log('url', dataUrl);
	console.log('length', dataUrl.length);
	
	Prism.languages.json = Prism.languages.json || Prism.languages.javascript;
	
	caution.get('README.md', [''], function (error, text) {
		if (error) {
			text = error.message + '\n\n```' + (error.stack || '(no stack)') + '```';
		}
		var html = marked(text, {gfm: true, sanitize: true});
		document.body.innerHTML = html;
		Prism.highlightAll();
	});
});