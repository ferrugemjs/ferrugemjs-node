var fjsparse = require("../parse/parse");
var beautify = require('js-beautify').js_beautify;

//<template view-model="ops">
//<template no-view-model="true">
var rawHtml 
= 
`<template no-model>
	<require from="./test/sass/style.sass"/>
	<require from="./test/scss/style.scss"/>
	<require from="./test/stylus/style.styl"/>
	<require from="css!../commons/assets/css/theme.min"/>	
	<require from="./test/less/style.less"/>
	<require from="../commons/assets/commons-style.css!"/>
	<require from="eliorcohen/semantic-ui/dist/semantic.min.css!"/>
	<require from="jquery as jq" type="script"/>	
	<require from="eliorcohen/semantic-ui/dist/semantic.min as semantic-lib" type="script"/>
	<require from="ferrugemjs-router as rt" type="namespace"/>
	<require from="page as pg" type="script"/> 
	<require from="../menus/main-menu"/>
	<require from="../menus/apps-menu"/>
	<require from="../tab-apps/tab-apps"/>
	<require from="../login/login-form"/>
	<require from="tpl-a"/>
	<require from="./test/tpl-b"/>
	<require from="./test/tpl-c as tpl-c1"/>
	<require from="./test/tpl-c2 as tpl-c12" type="script"/>
	<require from="./test/tpl-c3 as tpl-c13" type="namespace"/>
	<require from="./test/style-a.css!"/>
	<require from="css!./test/style-b.css"/>
	<require from="./test/style-b.css"/>
	<require from="style!./test/style-c.css"/>
	<script></script>
	<style>
		.test{
			color:pink;
			font-size:14px;
			background-color:#fa404a;
		}
		.super-especial-hot > .hosuit{
			margin:5px;
			background-img:url('../assets/teste.png');
		}
	</style>
	<div 
		class="sein viu my frient" 
		title="okboy" 
		alt="\${this.test}" 
		click.trigger="this.test" 
	>
		<custom-tag 
		myattr1="this.ops"
		myattr2="\${this.title}"
		on-first-loader.once="this.test"
		></custom-tag>
		<label if="1==2">texto condicional</label>
		<span
		    key:id="abracadabra"
		    id="gread1"
			alt="ops"
			title="lololo"
			tooltip="\${this.title}"
			click.trigger="this.test" 
		>Test with common dom element</span>
		<span key:id="hummm">
		 <p key:id="\${this.test}"></p>
		</span>
		<ul>
		<li each="item in this.itens">epa</li>
		</ul>
		<hhh:test-t1 key-ops="humm" id:key="123"/>
		<input class="simple" type="text" placeholder="...new name" keyup.bind="this.name"></input>
		<tpl-c12 
		test="12" 
		chess="\${this.oblivion}"
		on-trigger="this.test"
		on-peidar="this.ops(true)"
		/>

		<script if="1 < 8">
			$jq('open');
			$jq('other magic');
			this.test();
		</script>

<!--
		<if condition="1 < 4">
			case 0
		</if>



		<if condition="1 < 4">
			case 1
		<else>
			case 1.a	
		</if>

		<if condition="1 < 5">
			case 2
		<elseif condition="1 > 30">
			case 2.a	
		</if>


		<if condition="1 < 6">
			case 3
		<elseif condition="1 > 80">	
			case 3.a
		<elseif condition="1 > 20">	
			case 3.b	
		<else>
			case 3.c	
		</if>
-->
		<register-for
			on-close
			on-open.subscribe
			on-start.once
			on-digit:args="bonb-sign"
		>
			$(".super-modal").dialogmodal();
			$("#especial-picker").datapicker();
			@this.test();
		</register-for>
		<ui-template>
			um lixo
		</ui-template>
		<content></content>
		<router-section>
			<route path="/fruit-app" view-model="dist/example/fruit-app/fruit-app"/>
		</router-section>
		<a 
			click.trigger="this.testa"
			mouseup.trigger="this.testa(true)"
			mousedown.trigger="this.refresh"
			mouseover.trigger="this.refresh({a:1})"
			mouseenter.trigger="this.refresh({a:'b'})"
			change.trigger="this.refresh({a:this.b})"	
		>teste</a>
		<compose 
			key:id="\${this.uid}"
			view:from="./newview/statck-plz2"
		></compose>
		<compose
			quenada="\${this.opse}" 
			id="dinamiccompose1" 
			other-dinamic="\${this.title}"
			view:from="\${this.myview}"
		>
		</compose>
		<input type="text" change.bind="this.title"/>
		<input type="checkbox" value="y" checked="\${this.isNull=='y'}" change.bind="this.isNull"/>
		<select change.bind="this.region">
			<option selected="\${1 < 10}">a</option>
			<option>b</option>
			<option>c</option>
		</select>
		<script>
		    console.log('teste');
		</script>
		<div skip="this.region > 2323" id="mortadela">
			<span>humm???2</span>
		</div>
		<if condition="this.title">
			true
		<elseif condition="this.title < 0">
			false
		</elseif>	
		<elseif condition="this.title > 0">
			false2
		</elseif>
		<else>
			maybe
		</else>	
		</if>
		<script if="1 < 8">
			$jq('open');
			$jq('other magic');
			this.test();
		</script>
		<button disabled="1 === 4">
			bala
		</button>
		<select disabled="disabled" onclick="alert('teste')">
			<option selected="1 === 3"></option>
		</select>
		<input checked="this.a === 1" type="checkbox"/>
		<input checked.if="this.a === 1" type="checkbox"/>
		<input enable.if="5 < 8" type="text"/>
		<input disabled.if="4 > 2" type="text"/>
		<super-hero-land test="${1}" on.teste="this.teste" enable.if="a === b"/>
		<compose 
			key:id="h123"
			view:from="./newview/statck-plz"
		></compose>
		<span style="color:red">
			test of text with whitespace <i> a </i>
			not allowed
			with test
		</span>
		<p style="\${'color:'+this.color}"></p>
		<div class="cls-1"></div>
		<div data-teste="{data.name}"></div>
		<div class="cls-2"></div>
		<div></div>
		<div class="cls-1"></div>
		<nyw:faster-comp each="item in this.itens" teste="\${item.desc}">
		</nyw:faster-comp>
		<compose
			each="item in this.itens"
			quenada="\${this.opse}" 
			id="dinamiccompose1" 
			other-dinamic="\${this.title}"
			view:from="\${this.myview}"
		>
		</compose>
		<ul>
			<for each="item,subindxA in this.itens">
				<li>
					<span if="1 === 1" class="especial-loop">
						<p class="basic">\${item.name}</p>					
					</span>
					<if condition="1 === 1">
						<div data-test="if-123">ssss</div>
					<elseif condition="2 === 1">
						<div data-test="elseif-123">123123</div>
					</elseif>	
					<else>
						<div data-test="else-321">zzzz</div>
					</else>
					</if>
				</li>
			</for>
		</ul>
	</div>
</template>`;


console.log(

	//beautify(
	fjsparse(rawHtml,{viewModel:'test-comp'})
	//, { indent_size: 4 }) 

)
