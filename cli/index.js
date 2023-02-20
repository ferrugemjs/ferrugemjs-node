#!/usr/bin/env node

const fjsparse = require("../parse/parse");

let args = process.argv;
let tempTextIndex = args.indexOf('--tpl');
let compNameIndex = args.indexOf('--name');
if(tempTextIndex > -1 && compNameIndex > -1){    
    console.log(
        fjsparse.default(args[tempTextIndex+1],{viewModel: args[compNameIndex+1] })    
    )
}
