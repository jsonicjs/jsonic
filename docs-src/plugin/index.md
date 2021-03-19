# Plugins

There is a standard <name-self/> [syntax](/ref/syntax), which you
should probably just use if all you want is easy-going JSON.

But <name-self/> itself is meant to be an extensible parser for
JSON-like languages, so you feel the need for a little more power,
you've come to the right place!

A small set of plugins are built into the standard package. You load
them separately (this keeps the core small for web app use cases).

There is a wider set of standard plugins under the [@jsonic
organisation](https://www.npmjs.com/org/jsonic).

These plugins also serve as examples of how to write your own
extensions to JSON. Instead of starting from
scratch, [copy and improve](/guide/improve-plugin-tutorial)!


<a name="builtin-plugins"></a>


## Built-in plugins

* [native](#native): Parse native JavaScript values such as `undefined`, `NaN`, etc. 
* [csv](#csv): Parse CSV data that can contain embedded JSON.


### `native`
[details](/plugin/native) &rarr;

Parse native JavaScript values such as `undefined`, `NaN`, `Infinity`,
literal regular expressions, and ISO-formatted dates.


```js
let Native = require('jsonic/plugin/native') // or import
let extra = Jsonic.make().use(Native)
extra('a:NaN') // === {"a": NaN}
```



### `csv`
[details](/plugin/csv) &rarr;

Parse CSV data that can contain embedded JSON, and also supports
comments and other <name-self/> sugar.

```js
let Csv = require('jsonic/plugin/csv') // or import
let extra = Jsonic.make().use(Csv)

// === [{"a":1, "b":2}, {"a":3,"b":4}]
extra(`
a,b      // first line is headers
1,2
3,4
`) 
```


<a name="standard-plugins"></a>


## Standard plugins



<a name="community-plugins"></a>


## Community plugins
