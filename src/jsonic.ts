/* Copyright (c) 2013-2023 Richard Rodger, MIT License */

/*  jsonic.ts
 *  Entry point and API.
 */

import type {
  AltAction,
  AltCond,
  AltError,
  AltMatch,
  AltModifier,
  AltSpec,
  Bag,
  Config,
  Context,
  Counters,
  FuncRef,
  JsonicAPI,
  JsonicParse,
  Lex,
  LexCheck,
  LexMatcher,
  LexSub,
  MakeLexMatcher,
  NormAltSpec,
  Options,
  Parser,
  Plugin,
  Point,
  Rule,
  RuleDefiner,
  RuleSpec,
  RuleSpecMap,
  RuleState,
  RuleSub,
  StateAction,
  Tin,
  Token,
  GrammarSpec
} from './types'

import { OPEN, CLOSE, BEFORE, AFTER, EMPTY, SKIP } from './types'

import {
  S,
  assign,
  badlex,
  deep,
  defprop,
  makelog,
  mesc,
  regexp,
  tokenize,
  findTokenSet,
  srcfmt,
  clone,
  charset,
  configure,
  escre,
  parserwrap,
  str,
  clean,

  resolveFuncRefs,

  // Exported with jsonic.util
  omap,
  entries,
  values,
  keys,
} from './utility'

import {
  JsonicError,
  errdesc,
  errinject,
  errsite,
  errmsg,
  trimstk,
  strinject,
  prop,
} from './error'

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
  errsite,
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
  errmsg,
  strinject,

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
    param_options ? param_options : {},
  )

  // Create primary parsing function
  let jsonic: any = function Jsonic(
    src: any,
    meta?: any,
    parent_ctx?: any,
  ): any {
    if (S.string === typeof src) {
      let internal = jsonic.internal()
      let parser = optionsMethod.parser?.start
        ? parserwrap(optionsMethod.parser)
        : internal.parser
      return parser.start(src, jsonic, meta, parent_ctx)
    }

    return src
  }

  // This lets you access options as direct properties,
  // and set them as a function call.
  let optionsMethod: any = (change_options?: Bag) => {
    if (null != change_options && S.object === typeof change_options) {
      deep(merged_options, change_options)
      configure(jsonic, internal.config, merged_options)
      let parser: Parser = jsonic.internal().parser
      internal.parser = parser.clone(merged_options, internal.config, jsonic)
    }
    return { ...jsonic.options }
  }

  // Define the API
  let api: JsonicAPI = {
    token: ((ref: string | Tin) =>
      internal.config.fixed.token[ref] ??
      tokenize(ref, internal.config, jsonic)) as unknown as JsonicAPI['token'],

    tokenSet: ((ref: string | Tin) =>
      findTokenSet(ref, internal.config)) as unknown as JsonicAPI['tokenSet'],

    fixed: ((ref: string | Tin) =>
      internal.config.fixed.ref[ref]) as unknown as JsonicAPI['fixed'],

    options: deep(optionsMethod, merged_options),

    config: () => deep(internal.config),

    parse: jsonic,

    // TODO: how to handle null plugin?
    use: function use(plugin: Plugin, plugin_options?: Bag): Jsonic {
      if (S.function !== typeof plugin) {
        throw new Error(
          'Jsonic.use: the first argument must be a function ' +
          'defining a plugin. See https://jsonic.senecajs.org/plugin',
        )
      }

      // Plugin name keys in options.plugin are the lower-cased plugin function name.
      const plugin_name = plugin.name.toLowerCase()
      const full_plugin_options = deep(
        {},
        plugin.defaults || {},
        plugin_options || {},
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
      return (jsonic.internal().parser as Parser).rule(name, define) || jsonic
    },

    make: (options?: Options | string) => {
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
      (null == optionsMethod.tag ? '' : '/' + optionsMethod.tag),

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


    grammar: (gs: GrammarSpec | string) => {
      if ('string' === typeof gs) {
        gs = make()(gs) as GrammarSpec
      }

      if (gs.options) {
        const resolved = resolveFuncRefs(gs.options, gs.ref)
        ji.options(resolved)
      }

      if (gs.rule) {
        for (const rulename of Object.keys(gs.rule)) {
          const rulespec = gs.rule[rulename]
          ji.rule(rulename, (rs: RuleSpec) => {

            if (gs.ref) {
              rs.fnref(gs.ref)
            }

            if (rulespec.open) {
              const isarr = Array.isArray(rulespec.open)
              const alts = isarr ? rulespec.open : (rulespec.open as any).alts
              const inject = isarr ? {} : (rulespec.open as any).inject
              rs.open(alts, inject)
            }

            if (rulespec.close) {
              const isarr = Array.isArray(rulespec.close)
              const alts = isarr ? rulespec.close : (rulespec.close as any).alts
              const inject = isarr ? {} : (rulespec.close as any).inject
              rs.close(alts, inject)
            }

          })
        }
      }
    }


  }

  // Has to be done indirectly as we are in a fuction named `make`.
  defprop(api.make, S.name, { value: S.make })

  let ji = jsonic
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
    ji = assign(Object.create(jsonic), api)
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
      internal.config,
      ji,
    )
  }
  else {
    let rootWithAPI = { ...jsonic, ...api }
    internal.config = configure(rootWithAPI, undefined, merged_options)
    internal.plugins = []
    internal.parser = makeParser(merged_options, internal.config, ji)

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
root.SKIP = SKIP

root.util = util
root.make = make
root.S = S

// Export most of the types for use by plugins.
export type {
  AltAction,
  AltCond,
  AltError,
  AltMatch,
  AltModifier,
  AltSpec,
  Bag,
  Config,
  Context,
  Counters,
  FuncRef,
  Lex,
  LexCheck,
  LexMatcher,
  MakeLexMatcher,
  NormAltSpec,
  Options,
  Plugin,
  Point,
  Rule,
  RuleDefiner,
  RuleSpec,
  RuleSpecMap,
  RuleState,
  StateAction,
  Tin,
  Token,
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
  SKIP,
  S,
  root,
}

export default Jsonic

if ('undefined' !== typeof module) {
  module.exports = Jsonic
}
