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
`<template>
	<div class="test">
		<span>teste</span>
	</div>
</template>`;


console.log(

	beautify(
	fjsparse(rawHtml,{viewModel: 'test-comp', env: 'development', resourcePath: 'any/place/in/world/test-comp.html'})
	, { indent_size: 4 }) 

)
