var fjsparse = require("../parse/parse");
var beautify = require('js-beautify').js_beautify;

//<template view-model="ops">
//<template no-view-model="true">

console.reset = function () {
  return process.stdout.write('\033c');
}

console.reset();

var rawHtml 
= 
`<template no-model>
	<div class="test">
		<span>teste</span>
        <script constructor="init">
            function init($props){
                this.itens = [];
            }
        </script>
        <for each="item,$idx in this.itens">
            <div>\${item}</div>
        </for>
        <ul>
            <li each="let x = 0, ln = this.itens.length; x < ln ; x++">${'this.itens.length'}</li>
            <li each="item2 in this.itens" data-index="\${ln}">\${ln}</li>
        </ul>
	</div>
</template>`;


console.log(

	beautify(
	fjsparse(rawHtml,{viewModel: 'test-comp', env: 'development', resourcePath: 'any/place/in/world/test-comp.html'})
	, { indent_size: 4 }) 

)
