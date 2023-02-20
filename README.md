# @ferrugemjs/compile
a npm package to convert html to incremental dom


# @ferrugemjs/compile
ferrugemjs-node is a simple node package to converte template HTML engine to google incremental-DOM.

[![NPM](https://nodei.co/npm/@ferrugemjs/compile.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/@ferrugemjs/compile)

#### Install

'npm install @ferrugemjs/compile --save-dev'

#### Usage

```js
var ferrugemjs_compile = require('@ferrugemjs/compile');//import the plugin
// your code here!!
ferrugemjs_compile('<template><div>test</div></template>',<<options>>)
```

#### Options

```js	
	{
		templateExtension: ".html",
		env: "production" // default is "development"
	}
```

### Usage

```js
const fs = require("fs");
//import the plugin
const ferrugemjs_compile = require('@ferrugemjs/compile');

const filePath = "test/app/main-app.html";

fs.readFile(filePath, function (err, buf) {
    const compiledStr = ferrugemjs_compile(buf.toString(), {
        templateExtension: ".html",
        viewModel: "main-app",
        env: "production" // default is "development"
    })

    fs.writeFile(`${filePath}.js`, compiledStr, (err) => {
        if (err) console.log(err);
        console.log("Successfully Written to File.");
    });
});

```

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

