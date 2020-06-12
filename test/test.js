var fjsparse = require("../parse/parse");
var beautify = require('js-beautify').js_beautify;

//<template view-model="ops">
//<template no-view-model="true">

console.reset = function () {
  return process.stdout.write('\033c');
}

console.reset();

const rawHtml 
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

const rawHtml2 = `
	<template>
		<fragment>
			<span click="this.setVerdadeiro(1, this.verdadeiro, ('ssss'))">Other Way2</span>
			<span onclick="this.setVerdadeiro">Other Way</span>
			<div class="especial">
				<span>Ola</span>
			</div>
			<span>Um novo component</span>
			<input test="ufu" type="text" nadameu="\${this.nada}"  input.bind="texto"/>
			<input test="ufu" value="gafanhoto" type="checkbox" change.bind="verdadeiro"/>
			<select change.bind="estado">
				<option value="1">Vivo</option>
				<option value="2">Morto</option>
				<option value="3">Ambos</option>
				<option value="4">Desconhecido</option>
			</select>
			<p>o padeiro é \${this.state.verdadeiro}</p>
			<strong>esta \${this.state.estado} e o texto é \${this.state.texto}</strong>
		</fragment>
	</template>
`;


console.log(

	beautify(

	fjsparse(rawHtml2,{viewModel: 'any/other-comp', env: 'development', resourcePath: 'any/place/in/world/test-comp.html'})
	, { indent_size: 4 }

	) 

);
