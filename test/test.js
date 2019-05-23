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
    <require from="v3rtigo as v3r" type="namespace"/>
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
        <v3r:connect-provider
            store="\${helloWorldStore.default}"
        />

        <compose view:from="test/test" a="123"/>
        <ul>
            <li each="item2 in this.itens">\${ln}</li>
            <div-elem each="let x = 0, ln = this.itens.length; x < ln ; x++">${'this.itens.length'}</div-elem>
        </ul>
        <comp-test each="item,xind in this.list" text="\${item.text}" />
        <comp-test each="item in this.list" text="\${item.text}" />
	</div>
</template>`;


console.log(

	beautify(
	fjsparse(rawHtml,{viewModel: 'test-comp', env: 'development', resourcePath: 'any/place/in/world/test-comp.html'})
	, { indent_size: 4 }) 

)
