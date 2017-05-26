var fjsparse = require("./parse/parse");

module.exports = function(opt) {
	var opt = opt||{};
	opt.viewModel = opt.viewModel||"testeViewModel";
	return fjsparse((templateFile),{viewModel:opt.viewModel});		
};
