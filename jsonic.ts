/* Copyright (c) 2013-2021 Richard Rodger, MIT License */

/*  jsonic.ts
 *  Entry point and API.
 */


// TODO: put grammar in grammar.ts
// TODO: Context provides current jsonic instance: { ..., jsonic: ()=>instance }
// TODO: docs: ref https://wiki.alopex.li/OnParsers
// TODO: docs: nice tree diagram of rules (generate?)
// TODO: rule.use should be rule.u for consistency
// TODO: Jsonic.make('json') - preset plain JSON options - see variant test just-json
// TODO: consistent use of clean on options to allow null to mean 'remove property'
// TODO: [,,,] syntax should match JS!
// TODO: rename tokens to be user friendly
// TODO: if token recognized, error needs to be about token, not characters
// TODO: test custom alt error: eg.  { e: (r: Rule) => r.close[0] } ??? bug: r.close empty!
// TODO: multipe merges, also with dynamic
// TODO: FIX: jsonic script direct invocation in package.json not working
// TODO: quotes are value enders - x:a"a" is an err! not 'a"a"'
// TODO: tag should appear in error
// TODO: remove console colors in browser?
// post release: 
// TODO: plugin for path expr: a.b:1 -> {a:{b:1}}
// TODO: data file to diff exhaust changes
// TODO: cli - less ambiguous merging at top level
// TODO: internal errors - e.g. adding a null rulespec
// TODO: option to control comma null insertion
// TODO: {,} should fail ({,,...} does).


// # Conventions
//
// ## Token names
// * '#' prefix: parse token


import type {
  Config,
  Context,

  Counters,
  Relate,
  Tin,

  Point,
  Token,
  Rule,
  RuleSpec,
  Lex,

  RuleDefiner,
  RuleState,
  RuleSpecMap,

  LexMatcher,
  MakeLexMatcher,

  AltSpec,
  AltAction,
  AltCond,
  AltModifier,
  AltError,

  Options,
  JsonicAPI,
  JsonicParse,
  Plugin,

} from './types'


import {
  OPEN,
  CLOSE,
  BEFORE,
  AFTER,
} from './types'


import {
  JsonicError,
  S,
  assign,
  badlex,
  deep,
  defprop,
  errdesc,
  errinject,
  extract,
  makelog,
  mesc,
  regexp,
  tokenize,
  trimstk,
  srcfmt,
  clone,
  charset,
  configure,
  escre,
  parserwrap,
  keys,
} from './utility'


import {
  defaults
} from './defaults'

import {
  makePoint,
  makeToken,
  makeLex,
  makeFixedMatcher,
  makeSpaceMatcher,
  makeLineMatcher,
  makeStringMatcher,
  makeCommentMatcher,
  makeNumberMatcher,
  makeTextMatcher,
} from './lexer'

import {
  makeRule,
  makeRuleSpec,
  Parser
} from './parser'


import {
  grammar
} from './grammar'

// TODO: remove - too much for an API!
const util = {
  tokenize,
  srcfmt,
  deep,
  clone,
  charset,
  trimstk,
  makelog,
  badlex,
  extract,
  errinject,
  errdesc,
  configure,
  parserwrap,
  mesc,
  escre,
  regexp,
  keys,
}


// The full library type.
// NOTE: redeclared here so it can be exported as a type and instance.
type Jsonic =
  JsonicParse & // A function that parses.
  JsonicAPI & // A utility with API methods.
  { [prop: string]: any } // Extensible by plugin decoration.



function make(param_options?: Relate, parent?: Jsonic): Jsonic {

  let internal: {
    parser: Parser,
    config: Config,
    plugins: Plugin[],
    mark: number,
  } = {
    parser: ({} as Parser),
    config: ({} as Config),
    plugins: [],
    mark: Math.random()
  }

  // Merge options.
  let merged_options = deep(
    {},
    parent ? { ...parent.options } :
      false === param_options?.defaults$ ? {} : defaults,
    param_options ? param_options : {},
  )


  // Create primary parsing function
  let jsonic: any =
    function Jsonic(src: any, meta?: any, parent_ctx?: any): any {
      if (S.string === typeof (src)) {
        let internal = jsonic.internal()
        let parser = options.parser?.start ?
          parserwrap(options.parser) : internal.parser
        return parser.start(src, jsonic, meta, parent_ctx)
      }

      return src
    }


  // This lets you access options as direct properties,
  // and set them as a funtion call.
  let options: any = (change_options?: Relate) => {
    if (null != change_options && S.object === typeof (change_options)) {
      deep(merged_options, change_options)
      configure(jsonic, internal.config, merged_options)
      let parser = jsonic.internal().parser
      internal.parser = parser.clone(merged_options, internal.config)
    }
    return { ...jsonic.options }
  }


  // Define the API
  let api: JsonicAPI = {

    token: ((ref: string | Tin) =>
      tokenize(ref, internal.config, jsonic)) as unknown as JsonicAPI['token'],

    fixed: ((ref: string | Tin) =>
      internal.config.fixed.ref[ref]) as unknown as JsonicAPI['fixed'],

    options: deep(options, merged_options),

    parse: jsonic,

    // TODO: how to handle null plugin?
    use: function use(plugin: Plugin, plugin_options?: Relate): Jsonic {
      const full_plugin_options =
        deep({}, plugin.defaults || {}, plugin_options || {})
      jsonic.options({
        plugin: {
          [plugin.name]: full_plugin_options
        }
      })
      jsonic.internal().plugins.push(plugin)
      return plugin(jsonic, full_plugin_options) || jsonic
    },

    rule: (name?: string, define?: RuleDefiner | null) => {
      return jsonic.internal().parser.rule(name, define) || jsonic
    },

    lex: (matchmaker: MakeLexMatcher) => {
      let match = merged_options.lex.match
      match.unshift(matchmaker)
      jsonic.options({
        lex: { match }
      })
    },

    make: (options?: Options) => {
      return make(options, jsonic)
    },

    empty: (options?: Options) => make({
      defaults$: false,
      grammar$: false,
      ...(options || {})
    }),

    id: 'Jsonic/' +
      Date.now() + '/' +
      ('' + Math.random()).substring(2, 8).padEnd(6, '0') +
      (null == options.tag ? '' : '/' + options.tag),

    toString: () => {
      return api.id
    },

    util,
  }


  // Has to be done indirectly as we are in a fuction named `make`.
  defprop(api.make, S.name, { value: S.make })

  // Add API methods to the core utility function.
  assign(jsonic, api)

  // Hide internals where you can still find them.
  defprop(jsonic, 'internal', { value: () => internal })


  if (parent) {
    // Transfer extra parent properties (preserves plugin decorations, etc).
    for (let k in parent) {
      if (undefined === jsonic[k]) {
        jsonic[k] = parent[k]
      }
    }

    jsonic.parent = parent

    let parent_internal = parent.internal()
    internal.config = deep({}, parent_internal.config)

    configure(jsonic, internal.config, merged_options)
    assign(jsonic.token, internal.config.t)

    internal.plugins = [...parent_internal.plugins]
    internal.parser = parent_internal.parser.clone(merged_options, internal.config)
  }
  else {
    internal.config = configure(jsonic, undefined, merged_options)
    internal.plugins = []
    internal.parser = new Parser(merged_options, internal.config)
    if (false !== merged_options.grammar$) {
      grammar(jsonic)
    }
  }

  return jsonic
}


let root: any = undefined
let Jsonic: Jsonic = root = make()


// The global root Jsonic instance cannot be modified.
// use Jsonic.make() to create a modifiable instance.
delete root.options
delete root.use
delete root.rule
delete root.lex
delete root.token
delete root.fixed


// Provide deconstruction export names
root.Jsonic = root
root.JsonicError = JsonicError
root.Parser = Parser
root.makeLex = makeLex
root.makeToken = makeToken
root.makePoint = makePoint
root.makeRule = makeRule
root.makeRuleSpec = makeRuleSpec
root.util = util
root.make = make


// Export most of the types for use by plugins.
export type {
  Plugin,
  Options,
  Config,
  Context,

  Token,
  Point,
  Rule,
  RuleSpec,
  Lex,

  Counters,
  Relate,
  Tin,

  MakeLexMatcher,
  LexMatcher,

  RuleDefiner,
  RuleState,
  RuleSpecMap,

  AltSpec,
  AltCond,
  AltAction,
  AltModifier,
  AltError,
}

export {
  // Jsonic is both a type and a value.
  Jsonic as Jsonic,
  JsonicError,
  Parser,
  util,
  make,

  makeToken,
  makePoint,
  makeRule,
  makeRuleSpec,
  makeLex,

  makeFixedMatcher,
  makeSpaceMatcher,
  makeLineMatcher,
  makeStringMatcher,
  makeCommentMatcher,
  makeNumberMatcher,
  makeTextMatcher,

  OPEN,
  CLOSE,
  BEFORE,
  AFTER,
}


export default Jsonic

// Build process uncomments this to enable more natural Node.js requires.
/* $lab:coverage:off$ */
//-NODE-MODULE-FIX;('undefined' != typeof(module) && (module.exports = exports.Jsonic));
/* $lab:coverage:on$ */
