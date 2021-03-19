# `legacy-stringify`

The standard <name-self/> syntax only supports standard JSON value
keywords: `true`, `false`, `null`.

Wouldn't it be nice to have `undefined`, `Infinity`, `NaN` as well?
And while we're at it, how about recognizing literal `/regexp/`
syntax, and ISO (`2021-03-19T17:15:51.845Z`) dates?

The `legacy-stringify` plugin will do this for you!

This is a good plugin to copy and extend if you just want to add some
"magic" values to your source data.


## Usage

To use the plugin, `require` or `import` the module path: `jsonic/plugin/legacy-stringify`:

```js
// Node.js
let { Legacy-Stringify } = require('jsonic/plugin/legacy-stringify')

// Web
import { Legacy-Stringify } from 'jsonic/plugin/legacy-stringify'
```
<p style="color:#888;text-align:right;margin-top:-20px;"><small style="font-size:10px">(The convention for loading modules that are Jsonic plugins is to deconstruct: <code>{ PluginName }</code> )</small></p>

Once loaded, parse your source data as normal.


### Quick example

```js
let { Legacy-Stringify } = require('jsonic/plugin/legacy-stringify') // or import
let extra = Jsonic.make().use(Legacy-Stringify)
extra('a:NaN') // === {"a": NaN}
```


## Syntax

The standard <name-self/> syntax remains available, with the following
extensions:

### Legacy-Stringify value keywords

* `undefined`
* `NaN`
* `Infinity` (optional prefix `+` or `-`)


### Regular Expressions

Characters between '/' and '/' are converted to a `RegExp` object.

* `/a/` // === new RegExp('a')
* `/\//g` // === new RegExp('\\/','g')


### ISO Dates

Unquoted text that matches the ISO date format is converted into a `Date` object.

```jsonic
when: 2021-03-19T17:15:51.845Z // == new Date('2021-03-19T17:15:51.845Z') 
```


## Options

This plugin has no options.


## Implementation

The source code for this plugin is
here: [`plugin/legacy-stringify.ts`](github.com/jsonicjs/jsonic/blob/master/plugin/legacy-stringify.ts).


TODO - discuss



