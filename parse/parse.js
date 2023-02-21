var htmlparser = require("htmlparser2");
const { v4: uuidv4 } = require('uuid');

var buffer = [];
var context_alias = 'this';
var requireScriptList = [];
var requireNamespaces = [];
var parser_configs = { templateExtension: ".html", viewModel: "testeViewModel", env: "development" };

function nextUID() {
	var incrementalUID = `f_${uuidv4().replaceAll('-', '_')}`;
	return incrementalUID;
}

function appendBuffer(txt) {
	buffer.push(txt);
}

function flush() {
	buffer.length = 0;
	buffer = [];

	requireScriptList.length = 0;
	requireScriptList = [];

	requireNamespaces.length = 0;
	requireNamespaces = [];
}

function slashToCamelCase(str) {
	return str
		.toLowerCase()
		.replace(
			/-(.)/g,
			function (match, group1) {
				return group1.toUpperCase();
			}
		);
}

function pathToAlias(p_resource_url) {
	var _aliasname;
	var _trueurl;
	if (p_resource_url.indexOf(' as ') > -1) {
		var _urlsplit = p_resource_url.split(' as ');
		_trueurl = _urlsplit[0];
		_aliasname = _urlsplit[1];
	} else {
		_trueurl = p_resource_url;
		_aliasname = p_resource_url.substring(p_resource_url.lastIndexOf("/") + 1, p_resource_url.length);
	};
	return { alias: _aliasname, url: _trueurl };
}

function contextToAlias(str) {
	var list_ignore = list_ignore || [];
	if (typeof str === "string") {
		var nstr = str.replace(/this\.([_$a-zA-Z]+[a-zA-Z0-9_$]*)/g, function ($0, $1) {
			if (list_ignore.indexOf($1) > -1) {
				return $1;
			}
			return context_alias + "." + $1;
		});
		return nstr;
	}
	return str;
}

function encodeValue(value) {
	return value
		.replace(/"\$\{/g, '(')
		.replace(/\}"/g, ')');
}

function attrToContext(attribs) {
	var mod_tmp_attr_str = encodeValue(JSON.stringify(attribs));
	return mod_tmp_attr_str;
}


function encodeAndSetContext(str) {
	return str.replace(/\$\{([^}]*)\}/g, function ($1, $2) {
		return '"+(' + contextToAlias($2) + ')+"';
	});
}

function adjustEvents(key, value) {
	var argslist = '(' + context_alias + ')';
	value = contextToAlias(value);
	var argsInitIndex = value.indexOf("(");
	if (argsInitIndex > 0) {
		argslist = value.substring(argsInitIndex + 1, value.length);
		argslist = '(' + context_alias + ',' + argslist;
		value = value.substring(0, argsInitIndex);
	}
	if (parser_configs.env === 'development') {
		value = ' typeof ' + value + ' !== \'function\' ? function(){ console.warn(\'Method "this.' + value.split('.')[1] + '" used in "' + key + '" event not exist!\') } : ' + value;
	}
	// console.log( value);
	value = '${' + value + '.bind' + argslist + '}';
	return {
		key: key
		, value: value
	}
}

function separateAttribs(attribs) {
	var static_attr = {};
	var dinamic_attr = {};
	for (var key in attribs) {
		if (key.lastIndexOf(".if") > -1) {
			//obj_array.push(''+key+'');
			//obj_array.push(''+attribs[key]+'');
			static_attr[key] = attribs[key];
		} else if (key.indexOf(".") > 0) {
			//is a custom event		
			dinamic_attr[key] = contextToAlias(attribs[key]);
			//dinamic_attr[key] = "${"+contextToAlias(attribs[key])+"}";
			//var eventStripped =	adjustEvents(key,attribs[key]);
			//dinamic_attr[key] = eventStripped.value;

		} else {
			if (attribs[key].indexOf("${") === 0) {
				dinamic_attr[key] = contextToAlias(attribs[key]);
			} else {
				static_attr[key] = attribs[key];
			}
		}
	}
	return {
		static: static_attr
		, dinamic: dinamic_attr
	}
}

function objStaticAttrToStr(attribs) {
	var bindField = "";
	var obj_array_static = [];
	for (var key in attribs) {
		obj_array_static.push('' + key + '');
		obj_array_static.push(attribs[key]);
	}
	var mod_tmp_static_attr_str = '["' + obj_array_static.join('","') + '"]';
	return mod_tmp_static_attr_str;

}

function objDinamicAttrToStr(attribs, tagName, type) {
	var obj_array = [];
	var bindField = "";
	for (var key in attribs) {
		var indxBind = key.indexOf(".bind");
		//console.log(key,key.lastIndexOf(".if") < 0);
		if (indxBind > -1 && (tagName === "input" || tagName === "textarea" || tagName === "select")) {
			var evtstr = "on" + key.substring(0, indxBind);
			obj_array.push(evtstr);
			//console.log(attribs.type);
			var attr_pure = attribs[key].replace(context_alias + ".", "");
			if (tagName === "select") {
				obj_array.push('#{#function($evt){\nvar tmp_$target$_evt=$evt.target;\n' + context_alias + '.' + (attr_pure) + ' = tmp_$target$_evt.options[tmp_$target$_evt.selectedIndex].value;\n}.bind(' + context_alias + ')#}#');
			} else if (type === "checkbox" || type === "radio") {
				//console.log( attribs[key]);							
				obj_array.push('#{#function($evt){\n' + context_alias + '.' + (attr_pure) + ' = $evt.target.checked?$evt.target.value:null\n}.bind(' + context_alias + ')\n#}#');
			} else {
				//console.log( attribs[key]);							
				obj_array.push('#{#function($evt){\n' + context_alias + '.' + (attr_pure) + ' = $evt.target.value\n}.bind(' + context_alias + ')\n#}#');
			}
			//console.log(attribs[key])								
		} else if (key.indexOf(".") > 0) {
			var eventStripped = adjustEvents('on' + key.substring(0, key.indexOf(".")) + '', attribs[key]);
			obj_array.push(eventStripped.key);
			var vlFn = eventStripped.value;
			obj_array.push("#{#" + vlFn.substring(2, vlFn.length - 1) + "#}#");

		} else {
			if (typeof attribs[key] === "string" && attribs[key].indexOf("${") === 0) {
				obj_array.push('' + key + '');
				var vlFn = attribs[key];
				if (key === "style" && vlFn.lastIndexOf(";") === (vlFn.length - 1)) {
					var lastComman = vlFn.lastIndexOf(";");
					vlFn = vlFn.substring(0, lastComman);
				}
				//obj_array.push(contextToAlias(attribs[key]));
				obj_array.push(contextToAlias("#{#" + vlFn.substring(2, vlFn.length - 1) + "#}#"));
			}
		}
	}
	var mod_tmp_attr_str_ = '"' + obj_array.join('","') + '"';
	/*	
	var mod_tmp_attr_str = mod_tmp_attr_str_.replace(/\"\$\{([^}]*)\}\"/g,function($0,$1){
				return "("+$1+")";
		});
	*/
	var mod_tmp_attr_str = mod_tmp_attr_str_;
	//console.log(mod_tmp_attr_str_,mod_tmp_attr_str);
	mod_tmp_attr_str = mod_tmp_attr_str.replace(/\"#{#/g, "(");
	mod_tmp_attr_str = mod_tmp_attr_str.replace(/#}#\"/g, ")");


	return mod_tmp_attr_str;

}

function tagSkipToStr(comp, indexLoopName) {
	var txtIf = '\tif(' + contextToAlias(comp.attribs.condition) + '){\n';
	txtIf += '\t_idom.skip()\n';
	txtIf += '\t}else{\n';
	comp.children.forEach(sub_comp => txtIf += '\t' + componentToStr(sub_comp, indexLoopName));
	txtIf += '\t};\n';
	return txtIf;
}

function tagIfToStr(comp, indexLoopName) {
	var txtIf = '\t\nif(' + contextToAlias(comp.attribs.condition) + '){\n';
	comp.children.forEach(sub_comp => txtIf += '\t' + componentToStr(sub_comp, indexLoopName));
	txtIf += '\t};\n';
	return txtIf;
}

function tagElseToStr(comp, indexLoopName) {
	var txtElse = '\t\n}else{\n';
	comp.children.forEach(sub_comp => txtElse += '\t' + componentToStr(sub_comp, indexLoopName));
	txtElse += '\t';
	return txtElse;
}

function tagElseIfToStr(comp, indexLoopName) {
	var txtElseIf = '\t\n}else if(' + contextToAlias(comp.attribs.condition) + '){\n';
	comp.children.forEach(sub_comp => txtElseIf += '\t' + componentToStr(sub_comp, indexLoopName));
	txtElseIf += '\t';
	return txtElseIf;
}


function tagForToStr(comp, indexLoopName) {
	let eachTxt = comp.attribs.each || '';
	const isFor = eachTxt.indexOf(';') > -1;
	let index_array = "$tmp_index_name_" + nextUID();
	let txtFor = '';

	if (isFor) {
		var array_each = eachTxt.split(";");
		array_each[0] = `${array_each[0]},${index_array} = 0`;
		array_each[2] = `${array_each[2]},${index_array}++`;
		eachTxt = array_each.join(";");
		txtFor = `\n\tfor(${eachTxt}){`;
		comp.children.forEach(sub_comp => txtFor += `\t${componentToStr(sub_comp, index_array, indexLoopName)}`);
		txtFor += `\t};\n`;
		return txtFor;
	}


	var array_each = eachTxt.split(" in ");
	var sub_array_each = array_each[0].split(",");
	if (sub_array_each.length > 1) {
		index_array = sub_array_each[1];
	}
	txtFor = '\n\t' + contextToAlias(array_each[1]) + '.forEach(function(' + sub_array_each[0] + ',' + index_array + '){';
	comp.children.forEach(sub_comp => txtFor += '\t' + componentToStr(sub_comp, index_array, indexLoopName));
	txtFor += `\t}.bind(${context_alias}));\n`;

	return txtFor;
}
function formatTextToStr(text) {
	if (text && text.trim()) {
		var strTmp = text;

		var strBlankLineReplace = "-x-abc" + new Date().getTime() + "zxv-x-";
		strTmp = strTmp
			.replace(/\s/g, strBlankLineReplace)
			.trim()
			.replace(/\n/g, ' ')
			.replace(/\t/g, '')
			.replace(new RegExp(strBlankLineReplace, 'g'), " ");

		if (strTmp.indexOf('${') === -1) {
			// have'nt interpolation
			return strTmp;
		}
		strTmp = strTmp
			.replace(/([^$])((\{)(.+?)(\}))/g, '$1#beg-brackets#$4#end-brackets#')
			.replace(/\$\{([^}]*)\}/g, function ($1, $2) {
				return '"+(' + contextToAlias($2) + ')+"';
			})
			.replace(/#beg-brackets#/g, '{').replace(/#end-brackets#/g, '}');
		return strTmp;
	}
	return "";
}
function tagTextToStr(comp, indexLoopName) {
	let attrDirectives = [];
	if (comp.parent && comp.parent.attribs) {
		let attrKeys = Object.keys(comp.parent.attribs);
		attrDirectives = attrKeys
			.filter(tmpattr => tmpattr !== "key:id" && tmpattr.indexOf(":") > -1 && requireNamespaces.some(({ alias }) => alias === tmpattr.split(":")[0]));
	}
	let text = comp.data;
	if (text && text.trim()) {
		let strTmp = formatTextToStr(text);
		if (attrDirectives.length) {
			let tmpNodeAlias = 'executedNode_' + nextUID();
			concatenedStr = '\t\nvar ' + tmpNodeAlias + ' = _idom.text("' + strTmp + '");\t\n';
			attrDirectives.forEach(attr => {
				var splited = attr.split(":");
				var namespace = splited[0];
				var directiveCamelCase = slashToCamelCase(splited[1]);
				let attrVlw = '"' + encodeAndSetContext(comp.parent.attribs[attr]) + '"';
				concatenedStr += '\t\n' + namespace + '.' + directiveCamelCase + '(' + tmpNodeAlias + (comp.parent.attribs[attr] ? ',' + attrVlw : '') + ');\t\n';
			});
			return concatenedStr;
		}
		return '\t\n_idom.text("' + strTmp + '");\t\n';
	}
	return "";
}

function tagContentToStr(comp) {
	return `\t\n${context_alias}.$content();\n`;
}


function tagCommandToStr(comp) {
	if (comp.children && comp.children.length) {
		var text = comp.children[0].data;
		if (text && text.trim()) {
			//return text.replace(/@this\./gm,context_alias+'.');
			return '\n\t(function(){\n\t' + text.trim() + '\n\t}.bind(' + context_alias + '))();\n';
		};
	}
	return '';
}

function tagScriptConstructorToStr(comp) {
	if (comp.children && comp.children.length) {
		var text = comp.children[0].data;
		if (text && text.trim()) {
			//return text.replace(/@this\./gm,context_alias+'.');
			return `${text.trim()}`;
		};
	}
	return '';
}

function tagCustomToStr(comp, ...otherArgs) {

	//provendo um key caso nao exista, mas nao eh funcional em caso de foreach
	var static_key = 'custom_comp_keyid_' + nextUID();

	/*
	if(comp.attribs && comp.attribs["key:id"]){
		static_key =  '"'+encodeAndSetContext(comp.attribs["key:id"])+'"';
		delete comp.attribs["key:id"];
	}
	*/
	let indexLoopName = '';
	let keyId = static_key;
	if (otherArgs.length && typeof otherArgs[0] === 'string') {
		indexLoopName = otherArgs[0];
		keyId = `${keyId}_"+${otherArgs[0]}+"`;
	}

	var alreadyHasKeyId = true;
	if (!comp.attribs["key:id"]) {
		comp.attribs["key:id"] = static_key;
		alreadyHasKeyId = false;
	} else {
		keyId = encodeAndSetContext(comp.attribs["key:id"]);
		comp.attribs["key:id"] = keyId;
	}

	//comp.attribs["is"] = "compose-view";

	var namespace = "";
	var tagname = "";
	var tagname_underscore = "";
	var tagname_with_namespace = "";
	var tagname_constructor = "";
	var name = comp.name;

	if (name.indexOf(":") > -1) {
		let tagname_splited = name.split(":");
		namespace = tagname_splited[0];
		tagname = tagname_splited[1];

		if (!requireNamespaces.some(({ alias }) => alias === namespace)) {
			namespaceNotFound = true;
			return tagBasicToStr(comp, ...otherArgs);
		}

		tagname_underscore = slashToCamelCase(tagname);// tagname.replace(/-/g,"_");
		tagname_with_namespace = namespace + '.' + tagname_underscore;
		tagname_constructor = tagname_with_namespace;
	} else {
		namespace = "";
		tagname = name;
		tagname_underscore = tagname.replace(/-/g, "_");
		tagname_with_namespace = tagname_underscore;
		tagname_constructor = tagname_with_namespace + '.default';
	}


	var separate_attrs = separateAttribs(comp.attribs);
	separate_attrs.static.is = comp.name;

	var regx = /(\w*)+\.if$/g;

	for (key in separate_attrs.dinamic) {
		if (key.indexOf(".") > 0) {
			separate_attrs.dinamic[key] = adjustEvents(key, separate_attrs.dinamic[key]).value;
		}
	}

	for (key in separate_attrs.static) {
		if (regx.test(key)) {
			//console.log(key,separate_attrs.static[key]);
			var attrcondi = key.replace(".if", "");
			separate_attrs.dinamic[key] = "${" + separate_attrs.static[key] + " ? new String('" + attrcondi + "') : null }";
			delete separate_attrs.static[key];
		}
	}


	let content = '';
	var _tmp_host_vars_ = attrToContext(separate_attrs.dinamic);
	var _tmp_static_vars = JSON.stringify(separate_attrs.static);

	if (!alreadyHasKeyId && indexLoopName) {
		_tmp_static_vars = _tmp_static_vars.replace(static_key, static_key + '_"+' + indexLoopName + '+"');
	}
	// #2
	const attrs_merged = `Object.assign({},${_tmp_host_vars_},${_tmp_static_vars})`;

	var basicTag = `var ${static_key} = _libfjs_factory.default(${tagname_constructor},${attrs_merged},{is:"${name}", key_id:"${keyId}"}).content(function(){${content}}.bind(${context_alias}));`;

	basicTag += `${static_key}.$render({is:"${name}", key_id:"${keyId}"});`;

	return basicTag;
}

function tagRpFunctionToStr(comp) {
	var rpfnStr = '';
	var nameCamel = slashToCamelCase(comp.name);
	var attrsCamel = {};
	var separate_attrs = separateAttribs(comp.attribs);
	for (var key in separate_attrs.dinamic) {
		var keyCamel = slashToCamelCase(key);
		attrsCamel[keyCamel] = separate_attrs.dinamic[key];
	}
	for (var key in separate_attrs.static) {
		var keyCamel = slashToCamelCase(key);
		//verificar se eh uma funcao
		if (key.indexOf("on-") === 0) {
			attrsCamel[keyCamel] = adjustEvents(key, separate_attrs.static[key]).value;
		} else {
			attrsCamel[keyCamel] = separate_attrs.static[key];
		}
	}
	rpfnStr += '\t' + comp.name.replace(/-/g, "_") + '.default(' + attrToContext(attrsCamel) + ');\n'
	return rpfnStr;
}

function tagBasicToStr(comp, indexLoopName) {
	var static_key = 'null';
	if (comp.attribs && comp.attribs["key:id"]) {
		static_key = encodeAndSetContext(comp.attribs["key:id"]);
		delete comp.attribs["key:id"];
	}
	var separateAttrsElement = separateAttribs(comp.attribs);
	var type = (separateAttrsElement.static ? separateAttrsElement.static["type"] : "");
	var regx = /(\w*)+\.if$/g;
	for (key in separateAttrsElement.static) {
		if (regx.test(key)) {
			var attrcondi = key.replace(".if", "");
			separateAttrsElement.dinamic[attrcondi] = "${" + separateAttrsElement.static[key] + " ? new String('" + attrcondi + "') : null }";
			delete separateAttrsElement.static[key];
		}
	};

	var mod_tmp_static_attr_str = objStaticAttrToStr(separateAttrsElement.static);

	var mod_tmp_attr_str = objDinamicAttrToStr(separateAttrsElement.dinamic, comp.name, type);
	var basicTag = '';
	var haveStaticKeyGen = false;

	if (static_key === 'null' && (mod_tmp_static_attr_str !== '[""]' || mod_tmp_attr_str !== '""')) {
		static_key = nextUID();
		haveStaticKeyGen = true;
	}
	if (static_key === 'null') {
		basicTag = '\n\t_idom.elementOpen("' + comp.name + '");\n';
	} else {
		/*		
		if(comp.parent && comp.parent.attribs && comp.parent.attribs['key:id']){
			console.log(comp.parent.attribs['key:id']);
			//static_key = comp.parent.attribs['key:id']+static_key;
		}
		*/
		//comp.attribs['key:id'] = static_key;
		basicTag = ' _idom.elementOpen("' + comp.name + '","' + static_key + (indexLoopName && haveStaticKeyGen ? '_"+' + indexLoopName : '"') + ',' + mod_tmp_static_attr_str + ',' + mod_tmp_attr_str + ');\n';
	}
	if (comp.children) {
		comp.children.forEach(sub_comp => basicTag += '\t' + componentToStr(sub_comp, indexLoopName));
	}

	let attrDirectives = [];
	if (comp.attribs) {
		let attrKeys = Object.keys(comp.attribs);
		attrDirectives = attrKeys.filter(tmpattr => tmpattr !== "key:id" && tmpattr.indexOf(":") > -1 && requireNamespaces.some(({ alias }) => alias === tmpattr.split(":")[0]));
	}

	let tmpNodeAlias = 'executedNode_' + nextUID();
	if (attrDirectives.length) {
		basicTag = '\t\nvar ' + tmpNodeAlias + ' =' + basicTag + '\t\n';
	}



	basicTag += '\n\t_idom.elementClose("' + comp.name + '");\n';

	if (attrDirectives.length) {
		let concatenedStr = '';
		attrDirectives.forEach(attr => {
			var splited = attr.split(":");
			var namespace = splited[0];
			var directiveCamelCase = slashToCamelCase(splited[1]);
			let attrVlw = '"' + encodeAndSetContext(comp.attribs[attr]) + '"';
			concatenedStr += '\t\n' + namespace + '.' + directiveCamelCase + '(' + tmpNodeAlias + (comp.attribs[attr] ? ',' + attrVlw : '') + ');\t\n';
		});
		basicTag += concatenedStr;
	}

	return basicTag;
}

function tagTemplateToStr(comp, viewModel, resourcePath) {
	//console.log(comp.type,comp.name,viewModel);
	var stylesStr = "";
	var templatePre = "";
	var requiresComp = [];
	var viewModelAlias = "";
	if (comp.attribs && typeof comp.attribs["no-model"] === 'string') {
		viewModel = "";
	} else if (comp.attribs && comp.attribs["model"]) {
		viewModel = comp.attribs["model"];
		viewModelAlias = '_' + pathToAlias(viewModel).alias.replace(/-/g, "_");
		requiresComp.push({ type: 'controller', path: viewModel, alias: viewModelAlias });
	} else {
		//console.log(pathToAlias('./'+viewModel));
		viewModel = './' + viewModel;
		viewModelAlias = '_' + pathToAlias(viewModel).alias.replace(/-/g, "_");
		requiresComp.push({ type: 'controller', path: viewModel, alias: viewModelAlias });
	}



	var tmp_mod_name = "_mod_" + viewModelAlias + "_" + nextUID();

	var _tmp_constructor_no_view_ = '"_tmp_constructor_no_view_' + tmp_mod_name + '"';

	if (comp.children && comp.children.length) {
		var firstElementArray = comp
			.children
			.filter(sub_comp => sub_comp.type === 'tag' && ['require', 'style', 'script', 'command'].indexOf(sub_comp.name) < 0);

		if (firstElementArray.length) {

			var separateAttrsFirstElement = separateAttribs(firstElementArray[0].attribs)
			var flat_static_array = [];
			for (key in separateAttrsFirstElement.static) {
				flat_static_array.push(key, separateAttrsFirstElement.static[key])
			}

			comp
				.children
				.filter(sub_comp => sub_comp.type === 'tag' && sub_comp.name === 'require' && sub_comp.attribs['from'])
				.forEach(sub_comp => {
					//console.log(`${resolveTagRequire(sub_comp).type} : ${sub_comp.attribs['type']} : ${sub_comp.attribs['from']} : ${resolveTagRequire(sub_comp).alias}`);
					requiresComp.push(resolveTagRequire(sub_comp))
				});

			//console.log(modAlias,requiresPath)
			/*	
			template // "_"+tagobject.alias.replace(/-/g,"_")
			script (acho que nao precisa) // .replace(/-/g,"_")
			namespace  // "_"+tagobject.alias
			*/
			var modAlias = requiresComp
				.filter(item => item.type !== 'style')
				.sort(p => p.path)
				.map(req_comp => {
					if (['template', 'script', 'namespace'].indexOf(req_comp.type) > -1) {
						return req_comp.alias.replace(/-/g, '_');
					}
					return req_comp.alias;
				});


			//console.log(requiresComp);

			var requiresPath = requiresComp
				.filter(item => item.type !== "style")
				.sort(p => p.path)
				.map(req_comp => '"' + req_comp.path + '"');

			var onlyRequiresStyles = requiresComp
				.filter(item => item.type === "style")
				.map(req_comp => '"' + req_comp.path + '"');

			requireScriptList = requiresComp
				.filter(reqcomp => reqcomp.type === "script")
				.map(reqcomp => reqcomp.alias);

			requireNamespaces = requiresComp
				.filter(reqcomp => reqcomp.type === "namespace")
				.map(reqcomp => ({ url: reqcomp.path, alias: reqcomp.alias }));

			templatePre += 'define(["exports","incremental-dom","@ferrugemjs/library/component-factory"';

			if (requiresPath.length) {
				templatePre += ',';
			}

			templatePre += requiresPath.join();

			if (onlyRequiresStyles.length) {
				templatePre += ',';
			}

			templatePre += onlyRequiresStyles.join();

			templatePre += '], function (exports,_idom,_libfjs_factory';

			if (modAlias.length) {
				templatePre += ',';
			}

			templatePre += modAlias.join();

			templatePre += '){';

			if (viewModel) {
				templatePre += '\n\tvar _' + viewModelAlias + '_tmp = Object.keys(' + viewModelAlias + ')[0];\n';
			} else {
				templatePre += '\n\tvar _' + tmp_mod_name + '_tmp = ' + _tmp_constructor_no_view_ + ';\n';
			}

			comp
				.children
				.filter(sub_comp => sub_comp.type == 'style' && sub_comp.name == 'style')
				.forEach(sub_comp => stylesStr += '\t' + tagStyleToStr(sub_comp));

			templatePre += stylesStr + '\t';

			var subClazzName = '_clazz_sub_' + nextUID() + '_tmp';
			templatePre += 'exports.default = (function(super_clazz){\n';
			templatePre += '\t\tfunction ' + subClazzName + '(props){\n';
			templatePre += '\t\t\tif(super_clazz.call){\n';
			templatePre += '\t\t\t\tsuper_clazz.call(this, props);\n';
			templatePre += '\t\t\t}\n';
			templatePre += '\t\t};\n';
			templatePre += '\t\t' + subClazzName + '.prototype = Object.create(super_clazz.prototype || super_clazz);\n';
			templatePre += '\t\t' + subClazzName + '.prototype.constructor = ' + subClazzName + ';\n';
			//#1
			templatePre += '\t\t' + subClazzName + '.prototype.$render = ';

			var subcomp = comp.children.find(sub_comp => sub_comp.type === 'tag' && ['require', 'style', 'script'].indexOf(sub_comp.name) === -1);

			var childrenstr = '';
			childrenstr += 'function(config_props){';

			var dev_props = { "is": "${config_props.is}", "id": "${config_props.key_id}", "key:id": "${config_props.key_id}" };

			if (parser_configs.env === 'development' && resourcePath) {
				dev_props = Object.assign({}, dev_props, {
					"fjs-mode": parser_configs.env,
					"fjs-resource-path": resourcePath
				});
			}

			subcomp.attribs = Object.assign({}, subcomp.attribs || {}, dev_props);

			let subcompSterie = Object.assign({}, subcomp, { children: [] });
			subcompSterieStr = componentToStr(subcompSterie).replace(`_idom.elementClose("${subcompSterie.name}");`, '');

			if (subcomp.name !== 'fragment') {
				subcompSterieStr = 'if(!config_props.loaded){' + subcompSterieStr + '};'
			}

			subcomp.children.forEach(child => subcompSterieStr += '\t\t' + componentToStr(child));

			childrenstr += subcompSterieStr;

			if (subcomp.name !== 'fragment') {
				childrenstr += `if(!config_props.loaded){_idom.elementClose("${subcomp.name}");};`;
			}

			childrenstr += '\t}';

			templatePre += childrenstr;

			templatePre += ';\n\t\treturn ' + subClazzName + ';\n';

			if (viewModel) {
				templatePre += '\t})(' + viewModelAlias + '[_' + viewModelAlias + '_tmp] || ' + viewModelAlias + ');';
			} else {
				const childConstructor = comp.children.find(child => child.name === 'script' && child.attribs && child.attribs['init']);
				let initStr = `function(){}`;
				if (childConstructor) {
					//console.log('child-constructor:',childConstructor.attribs.init);
					initStr = tagScriptConstructorToStr(childConstructor, 0);
				}
				templatePre += `\t})(${initStr})`;
			}

			templatePre += '\n});';

			return templatePre;
		} else {
			console.warn(`warn: you need a root element into a template element to '${viewModel}' !`)
			return "";
		}
	} else {
		console.warn(`warn: you need a root element into a template element to '${viewModel}' !`);
		return "";
	}
}

function tagStyleToStr(comp) {
	//console.log(comp);
	var text = comp.children && comp.children[0] && comp.children[0].data;
	if (text && text.trim()) {
		var styletxt = "";
		styletxt += "\n\tvar tmp_style = document.createElement('style');";
		styletxt += "\n\ttmp_style.type = 'text/css';";
		//parser.write(rawHtml.replace(/[\n\t\r]/g," "));
		//.replace(/\n/g," '\n\t\t+' ")
		styletxt += "\n\ttmp_style.innerHTML = '" + text.replace(/'/g, '"').replace(/[\n\t\r]/g, " ") + "';";
		styletxt += "\n\tdocument.getElementsByTagName('head')[0].appendChild(tmp_style);";
		return styletxt;
	}
	return "";
}
function resolveTagRequire(comp) {
	var fromstr = comp.attribs["from"];
	var tagobject = pathToAlias(fromstr);

	if (comp.attribs.type && comp.attribs.type === "script") {
		return {
			type: comp.attribs.type
			, path: tagobject.url
			, alias: tagobject.alias
			, origin: tagobject.origin
		}
	}
	if (comp.attribs.type && comp.attribs.type === "namespace") {
		return {
			type: comp.attribs.type
			, path: tagobject.url
			, alias: tagobject.alias
			, origin: tagobject.origin
		}
	}
	//suporte aos plugins mais conhecidos
	if (/^(css|style)!/gm.test(fromstr) || /\.(sass|scss|styl|css|less)$/gm.test(fromstr) || /scss!?$/gm.test(fromstr) || /css!$/gm.test(fromstr) || fromstr.indexOf("style!") === 0) {
		return {
			type: "style"
			, path: fromstr
			, alias: ""
			, origin: ""
		};
	}
	return {
		type: 'template'
		, path: tagobject.url + parser_configs.templateExtension
		, alias: tagobject.alias
		, origin: tagobject.origin
	}
}

function skipConditionExtractor(comp, indexLoopName) {
	var skipcomp = {
		type: "tag"
		, name: "skip"
		, attribs: { condition: comp.attribs["skip"] }
	};
	delete comp.attribs["skip"];
	//skipcomp.children=[comp];	
	skipcomp.children = comp.children;
	delete comp.attribs["children"];
	comp.children = [skipcomp];
	return componentToStr(comp, indexLoopName);
}

function ifConditionExtractor(comp, indexLoopName) {
	var ifcomp = {
		type: "tag"
		, name: "if"
		, attribs: { condition: comp.attribs["if"] }
	};
	delete comp.attribs["if"];
	ifcomp.children = [comp];
	return componentToStr(ifcomp, indexLoopName);
}

function forConditionExtractor(comp) {
	//console.log(comp);
	var forcomp = {
		type: "tag"
		, name: "for"
		, attribs: { "each": comp.attribs["each"], "dinamic": true }
	};
	delete comp.attribs["each"];
	/*
	if(!comp.attribs["key:id"]){
		comp.attribs["key:id"] = nextUID();
	}
	*/
	forcomp.children = [comp];
	return componentToStr(forcomp);
}

function componentToStr(comp, ...otherArgs) {

	//ignorando os comentarios
	if (comp.type === 'comment') {
		return "";
	}

	//eliminando os textos vazios
	if (comp.type === 'text') {
		return tagTextToStr(comp, ...otherArgs);
	}
	//tratando os skips embutidos
	if (comp.attribs && comp.attribs["skip"]) {
		return skipConditionExtractor(comp, ...otherArgs);
	}
	//tratando os ifs embutidos
	if (comp.attribs && comp.attribs["if"]) {
		return ifConditionExtractor(comp, ...otherArgs);
	}
	//precisa esta aqui para evitar deadlock
	if (comp.name === 'for') {
		return tagForToStr(comp, ...otherArgs);
	}

	if (comp.attribs && comp.attribs["each"]) {
		return forConditionExtractor(comp, ...otherArgs);
	}

	if (comp.name === 'if') {
		return tagIfToStr(comp, ...otherArgs);
	}
	if (comp.name === 'skip') {
		return tagSkipToStr(comp, ...otherArgs);
	}
	if (comp.name === 'else') {
		return tagElseToStr(comp, ...otherArgs);
	}

	if (comp.name === 'elseif') {
		return tagElseIfToStr(comp, ...otherArgs);
	}

	if (comp.name === 'fragment') {
		return comp.children.reduce((acum, curr) => {
			if (curr.type !== 'text') {
				return acum + tagBasicToStr(curr, ...otherArgs)
			}
			return acum;
		}, '');
	}

	if (comp.name === 'content') {
		return tagContentToStr(comp, ...otherArgs);
	}

	if (comp.name === 'script' && comp.attribs && comp.attribs['init']) {
		return '';
	}

	if (comp.name === 'script') {
		return tagCommandToStr(comp, ...otherArgs);
	}

	if (comp.name.indexOf("-") > 0 && requireScriptList.indexOf(comp.name) > -1) {
		return tagRpFunctionToStr(comp, ...otherArgs);
	}

	if (comp.name.indexOf('-') > 0) {
		if (comp.name.indexOf(':') > -1) {
			const [alias, comp_name] = comp.name.split(':');
			if (
				comp_name === 'connect-provider'
				&& requireNamespaces.some(reqNms => reqNms.alias === alias && reqNms.url === 'v3rtigo')
			) {
				comp.attribs['target'] = `\${${context_alias}}`;
			}
		}
		return tagCustomToStr(comp, ...otherArgs);
	}

	return tagBasicToStr(comp, ...otherArgs);
}

const convert = (rawHtml, config) => {
	flush();
	var finalBuffer = "";
	parser_configs = Object.assign({}, parser_configs, config);
	var handler = new htmlparser.DomHandler(function (error, dom) {
		if (error) {
			console.log(error)
		} else {
			dom.filter(elementDom => elementDom.name === 'template').forEach(root_comp => appendBuffer(tagTemplateToStr(root_comp, config.viewModel, config.resourcePath)));
			finalBuffer = buffer.join('');
		}
	});
	var parser = new htmlparser.Parser(handler, { decodeEntities: true, recognizeSelfClosing: true });
	parser.write(rawHtml);
	//parser.write(rawHtml.replace(/[\n\t\r]/g," "));
	parser.done();
	//liberando a memoria
	flush();
	return finalBuffer;
}

exports.default = convert;
