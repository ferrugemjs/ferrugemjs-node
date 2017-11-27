var htmlparser = require("htmlparser2");
var generate = require("nanoid/generate");

var buffer = [];
var context_alias = '$_this_$';
var requireScriptList = [];

function nextUID(){
	let alphabet = 'abcdefghijklmnopkrstuvwxzABCDEFGHIJKLMNOPKRSTUVWXZ';
	var incrementalUID = generate(alphabet,3)+generate(`0123456789_${alphabet}`,19);
	return incrementalUID;
}

function appendBuffer(txt){
	buffer.push(txt);
}

function flush () {
  buffer.length = 0;
  buffer = [];
  requireScriptList.length = 0;
  requireScriptList = [];
}

function slashToCamelCase(str){
	return str
	.toLowerCase()
	.replace(
			/-(.)/g,
			function(match, group1) {
				return group1.toUpperCase();
			}
	);
}

function pathToAlias(p_resource_url){
	var patt_alias = / as\W+(\w.+)/g;
	var _aliasname;
	var _trueurl;
	if(patt_alias.test(p_resource_url)){
		var _urlsplit = p_resource_url.split(' as ');
		_trueurl = _urlsplit[0];
		_aliasname = _urlsplit[1];
	}else{
		_trueurl = p_resource_url;
		_aliasname = p_resource_url.substring(p_resource_url.lastIndexOf("/")+1,p_resource_url.length);
	};
	return {alias:_aliasname,url:_trueurl};
}

function contextToAlias(str){
	var list_ignore = list_ignore || [];
	if(typeof str === "string"){
		var nstr = str.replace(/this\.([_$a-zA-Z]+[a-zA-Z0-9_$]*)/g,function($0,$1){
			if(list_ignore.indexOf($1) > -1 ){
				return $1;
			}
			return context_alias+"."+$1;
		});
		return nstr;
	}
	return str; 
}

function encodeValue(value){
	return value
		.replace(/"\$\{/g,'(')
		.replace(/\}"/g,')');
}

function attrToContext(attribs){
	var mod_tmp_attr_str = encodeValue(JSON.stringify(attribs));									
	return mod_tmp_attr_str;
}


function encodeAndSetContext(str){		
		return str.replace(/\$\{([^}]*)\}/g,function($1,$2){		
  			return '"+('+contextToAlias($2)+')+"';
		});	
}

function adjustEvents(key,value){
	var argslist = '('+context_alias+')';
	value = contextToAlias(value);								
	var argsInitIndex = value.indexOf("(");
	if(argsInitIndex > 0){								
		argslist = value.substring(argsInitIndex+1,value.length);
		argslist = '('+context_alias+','+argslist;									
		value = value.substring(0,argsInitIndex);
	}								
	value = '${'+value+'.bind'+argslist+'}';
	return {
		key:key
		,value:value
	}
}

function separateAttribs(attribs){
	var static_attr = {};
	var dinamic_attr = {};
	for (var key in attribs) {
		if(key.lastIndexOf(".if") > -1){
			//obj_array.push(''+key+'');
			//obj_array.push(''+attribs[key]+'');
			static_attr[key] = attribs[key];
		}else if(key.indexOf(".") > 0){	
			//is a custom event		
			dinamic_attr[key] =  contextToAlias(attribs[key]);	    			
			 //dinamic_attr[key] = "${"+contextToAlias(attribs[key])+"}";
			//var eventStripped =	adjustEvents(key,attribs[key]);
			//dinamic_attr[key] = eventStripped.value;
												    			
		}else{				    			
			if(attribs[key].indexOf("${") === 0){
				dinamic_attr[key] = contextToAlias(attribs[key]);
			}else{
				static_attr[key] = attribs[key];
			}				    			
		}				    		
	}
	return {
		static:static_attr
		,dinamic:dinamic_attr
	}
}

function objStaticAttrToStr(attribs){	
	var bindField = "";	
	var obj_array_static = [];			
	for(var key in attribs){
		obj_array_static.push(''+key+'');								
		obj_array_static.push(attribs[key]);									
	}	
	var mod_tmp_static_attr_str =  '["'+obj_array_static.join('","')+'"]';
	return 	mod_tmp_static_attr_str;				

}

function objDinamicAttrToStr(attribs,tagName,type){
	var obj_array = [];		
	var bindField = "";	
	for(var key in attribs){
		var indxBind = 	key.indexOf(".bind");
		//console.log(key,key.lastIndexOf(".if") < 0);
		if(indxBind > -1 && (tagName === "input" || tagName === "textarea" || tagName === "select")){
			var evtstr = "on"+key.substring(0,indxBind);
			obj_array.push(evtstr);
			//console.log(attribs.type);
			var attr_pure = attribs[key].replace(context_alias+".","");
			if(tagName=="select"){									
				obj_array.push('#{#function($evt){\nvar tmp_$target$_evt=$evt.target;\n'+context_alias+'.refresh({"'+( attr_pure )+'":tmp_$target$_evt.options[tmp_$target$_evt.selectedIndex].value});\n}#}#');
			}else if(type=="checkbox"||type=="radio"){		
				//console.log( attribs[key]);							
				obj_array.push('#{#function($evt){\n'+context_alias+'.refresh({"'+( attr_pure )+'":$evt.target.checked?$evt.target.value:null})\n}\n#}#');
			}else{
				//console.log( attribs[key]);							
				obj_array.push('#{#function($evt){\n'+context_alias+'.refresh({"'+( attr_pure )+'":$evt.target.value})\n}\n#}#');
			}
			//console.log(attribs[key])								
		}else if(key.indexOf(".") > 0){
			var eventStripped =	adjustEvents('on'+key.substring(0,key.indexOf("."))+'',attribs[key]);
			obj_array.push(eventStripped.key);
			var vlFn = eventStripped.value;
			obj_array.push("#{#"+vlFn.substring(2,vlFn.length-1)+"#}#");
			
		}else{								
			if(typeof attribs[key] === "string" && attribs[key].indexOf("${") === 0){
				obj_array.push(''+key+'');
				var vlFn = attribs[key];
				//obj_array.push(contextToAlias(attribs[key]));
				obj_array.push(contextToAlias("#{#"+vlFn.substring(2,vlFn.length-1)+"#}#"));
			}
		}							
	}
	var mod_tmp_attr_str_ = '"'+obj_array.join('","')+'"';	
/*	
var mod_tmp_attr_str = mod_tmp_attr_str_.replace(/\"\$\{([^}]*)\}\"/g,function($0,$1){
			return "("+$1+")";
	});
*/
	var mod_tmp_attr_str = mod_tmp_attr_str_;		
	//console.log(mod_tmp_attr_str_,mod_tmp_attr_str);
	mod_tmp_attr_str = mod_tmp_attr_str.replace(/\"#{#/g,"(");
	mod_tmp_attr_str = mod_tmp_attr_str.replace(/#}#\"/g,")");


	return 	mod_tmp_attr_str;				

}

function tagSkipToStr(comp){
	var txtIf = '\tif('+contextToAlias(comp.attribs.condition)+'){\n';
	txtIf += '\t_idom.skip()\n';
	txtIf += '\t}else{\n';
	comp.children.forEach(sub_comp => txtIf += '\t'+componentToStr(sub_comp));
	txtIf += '\t};\n';
	return txtIf;
}

function tagIfToStr(comp){
	var txtIf = '\t\nif('+contextToAlias(comp.attribs.condition)+'){\n';
	comp.children.forEach(sub_comp => txtIf += '\t'+componentToStr(sub_comp));
	txtIf += '\t};\n';
	return txtIf;
}

function tagElseToStr(comp){
	var txtElse = '\t\n}else{\n';
	comp.children.forEach(sub_comp => txtElse += '\t'+componentToStr(sub_comp));
	txtElse += '\t';
	return txtElse;
}

function tagElseIfToStr(comp){
	var txtElseIf = '\t\n}else if('+contextToAlias(comp.attribs.condition)+'){\n';
	comp.children.forEach(sub_comp => txtElseIf += '\t'+componentToStr(sub_comp));
	txtElseIf += '\t';
	return txtElseIf;
}


function tagForToStr(comp){
	var array_each = comp.attribs.each.split(" in ");
	var sub_array_each = array_each[0].split(",");
	var index_array = "$key_tmp_"+nextUID();
	if(sub_array_each.length > 1){
		index_array = sub_array_each[1];
		//lasts_index_alias.push(sub_array_each[1]);
	}
	//lasts_item_alias.push(sub_array_each[0]);
	//renderIDOMHTML += '\t'+appendContext(array_each[1])+'.forEach(function('+sub_array_each[0]+','+index_array+'){\n';
	
	var txtFor = '\n\t'+contextToAlias(array_each[1])+'.forEach(function('+sub_array_each[0]+','+index_array+'){';
	comp.children.forEach(sub_comp => txtFor += '\t'+componentToStr(sub_comp));
	txtFor += '\t});\n';
	return txtFor;
}

function tagTextToStr(comp){
	var text = comp.data;
	if(text && text.trim()){
		return '\t\n_idom.text("'+text.replace(/\n/g," ").replace(/\t/g,"").replace(/\$\{([^}]*)\}/g,function($1,$2){  								
  			return '"+('+contextToAlias($2)+')+"';
		})+'");\t\n';
	}
	return "";
}

function tagContentToStr(comp){
	return '\t\n_libfjs_mod_.default.content.call('+context_alias+');\n';
}

function tagRegisterForToStr(comp){
	//console.log(comp);
	var registerStr = '';
	if(!comp.children.length){
		return '';
	}
	for(var key in comp.attribs){
		var keyIsoled = key;
		//caso seja um event pattern tradicional
		var eventParam = '';
		if(key.indexOf(":") > 0){
			keyIsoled = key.split(":")[0];
			eventParam = '"'+comp.attribs[key]+'",';
		}
		var propCamelCase = slashToCamelCase(keyIsoled);
		registerStr += '\t'+context_alias+'.'+propCamelCase+'('+eventParam+'function($param){'+ comp.children[0].data.replace(/@this\./gm,context_alias+'.') +'}.bind('+context_alias+'));';
	}
	return registerStr;
}

function tagCommandToStr(comp){
	if(comp.children && comp.children.length){
		var text = comp.children[0].data;
		if(text && text.trim()){
			//return text.replace(/@this\./gm,context_alias+'.');
			return '\n\t(function(){\n\t'+text.trim()+'\n\t}.bind('+context_alias+'))();\n';
		};
	}
	return '';
}

function tagRouteToStr(comp){
	var separateAttrsElement = separateAttribs(comp.attribs)
	var mod_tmp_static_attr_str=objStaticAttrToStr(separateAttrsElement.static);

	//console.log(separateAttrsElement.static);
	var attrsCamel = {};
	for(var key in separateAttrsElement.static){
		attrsCamel[slashToCamelCase(key)] = separateAttrsElement.static[key];
	}

	var routeStr = '\n_$_inst_$_.routes.push('+JSON.stringify(attrsCamel)+');\n';
	return routeStr;
}

function tagCustomToStr(comp){

	//provendo um key caso nao exista, mas nao eh funcional em caso de foreach
	var static_key = 'tmp_key_inst_custom_comp'+nextUID();
	
	/*
	if(comp.attribs && comp.attribs["key:id"]){
		static_key =  '"'+encodeAndSetContext(comp.attribs["key:id"])+'"';
		delete comp.attribs["key:id"];
	}
	*/

	if(!comp.attribs["key:id"]){
		comp.attribs["key:id"] = static_key;
	}

	//comp.attribs["is"] = "compose-view";

	var namespace = "";
	var tagname = "";
	var tagname_underscore = "";
	var tagname_with_namespace = "";
	var tagname_constructor = "";
	var name = comp.name;

	if(name.indexOf(":") > -1){
		namespace = name.substring(0,name.indexOf(":"));
		tagname = name.substring(name.indexOf(":")+1,name.length);
		tagname_underscore = tagname.replace(/-/g,"_");
		tagname_with_namespace = namespace+'.'+tagname_underscore;
		tagname_constructor = '_'+tagname_with_namespace;
	}else{
		namespace = "";
		tagname = name;
		tagname_underscore = tagname.replace(/-/g,"_");
		tagname_with_namespace = tagname_underscore;
		tagname_constructor = '_'+tagname_with_namespace+'.default';							
	}					


	var separate_attrs = separateAttribs(comp.attribs);
   	separate_attrs.static.is = comp.name;

	var regx = /(\w*)+\.if$/g;

	for(key in separate_attrs.dinamic){
		if(key.indexOf(".") > 0){
			separate_attrs.dinamic[key] = adjustEvents(key,separate_attrs.dinamic[key]).value;
		}
	}

	for(key in separate_attrs.static){
		if(regx.test(key)){
			//console.log(key,separate_attrs.static[key]);
			var attrcondi = key.replace(".if","");
			separate_attrs.dinamic[key] = "${"+separate_attrs.static[key]+" ? new String('"+attrcondi+"') : null }";
			delete separate_attrs.static[key];
		}
	}

	var  _tmp_host_vars_ = attrToContext(separate_attrs.dinamic);
	var _tmp_static_vars = JSON.stringify(separate_attrs.static);
	
	//console.log('aqui----->',separate_attrs.dinamic)

	basicTag = '\t\n(function(){\n var _$_inst_$_ = _libfjs_mod_.default.build({"classFactory":'+tagname_constructor+',"tag":"div","alias":"'+name+'","target":"","hostVars":'+_tmp_host_vars_+',"staticVars":'+_tmp_static_vars+'});\n';
	
	if(comp.children && comp.children.length){
		var hasRoute = comp.children.some(sub_comp=>sub_comp.name=="route");
		//console.log('has route',hasRoute)
		if(hasRoute){
			//console.log(comp.children[1].type);
			comp.children.forEach(sub_comp => basicTag += '\t'+componentToStr(sub_comp));
		}else{		
			basicTag += '\t\n_libfjs_mod_.default.content.call(_$_inst_$_,function(){\n';
			comp.children.forEach(sub_comp => basicTag += '\t'+componentToStr(sub_comp));
			basicTag += '\t\n});\n';
		}
	}

	basicTag += '\t\n_libfjs_mod_.default.reDraw.call(_$_inst_$_);\n';
	basicTag += '\t\n})();\n';

	return basicTag;
}

function tagRpFunctionToStr(comp){
	var rpfnStr = '';
	var nameCamel = slashToCamelCase(comp.name);
	var attrsCamel = {};
	var separate_attrs = separateAttribs(comp.attribs);
	for(var key in separate_attrs.dinamic){
    	var keyCamel = slashToCamelCase(key);
		attrsCamel[keyCamel] =  separate_attrs.dinamic[key];
	}
	for(var key in separate_attrs.static){
		var keyCamel = slashToCamelCase(key);
		//verificar se eh uma funcao
		if(key.indexOf("on-") === 0){
			attrsCamel[keyCamel] = adjustEvents(key,separate_attrs.static[key]).value;
		}else{
			attrsCamel[keyCamel] = separate_attrs.static[key];
		}	
	}
	rpfnStr += '\t'+comp.name.replace(/-/g,"_")+'.default('+attrToContext(attrsCamel)+');\n'
	return rpfnStr;
}

function tagComposeToStr(comp){
	var attrview = "view:from";

	if(!comp.attribs[attrview]){
		return "";
	}
	//provendo um key caso nao exista, mas nao eh funcional em caso de foreach
	var static_key = '"tmp_key_inst_compose_view'+nextUID()+'"';
	if(comp.attribs && comp.attribs["key:id"]){
		static_key =  '"'+encodeAndSetContext(comp.attribs["key:id"])+'"';
		//delete comp.attribs["key:id"];
		comp.attribs["key-id"] = comp.attribs["key:id"];
		comp.attribs["id"] = comp.attribs["key:id"];
	}else{
		comp.attribs["key:id"] = static_key.replace(/"/g,"");
		comp.attribs["key-id"] = static_key.replace(/"/g,"");
		comp.attribs["id"] = static_key.replace(/"/g,"");
	}
	

	comp.attribs["is"] = "compose-view";

	var separateAttrsElement = separateAttribs(comp.attribs);

	var tmp_view = 	(separateAttrsElement.static[attrview]?separateAttrsElement.static[attrview]:encodeAndSetContext(separateAttrsElement.dinamic[attrview]));		    	
	
	delete separateAttrsElement.static[attrview];
	delete separateAttrsElement.dinamic[attrview];

	var mod_tmp_static_attr_str = JSON.stringify(separateAttrsElement.static);
	var mod_tmp_static_attr_str_array_flat = objStaticAttrToStr(separateAttrsElement.static);
	
	var mod_tmp_attr_str = objDinamicAttrToStr(separateAttrsElement.dinamic);
	
	//console.log(mod_tmp_static_attr_str_array_flat);

	var basicTag = '\n\t_idom.elementOpen("div",'+static_key+','+mod_tmp_static_attr_str_array_flat+','+mod_tmp_attr_str+');\n';
	basicTag += '\n\t_idom.elementClose("div");\n';
	
	basicTag += '\n\t_libfjs_mod_.default.compose("'+tmp_view+'",'+static_key+','+attrToContext(separateAttrsElement.dinamic)+','+mod_tmp_static_attr_str+',function(){\n';


	if(comp.children){
		comp.children.forEach(sub_comp => basicTag += '\t'+componentToStr(sub_comp));
	}

	basicTag += '\n\t});\n';



	return basicTag;
}

function tagBasicToStr(comp){
	var static_key = 'null';
	if(comp.attribs && comp.attribs["key:id"]){
		static_key =  '"'+encodeAndSetContext(comp.attribs["key:id"])+'"';
		delete comp.attribs["key:id"];
	}
	var separateAttrsElement = separateAttribs(comp.attribs);
	var type = (separateAttrsElement.static ?separateAttrsElement.static["type"] : "");
	var regx = /(\w*)+\.if$/g;
	for(key in separateAttrsElement.static){
		if(regx.test(key)){
			 var attrcondi = key.replace(".if","");
			 separateAttrsElement.dinamic[attrcondi] = "${"+separateAttrsElement.static[key]+" ? new String('"+attrcondi+"') : null }";
			 delete separateAttrsElement.static[key];
		}
	};

	var mod_tmp_static_attr_str = objStaticAttrToStr(separateAttrsElement.static);

	var mod_tmp_attr_str = objDinamicAttrToStr(separateAttrsElement.dinamic,comp.name,type);
	var basicTag = '';

	basicTag = '\n\t_idom.elementOpen("'+comp.name+'",'+static_key+','+mod_tmp_static_attr_str+','+mod_tmp_attr_str+');\n';
	if(comp.children){
		comp.children.forEach(sub_comp => basicTag += '\t'+componentToStr(sub_comp));
	}
	basicTag += '\n\t_idom.elementClose("'+comp.name+'");\n';
	return basicTag;
}

function tagTemplateToStr(comp,viewModel){
	//console.log(comp.type,comp.name,viewModel);
	var stylesStr = "";
	var templatePre = "";	
	var requiresComp = [];
	var viewModelAlias = "";
	if(comp.attribs && typeof comp.attribs["no-model"] === 'string'){
		viewModel = "";
	}else if(comp.attribs && comp.attribs["model"]){
		viewModel = comp.attribs["model"];
		viewModelAlias = '_'+pathToAlias(viewModel).alias.replace(/-/g,"_");
		requiresComp.push({type: 'controller', path: viewModel, alias:viewModelAlias });
	}else{
		//console.log(pathToAlias('./'+viewModel));
		viewModel = './'+viewModel;
		viewModelAlias = '_'+pathToAlias(viewModel).alias.replace(/-/g,"_");
		requiresComp.push({type: 'controller', path:viewModel, alias: viewModelAlias});
	}

	

	var tmp_mod_name = "_mod_"+viewModelAlias+"_"+nextUID();

	var _tmp_constructor_no_view_ = '"_tmp_constructor_no_view_'+tmp_mod_name+'"';

	if(comp.children && comp.children.length){
		var firstElementArray = comp
							   .children
							   .filter(sub_comp => sub_comp.type=='tag' && ['require','style','script','command'].indexOf(sub_comp.name) < 0)

	 	var	firstElementAttrs = {name:'div'};

	    if(firstElementArray.length){

	    	var separateAttrsFirstElement = separateAttribs(firstElementArray[0].attribs)
	        var flat_static_array = [];
	    	for(key in separateAttrsFirstElement.static){    		
	    		flat_static_array.push(key,separateAttrsFirstElement.static[key])
	    	} 

	      	firstElementAttrs = {
				name:firstElementArray[0].name
				,static:flat_static_array 
				,dinamic:objDinamicAttrToStr(separateAttrsFirstElement.dinamic,firstElementArray[0].name)
			};
			comp
		.children
		.filter(sub_comp => sub_comp.type=='tag' && sub_comp.name == 'require' && sub_comp.attribs["from"])
		.forEach(sub_comp => requiresComp.push(resolveTagRequire(sub_comp)));

		var modAlias = requiresComp
			.filter(item=>item.type!="style")
			.sort(p=>p.path)
			.map(req_comp=> req_comp.alias);




		var requiresPath = requiresComp		
			.filter(item=>item.type!="style")	
			.sort(p=>p.path)
			.map(req_comp=> '"'+req_comp.path+'"');

		var onlyRequiresStyles = requiresComp
			.filter(item=>item.type=="style")
			.map(req_comp=> '"'+req_comp.path+'"');	

		//console.log(modAlias,requiresPath)	

		requireScriptList = requiresComp
										.filter(reqcomp=>reqcomp.type=="script")
										.map(reqcomp=>reqcomp.alias.replace(/_/g,"-"));
		
		templatePre += 'define(["exports","incremental-dom","ferrugemjs/component-factory"';

		if(requiresPath.length){
			templatePre += ',';
		}

		templatePre += 	
			requiresPath.join();

		if(onlyRequiresStyles.length){
			templatePre += ',';
		}			

		templatePre += 	
			onlyRequiresStyles.join();		

		templatePre += '], function (exports,_idom,_libfjs_mod_';

		if(modAlias.length){
			templatePre += ',';
		}

		templatePre += modAlias.join();

		templatePre += '){';

		if(viewModel){			
			templatePre += '\n\tvar _'+viewModelAlias+'_tmp = Object.keys('+viewModelAlias+')[0];\n';
		}else{
			templatePre +='\n\tvar _'+tmp_mod_name+'_tmp = '+_tmp_constructor_no_view_+';\n';
		}

		comp
			.children
			.filter(sub_comp => sub_comp.type=='style' && sub_comp.name == 'style')
			.forEach(sub_comp => stylesStr += '\t'+tagStyleToStr(sub_comp));

		templatePre +=  stylesStr+'\t';
	
		var subClazzName = '_clazz_sub_'+nextUID()+'_tmp';
		templatePre += 'exports.default = (function(super_clazz){\n';
		templatePre += '\t\tfunction '+subClazzName+'(){\n';
		templatePre += '\t\t\tsuper_clazz.call(this);\n';
		templatePre += '\t\t};\n';
		templatePre += '\t\t'+subClazzName+'.prototype = Object.create(super_clazz.prototype);\n';
		templatePre += '\t\t'+subClazzName+'.prototype.constructor = '+subClazzName+';\n';

		templatePre += '\t\t'+subClazzName+'.prototype._$attrs$_ = '+JSON.stringify(firstElementAttrs)+';\n';

		templatePre += '\t\t'+subClazzName+'.prototype.render = ';
		
		var childrenstr = '';
		childrenstr += 'function('+context_alias+'){';




		comp.children.filter( sub_comp => sub_comp.type=='tag' && ['require','style','script'].indexOf(sub_comp.name) == -1 )[0].children.forEach(sub_comp => childrenstr += '\t'+componentToStr(sub_comp));


		childrenstr += '\t}';
		
		templatePre += childrenstr;
		
		templatePre += ';\n\t\treturn '+subClazzName+';\n';
		
		
		if(viewModel){
			//tmp_mod_name
			//templatePre += ' })('+tmp_mod_name+'[_'+tmp_mod_name+'_tmp]);';
			templatePre += '\t})('+viewModelAlias+'[_'+viewModelAlias+'_tmp]);';
		}else{
			templatePre += '\t})(function(){})';
		}		
		
		templatePre += '\n});';
	
		return templatePre;
	    }else{
	    	console.warn(`warn: you need a root element into a template element to '${viewModel}' !`)
	    	return "";
	    }
	}else{
		console.warn(`warn: you need a root element into a template element to '${viewModel}' !`);
    	return "";
    }
    return "";
}

function tagStyleToStr(comp){
	//console.log(comp);
	var text = comp.children && comp.children[0] && comp.children[0].data;
	if(text && text.trim()){
		var styletxt = "";
		styletxt += "\n\tvar tmp_style = document.createElement('style');";
		styletxt += "\n\ttmp_style.type = 'text/css';";
		//parser.write(rawHtml.replace(/[\n\t\r]/g," "));
		//.replace(/\n/g," '\n\t\t+' ")
		styletxt += "\n\ttmp_style.innerHTML = '"+text.replace(/'/g,'"').replace(/[\n\t\r]/g," ")+"';";
		styletxt += "\n\tdocument.getElementsByTagName('head')[0].appendChild(tmp_style);";
		return styletxt;
	}
	return "";
}
function resolveTagRequire(comp){	
	var fromstr = comp.attribs["from"];	
	//suporte aos plugins mais conhecidos
	if( /^(css|style)!/gm.test(fromstr) || /less!?$/gm.test(fromstr) || /scss!?$/gm.test(fromstr) || /css!?$/gm.test(fromstr) || fromstr.indexOf("style!") == 0){		
		return {
			type:"style"
			,path:fromstr
			,alias:""
		};
	}

	var tagobject = pathToAlias(fromstr);

	if(comp.attribs.type && comp.attribs.type=="script"){			
		return {
			type:comp.attribs.type
			,path:tagobject.url
			,alias:tagobject.alias.replace(/-/g,"_")	
		}			    		
	}
	if(comp.attribs.type && comp.attribs.type=="namespace"){			
		return {
			type:comp.attribs.type
			,path:tagobject.url
			,alias:"_"+tagobject.alias.replace(/-/g,"_")	
		}					    		
	}
											
	return {
		type:'template'
		,path:tagobject.url+'.html'
		,alias:"_"+tagobject.alias.replace(/-/g,"_")	
	}		
	
		
}

function skipConditionExtractor(comp){	
	var skipcomp = {
		type:"tag"
		,name:"skip"
		,attribs:{condition:comp.attribs["skip"]}
	};
	delete comp.attribs["skip"];
	//skipcomp.children=[comp];	
	skipcomp.children=comp.children;
	delete comp.attribs["children"];
	comp.children=[skipcomp];
	return componentToStr(comp);
}

function ifConditionExtractor(comp){	
	var ifcomp = {
		type:"tag"
		,name:"if"
		,attribs:{condition:comp.attribs["if"]}
	};
	delete comp.attribs["if"];
	ifcomp.children=[comp];	
	return componentToStr(ifcomp);
}

function forConditionExtractor(comp){	
	//console.log(comp);
	var forcomp = {
		type:"tag"
		,name:"for"
		,attribs:{"each":comp.attribs["each"],"dinamic":true}
	};
	delete comp.attribs["each"];
	forcomp.children=[comp];	
	return componentToStr(forcomp);
}

function componentToStr(comp){

	//ignorando os comentarios
	if(comp.type=='comment'){
		return "";
	}

	//eliminando os textos vazios
	if(comp.type=='text'){
		return tagTextToStr(comp);
	}
	//tratando os skips embutidos
	if(comp.attribs && comp.attribs["skip"]){
		return skipConditionExtractor(comp);
	}
	//tratando os ifs embutidos
	if(comp.attribs && comp.attribs["if"]){
		return ifConditionExtractor(comp);
	}
	//precisa esta aqui para evitar deadlock
	if(comp.name=='for'){
		return tagForToStr(comp);
	}

	if(comp.attribs && comp.attribs["each"]){
		return forConditionExtractor(comp);
	}

	if(comp.name=='if'){
		return tagIfToStr(comp);
	}
	if(comp.name=='skip'){
		return tagSkipToStr(comp);
	}
	if(comp.name=='else'){
		return tagElseToStr(comp);
	}
	
	if(comp.name=='elseif'){
		return tagElseIfToStr(comp);
	}
	if(comp.name=='route'){
		return tagRouteToStr(comp);
	}
	if(comp.name=='compose'){		
		return tagComposeToStr(comp);
	}

	if(comp.name=='content'){		
		return tagContentToStr(comp);
	}

	if(comp.name=='script'){
		return tagCommandToStr(comp);
	}


	if(comp.name=='register-for'){		
		return tagRegisterForToStr(comp);
	}

	if(comp.name.indexOf("-") > 0 && requireScriptList.indexOf(comp.name) > -1){
		return tagRpFunctionToStr(comp);
	}
	
	if(comp.name.indexOf('-') > 0){
		return tagCustomToStr(comp);
	}	

	return tagBasicToStr(comp);
}

module.exports = function(rawHtml,config){
	flush();
	var finalBuffer = "";
	var handler = new htmlparser.DomHandler(function (error, dom) {
	    if (error){
	     	console.log(error)   
	    }else{
			dom.filter(elementDom=>elementDom.name == 'template').forEach(root_comp => appendBuffer(tagTemplateToStr(root_comp,config.viewModel)));
			finalBuffer = buffer.join('');
		}
	});
	var parser = new htmlparser.Parser(handler,{decodeEntities: true,recognizeSelfClosing:true});
	parser.write(rawHtml);
	//parser.write(rawHtml.replace(/[\n\t\r]/g," "));
	parser.done();
	//liberando a memoria
	flush();
	return finalBuffer;

}
