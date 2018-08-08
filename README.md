# ferrugemjs-node
a npm package to convert html to incremental dom


# ferrugemjs-node
ferrugemjs-node is a simple node package to converte template HTML engine to google incremental-DOM.

[![NPM](https://nodei.co/npm/ferrugemjs-node.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/ferrugemjs-node/)

#### Install

'npm install ferrugemjs-node --save-dev'

#### Usage

```js
var ferrugemjs_node = require('ferrugemjs-node');//import the plugin
// your code here!!
ferrugemjs_node('<template><div>test</div></template>',<<options>>)
```

#### Options

```js	
	{
		templateExtension: ".html",
		env: "production" // default is "development"
	}
```

### Usage as CLI

#### usage

```
node_modules/.bin/ferrugemjs-node-cli --name <comp-name>  --tpl '<raw html>'
```
eg.
```
node_modules/.bin/ferrugemjs-node-cli --name teste  --tpl '<template><div></div></template>'
```

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

