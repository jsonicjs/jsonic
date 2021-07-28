/* Copyright (c) 2013-2021 Richard Rodger, MIT License */

/*  jsonic.ts
 *  Entry point and API.
 */


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
  KV,
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
} from './utility'


import { defaults } from './defaults'


import {
  Point,
  Token,
  Lex,
  MakeLexMatcher,
} from './lexer'


import {
  Parser,
  Rule,
  RuleDefiner,
  RuleSpec,
  RuleSpecMap,
  /*
  Alt,
  AltCond,
  AltHandler,
  AltAction,
  */
  NONE,
} from './parser'


// The full exported type.
type Jsonic =
  JsonicParse & // A function that parses.
  JsonicAPI & // A utility with API methods.
  { [prop: string]: any } // Extensible by plugin decoration.


// The main top-level utility function. 
// NOTE: Exported as `Jsonic`; this type is internal and *not* exported.
type JsonicParse = (src: any, meta?: any, parent_ctx?: any) => any


// The core API is exposed as methods on the main utility function.
type JsonicAPI = {

  // Explicit parse method.
  parse: JsonicParse

  // Get and set partial option trees.
  options: Options & ((change_options?: KV) => KV)

  // Create a new Jsonic instance to customize.
  make: (options?: Options) => Jsonic

  // Use a plugin
  use: (plugin: Plugin, plugin_options?: KV) => Jsonic

  // Get and set parser rules.
  rule: (name?: string, define?: RuleDefiner) => RuleSpec | RuleSpecMap

  // Provide new lex matcher.
  lex: (matchmaker: MakeLexMatcher) => void

  // Token get and set for plugins. Reference by either name or Tin.
  token:
  { [ref: string]: Tin } &
  { [ref: number]: string } &
  (<A extends string | Tin>(ref: A) => A extends string ? Tin : string)

  // Unique identifier string for each Jsonic instance.
  id: string

  // Provide identifier for string conversion.
  toString: () => string
}


// Define a plugin to extend the provided Jsonic instance.
type Plugin = (jsonic: Jsonic) => void | Jsonic


// Unique token identification number (aka "tin").
type Tin = number


// Parsing options. See defaults for commentary.
type Options = {
  tag: string
  fixed: {
    lex: boolean
    token: StrMap
  }
  tokenSet: {
    ignore: string[]
  }
  space: {
    lex: boolean
    chars: string
  }
  line: {
    lex: boolean
    chars: string
    rowChars: string
  },
  text: {
    lex: boolean
  }
  number: {
    lex: boolean
    hex: boolean
    oct: boolean
    bin: boolean
    sep?: string
  }
  comment: {
    lex: boolean
    marker: {
      line: boolean
      start: string
      end?: string
      lex: boolean
    }[]
  }
  string: {
    lex: boolean
    chars: string
    multiChars: string
    escapeChar: string
    escape: { [char: string]: string }
    allowUnknown: boolean
  }
  map: {
    extend: boolean
    merge?: (prev: any, curr: any) => any
  }
  value: {
    lex: boolean
    map: { [src: string]: { val: any } }
  }
  plugin: KV
  debug: {
    get_console: () => any
    maxlen: number
    print: {
      config: boolean
    }
  }
  error: { [code: string]: string }
  hint: any
  lex: {
    match: MakeLexMatcher[]
  }
  rule: {
    start: string
    finish: boolean
    maxmul: number
    include: string
    exclude: string
  },
  config: {
    modify: { [plugin_name: string]: (config: Config, options: Options) => void }
  },
  parser: {
    start?: (
      lexer: any, //Lexer,
      src: string,
      jsonic: any, //Jsonic,
      meta?: any,
      parent_ctx?: any
    ) => any
  }
  /*
    // TODO: move to plugin
  block: {
    lex: boolean
 
    // NOTE: block.marker definition uses value structure to define start and end.
    marker: {
      [start_marker: string]: // Start marker (eg. `'''`).
      string  // End marker (eg. `'''`).
    }
  }
  */
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
  regexp,
  mesc,
}


function make(param_options?: KV, parent?: Jsonic): Jsonic {
  let parser: Parser
  let config: Config
  let plugins: Plugin[]


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
        //return parser.start(internal.lexer, src, jsonic, meta, parent_ctx)
        return parser.start(src, jsonic, meta, parent_ctx)
      }

      return src
    }


  // This lets you access options as direct properties,
  // and set them as a funtion call.
  let options: any = (change_options?: KV) => {
    if (null != change_options && S.object === typeof (change_options)) {
      configure(config, deep(merged_options, change_options))
      for (let k in merged_options) {
        jsonic.options[k] = merged_options[k]
      }
      assign(jsonic.token, config.t)
    }
    return { ...jsonic.options }
  }


  // Define the API
  let api: JsonicAPI = {

    // TODO: not any, instead & { [token_name:string]: Tin }
    token: (function token<
      R extends string | Tin,
      T extends (R extends Tin ? string : Tin)
    >(ref: R): T {
      return tokenize(ref, config, jsonic)
    } as any),

    options: deep(options, merged_options),

    parse: jsonic,

    // TODO: how to handle null plugin?
    use: function use(plugin: Plugin, plugin_options?: KV): Jsonic {
      jsonic.options({ plugin: { [plugin.name]: plugin_options || {} } })
      jsonic.internal().plugins.push(plugin)
      return plugin(jsonic) || jsonic
    },

    rule: function rule(name?: string, define?: RuleDefiner):
      RuleSpecMap | RuleSpec {
      return jsonic.internal().parser.rule(name, define)
    },

    /*
    lex: (
      match: LexMatcher | undefined,
      modify: (mat: LexMatcher[]) => void) => {
      let lexer = jsonic.internal().lexer
      if (null != match) {
        lexer.mat.unshift(match)
      }
      if (null != modify) {
        modify(lexer.mat)
      }
      return lexer.mat
    },
    */

    lex: (matchmaker: MakeLexMatcher) => {
      let match = merged_options.lex.match
      match.unshift(matchmaker)
      jsonic.options({
        lex: { match }
      })
    },

    make: function(options?: Options) {
      return make(options, jsonic)
    },

    id: 'Jsonic/' +
      Date.now() + '/' +
      ('' + Math.random()).substring(2, 8).padEnd(6, '0') + '/' +
      options.tag,

    toString: function() {
      return this.id
    },
  }


  // Has to be done indirectly as we are in a fuction named `make`.
  defprop(api.make, S.name, { value: S.make })


  // Transfer parent properties (preserves plugin decorations, etc).
  if (parent) {
    for (let k in parent) {
      jsonic[k] = parent[k]
    }

    jsonic.parent = parent

    let parent_internal = parent.internal()
    config = deep({}, parent_internal.config)

    configure(config, merged_options)
    assign(jsonic.token, config.t)

    plugins = [...parent_internal.plugins]

    parser = parent_internal.parser.clone(merged_options, config)
  }
  else {
    config = configure(undefined, merged_options)

    plugins = []

    parser = new Parser(merged_options, config)
    parser.init()
  }


  // Add API methods to the core utility function.
  assign(jsonic, api)


  // As with options, provide direct access to tokens.
  assign(jsonic.token, config.t)


  // Hide internals where you can still find them.
  defprop(jsonic, 'internal', {
    value: function internal() {
      return {
        parser,
        config,
        plugins,
      }
    }
  })


  return jsonic
}


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
              cfg: ({ t: {} } as Config),
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
  // Meta,
  /*
  Alt,
  AltCond,
  AltHandler,
  AltAction,
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
  util,
  make,
}


export default Jsonic

// Build process uncomments this to enable more natural Node.js requires.
/* $lab:coverage:off$ */
//-NODE-MODULE-FIX;('undefined' != typeof(module) && (module.exports = exports.Jsonic));
/* $lab:coverage:on$ */
