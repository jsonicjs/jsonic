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

* [`Jsonic`](#jsonic-just-parse-already)
* [`make`](#make-create-a-new-customizable-jsonic-instance)
* [`options`](#options-get-and-set-options-for-a-jsonic-instance)
* [`use`](#use-register-a-plugin)
* [`rule`](#rule-define-or-modify-a-parser-rule)
* [`lex`](#lex-define-a-lex-matcher)
* [`token`](#token-resolve-a-token-by-name-or-index)



## Methods

### `Jsonic`: Just parse already!

`Jsonic(source: string, meta?: object): any`

_Returns_: `any` Object (or value) containing the parsed JSON data.

* `source: string` _<small>required</small>_ : The JSON source text to parse.
* `meta?: object` _<small>optional</small>_ : Provide meta data for this parse.

#### Example

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

#### Example: using the `meta` parameter

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


### `make`: Create a new customizable Jsonic instance.

`.make(options?: object): Jsonic`

_Returns_: `Jsonic` A new Jsonic instance that can be modified.

* `options?: object` _<small>optional</small>_ : Partial options tree.


#### Example

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


#### Example: child instances inherit from parent instances

```js
let no_numbers_please = Jsonic.make({number: {lex: false}})
no_numbers_please('1,2,3') // === ['1', '2', '3'] as before

let pipe_separated = no_numbers_please.make({token: {'#CA':{c:'|'}}})
pipe_separated('1|2|3') // === ['1', '2', '3'], but:
pipe_separated('1,2,3') // === '1,2,3' !!!
```

To understand how the `token` option works, and all the other
options, see the [Options](/ref/options/) section.

# TODO: toString ids



### `options`: Get and set options for a Jsonic instance.

`.options(options: object): object`

_Returns_: `object` merged object containing the full option tree

* `options: object` _<small>required</small>_ : Partial options tree.


#### Example

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



### `use`: Register a plugin.

`.use(plugin: function, plugin_options?: object): Jsonic`

_Returns_: Jsonic instance (this allows chaining)

* `plugin: function` _<small>required</small>_ : Plugin definition function
  * `(jsonic: Jsonic) => Jsonic`
* `plugin_options?: object` _<small>optional</small>_ : Plugin-specific options

#### Example

```js
let jsonic = Jsonic.make().use(function piper(jsonic) {
  jsonic.options({token: {'#CA':{c:'|'}}})
})
jsonic('a|b|c') // === ['a', 'b', 'c']
```

Plugins are defined by a function that takes the `Jsonic` instance as
a first parameter, and then changes the options and parsing rules of
that instance. For more, see the [plugin writing guide](/guide/write-a-plugin).


#### Example: plugin options

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


#### Example: plugin chaining

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



### `rule`: Define or modify a parser rule.

`.rule(name?: string, define?: function): RuleSpec`

_Returns_: `RuleSpec` Rule specification

* `name?: string` _<small>optional</small>_ : Rule name
* `define?: function` _<small>optional</small>_ : Rule definition function
  * `(rs: RuleSpec, rsm: RuleSpecMap) => RuleSpec` 


# Example

```js
let ruler = Jsonic.make()

// Get all the rules
Object.keys(ruler.rule()) // === ['val', 'map', 'list', 'pair', 'elem']

// Get a rule by name
let val_rule = jsonic.rule('val') // val_rule.name === 'val'

// Modify a rule 
let ST = ruler.token.ST
ruler.rule('val',(rule)=>{
  // Concatentate strings (ST) instead of forming array elements
  rule.def.open.unshift({s:[ST,ST], h:(alt,rule,ctx)=>{
    rule.node = ctx.t0.val + ctx.t1.val
    // Disable default value handling
    rule.before_close_active = false
  }})
})

ruler('"a" "b"') // === 'ab'
Jsonic('"a" "b"') // === ['a', 'b']

// Create a new rule (for a new token)
ruler.options({
  token: { '#HH': {c:'%'} }
})

let HH = ruler.token.HH
ruler.rule('hundred', ()=>{
  return new RuleSpec({
    after_open: (rule)=>{
      // % always becomes the value 100
      rule.node = 100
    }
  })
})
ruler.rule('val', (rulespec)=>{
  rulespec.def.open.unshift({s:[HH], p:'hundred'})
})

ruler('{x:1, y:%}') // === {x:1, y:100}
```



### `lex`: Define a lex matcher.

`.lex(state?: Tin, match?: function): LexMatcher[]`

_Returns_: `LexMatcher[]` Ordered list of lex matchers for this lex state.

* `state?: Tin` _<small>optional</small>_ : Token identifier number
* `matcher?: function` _<small>optional</small>_ : Lex matcher function
  * `(state: LexMatcherState) => LexMatcherResult`




### `token`: Resolve a token by name or index.

`.token(ref: Tin | string): string | Tin`

_Returns_: `string | Tin` Token identifier or token name (opposite of `ref` type).

* `ref: Tin | string` _<small>required</small>_ : Token identifier number or name


