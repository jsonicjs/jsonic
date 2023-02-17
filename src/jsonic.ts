/* Copyright (c) 2013-2022 Richard Rodger, MIT License */

/*  jsonic.ts
 *  Entry point and API.
 */

// TODO: exception inside matcher needs own error code - too easy to miss!
// TODO: null proto
// TODO: handle proto
// TODO: add rule.next property, referencing next rule
// TODO: remove the # prefix from token names
// TODO: define jsonic.tokenSet for access to tokenSets, same as jsonic.token
// TODO .rule should prepend by default - far more common
// TODO: Jsonic.options type should not have optionals as definitely defined:
//   e.g jsonic.options.lex.match is defined!
// TODO: HIGH: [a:1] should set prop on array, not create [{a:1}]
// TODO: HIGH: [,,,] syntax should match JS!

// TODO: Option switch to turn Debug plugin off when loaded
// TODO: document standard g names: open, close, step, start, end, imp, top, val, map, etc
// TODO: Rule.use should be Rule.u for consistency
// TODO: remove c: { n: } and c: { d: } conditionals - just use funcs
// TODO: option for sparse arrays: https://dmitripavlutin.com/javascript-sparse-dense-arrays/
// TODO: YAML quoted strings: https://yaml-multiline.info/ - via options
// TODO: line continuation ("\" at end) should be a feature of standard JSONIC strings
// TODO: support BigInt numbers: 123n
// TODO: err if plugin arg is not a plugin
// TODO: error msgs for bad names - eg mispelled rule name
// TODO: http://seriot.ch/projects/parsing_json.html
// TODO: error if rule name not found when parsing
// TODO: error if fixed tokens clash
// TODO: define explicitly: p in close, r in open, behaviour
// TODO: is s:[] needed?
// TODO: implicit lists in pair values: "a:1,2 b:3" -> {a:[1,2], b:3} - pair key terminates (A)
// TODO: string format for rule def: s:'ST,NR' -> s:[ST,NR], also "s:ST,NR,p:foo,..." - needs (A) - can only used post standard definition (thus not in grammar.ts)
// TODO: Context provides current jsonic instance: { ..., jsonic: ()=>instance }
// TODO: docs: ref https://wiki.alopex.li/OnParsers
// TODO: docs: nice tree diagram of rules (generate?)
// TODO: rule.use should be rule.u for consistency
// TODO: Jsonic.make('json') - preset plain JSON options - see variant test just-json
// TODO: consistent use of clean on options to allow null to mean 'remove property'
// TODO: rename tokens to be user friendly
// TODO: if token recognized, error needs to be about token, not characters
// TODO: test custom alt error: eg.  { e: (r: Rule) => r.close[0] } ??? bug: r.close empty!
// TODO: multipe merges, also with dynamic
// TODO: FIX: jsonic script direct invocation in package.json not working
// TODO: quotes are value enders - x:a"a" is an err! not 'a"a"'
// TODO: tag should appear in error
// TODO: remove console colors in browser?
// post release:
// TODO: data file to diff exhaust changes
// TODO: cli - less ambiguous merging at top level
// TODO: internal errors - e.g. adding a null rulespec

// # Conventions
//
// ## Token names
// * '#' prefix: parse token

import type {
  Config,
  Context,
  Counters,
  Bag,
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
  AltMatch,
  AltAction,
  AltCond,
  AltModifier,
  AltError,
  Options,
  JsonicAPI,
  JsonicParse,
  Plugin,
  StateAction,
  LexSub,
  RuleSub,
  Parser,
  NormAltSpec,
} from './types'

import { OPEN, CLOSE, BEFORE, AFTER, EMPTY } from './types'

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
  findTokenSet,
  trimstk,
  srcfmt,
  clone,
  charset,
  configure,
  escre,
  parserwrap,
  prop,
  str,
  clean,

  // Exported with jsonic.util
  omap,
  entries,
  values,
  keys,
} from './utility'

import { defaults } from './defaults'

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

import { makeRule, makeRuleSpec, makeParser } from './parser'

import { grammar, makeJSON } from './grammar'

// TODO: remove - too much for an API!
const util = {
  tokenize,
  srcfmt,
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
  prop,
  str,
  clean,

  // TODO: validated to include in util API:
  deep,
  omap,
  keys,
  values,
  entries,
}

// The full library type.
// NOTE: redeclared here so it can be exported as a type and instance.
type Jsonic = JsonicParse & // A function that parses.
  JsonicAPI & { [prop: string]: any } // A utility with API methods. // Extensible by plugin decoration.

function make(param_options?: Bag | string, parent?: Jsonic): Jsonic {
  let injectFullAPI = true
  if ('jsonic' === param_options) {
    injectFullAPI = false
  } else if ('json' === param_options) {
    return makeJSON(root)
  }

  param_options = 'string' === typeof param_options ? {} : param_options

  let internal: {
    parser: Parser
    config: Config
    plugins: Plugin[]
    sub: {
      lex?: LexSub[]
      rule?: RuleSub[]
    }
    mark: number
  } = {
    parser: null as unknown as Parser,
    config: null as unknown as Config,
    plugins: [],
    sub: {
      lex: undefined,
      rule: undefined,
    },
    mark: Math.random(),
  }

  // Merge options.
  let merged_options = deep(
    {},
    parent
      ? { ...parent.options }
      : false === (param_options as Bag)?.defaults$
        ? {}
        : defaults,
    param_options ? param_options : {}
  )

  // Create primary parsing function
  let jsonic: any = function Jsonic(
    src: any,
    meta?: any,
    parent_ctx?: any
  ): any {
    if (S.string === typeof src) {
      let internal = jsonic.internal()
      let parser = options.parser?.start
        ? parserwrap(options.parser)
        : internal.parser
      return parser.start(src, jsonic, meta, parent_ctx)
    }

    return src
  }

  // This lets you access options as direct properties,
  // and set them as a function call.
  let options: any = (change_options?: Bag) => {
    if (null != change_options && S.object === typeof change_options) {
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

    tokenSet: ((ref: string | Tin) =>
      findTokenSet(ref, internal.config)) as unknown as JsonicAPI['tokenSet'],

    fixed: ((ref: string | Tin) =>
      internal.config.fixed.ref[ref]) as unknown as JsonicAPI['fixed'],

    options: deep(options, merged_options),

    config: () => deep(internal.config),

    parse: jsonic,

    // TODO: how to handle null plugin?
    use: function use(plugin: Plugin, plugin_options?: Bag): Jsonic {
      // Plugin name keys in options.plugin are the lower-cased plugin function name.
      const plugin_name = plugin.name.toLowerCase()
      const full_plugin_options = deep(
        {},
        plugin.defaults || {},
        plugin_options || {}
      )
      jsonic.options({
        plugin: {
          [plugin_name]: full_plugin_options,
        },
      })
      let merged_plugin_options = jsonic.options.plugin[plugin_name]
      jsonic.internal().plugins.push(plugin)
      plugin.options = merged_plugin_options
      return plugin(jsonic, merged_plugin_options) || jsonic
    },

    rule: (name?: string, define?: RuleDefiner | null) => {
      return jsonic.internal().parser.rule(name, define) || jsonic
    },

    // lex: (matchmaker: MakeLexMatcher) => {
    //   let match = merged_options.lex.match
    //   match.unshift(matchmaker)
    //   jsonic.options({
    //     lex: { match },
    //   })
    // },

    make: (options?: Options) => {
      return make(options, jsonic)
    },

    empty: (options?: Options) =>
      make({
        defaults$: false,
        standard$: false,
        grammar$: false,
        ...(options || {}),
      }),

    id:
      'Jsonic/' +
      Date.now() +
      '/' +
      ('' + Math.random()).substring(2, 8).padEnd(6, '0') +
      (null == options.tag ? '' : '/' + options.tag),

    toString: () => {
      return api.id
    },

    sub: (spec: { lex?: LexSub; rule?: RuleSub }) => {
      if (spec.lex) {
        internal.sub.lex = internal.sub.lex || []
        internal.sub.lex.push(spec.lex)
      }
      if (spec.rule) {
        internal.sub.rule = internal.sub.rule || []
        internal.sub.rule.push(spec.rule)
      }
      return jsonic
    },

    util,
  }

  // Has to be done indirectly as we are in a fuction named `make`.
  defprop(api.make, S.name, { value: S.make })

  if (injectFullAPI) {
    // Add API methods to the core utility function.
    assign(jsonic, api)
  } else {
    assign(jsonic, {
      empty: api.empty,
      parse: api.parse,
      sub: api.sub,
      id: api.id,
      toString: api.toString,
    })
  }

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
    internal.parser = parent_internal.parser.clone(
      merged_options,
      internal.config
    )
  } else {
    let rootWithAPI = { ...jsonic, ...api }
    internal.config = configure(rootWithAPI, undefined, merged_options)
    internal.plugins = []
    internal.parser = makeParser(merged_options, internal.config)

    if (false !== merged_options.grammar$) {
      grammar(rootWithAPI)
    }
  }

  return jsonic
}

let root: any = undefined

// The global root Jsonic instance parsing rules cannot be modified.
// use Jsonic.make() to create a modifiable instance.
let Jsonic: Jsonic = (root = make('jsonic'))

// Provide deconstruction export names
root.Jsonic = root
root.JsonicError = JsonicError
root.makeLex = makeLex
root.makeParser = makeParser
root.makeToken = makeToken
root.makePoint = makePoint
root.makeRule = makeRule
root.makeRuleSpec = makeRuleSpec
root.makeFixedMatcher = makeFixedMatcher
root.makeSpaceMatcher = makeSpaceMatcher
root.makeLineMatcher = makeLineMatcher
root.makeStringMatcher = makeStringMatcher
root.makeCommentMatcher = makeCommentMatcher
root.makeNumberMatcher = makeNumberMatcher
root.makeTextMatcher = makeTextMatcher
root.OPEN = OPEN
root.CLOSE = CLOSE
root.BEFORE = BEFORE
root.AFTER = AFTER
root.EMPTY = EMPTY

root.util = util
root.make = make
root.S = S

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
  Bag,
  Tin,
  MakeLexMatcher,
  LexMatcher,
  RuleDefiner,
  RuleState,
  RuleSpecMap,
  AltSpec,
  AltMatch,
  AltCond,
  AltAction,
  AltModifier,
  AltError,
  StateAction,
  NormAltSpec,
}

const foo = 'FOO'

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
  makeParser,
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
  EMPTY,
  S,
  foo,
  root,
}

export default Jsonic
