/* Copyright (c) 2013-2021 Richard Rodger, MIT License */

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
// TODO: import of plugins convenience: import { Foo, Bar } from 'jsonic/plugin'


// # Conventions
//
// ## Token names
// * '#' prefix: parse token
// * '@' prefix: lex state




import {
  Config,
  Context,
  JsonicError,
  KV,
  MT,
  Meta,
  Options,
  S,
  Tin,
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
} from './intern'


import {
  Point,
  Token,
  Lexer,
  LexMatcher,
  makeFixedMatcher,
  makeSpaceMatcher,
  makeLineMatcher,
  makeStringMatcher,
  makeCommentMatcher,
  makeNumberMatcher,
  makeTextMatcher,
} from './lexer'


import {
  Parser,
  Rule,
  RuleDefiner,
  RuleSpec,
  RuleSpecMap,
  Alt,
  AltCond,
  AltHandler,
  AltAction,
  NONE,
} from './parser'


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

  // Add. modify, and list lex matchers.
  lex: (match: LexMatcher | undefined,
    modify: (mat: LexMatcher[]) => void) => LexMatcher[]

  // Token get and set for plugins. Reference by either name or Tin.
  token:
  { [ref: string]: Tin } &
  { [ref: number]: string } &
  (<A extends string | Tin, B extends string | Tin>(ref: A)
    => A extends string ? B : string)

  // Unique identifier string for each Jsonic instance.
  id: string

  // Provide identifier for string conversion.
  toString: () => string
}


// The full exported type.
type Jsonic =
  JsonicParse & // A function that parses.
  JsonicAPI & // A utility with API methods.
  { [prop: string]: any } // Extensible by plugin decoration.


type Plugin = (jsonic: Jsonic) => void | Jsonic


function make_default_options(): Options {

  let options: Options = {

    // Default tag - set your own! 
    tag: '-',

    // Fixed token lexing.
    fixed: {

      // Recognize fixed tokens in the Lexer.
      lex: true,

      // Token names.
      token: {
        '#OB': '{',
        '#CB': '}',
        '#OS': '[',
        '#CS': ']',
        '#CL': ':',
        '#CA': ',',
      }
    },

    // Token sets.
    tokenSet: {
      ignore: ['#SP', '#LN', '#CM']
    },


    // Recognize space characters in the lexer.
    space: {

      // Recognize space in the Lexer.
      lex: true,

      // Space characters.
      chars: ' \t',
    },


    // Line lexing.
    line: {

      // Recognize lines in the Lexer.
      lex: true,

      // Line characters.
      chars: '\r\n',

      // Increments row (aka line) counter.
      rowChars: '\n',
    },


    // Text formats.
    text: {

      // Recognize text (non-quoted strings) in the Lexer.
      lex: true,
    },


    // Control number formats.
    number: {

      // Recognize numbers in the Lexer.
      lex: true,

      // Recognize hex numbers (eg. 10 === 0x0a).
      hex: true,

      // Recognize octal numbers (eg. 10 === 0o12).
      oct: true,

      // Recognize ninary numbers (eg. 10 === 0b1010).
      bin: true,

      // All possible number chars. |+-|0|xob|0-9a-fA-F|.e|+-|0-9a-fA-F|
      // digital: '-1023456789._xoeEaAbBcCdDfF+',

      // Allow embedded separator. `null` to disable.
      sep: '_',
    },


    // Comment markers.
    // <mark-char>: true -> single line comments
    // <mark-start>: <mark-end> -> multiline comments
    comment: {

      // Recognize comments in the Lexer.
      lex: true,

      // TODO: plugin
      // Balance multiline comments.
      // balance: true,

      // Comment markers.
      marker: [
        { line: true, start: '#', lex: true },
        { line: true, start: '//', lex: true },
        { line: false, start: '/' + '*', end: '*' + '/', lex: true },
      ],
    },

    /* TODO: PLUGIN
        // Multiline blocks.
        block: {
    
          // Recognize blocks in the Lexer.
          lex: true,
    
          // Block markers
          marker: {
            '\'\'\'': '\'\'\''
          },
        },
    */

    // String formats.
    string: {

      // Recognize strings in the Lexer.
      lex: true,

      // Quote characters
      chars: '\'"`',

      // Multiline quote chars.
      multiChars: '`',

      // Escape character.
      escapeChar: '\\',

      // String escape chars.
      // Denoting char (follows escape char) => actual char.
      escape: {
        b: '\b',
        f: '\f',
        n: '\n',
        r: '\r',
        t: '\t',
      },

      // TODO: PLUGIN csv
      // CSV-style double quote escape.
      // doubleEscape: false,
    },


    // Object formats.
    map: {

      // Later duplicates extend earlier ones, rather than replacing them.
      extend: true,

      // Custom merge function for duplicates (optional).
      merge: undefined,
    },


    // Keyword values.
    value: {
      lex: true,
      src: {
        'null': null,
        'true': true,
        'false': false,
      }
    },


    // Plugin custom options, (namespace by plugin name).
    plugin: {},


    // Debug settings
    debug: {
      // Default console for logging.
      get_console: () => console,

      // Max length of parse value to print.
      maxlen: 99,

      // Print internal structures
      print: {

        // Print config built from options.
        config: false
      }
    },


    // Error messages.
    error: {
      unknown: 'unknown error: $code',
      unexpected: 'unexpected character(s): $src',
      invalid_unicode: 'invalid unicode escape: $src',
      invalid_ascii: 'invalid ascii escape: $src',
      unprintable: 'unprintable character: $src',
      unterminated_string: 'unterminated string: $src',
      unterminated_comment: 'unterminated comment: $src',
    },


    // Error hints: {error-code: hint-text}. 
    hint: make_hint,

    // Lexer 
    lex: {
      match: [
        makeFixedMatcher,
        makeSpaceMatcher,
        makeLineMatcher,
        makeStringMatcher,
        makeCommentMatcher,
        makeNumberMatcher,
        makeTextMatcher,
      ]
    },


    // Parser rule options.
    rule: {

      // Name of the starting rule.
      start: S.val,

      // Automatically close remaining structures at EOF.
      finish: true,

      // Multiplier to increase the maximum number of rule occurences.
      maxmul: 3,
    },


    // Configuration options.
    config: {

      // Configuration modifiers.
      modify: {}
    },


    // Provide a custom parser.
    parser: {
      start: undefined
    }
  }

  return options
}



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
  let lexer: Lexer
  let parser: Parser
  let config: Config
  let plugins: Plugin[]


  // Merge options.
  let merged_options = deep(
    {},
    parent ? { ...parent.options } : make_default_options(),
    param_options ? param_options : {},
  )


  // Create primary parsing function
  let jsonic: any =
    function Jsonic(src: any, meta?: any, parent_ctx?: any): any {
      if (S.string === typeof (src)) {
        let internal = jsonic.internal()
        let parser = options.parser.start ?
          parserwrap(options.parser) : internal.parser
        return parser.start(internal.lexer, src, jsonic, meta, parent_ctx)
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

    lexer = parent_internal.lexer.clone(config)
    parser = parent_internal.parser.clone(merged_options, config)
  }
  else {
    config = configure(undefined, merged_options)

    plugins = []

    lexer = new Lexer(config)
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
        lexer,
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
      lexer: Lexer,
      src: string,
      jsonic: Jsonic,
      meta?: any,
      parent_ctx?: any
    ) {
      try {
        return parser.start(lexer, src, jsonic, meta, parent_ctx)
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

          /*
          let token = ex.token || {
            tin: jsonic.token.UK,
            sI: loc,
            len: tsrc.length,
            rI: ex.lineNumber || row,
            cI: ex.columnNumber || col,
            val: undefined,
            src: tsrc,
          } as Token
          */

          let token = ex.token || new Token(
            '#UK',
            tokenize('#UK', jsonic.config),
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






// Generate hint text lookup.
// NOTE: generated and inserted by hint.js
function make_hint(d = (t: any, r = 'replace') => t[r](/[A-Z]/g, (m: any) => ' ' + m.toLowerCase())[r](/[~%][a-z]/g, (m: any) => ('~' == m[0] ? ' ' : '') + m[1].toUpperCase()), s = '~sinceTheErrorIsUnknown,ThisIsProbablyABugInsideJsonic\nitself,OrAPlugin.~pleaseConsiderPostingAGithubIssue -Thanks!|~theCharacter(s) $srcWereNotExpectedAtThisPointAsTheyDoNot\nmatchTheExpectedSyntax,EvenUnderTheRelaxedJsonicRules.~ifIt\nisNotObviouslyWrong,TheActualSyntaxErrorMayBeElsewhere.~try\ncommentingOutLargerAreasAroundThisPointUntilYouGetNoErrors,\nthenRemoveTheCommentsInSmallSectionsUntilYouFindThe\noffendingSyntax.~n%o%t%e:~alsoCheckIfAnyPluginsYouAreUsing\nexpectDifferentSyntaxInThisCase.|~theEscapeSequence $srcDoesNotEncodeAValidUnicodeCodePoint\nnumber.~youMayNeedToValidateYourStringDataManuallyUsingTest\ncodeToSeeHow~javaScriptWillInterpretIt.~alsoConsiderThatYour\ndataMayHaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeen\ngeneratedCorrectly.|~theEscapeSequence $srcDoesNotEncodeAValid~a%s%c%i%iCharacter.~you\nmayNeedToValidateYourStringDataManuallyUsingTestCodeToSee\nhow~javaScriptWillInterpretIt.~alsoConsiderThatYourDataMay\nhaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeenGenerated\ncorrectly.|~stringValuesCannotContainUnprintableCharacters (characterCodes\nbelow 32).~theCharacter $srcIsUnprintable.~youMayNeedToRemove\ntheseCharactersFromYourSourceData.~alsoCheckThatItHasNot\nbecomeCorrupted.|~thisStringHasNoEndQuote.|~thisCommentIsNeverClosed.'.split('|')): any { return 'unknown|unexpected|invalid_unicode|invalid_ascii|unprintable|unterminated_string|unterminated_comment'.split('|').reduce((a: any, n, i) => (a[n] = d(s[i]), a), {}) }


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
Jsonic.Lexer = Lexer
Jsonic.Parser = Parser
Jsonic.Rule = Rule
Jsonic.RuleSpec = RuleSpec
Jsonic.Alt = Alt
Jsonic.util = util
Jsonic.make = make


// Export most of the types for use by plugins.
export {
  Jsonic,
  Plugin,
  JsonicError,
  Tin,
  Lexer,
  // LexerNG,
  Parser,
  Rule,
  RuleSpec,
  RuleSpecMap,
  Token,
  Context,
  Meta,
  Alt,
  AltCond,
  AltHandler,
  AltAction,
  util,
  make,
}

export default Jsonic

// Build process uncomments this to enable more natural Node.js requires.
/* $lab:coverage:off$ */
//-NODE-MODULE-FIX;('undefined' != typeof(module) && (module.exports = exports.Jsonic));
/* $lab:coverage:on$ */
