## Install

You can use <name-self/> in the browser and on the server.

You'll need to install the package into your project first:

```sh
$ npm install jsonic 
```

&ZeroWidthSpace;<name-self /> also provides a command line utility
that converts _jsonic_ arguments into traditional _JSON_. If you install
<name-self/> globally, then you can run this utility directly:

```sh
$ npm install -g jsonic
$ jsonic a:1
{"a":1}
```

If you plan on writing custom plugins, this utility is very handy for
debugging (try `jsonic -d` to get a debug log).


## Node.js

The recommended way to load Jsonic is:

```js
const { Jsonic } = require('jsonic')

// And then just use it directly!
console.log(Jsonic('a:1'))
```

However, if you are upgrading from <name-self/> 0.x or 1.x, then the
old way will still work (and is *not* deprecated&mdash;this is a perfectly valid traditional Node.js idiom!):


```js
const Jsonic = require('jsonic')

// Nothing broken!
console.log(Jsonic('a:1'))
```

## ES Module

If you are using Node version 14 or higher and want to load <name-self/> into your
own modules, then load the jsonic.js file directly, like so:

```js
import Jsonic from 'jsonic'
console.log(Jsonic('a:1'))
```

This will also work:

```js
import { Jsonic } from 'jsonic'
console.log(Jsonic('a:1'))
```

Note that <name-self /> is a CommonJS module, so this required Node
version 14 or higher.

In other scenarios (such as browser usage), your packaging solution
(webpack, rollup, etc.) will expose <name-self /> to you as an ES Module.


## Typescript

&ZeroWidthSpace;<name-self /> is written in TypeScript, and the
package includes type information. Import and go!

```ts
import Jsonic from 'jsonic'
console.log(Jsonic('a:1'))
```

This will also work:

```ts
import { Jsonic } from 'jsonic'
console.log(Jsonic('a:1'))
```

The package also exports all of the types needed for plugin development:


```ts
// Some of the exported types (there are more...)
import { Jsonic, Plugin, Rule, Context } from 'jsonic'
```


## Browser

If you use a packager (such as webpack, rollup, parcel, ...), then
import <name-self/> and the packager will look after things for you.

```js
import { Jsonic } from 'jsonic'
```

You can also load <name-self/> directly using the `script` tag. The
package includes a standalone minified version `jsonic.min.js`.


```html
<script src="jsonic.min.js"></script>
```

This will make the global variable `Jsonic` available for direct use.


## Getting Help

If you need help installing <name-self/>, please post a question on
the [Installation](https://github.com/rjrodger/jsonic/discussions/26)
discussion board.















