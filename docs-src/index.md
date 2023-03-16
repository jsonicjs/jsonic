---
home: true
heroImage: /jsonic-logo.svg
heroText: "Jsonic"
actionText: Getting Started →
actionLink: /guide/getting-started.html
features:
- title: Easy Syntax
  details: Quotes and commas are optional. So are braces. There are comments. Like YAML, but without indents, and predictable.
- title: Friendly Errors
  details: Parsing errors show exactly where the problem is, with a code snippet, and offer helpful hints for fixes.
- title: A Parsing System
  details: Plugins can help you parse most JSON variants, including things like CSV. You can write your own parsers using a little token state machine.
footer: MIT Licensed | Copyright © 2013-present Richard Rodger & Jsonic Contributors
---

## Jsonic vs JSON

The goals of Jsonic are to:
* be for human coders;
* reduce syntax noise;
* make it easier to edit large files;
* be closer to JavaScript syntax;
* _NOT_ be a data exchange format;
* be extensible (for power users).

On the left, you have some examples of Jsonic syntax. On the right,
the same data in JSON. Of course, all JSON is valid Jsonic too.


```jsonic
## jsonic ##                                #  ## JSON ##
                                            #
# comment           # comments              #
// comment                                  #
/*                                          #
 * comment                                  #
 */                                         #
                    # implicit object       #  { 
                                            #
key: value          # implicit quotes       #    "key": "value",
                                            #
comma: 0            # optional commas       #    "comma": 0,
                                            #
single: 'quotes'    # single quote strings  #    "single": "quotes",
                                            #  
multi: `            # multi-line quotes     #    "multi": "\nline\nquotes\n"",             
line                                        #
quotes                                      #
`                                           #
                                            #                                              
merge: { this:1 }   # merge objects         #    "merge": { 
merge: { that:2 }                           #      "this": 1,
                                            #      "that": 2
                                            #    },                               
                                            #  
deep: dive: chain   # key chaining          #    "deep": {
                                            #      "dive": "chain"                                        
                                            #    },
                                            #
inline: [one two]   # inline values         #    "inline": [ "one", "two" ],
                                            #
props: [1 2 key:3]  # array properties      #    "props": [1, 2],  # props.key === 3                                         
                                            #                                              
million: 1_000_000  # readable numbers      #    "million": 1000000                                           
                                            #  }
```

A more formal description of the syntax is provided in the reference documentation using [railroad diagrams](ref/syntax.html#railroad-diagrams).


<br><br><br>

## Usage

Plain Javascript:

```js
const Jsonic = require('jsonic')

console.log(Jsonic('a:1')) // Prints {a: 1}
```

TypeScript types are included:

```ts
import { Jsonic } from 'jsonic'
```

The distribution also includes a minified browser version so you
import _Jsonic_ into your frontend code.

Install with:

```
$ npm install jsonic
```

OK! Time to [Get Started!](/guide/getting-started.html)

<br><br><br>


## But ... why write yet another JSON parser?

Originally Jsonic was created to make using the [Seneca](https://senecajs.org)
REPL easier. The Seneca microservices framework provides a
[REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop)
for easier debugging, allowing you to manually submit JSON messages to
the system.

Manually typing JSON in debug sessions is painful. Compare a JSON message:

```json
> {"sys":"entity","cmd":"load","name":"foo","q":{"id":1}}
```

with a Jsonic message:

```jsonic
> sys:entity,cmd:load,name:foo,q:id:1
```

The first version of the Jsonic parser was generated using
[PEG.js](https://pegjs.org/). And it worked very well!

But the source code was machine generated, difficult to follow, not
extensible, and it was a little slow. The syntax errors were terse.

While preparing a new version of Seneca, I decided to rewrite Jsonic
using a simple hand-rolled recursive descent code. And do it in
TypeScript. And then I wrote a little state machine to handle the
tokens, and then realised it was actually general-purpose, and then
I made it dynamic, and then added plugin support, and then...

Well, you know how it goes with open source.

So now Seneca has a lovely new Jsonic parser, and you dear coder have
another parsing option for your DSL! Jsonic is not a
parser-generator. You define the token state machine at run time. That
means you can have a configurable and extensible language. As a
demonstration, there are Jsonic plugins to parse Json variants like
[Jsonc](https://github.com/jsonicjs/jsonc), and things that can be
made to be JSON-like, such as [TOML](https://github.com/jsonicjs/toml)
or [CSV](https://github.com/jsonicjs/csv).

Can't be bothered to implement expression precedence yet again? Jsonic
has you covered with some good old [Pratt expression
parsing](https://github.com/jsonicjs/expr).

Also, since it's a state machine, you can parse to infinite depth (or
until you run out of memory). You'll never blow the call stack, so
it's safe to call the parser quite deep in your own code.

There are trade-offs. You won't get a nice BNF-style grammar
specification (well, the debug output does try), and you have to use
JavaScript code directly to define the parser and lexer. You get two
token lookahead, and that's it. Also, the state machine really prefers
[context-free
grammers](https://en.wikipedia.org/wiki/Context-free_grammar). It can
handle anything, but then your tokenizers get a little messy.

The logo is a tribute to this [little
guy](https://mars.nasa.gov/mer/mission/rover-status/).

Finally, the urge to write this little engine, and my interest in
language parsing, is very much inspired by good old
[ANTLR](https://www.antlr.org/). 






