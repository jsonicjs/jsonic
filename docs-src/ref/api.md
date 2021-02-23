# API

The <name-self/> API is deliberately kept as small as possible.

::: tip
If all you want to do is parse easy-going JSON, you don't need this API!
Just call `Jsonic(...your-json-source...)` and use the return value.

This API is for customizing the JSON parser, so if that is your game, read on...
:::


The default import `Jsonic` is intended as utility function and to be
used as-is. For customization, and to access the API methods, create a
new <name-self/> instance with `Jsonic.make()`.

Some plugins may decorate the main `Jsonic` object with additional methods.

* :strawberry: :pear: [`Jsonic`](#jsonic-just-parse-already)
* &nbsp;&nbsp;&nbsp;&nbsp; :pear: [`id`](#id-unique-instance-identifier)
* :strawberry: &nbsp;&nbsp;&nbsp;&nbsp; [`toString`](#tostring-string-description-of-the-jsonic-instance)
* :strawberry: &nbsp;&nbsp;&nbsp;&nbsp; [`make`](#make-create-a-new-customizable-jsonic-instance)
* :strawberry: :pear: [`options`](#options-get-and-set-options-for-a-jsonic-instance)
* :strawberry: &nbsp;&nbsp;&nbsp;&nbsp; [`use`](#use-register-a-plugin)
* :strawberry: &nbsp;&nbsp;&nbsp;&nbsp; [`rule`](#rule-define-or-modify-a-parser-rule)
* :strawberry: &nbsp;&nbsp;&nbsp;&nbsp; [`lex`](#lex-define-a-lex-matcher)
* :strawberry: :pear: [`token`](#token-resolve-a-token-by-name-or-index)

<small>
(🍓 method, 🍐 property or set of properties)
</small>


<br><br>
## Methods

### :strawberry: :pear: `Jsonic`: Just parse already!

`Jsonic(source: string, meta?: object): any`

_Returns_: `any` Object (or value) containing the parsed JSON data.

* `source: string` _<small>required</small>_ : The JSON source text to parse.
* `meta?: object` _<small>optional</small>_ : Provide meta data for this parse.

#### :thumbsup: Example

```js
let earth = Jsonic('name: Terra, moons: [{name: Luna}]')
```

The `earth` variable now contains the following data: 

```json
// earth ->
{
  "name": "Terra",
  "moons": [
    {
      "name": "Luna"
    }
  ]
}
```

#### :thumbsup: Example: using the `meta` parameter

```js
let one = Jsonic('1', {log:-1}) // one === 1
```

The `meta` value of `{log:-1}` prints a debug log of the lexing and
parsing process to `STDOUT`. Very useful when you are writing a
plugin! See the plugin section for more details.

```sh
lex	#NR	"1"	1	0:1	@LTP
lex	#ZZ		1	0:1	@LTP
rule	val/1	open	0	0	[#NR #ZZ]	["1" ]
parse	val/1	open	alt=10	[#NR]	0	p=	r=	b=	#NR	["1"]	c:	n:
lex	#ZZ		1	0:1	@LTP
node	val/1	open	w=Z	
stack	0	
rule	val/1	close	0	1	[#ZZ #ZZ]	[ ]
parse	val/1	close	alt=2	[#AA]	1	p=	r=	b=1	#ZZ	[null]	c:	n:
node	val/1	close	w=O	1
stack	0
```

Apart from `log`, the meta object contains plugin-specific
parameters. See your friendly neighbourhood plugin documentation for
more.

<br>
---
### :pear: `id`: Unique instance identifier

`.id: string`

It's useful to be able to identify unique instances when you're debugging.

Use the `tag` option to set a custom tag for the instance.


#### :thumbsup: Example

```js
// format: Jsonic/<Date.now()>/<Math.random()[2:8]>/<options.tag>
Jsonic.id // === 'Jsonic/1614085850042/022636/-'
Jsonic.make({tag:'foo'}).id // === 'Jsonic/1614085851902/375149/foo'
```


<br>
---
### :strawberry: `toString`: String description of the Jsonic instance

`.toString(): string`

Returns the value of the `.id` property as the string description of
the instance.


#### :thumbsup: Example

```js
// format: Jsonic/<Date.now()>/<Math.random()[2:8]>/<options.tag>
''+Jsonic // === 'Jsonic/1614085850042/022636/-'
''+(Jsonic.make({tag:'foo'})) // === 'Jsonic/1614085851902/375149/foo'
```



<br>
---
### :strawberry: `make`: Create a new customizable Jsonic instance.

`.make(options?: object): Jsonic`

_Returns_: `Jsonic` A new Jsonic instance that can be modified.

* `options?: object` _<small>optional</small>_ : Partial options tree.


#### :thumbsup: Example

```js
let array_of_numbers = Jsonic('1,2,3') 
// array_of_numbers === [1, 2, 3]

let no_numbers_please = Jsonic.make({number: {lex: false}})
let array_of_strings = no_numbers_please('1,2,3') 
// array_of_strings === ['1', '2', '3']
```

You must call `make` to customize <name-self/>. This protects the
`Jsonic` import which is a shared global object.

Calling `make` again on the new `Jsonic` instance will generate
another new instance that inherits the configuration of its parent and
can itself be independently customized. Which is what you want.


#### :thumbsup: Example: child instances inherit from parent instances

```js
let no_numbers_please = Jsonic.make({number: {lex: false}})
no_numbers_please('1,2,3') // === ['1', '2', '3'] as before

let pipe_separated = no_numbers_please.make({token: {'#CA':{c:'|'}}})
pipe_separated('1|2|3') // === ['1', '2', '3'], but:
pipe_separated('1,2,3') // === '1,2,3' !!!
```

To understand how the `token` option works, and all the other
options, see the [Options](/ref/options/) section.



<br>
---
### :strawberry: :pear: `options`: Get and set options for a Jsonic instance.

`.options(options: object): object`

_Returns_: `object` merged object containing the full option tree

* `options: object` _<small>required</small>_ : Partial options tree.


#### :thumbsup: Example

```js

Jsonic.options().comment.lex // === true
Jsonic.options.comment.lex // === true - as a convenience

let no_comment = Jsonic.make()
no_comment.options({comment: {lex: false}})

// Returns {"a": 1, "#b": 2}
no_comment(`
  a: 1
  #b: 2
`)

// Whereas this returns only {"a": 1} as # starts a one line comment
Jsonic(`
  a: 1
  #b: 2
`)
```



<br>
---
### :strawberry: `use`: Register a plugin.

`.use(plugin: function, plugin_options?: object): Jsonic`

_Returns_: Jsonic instance (this allows chaining)

* `plugin: function` _<small>required</small>_ : Plugin definition function
  * `(jsonic: Jsonic) => Jsonic`
* `plugin_options?: object` _<small>optional</small>_ : Plugin-specific options

#### :thumbsup: Example

```js
let jsonic = Jsonic.make().use(function piper(jsonic) {
  jsonic.options({token: {'#CA':{c:'|'}}})
})
jsonic('a|b|c') // === ['a', 'b', 'c']
```

Plugins are defined by a function that takes the `Jsonic` instance as
a first parameter, and then changes the options and parsing rules of
that instance. For more, see the [plugin writing guide](/guide/write-a-plugin).


#### :thumbsup: Example: plugin options

```js
function sepper(jsonic) {
  let sep = jsonic.options.plugin.sepper.sep
  jsonic.options({token: {'#CA':{c:sep}}})
}

let jsonic = Jsonic.make().use(sepper, {sep:';'})
jsonic('a;b;c') // === ['a', 'b', 'c']
```

Plugin options are added to the main options under the `plugin` key using the
name of the plugin function as a sub-key. Thus `function sepper(...)` means that 
`jsonic.options.plugin.sepper` contains the plugin option.

Notice that you can refer to options directly as properties of the
`.options` method, as a convenience.


#### :thumbsup: Example: plugin chaining

When defining a custom <name-self /> instance, you'll probably be registering
multiple plugins. The `.use` method can be chained to make this easier.

```js
function foo(jsonic) {
  jsonic.foo = function() {
    return 1
  }
}
function bar(jsonic) {
  jsonic.bar = function() {
    return this.foo() * 2
  }
}
let jsonic = Jsonic.make()
    .use(foo)
    .use(bar)
// jsonic.foo() === 1
// jsonic.bar() === 2
```



<br>
---
### :strawberry: `rule`: Define or modify a parser rule.

`.rule(name?: string, define?: function): RuleSpec`

_Returns_: `RuleSpec` Rule specification

* `name?: string` _<small>optional</small>_ : Rule name
* `define?: function` _<small>optional</small>_ : Rule definition function
  * `(rs: RuleSpec, rsm: RuleSpecMap) => RuleSpec` 

The `.rule` method (and the `.lex` and `.token`) methods ar intended
mostly for use inside plugin definitions. They allow you to modify the way that
<name-self/> works.

The `.rule` method takes the name of a rule and if it exists, provides
the rule specification as first parameter to the rule definition
function. If the rule does not exist, you can create a new rule
specification and return that to define a new rule.

The details of rule definition are covered in the [Plugins](/plugins/)
section.


#### :thumbsup: Example

```js
let concat = Jsonic.make()

// Get all the rules
Object.keys(concat.rule()) // === ['val', 'map', 'list', 'pair', 'elem']

// Get a rule by name
let val_rule = jsonic.rule('val') // val_rule.name === 'val'

// Modify a rule 
let ST = concat.token.ST
concat.rule('val',(rule)=>{
  // Concatentate strings (ST) instead of forming array elements
  rule.def.open.unshift({s:[ST,ST], h:(alt,rule,ctx)=>{
    rule.node = ctx.t0.val + ctx.t1.val
    // Disable default value handling
    rule.before_close_active = false
  }})
})

concat('"a" "b"') // === 'ab'
Jsonic('"a" "b"') // === ['a', 'b']

// Create a new rule (for a new token)
concat.options({
  token: { '#HH': {c:'%'} }
})

let HH = concat.token.HH
concat.rule('hundred', ()=>{
  return new RuleSpec({
    after_open: (rule)=>{
      // % always becomes the value 100
      rule.node = 100
    }
  })
})
concat.rule('val', (rulespec)=>{
  rulespec.def.open.unshift({s:[HH], p:'hundred'})
})

concat('{x:1, y:%}') // === {x:1, y:100}
```



<br>
---
### :strawberry: `lex`: Define a lex matcher.

`.lex(state?: Tin, match?: function): LexMatcher[]`

_Returns_: `LexMatcher[]` Ordered list of lex matchers for this lex state.

* `state?: Tin` _<small>optional</small>_ : Token identifier number
* `matcher?: function` _<small>optional</small>_ : Lex matcher function
  * `(state: LexMatcherState) => LexMatcherResult`


The `.lex` method (like the `.rule` and `.token` methods) allows you
to change the way that <name-self /> works. The `.lex` method attaches
a matcher function to a given lex state. This matcher has the
opportunity to examine the current source text position and generate a
token, or pass lexing over to the standard machinery.

The <name-self /> is state based, although most of the normal lexing
happens in the top lex state (LTP).

For more about lex matchers, see the [Plugins](/plugins/) section.


#### :thumbsup: Example

```js
let tens = Jsonic.make()
let VL = tens.token.VL
let LTP = tens.token.LTP

// Match characters in the top lex state (LTP)
tens.lex(LTP, function tens_matcher(state) {

  // % -> 10, %% -> 20, %%% -> 30, etc.
  let marks = state.src.substring(state.sI).match(/^%+/)
  if(marks) {
    let len = marks[0].length
    state.token.tin = VL
    state.token.val = 10 * len

    // Update lexer position and column
    return {
      sI: state.sI + len,
      cI: state.cI + len
    }
  }
})

tens('a:1,b:%%,c:[%%%%]') // === {a:1, b:20, c:[40]}
```



<br>
---
### :strawberry: :pear: `token`: Resolve a token by name or index.

`.token(ref: Tin | string): string | Tin`

_Returns_: `string | Tin` Token identifier or token name (opposite of `ref` type).

* `ref: Tin | string` _<small>required</small>_ : Token identifier number or name


The `.token` method lets you get the unique token identification
number (`Tin`) of a named token in the current `Jsonic` instance, or
lookup the name of a token by its `Tin`.

As lexer states must also be unique, they are generated as
pseudo-tokens using the same index of tokens. While child `Jsonic`
instances (generated with `.make`) will inherit the index of their
parents, in general token identification is usable only for a specific
`Jsonic` instance.


#### :thumbsup: Example

```js
Jsonic.token.ST // === 11, String token identification number
Jsonic.token(11) // === '#ST', String token name
Jsonic.token('#ST') // === 11, String token name
```
