/* Copyright (c) 2013-2021 Richard Rodger, MIT License */

/*  jsonic.ts
 *  Entry point and API.
 */


// TODO: Context provides current jsonic instance: { ..., jsonic: ()=>instance }
// TODO: docs: ref https://wiki.alopex.li/OnParsers
// TODO: docs: nice tree diagram of rules (generate?)
// TODO: rule.use should be rule.u for consistency
// TODO: Jsonic.make('json') - preset plain JSON options - see variant test just-json
// TODO: consistent use of clean on options to allow null to mean 'remove property'
// TODO: [,,,] syntax should match JS!
// TODO: rename tokens to be user friendly
// TODO: if token recognized, error needs to be about token, not characters
// TODO: row numbers need to start at 1 as editors start line numbers at 1, cols too - fix error msg
// TODO: test custom alt error: eg.  { e: (r: Rule) => r.close[0] } ??? bug: r.close empty!
// TODO: multipe merges, also with dynamic
// TODO: FIX: jsonic script direct invocation in package.json not working
// TODO: norm alt should be called as needed to handle new dynamic alts
// TODO: quotes are value enders - x:a"a" is an err! not 'a"a"'
// TODO: tag should appear in error
// TODO: remove console colors in browser?
// post release: 
// TODO: test use of constructed regexps - perf?
// TODO: complete rule tagging groups g:imp etc.
// TODO: plugin for path expr: a.b:1 -> {a:{b:1}}
// TODO: data file to diff exhaust changes
// TODO: cli - less ambiguous merging at top level
// TODO: internal errors - e.g. adding a null rulespec
// TODO: replace parse_alt loop with lookups
// TODO: extend lexer to handle multi-char tokens (e.g `->`)
// TODO: lex matcher should be able to explicitly disable rest of state logic
// TODO: option to control comma null insertion
// TODO: {,} should fail ({,,...} does).


// # Conventions
//
// ## Token names
// * '#' prefix: parse token





import {
  Config,
  Context,
  JsonicError,
  Relate,
  MT,
  // Meta,
  StrMap,
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
} from './utility'


import { defaults } from './defaults'


import {
  Point,
  Token,
  Lex,
  MakeLexMatcher,
} from './lexer'


import type {
  AltAction,
} from './parser'

import {
  Parser,
  Rule,
  RuleDefiner,
  RuleSpec,
  RuleSpecMap,
  NONE,
} from './parser'


// The full exported type.
type Jsonic =
  JsonicParse & // A function that parses.
  JsonicAPI & // A utility with API methods.
  { [prop: string]: any } // Extensible by plugin decoration.


// The main top-level utility function. 
type JsonicParse = (src: any, meta?: any, parent_ctx?: any) => any


// The core API is exposed as methods on the main utility function.
type JsonicAPI = {

  // Explicit parse method. 
  parse: JsonicParse

  // Get and set partial option trees.
  options: Options & ((change_options?: Relate) => Relate)

  // Create a new Jsonic instance to customize.
  make: (options?: Options) => Jsonic

  // Use a plugin
  use: (plugin: Plugin, plugin_options?: Relate) => Jsonic

  // Get and set parser rules.
  rule: (name?: string, define?: RuleDefiner) => RuleSpec | RuleSpecMap

  // Provide new lex matcher.
  lex: (matchmaker: MakeLexMatcher) => void

  // Token get and set for plugins. Reference by either name or Tin.
  token:
  { [ref: string]: Tin } &
  { [ref: number]: string } &
  (<A extends string | Tin>(ref: A) => A extends string ? Tin : string)

  // Fixed token src get and set for plugins. Reference by either src or Tin.
  fixed:
  { [ref: string]: Tin } &
  { [ref: number]: string } &
  (<A extends string | Tin>(ref: A) => A extends string ? Tin : string)

  // Unique identifier string for each Jsonic instance.
  id: string

  // Provide identifier for string conversion.
  toString: () => string

  util: Relate
}


// Define a plugin to extend the provided Jsonic instance.
type Plugin = ((jsonic: Jsonic, plugin_options?: any) => void | Jsonic) &
{ defaults?: Relate }


// Unique token identification number (aka "tin").
type Tin = number


// Parsing options. See defaults for commentary.
type Options = {
  tag?: string
  fixed?: {
    lex?: boolean
    token?: StrMap
  }
  tokenSet?: {
    ignore?: string[]
  }
  space?: {
    lex?: boolean
    chars?: string
  }
  line?: {
    lex?: boolean
    chars?: string
    rowChars?: string
  },
  text?: {
    lex?: boolean
  }
  number?: {
    lex?: boolean
    hex?: boolean
    oct?: boolean
    bin?: boolean
    sep?: string | null
  }
  comment?: {
    lex?: boolean
    marker?: {
      line?: boolean
      start?: string
      end?: string
      lex?: boolean
    }[]
  }
  string?: {
    lex?: boolean
    chars?: string
    multiChars?: string
    escapeChar?: string
    escape?: { [char: string]: string | null }
    allowUnknown?: boolean
  }
  map?: {
    extend?: boolean
    merge?: (prev: any, curr: any) => any
  }
  value?: {
    lex?: boolean
    map?: { [src: string]: { val: any } }
  }
  plugin?: Relate
  debug?: {
    get_console?: () => any
    maxlen?: number
    print?: {
      config?: boolean
    }
  }
  error?: { [code: string]: string }
  hint?: any
  lex?: {
    empty?: boolean
    match?: MakeLexMatcher[]
  }
  rule?: {
    start?: string
    finish?: boolean
    maxmul?: number
    include?: string
    exclude?: string
  },
  config?: {
    modify?: { [plugin_name: string]: (config: Config, options: Options) => void }
  },
  parser?: {
    start?: (
      lexer: any, //Lexer,
      src: string,
      jsonic: any, //Jsonic,
      meta?: any,
      parent_ctx?: any
    ) => any
  }
}




// TODO: remove - too much for an API!
let util = {
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
}


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
    parent ? { ...parent.options } : defaults,
    param_options ? param_options : {},
  )


  // Create primary parsing function
  let jsonic: any =
    function Jsonic(src: any, meta?: any, parent_ctx?: any): any {
      if (S.string === typeof (src)) {
        let internal = jsonic.internal()
        let parser = options.parser.start ?
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
      // for (let k in merged_options) {
      //   jsonic.options[k] = merged_options[k]
      // }
      // assign(jsonic.token, internal.config?.t)

      let parser = jsonic.internal().parser
      //if (parser) {
      internal.parser = parser.clone(merged_options, internal.config)
      //}
    }
    return { ...jsonic.options }
  }


  // Define the API
  let api: JsonicAPI = {

    token: ((ref: string | Tin) => tokenize(ref, internal.config, jsonic)) as unknown as JsonicAPI['token'],

    fixed: ((ref: string | Tin) => internal.config.fixed.ref[ref]) as unknown as JsonicAPI['fixed'],

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

    rule: (name?: string, define?: RuleDefiner) => {
      return jsonic.internal().parser.rule(name, define)
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

    id: 'Jsonic/' +
      Date.now() + '/' +
      ('' + Math.random()).substring(2, 8).padEnd(6, '0') + '/' +
      options.tag,

    toString: () => {
      return api.id
    },

    util,
  }


  // Has to be done indirectly as we are in a fuction named `make`.
  defprop(api.make, S.name, { value: S.make })


  // Add API methods to the core utility function.
  assign(jsonic, api)


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
    internal.parser.init()
  }




  // As with options, provide direct access to tokens.
  // assign(jsonic.token, internal.config.t)


  // As with options, provide direct access to fixed token src strings.
  // assign(jsonic.fixed, internal.config.fixed.ref)


  // Hide internals where you can still find them.
  defprop(jsonic, 'internal', { value: () => internal })


  return jsonic
}


// TODO: move to utility
function parserwrap(parser: any) {
  return {
    start: function(
      src: string,
      jsonic: Jsonic,
      meta?: any,
      parent_ctx?: any
    ) {
      try {
        return parser.start(src, jsonic, meta, parent_ctx)
      } catch (ex) {
        if ('SyntaxError' === ex.name) {
          let loc = 0
          let row = 0
          let col = 0
          let tsrc = MT
          let errloc = ex.message.match(/^Unexpected token (.) .*position\s+(\d+)/i)
          if (errloc) {
            tsrc = errloc[1]
            loc = parseInt(errloc[2])
            row = src.substring(0, loc).replace(/[^\n]/g, MT).length
            let cI = loc - 1
            while (-1 < cI && '\n' !== src.charAt(cI)) cI--;
            col = Math.max(src.substring(cI, loc).length, 0)
          }

          let token = ex.token || new Token(
            '#UK',
            // tokenize('#UK', jsonic.config),
            tokenize('#UK', jsonic.internal().config),
            undefined,
            tsrc,
            new Point(tsrc.length, loc, ex.lineNumber || row, ex.columnNumber || col)
          )

          throw new JsonicError(
            ex.code || 'json',
            ex.details || {
              msg: ex.message
            },
            token,
            ({} as Rule),
            ex.ctx || {
              uI: -1,
              opts: jsonic.options,
              //cfg: ({ t: {} } as Config),
              cfg: jsonic.internal().config,
              token: token,
              meta,
              src: () => src,
              root: () => undefined,
              plgn: () => jsonic.internal().plugins,
              rule: NONE,
              xs: -1,
              v2: token,
              v1: token,
              t0: token,
              t1: token, // TODO: should be end token
              tC: -1,
              rs: [],
              next: () => token, // TODO: should be end token
              rsm: {},
              n: {},
              log: meta ? meta.log : undefined,
              F: srcfmt(jsonic.internal().config),
              use: {},
            } as Context,
          )
        }
        else {
          throw ex
        }
      }
    }
  }
}








let Jsonic: Jsonic = make()

// Keep global top level safe
let top: any = Jsonic
delete top.options
delete top.use
delete top.rule
delete top.lex
delete top.token
delete top.fixed


// Provide deconstruction export names
Jsonic.Jsonic = Jsonic
Jsonic.JsonicError = JsonicError
Jsonic.Parser = Parser
Jsonic.Rule = Rule
Jsonic.RuleSpec = RuleSpec
// Jsonic.Alt = Alt
Jsonic.util = util
Jsonic.make = make


// Export most of the types for use by plugins.
export type {
  Plugin,
  Tin,
  RuleSpecMap,
  Context,
  Options,
  AltAction,

  // Meta,
  /*
  Alt,
  AltCond,
  AltHandler,

  */
}

export {
  Jsonic,
  JsonicError,
  Lex,
  Parser,
  Rule,
  RuleSpec,
  Token,
  Point,
  util,
  make,
}


export default Jsonic

// Build process uncomments this to enable more natural Node.js requires.
/* $lab:coverage:off$ */
//-NODE-MODULE-FIX;('undefined' != typeof(module) && (module.exports = exports.Jsonic));
/* $lab:coverage:on$ */
