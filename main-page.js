document.title = "caution.js";
document.body.innerHTML = 'Loading...';

define(['caution'], function (caution) {
	caution.addUrls({
		'marked': 'http://cdnjs.cloudflare.com/ajax/libs/marked/0.3.2/marked.min.js',
		'Prism': 'http://cdnjs.cloudflare.com/ajax/libs/prism/0.0.1/prism.min.js'		
	});
	caution.addValid(['8208dd7d61227d3caeece575cfe01fcd60fce360fa7103abb0dc7f6329217eba', 'e904847187d6817a5f483b70c1d702703dd20d23bac7045968f5c889690d1a08']);

	caution.load('marked');
	caution.loadShim('Prism');
	caution.get('http://cdnjs.cloudflare.com/ajax/libs/prism/0.0.1/prism.min.css', ['b290c340249a46416d21ed64ff3a4162dc8a7c0e813654f23a5d36b65f72aab2'], function (error, css) {
		if (error) return caution.fail('Prism CSS', []);
		var style = document.createElement('style');
		css += 'pre[class*=language-]>code[data-language] {overflow: auto}';
		style.innerText = style.innerHTML = css;
		document.head.appendChild(style);
	});
});

define(['caution', 'marked', 'Prism'], function (caution, marked, Prism) {

	Prism.languages.json = Prism.languages.json || Prism.languages.javascript;
	
	caution.get(baseUrl + 'README.md', [''], function (error, text) {
		if (error) {
			text = error.message + '\n\n```' + (error.stack || '(no stack)') + '```';
		}
		document.body.innerHTML = '<a id="bitbucket" href="https://bitbucket.org/geraintluff/caution.js">view on BitBucket</a>';
		var div = document.createElement('div');
		div.innerHTML = marked(text, {gfm: true, sanitize: true});
		document.body.appendChild(div)
		Prism.highlightAll();
	});
});