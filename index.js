var fjsparse = require("./parse/parse");

module.exports = function(templateFile,opt) {
	var opt = opt||{};
	return fjsparse(templateFile
		,Object.assign({},{templateExtension:".html", viewModel:"testeViewModel", env: "development"},opt)
	);		
};
