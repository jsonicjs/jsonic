/* Copyright (c) 2013-2021 Richard Rodger, MIT License */

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

  // Get and set custom lex matchers.
  lex: (state?: Tin, match?: LexMatcher) => LexMatcherListMap | LexMatcher[]

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


// General Key-Value map.
type KV = { [k: string]: any }


// Unique token identification number (aka "tin").
type Tin = number


// Parsing options. See defaults for commentary.
type Options = {
  tag: string
  line: {
    lex: boolean
    row: string
    sep: string
  },
  comment: {
    lex: boolean
    balance: boolean

    // NOTE: comment.marker uses value structure to define comment kind.
    marker: {
      [start_marker: string]: // Start marker (eg. `/*`).
      string | // End marker (eg. `*/`).
      boolean // No end marker (eg. `#`).
    }
  },
  space: {
    lex: boolean
  }
  number: {
    lex: boolean
    hex: boolean
    oct: boolean
    bin: boolean
    digital: string
    sep: string
  }
  block: {
    lex: boolean

    // NOTE: block.marker definition uses value structure to define start and end.
    marker: {
      [start_marker: string]: // Start marker (eg. `'''`).
      string  // End marker (eg. `'''`).
    }
  }
  string: {
    lex: boolean
    escape: { [char: string]: string }
    multiline: string
    escapedouble: boolean
  }
  text: {
    lex: boolean
  }
  map: {
    extend: boolean
    merge?: (prev: any, curr: any) => any
  }
  value: {
    lex: boolean,
    src: KV
  },
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

  // NOTE: Token definition uses value structure to indicate token kind.
  token: {
    [name: string]:  // Token name.
    { c: string } |  // Single char token (eg. OB=`{`).

    // Token set, comma-sep string (eg. '#SP,#LN').
    // NOTE: array not used as util.deep would merge, not override.
    { s: string } |

    string |         // Multi-char token (eg. SP=` \t`).
    true             // Non-char token (eg. ZZ).
  }

  rule: {
    start: string,
    finish: boolean,
    maxmul: number,
  },
  config: {
    modify: { [plugin_name: string]: (config: Config, options: Options) => void }
  },
  parser: {
    start?: (
      lexer: Lexer,
      src: string,
      jsonic: Jsonic,
      meta?: any,
      parent_ctx?: any
    ) => any
  }
}


type Plugin = (jsonic: Jsonic) => void | Jsonic
type Meta = KV


// Tokens from the lexer.
type Token = {
  tin: any,  // Token kind.
  loc: number,   // Location of token index in source text.
  len: number,   // Length of Token source text.
  row: number,   // Row location of token in source text.
  col: number,   // Column location of token in source text.
  val: any,      // Value of Token if literal (eg. number).
  src: any,      // Source text of Token.
  why?: string,  // Error code.
  use?: any,     // Custom meta data from plugins goes here.
}


// Current parsing context.
type Context = {
  uI: number           // Rule index.
  opts: Options        // Jsonic instance options.
  cnfg: Config         // Jsonic instance config.
  meta: Meta           // Parse meta parameters.
  src: () => string,   // source text to parse.
  root: () => any,     // Root node.
  plgn: () => Plugin[] // Jsonic instance plugins.
  rule: Rule           // Current rule instance.
  xs: Tin              // Lex state tin.
  v2: Token            // Previous previous token.
  v1: Token            // Previous token.
  t0: Token            // Current token.
  t1: Token            // Next token. 
  tC: number           // Token count.
  rs: Rule[]           // Rule stack.
  rsm: { [name: string]: RuleSpec } // RuleSpec lookup map (by rule name).
  next: () => Token    // Move to next token.
  log?: (...rest: any) => undefined // Log parse/lex step (if defined).
  F: (s: any) => string // Format arbitrary data as length-limited string.
  use: KV               // Custom meta data (for use by plugins)
}


// The lexing function returns the next token.
type Lex = ((rule: Rule) => Token) & { src: string }

// Map character to Token index.
type TinMap = { [char: string]: Tin }

// Map character to code value.
type CharCodeMap = { [char: string]: number }


// Internal configuration derived from options.
// See build_config.
type Config = {
  tI: number // Token identifier index.
  t: any // Token index map.
  m: { [token_name: string]: TinMap }         // Mutually exclusive character sets.
  cs: { [charset_name: string]: CharCodeMap } // Character set.
  sm: { [char: string]: Tin }                 // Single character token index.
  ts: { [tokenset_name: string]: Tin[] }      // Named token sets.
  vs: { [start_char: string]: boolean }       // Literal value start characters.
  vm: KV,                                     // Map value source to actual value.
  esc: { [name: string]: string }             // String escape characters.
  cm: { [start_marker: string]: string | boolean } // Comment start markers.
  cmk: string[]                               // Comment start markers.
  cmx: number                                 // Comment start markers max length.
  bmk: string[]                               // Block start markers.
  bmx: number                                 // Block start markers max length.
  sc: string                                  // Token start characters.
  d: KV,                                      // Debug options.
  re: { [name: string]: RegExp | null }       // RegExp map.
}

const MT = '' // Empty ("MT"!) string.
const keys = Object.keys
const entries = Object.entries
const assign = Object.assign
const defprop = Object.defineProperty


// A bit pedantic, but let's be strict about strings.
// Also improves minification a little.
const S = {
  object: 'object',
  string: 'string',
  function: 'function',
  unexpected: 'unexpected',
  map: 'map',
  list: 'list',
  elem: 'elem',
  pair: 'pair',
  val: 'val',
  node: 'node',
  no_re_flags: MT,
  unprintable: 'unprintable',
  invalid_ascii: 'invalid_ascii',
  invalid_unicode: 'invalid_unicode',
  invalid_lex_state: 'invalid_lex_state',
  unterminated: 'unterminated',
  lex: 'lex',
  parse: 'parse',
  block_indent_: 'block_indent_',
  error: 'error',
  none: 'none',
  END_OF_SOURCE: 'END_OF_SOURCE',
  imp_map: 'imp,map',
  imp_list: 'imp,list',
  imp_null: 'imp,null',
  end: 'end',
  open: 'open',
  close: 'close',
  rule: 'rule',
  stack: 'stack',
  nUll: 'null',
  name: 'name',
  make: 'make',
}


function make_default_options(): Options {

  let options: Options = {

    // Default tag - set your own! 
    tag: '-',

    // Line lexing.
    line: {

      // Recognize lines in the Lexer.
      lex: true,

      // Increments row (aka line) counter.
      row: '\n',

      // Line separator regexp (as string)
      sep: '\r*\n',
    },


    // Comment markers.
    // <mark-char>: true -> single line comments
    // <mark-start>: <mark-end> -> multiline comments
    comment: {

      // Recognize comments in the Lexer.
      lex: true,

      // Balance multiline comments.
      balance: true,

      // Comment markers.
      marker: {
        '#': true,
        '//': true,
        '/*': '*/',
      },
    },


    // Recognize space characters in the lexer.
    space: {

      // Recognize space in the Lexer.
      lex: true
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
      digital: '-1023456789._xoeEaAbBcCdDfF+',

      // Allow embedded separator. `null` to disable.
      sep: '_',
    },


    // Multiline blocks.
    block: {

      // Recognize blocks in the Lexer.
      lex: true,

      // Block markers
      marker: {
        '\'\'\'': '\'\'\''
      },
    },


    // String formats.
    string: {

      // Recognize strings in the Lexer.
      lex: true,

      // String escape chars.
      // Denoting char (follows escape char) => actual char.
      escape: {
        b: '\b',
        f: '\f',
        n: '\n',
        r: '\r',
        t: '\t',
      },

      // Multiline quote chars.
      multiline: '`',

      // CSV-style double quote escape.
      escapedouble: false,
    },


    // Text formats.
    text: {

      // Recognize text (non-quoted strings) in the Lexer.
      lex: true,
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
      unterminated: 'unterminated string: $src'
    },


    // Error hints: {error-code: hint-text}. 
    hint: make_hint,


    // Token definitions:
    // { c: 'X' }: single character
    // 'XY': multiple characters
    // true: non-character tokens
    // '#X,#Y': token set
    token: {
      // Single char tokens.
      '#OB': { c: '{' }, // OPEN BRACE
      '#CB': { c: '}' }, // CLOSE BRACE
      '#OS': { c: '[' }, // OPEN SQUARE
      '#CS': { c: ']' }, // CLOSE SQUARE
      '#CL': { c: ':' }, // COLON
      '#CA': { c: ',' }, // COMMA

      // Multi-char tokens (start chars).
      '#SP': ' \t',          // SPACE - NOTE: first char is used for indents
      '#LN': '\n\r',         // LINE
      '#NR': '-0123456789+', // NUMBER
      '#ST': '"\'`',         // STRING

      // General char tokens.
      '#TX': true, // TEXT
      '#VL': true, // VALUE
      '#CM': true, // COMMENT

      // Non-char tokens.
      '#BD': true, // BAD
      '#ZZ': true, // END
      '#UK': true, // UNKNOWN
      '#AA': true, // ANY

      // Token sets
      // NOTE: comma-sep strings to avoid deep array override logic
      '#IGNORE': { s: '#SP,#LN,#CM' },
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


// Jsonic errors with nice formatting.
class JsonicError extends SyntaxError {
  constructor(
    code: string,
    details: KV,
    token: Token,
    rule: Rule,
    ctx: Context,
  ) {
    details = deep({}, details)
    let desc = errdesc(code, details, token, rule, ctx)
    super(desc.message)
    assign(this, desc)
    trimstk(this)
  }

  toJSON() {
    return {
      ...this,
      __error: true,
      name: this.name,
      message: this.message,
      stack: this.stack,
    }
  }

}


// WIP: restructure lexing to use matchers consistently
/*
abstract class MatcherNG {
  token: any = undefined
}

class TokenMatcherNG extends MatcherNG {
  token: { [src: string]: { tin: Tin, val?: any } } = {}
  constructor(token: any) {
    super()
    this.token = token
  }

}


class LexerNG {
  token_src: string[] = []
  token_re: RegExp = new RegExp('')
  token_tm: { [src: string]: { tin: Tin, val?: any } } = {}

  add(m: MatcherNG) {
    if (m.token) {
      // TODO: escapes, unique check
      this.token_src.push(...Object.keys(m.token))
      this.token_re = new RegExp('^(' + this.token_src.join('|') + ')')
      Object.assign(this.token_tm, m.token)
    }
  }

  start(
    ctx: Context
  ): Lex {

    const config = ctx.cnfg

    const tpin = (name: string): Tin => tokenize(name, config)

    let ZZ = tpin('#ZZ')


    let token: Token = {
      tin: ZZ,
      loc: 0,
      row: 0,
      col: 0,
      len: 0,
      val: undefined,
      src: undefined,
    }


    // Main indexes.
    let sI = 0 // Source text index.
    let rI = 0 // Source row index.
    let cI = 0 // Source column index.


    let src = ctx.src()

    let token_re = this.token_re
    let token_tm = this.token_tm

    // Lex next Token.
    let lex: Lex = (function lex(rule: Rule): Token {
      token.len = 0
      token.val = undefined
      token.src = undefined
      token.row = rI
      token.use = undefined

      let srcfwd = src.substring(sI)
      let tsrc

      if (tsrc = srcfwd.match(token_re)) {
        let tm = token_tm[tsrc[0]]
        token.tin = tm.tin
        token.val = tm.val

        return token
      }


      return token

    } as Lex)

    lex.src = src

    return lex
  }
}
*/


type LexMatcherState = {
  sI: number,
  rI: number,
  cI: number,
  src: string,
  token: Token,
  ctx: Context,
  rule: Rule,
  bad: any,
}

type LexMatcher = (lms: LexMatcherState) => LexMatcherResult
type LexMatcherListMap = { [state: number]: LexMatcher[] }

type LexMatcherResult = undefined | {
  sI: number,
  rI: number
  cI: number,
  state?: number,
  state_param?: any,
}

class Lexer {
  end: Token
  match: LexMatcherListMap = {}

  constructor(config: Config) {

    // The token indexer is also used to generate lex state indexes.
    // Lex state names have the prefix `@L`
    tokenize('@LTP', config) // TOP
    tokenize('@LTX', config) // TEXT
    tokenize('@LCS', config) // CONSUME
    tokenize('@LML', config) // MULTILINE

    // End token instance (returned once end-of-source is reached).
    this.end = {
      tin: tokenize('#ZZ', config),
      loc: 0,
      len: 0,
      row: 0,
      col: 0,
      val: undefined,
      src: undefined,
    }
  }


  // Create the lexing function, which will then return the next token on each call.
  // NOTE: lexing is context-free with n-token lookahead (n=2). There is no
  // deterministic relation between the current rule and the current lex.
  start(
    ctx: Context
  ): Lex {

    // Convenience vars
    const options = ctx.opts
    const config = ctx.cnfg

    let tpin = (name: string): Tin => tokenize(name, config)
    let tn = (pin: Tin): string => tokenize(pin, config)
    let F = ctx.F

    let LTP = tpin('@LTP')
    let LTX = tpin('@LTX')
    let LCS = tpin('@LCS')
    let LML = tpin('@LML')

    let ZZ = tpin('#ZZ')
    let SP = tpin('#SP')
    let CM = tpin('#CM')
    let NR = tpin('#NR')
    let ST = tpin('#ST')
    let TX = tpin('#TX')
    let VL = tpin('#VL')
    let LN = tpin('#LN')


    // NOTE: always returns this object instance!
    // Yes, this is deliberate. The parser clones tokens as needed.
    let token: Token = {
      tin: ZZ,
      loc: 0,
      row: 0,
      col: 0,
      len: 0,
      val: undefined,
      src: undefined,
    }


    // Main indexes.
    let sI = 0 // Source text index.
    let rI = 0 // Source row index.
    let cI = 0 // Source column index.


    // Lex state.
    let state = LTP // Starting state.
    let state_param: any = null // Parameters for the new state.


    // This is not a streaming lexer, sorry.
    let src = ctx.src()
    let srclen = src.length


    // Shortcut logging function for the lexer.
    // If undefined, don't log.
    // TS2722 impedes this definition unless Context is
    // refined to (Context & { log: any })
    let lexlog: ((token: Token, ...rest: any) => undefined) | undefined =
      (null != ctx.log) ?
        ((...rest: any) => (ctx as (Context & { log: any }))
          .log(
            S.lex,         // Log entry prefix.
            tn(token.tin), // Name of token from tin (token identification numer).
            F(token.src),  // Format token src for log.
            sI,            // Current source index.
            rI + ':' + cI, // Row and column.
            tn(state),     // Name of lex state.
            { ...token },  // Copy of the token.
            ...rest)       // Context-specific additional entries.
        ) : undefined


    // Convenience function to return a bad token.
    let bad = (code: string, cpI: number, badsrc: string, use?: any) => {
      return this.bad(ctx, lexlog, code, token, sI, cpI, rI, cI, badsrc, badsrc, use)
    }


    // Check for custom matchers on current lex state, and call the first
    // (if any) that returns a match.
    // NOTE: deliberately grabs local state (token,sI,rI,cI,...)
    let matchers = (rule: Rule) => {
      let matchers = this.match[state]
      if (null != matchers) {
        // token.loc = sI // TODO: move to top of while for all rules?

        for (let matcher of matchers) {
          let match = matcher({ sI, rI, cI, src, token, ctx, rule, bad })

          // Adjust lex location if there was a match.
          if (match) {
            sI = match.sI ? match.sI : sI
            rI = match.rI ? match.rI : rI
            cI = match.cI ? match.cI : cI
            state = null == match.state ? state : match.state
            state_param = null == match.state_param ? state_param : match.state_param

            lexlog && lexlog(token, matcher)
            return token
          }
        }
      }
    }


    // Lex next Token.
    let lex: Lex = (function lex(rule: Rule): Token {
      token.len = 0
      token.val = undefined
      token.src = undefined
      token.row = rI
      token.use = undefined

      let enders: TinMap = {}

      let pI = 0 // Current lex position (only update sI at end of rule).
      let s: string[] = [] // Parsed string chars and substrings.

      next_char:
      while (sI < srclen) {
        let c0 = src[sI]

        token.loc = sI
        token.col = cI

        ctx.xs = state

        if (LTP === state) {

          if (matchers(rule)) {
            return token
          }


          // FIXED-REGEXP
          // Space chars.
          //if (options.space.lex && config.s.SP[c0]) {
          if (options.space.lex && config.m.SP[c0]) {
            token.tin = SP
            cI++
            pI = sI + 1

            while (config.m.SP[src[pI]]) cI++, pI++;

            token.len = pI - sI
            token.val = src.substring(sI, pI)
            token.src = token.val

            sI = pI

            lexlog && lexlog(token)
            return token
          }


          // FIXED-REGEXP
          // CHAR-COUNTER
          // Newline chars.
          //if (options.line.lex && config.s.LN[c0]) {
          if (options.line.lex && config.m.LN[c0]) {
            token.tin = LN
            pI = sI
            cI = 0

            while (config.m.LN[src[pI]]) {
              // Count rows.
              rI += (options.line.row === src[pI] ? 1 : 0)
              pI++
            }

            token.len = pI - sI
            token.val = src.substring(sI, pI)
            token.src = token.val

            sI = pI

            lexlog && lexlog(token)
            return token
          }

          // FIXED-REGEXP
          // MATCHER-FUNC
          // ABANDON
          // Number chars.
          if (options.number.lex && config.m.NR[c0]) {
            let num_match = src.substring(sI).match((config.re.nm as RegExp))

            if (null != num_match) {
              let numstr = num_match[0]
              pI = sI + numstr.length

              // Numbers must end with a value ender char, otherwise
              // it must just be text with prefixed digits: '1a' -> "1a"
              if (null == src[pI] || config.cs.vend[src[pI]]) {
                let numval =
                  +(config.re.ns ? numstr.replace(config.re.ns, '') : numstr)

                if (!isNaN(numval)) {
                  token.tin = NR
                  token.src = numstr
                  token.val = numval
                  token.len = numstr.length
                  sI += token.len
                  cI += token.len

                  lexlog && lexlog(token)
                  return token
                }
              }
            }
          }


          // FIXED-REGEXP
          // Single char tokens.
          if (null != config.sm[c0]) {
            token.tin = config.sm[c0]
            token.len = 1
            token.src = c0
            sI++
            cI++

            lexlog && lexlog(token)
            return token
          }

          // FIXED-REGEXP
          // CHANGE-STATE
          // LEX-STATE?
          // TWO MATCHERS?
          // Block chars.
          if (options.block.lex && config.cs.bs[c0]) {
            let marker = src.substring(sI, sI + config.bmx)

            for (let bm of config.bmk) {
              if (marker.startsWith(bm)) {
                token.tin = ST

                state = LML
                state_param = [bm, options.block.marker[bm], null, true]
                continue next_char
              }
            }
          }


          // FIXED-REGEXP
          // MATCHER-FUNC
          // LEX-STATE?
          // String chars.
          //if (options.string.lex && config.s.ST[c0]) {
          if (options.string.lex && config.m.ST[c0]) {
            token.tin = ST
            cI++

            let multiline = config.cs.mln[c0]

            s = []
            let cs = MT

            for (pI = sI + 1; pI < srclen; pI++) {
              cI++

              cs = src[pI]

              // Quote char.
              if (c0 === cs) {
                if (options.string.escapedouble && c0 === src[pI + 1]) {
                  s.push(src[pI])
                  pI++
                }
                else {
                  pI++
                  break // String finished.
                }
              }

              // Escape char. 
              else if ('\\' === cs) {
                pI++
                cI++

                let es = config.esc[src[pI]]
                if (null != es) {
                  s.push(es)
                }

                // ASCII escape \x**
                else if ('x' === src[pI]) {
                  pI++
                  let cc = parseInt(src.substring(pI, pI + 2), 16)

                  if (isNaN(cc)) {
                    sI = pI - 2
                    cI -= 2
                    return bad(S.invalid_ascii, pI + 2, src.substring(pI - 2, pI + 2))
                  }

                  let us = String.fromCharCode(cc)

                  s.push(us)
                  pI += 1 // Loop increments pI.
                  cI += 2
                }

                // Unicode escape \u**** and \u{*****}.
                else if ('u' === src[pI]) {
                  pI++
                  let ux = '{' === src[pI] ? (pI++, 1) : 0
                  let ulen = ux ? 6 : 4

                  let cc = parseInt(src.substring(pI, pI + ulen), 16)

                  if (isNaN(cc)) {
                    sI = pI - 2 - ux
                    cI -= 2
                    return bad(S.invalid_unicode, pI + ulen + 1,
                      src.substring(pI - 2 - ux, pI + ulen + ux))
                  }

                  let us = String.fromCodePoint(cc)

                  s.push(us)
                  pI += (ulen - 1) + ux // Loop increments pI.
                  cI += ulen + ux
                }
                else {
                  s.push(src[pI])
                }
              }

              // Body part of string.
              else {
                let bI = pI

                let qc = c0.charCodeAt(0)
                let esc = '\\'.charCodeAt(0)
                let cc = src.charCodeAt(pI)

                while (pI < srclen && 32 <= cc && qc !== cc && esc !== cc) {
                  cc = src.charCodeAt(++pI)
                  cI++
                }
                cI--

                cs = src[pI]

                if (cc < 32) {
                  if (multiline && config.m.LN[cs]) {
                    //if (multiline && config.s.LN[cs]) {
                    if (cs === options.line.row) {
                      rI++
                      cI = 0
                    }

                    s.push(src.substring(bI, pI + 1))
                  }
                  else {
                    return bad(S.unprintable, pI,
                      'char-code=' + src[pI].charCodeAt(0))
                  }
                }
                else {
                  s.push(src.substring(bI, pI))

                  // Handle qc, esc, END-OF-SOURCE at top of loop
                  pI--
                }
              }
            }

            if (c0 !== cs) {
              return bad(S.unterminated, pI, s.join(MT))
            }

            token.val = s.join(MT)
            token.src = src.substring(sI, pI)

            token.len = pI - sI
            sI = pI

            lexlog && lexlog(token)
            return token
          }


          // FIXED-REGEXP
          // THEN SAME AS BML
          // Comment chars.
          if (options.comment.lex && config.cs.cs[c0]) {

            // Check for comment markers as single comment char could be
            // a comment marker prefix (eg. # and ###, / and //, /*).
            let marker = src.substring(sI, sI + config.cmx)

            for (let cm of config.cmk) {
              if (marker.startsWith(cm)) {

                // Multi-line comment.
                if (true !== config.cm[cm]) {
                  token.tin = CM
                  //token.loc = sI
                  //token.col = cI
                  token.val = MT // intialize for LCS.

                  state = LML
                  state_param = [cm, config.cm[cm], options.comment.balance]
                  continue next_char
                }

                break;
              }
            }

            // It's a single line comment.
            token.tin = CM
            token.val = MT // intialize for LCS.

            state = LCS
            enders = config.m.LN
            continue next_char
          }

          // FIXED-REGEXP
          // Literal values.
          if (options.value.lex && config.vs[c0]) {
            pI = sI

            do {
              pI++
            } while (null != src[pI] && !config.cs.vend[src[pI]])

            let txt = src.substring(sI, pI)

            // A keyword literal value? (eg. true, false, null)
            let val = config.vm[txt]
            val = S.function === typeof (val) ?
              val({ sI, rI, cI, src, token, ctx, rule, bad }) : val

            if (undefined !== val) {
              token.tin = VL
              token.val = val
              token.src = txt
              token.len = pI - sI

              cI += token.len
              sI = pI

              lexlog && lexlog(token)
              return token
            }
          }


          // Text values.
          // No explicit token recognized. That means a text value
          // (everything up to a value_ender char (eg. newline)) NOTE:
          // default section. Cases above bail to here if lookaheads
          // fail to match (eg. NR).

          if (options.text.lex) {
            state = LTX
            continue next_char
          }
        }
        else if (LTX === state) {
          if (matchers(rule)) {
            return token
          }

          pI = sI

          // FIXED-REGEXP
          // UNTIL-MATCH
          let m = src.substring(sI).match((config.re.te as RegExp))
          if (m) {
            let txlen = m[0].length
            pI += txlen
            cI += txlen
          }

          token.len = pI - sI
          token.tin = TX
          token.val = src.substring(sI, pI)
          token.src = token.val

          sI = pI
          state = LTP

          lexlog && lexlog(token)
          return token
        }


        // Lexer State: CONSUME => all chars up to first ender
        else if (LCS === state) {
          if (matchers(rule)) {
            return token
          }

          pI = sI

          // FIXED-REGEXP
          // UNTIL-MATCH
          while (pI < srclen && !enders[src[pI]]) pI++, cI++;

          token.val += src.substring(sI, pI)
          token.src = token.val
          token.len = token.val.length

          sI = pI

          state = LTP

          lexlog && lexlog(token)
          return token
        }


        // Lexer State: MULTILINE => all chars up to last close marker, or end
        else if (LML === state) {
          if (matchers(rule)) {
            return token
          }

          // FIXED-REGEXP
          // UNTIL-MATCH
          // STATE DEPTH?

          pI = sI

          // Balance open and close markers (eg. if options.balance.comment=true).
          let depth = 1
          let open = state_param[0]
          let close = state_param[1]
          let balance = state_param[2]
          let has_indent = !!state_param[3]
          let indent_str = MT
          let indent_len = 0
          let openlen = open.length
          let closelen = close.length

          if (has_indent) {
            let uI = sI - 1
            while (-1 < uI && config.m.SP[src[uI]]) uI--;

            indent_len = sI - uI - 1
            if (0 < indent_len) {
              indent_str = keys(config.m.SP)[0].repeat(indent_len)
            }
          }

          // Assume starts with open string
          pI += open.length

          while (pI < srclen && 0 < depth) {

            // Close first so that open === close case works
            if (close[0] === src[pI] &&
              close === src.substring(pI, pI + closelen)) {
              pI += closelen
              cI += closelen
              depth--
            }
            else if (balance && open[0] === src[pI] &&
              open === src.substring(pI, pI + openlen)) {
              pI += openlen
              cI += closelen
              depth++
            }
            else {
              // Count rows.
              if (options.line.row === src[pI]) {
                rI++
                cI = 0
              }
              else {
                cI++
              }
              pI++
            }
          }

          token.val = src.substring(sI, pI)
          token.src = token.val
          token.len = token.val.length

          // Assume indent means block
          if (has_indent) {
            token.val =
              token.val.substring(openlen, token.val.length - closelen)

            // Remove spurious space at start
            if (null == config.re.block_prefix) {
              config.re.block_prefix = regexp(
                S.no_re_flags,
                '^[',
                // TODO: need config val here?
                mesc((options.token['#SP'] as string)),
                ']*(',
                options.line.sep,
                ')',
              )
            }
            token.val =
              token.val.replace(config.re.block_prefix, MT)

            // Remove spurious space at end
            if (null == config.re.block_suffix) {
              config.re.block_suffix = regexp(
                S.no_re_flags,
                options.line.sep,
                '[',
                // TODO: need config val here?
                mesc(options.token['#SP'] as string),
                ']*$'
              )
            }
            token.val =
              token.val.replace(config.re.block_suffix, MT)

            // Remove indent
            let block_indent_RE = config.re[S.block_indent_ + indent_str] =
              config.re[S.block_indent_ + indent_str] || regexp(
                'g',
                '^(',
                mesc(indent_str),
                ')|((',
                options.line.sep,
                ')',
                mesc(indent_str),
                ')'
              )

            token.val =
              token.val.replace(block_indent_RE, '$3')
          }

          sI = pI

          state = LTP

          lexlog && lexlog(token)
          return token
        }
        else {
          return bad(S.invalid_lex_state, sI, src[sI], { state: state })
        }

        // Some token must match.
        return bad(S.unexpected, sI, src[sI])
      }


      // Keeps returning ZZ past end of input.
      token.tin = ZZ
      token.loc = srclen
      token.col = cI

      lexlog && lexlog(token)
      return token
    } as Lex)

    lex.src = src

    return lex
  }


  // Describe state when lexing goes wrong using the signal token "#BD" (bad token!).
  bad(
    ctx: Context,
    log: ((...rest: any) => undefined) | undefined,
    why: string,
    token: Token,
    sI: number,
    pI: number,
    rI: number,
    cI: number,
    val?: any,
    src?: any,
    use?: any
  ): Token {
    token.why = why
    token.tin = tokenize('#BD', ctx.cnfg)
    token.loc = sI
    token.row = rI
    token.col = cI
    token.len = pI - sI
    token.val = val
    token.src = src
    token.use = use

    log && log(tokenize(token.tin, ctx.cnfg), ctx.F(token.src),
      sI, rI + ':' + cI, { ...token },
      S.error, why)
    return token
  }


  // Register a custom lexing matcher to be attempted first for given lex state.
  // See _plugin_ folder for examples.
  lex(state?: Tin, matcher?: LexMatcher): LexMatcherListMap | LexMatcher[] {

    // If no state, return all the matchers.
    if (null == state) {
      return this.match
    }

    // Else return the list of matchers for the state.
    let matchers: LexMatcher[] = this.match[state]

    // Else add a new matcher and possible a new state.
    if (null != matcher) {
      if (null == matchers) {
        matchers = this.match[state] = []
      }

      matchers.push(matcher)
    }

    // Explicitly remove all matchers for state
    else if (null === matcher) {
      matchers = this.match[state]
      delete this.match[state]
    }

    return matchers
  }


  // Clone the Lexer, and in particular the registered matchers.
  clone(config: Config) {
    let lexer = new Lexer(config)
    deep(lexer.match, this.match)
    return lexer
  }
}


/* $lab:coverage:off$ */
enum RuleState {
  open,
  close,
}
/* $lab:coverage:on$ */


class Rule {
  id: number
  name: string
  spec: RuleSpec
  node: any
  state: RuleState
  child: Rule
  parent?: Rule
  prev?: Rule
  open: Token[]
  close: Token[]
  n: KV
  use: any
  bo: boolean // Call bo (before-open).
  ao: boolean // Call ao (after-open).
  bc: boolean // Call bc (before-close).
  ac: boolean // Call ac (after-close).
  why?: string

  constructor(spec: RuleSpec, ctx: Context, node?: any) {
    this.id = ctx.uI++
    this.name = spec.name
    this.spec = spec
    this.node = node
    this.state = RuleState.open
    this.child = NONE
    this.open = []
    this.close = []
    this.n = {}
    this.use = {}
    this.bo = false === spec.bo ? false : true
    this.ao = false === spec.ao ? false : true
    this.bc = false === spec.bc ? false : true
    this.ac = false === spec.ac ? false : true
  }

  process(ctx: Context): Rule {
    let rule = this.spec.process(this, ctx, this.state)
    return rule
  }
}


const NONE = ({ name: S.none, state: 0 } as Rule)

// Parse alternate specification provided by rule.
type AltSpec = {
  s?: any[]      // Token tin sequence to match (0,1,2 tins, or a subset of tins).
  p?: string
  r?: string
  b?: number
  c?: AltCond
  d?: number     // Rule stack depth to match.
  n?: any
  a?: AltAction
  h?: AltHandler
  u?: any
  g?: string[]
  e?: AltError
}

// NOTE: errors are specified using tokens to capture row and col.
type AltError = (rule: Rule, ctx: Context, alt: Alt) => Token | undefined

// Parse match alternate (built from current tokens and AltSpec).
class Alt {
  m: Token[] = []   // Matched tokens (not tins!).
  p: string = MT    // Push rule (by name).
  r: string = MT    // Replace rule (by name).
  b: number = 0     // Move token position backward.
  c?: AltCond       // Custom alt match condition.
  n?: any           // increment named counters.
  a?: AltAction     // Match actions.
  h?: AltHandler    // Custom match handler.
  u?: any           // Custom properties to add to Rule.use.
  g?: string[]      // Named groups for this alt (allows plugins to find alts).
  e?: Token         // Error on this token (giving row and col).
}

type AltCond = (rule: Rule, ctx: Context, alt: Alt) => boolean
type AltHandler = (rule: Rule, ctx: Context, alt: Alt, next: Rule) => Alt
type AltAction = (rule: Rule, ctx: Context, alt: Alt, next: Rule) => void

const PALT = new Alt() // As with lexing, only one alt object is created.
const EMPTY_ALT = new Alt()


type RuleDef = {
  open?: any[]
  close?: any[]
  bo?: (rule: Rule, ctx: Context) => any
  bc?: (rule: Rule, ctx: Context) => any
  ao?: (rule: Rule, ctx: Context, alt: Alt, next: Rule) => any
  ac?: (rule: Rule, ctx: Context, alt: Alt, next: Rule) => any
}


class RuleSpec {
  name: string = '-'
  def: any
  bo: boolean = true
  ao: boolean = true
  bc: boolean = true
  ac: boolean = true

  constructor(def: any) {
    this.def = def || {}

    function norm_alt(alt: Alt) {
      // Convert counter abbrev condition into an actual function.
      let counters = null != alt.c && (alt.c as any).n
      if (counters) {
        alt.c = (rule: Rule) => {
          let pass = true
          for (let cn in counters) {
            pass = pass && (null == rule.n[cn] || (rule.n[cn] <= counters[cn]))
          }
          return pass
        }
      }

      // Ensure groups are a string[]
      if (S.string === typeof (alt.g)) {
        alt.g = (alt as any).g.split(/\s*,\s*/)
      }
    }

    this.def.open = this.def.open || []
    this.def.close = this.def.close || []

    for (let alt of [...this.def.open, ...this.def.close]) {
      norm_alt(alt)
    }
  }


  process(rule: Rule, ctx: Context, state: RuleState) {
    let why = MT
    let F = ctx.F

    let is_open = state === RuleState.open
    let next = is_open ? rule : NONE

    let def: RuleDef = this.def

    // Match alternates for current state.
    let alts = (is_open ? def.open : def.close) as AltSpec[]

    // Handle "before" call.
    let before = is_open ?
      (rule.bo && def.bo) :
      (rule.bc && def.bc)

    let bout
    if (before) {
      bout = before.call(this, rule, ctx)
      if (bout) {
        if (bout.err) {
          throw new JsonicError(bout.err, {
            ...bout, state: is_open ? S.open : S.close
          }, ctx.t0, rule, ctx)
        }
        rule.node = bout.node || rule.node
      }
    }

    // Attempt to match one of the alts.
    let alt: Alt = (bout && bout.alt) ? { ...EMPTY_ALT, ...bout.alt } :
      0 < alts.length ? this.parse_alts(alts, rule, ctx) :
        EMPTY_ALT

    // Custom alt handler.
    if (alt.h) {
      alt = alt.h(rule, ctx, alt, next) || alt
      why += 'H'
    }

    // Expose match to handlers.
    if (is_open) {
      rule.open = alt.m
    }
    else {
      rule.close = alt.m
    }

    // Unconditional error.
    if (alt.e) {
      throw new JsonicError(
        S.unexpected,
        { ...alt.e.use, state: is_open ? S.open : S.close },
        alt.e, rule, ctx)
    }

    // Update counters.
    if (alt.n) {
      for (let cn in alt.n) {
        rule.n[cn] =
          // 0 reverts counter to 0.
          0 === alt.n[cn] ? 0 :
            // First seen, set to 0.
            (null == rule.n[cn] ? 0 :
              // Increment counter.
              rule.n[cn]) + alt.n[cn]

        // Disallow negative counters.
        rule.n[cn] = 0 < rule.n[cn] ? rule.n[cn] : 0
      }
    }

    // Set custom properties
    if (alt.u) {
      rule.use = Object.assign(rule.use, alt.u)
    }

    // Action call.
    if (alt.a) {
      why += 'A'
      alt.a.call(this, rule, ctx, alt, next)
    }

    // Push a new rule onto the stack...
    if (alt.p) {
      ctx.rs.push(rule)
      next = rule.child = new Rule(ctx.rsm[alt.p], ctx, rule.node)
      next.parent = rule
      next.n = { ...rule.n }
      why += 'U'
    }

    // ...or replace with a new rule.
    else if (alt.r) {
      next = new Rule(ctx.rsm[alt.r], ctx, rule.node)
      next.parent = rule.parent
      next.prev = rule
      next.n = { ...rule.n }
      why += 'R'
    }

    // Pop closed rule off stack.
    else {
      if (!is_open) {
        next = ctx.rs.pop() || NONE
      }
      why += 'Z'
    }

    // Handle "after" call.
    let after = is_open ?
      (rule.ao && def.ao) :
      (rule.ac && def.ac)

    if (after) {
      let aout = after.call(this, rule, ctx, alt, next)
      if (aout) {
        if (aout.err) {
          ctx.t0.why = why
          throw new JsonicError(aout.err, {
            ...aout, state: is_open ? S.open : S.close
          }, ctx.t0, rule, ctx)
        }
        next = aout.next || next
      }
    }

    next.why = why

    ctx.log && ctx.log(
      S.node,
      rule.name + '~' + rule.id,
      RuleState[rule.state],
      'w=' + why,
      'n:' + entries(rule.n).map(n => n[0] + '=' + n[1]).join(';'),
      'u:' + entries(rule.use).map(u => u[0] + '=' + u[1]).join(';'),
      F(rule.node)
    )


    // Lex next tokens (up to backtrack).
    let mI = 0
    let rewind = alt.m.length - (alt.b || 0)
    while (mI++ < rewind) {
      ctx.next()
    }

    // Must be last as state is for next process call.
    if (RuleState.open === rule.state) {
      rule.state = RuleState.close
    }

    return next
  }


  // First match wins.
  // NOTE: input AltSpecs are used to build the Alt output.
  parse_alts(alts: AltSpec[], rule: Rule, ctx: Context): Alt {
    let out = PALT
    out.m = []          // Match 0, 1, or 2 tokens in order .
    out.b = 0           // Backtrack n tokens.
    out.p = MT          // Push named rule onto stack. 
    out.r = MT          // Replace current rule with named rule.
    out.n = undefined   // Increment named counters.
    out.h = undefined   // Custom handler function.
    out.a = undefined   // Rule action.
    out.u = undefined   // Custom rule properties.
    out.e = undefined   // Error token.

    let alt
    let altI = 0
    let t = ctx.cnfg.t
    let cond

    // TODO: replace with lookup map
    let len = alts.length
    for (altI = 0; altI < len; altI++) {

      cond = false
      alt = alts[altI]

      // No tokens to match.
      if (null == alt.s || 0 === alt.s.length) {
        cond = true
      }

      // Match 1 or 2 tokens in sequence.
      else if (
        alt.s[0] === ctx.t0.tin ||
        alt.s[0] === t.AA ||
        (Array.isArray(alt.s[0]) && alt.s[0].includes(ctx.t0.tin))
      ) {
        if (1 === alt.s.length) {
          out.m = [ctx.t0]
          cond = true
        }
        else if (
          alt.s[1] === ctx.t1.tin ||
          alt.s[1] === t.AA ||
          (Array.isArray(alt.s[1]) && alt.s[1].includes(ctx.t1.tin))
        ) {
          out.m = [ctx.t0, ctx.t1]
          cond = true
        }
      }

      // Optional custom condition
      cond = cond && (alt.c ? alt.c(rule, ctx, out) : true)

      // Depth.
      cond = cond && (null == alt.d ? true : alt.d === ctx.rs.length)

      if (cond) {
        break
      }
      else {
        alt = null
      }
    }

    if (null == alt && t.ZZ !== ctx.t0.tin) {
      out.e = ctx.t0
    }

    if (null != alt) {
      out.e = alt.e && alt.e(rule, ctx, out) || undefined

      out.b = alt.b ? alt.b : out.b
      out.p = alt.p ? alt.p : out.p
      out.r = alt.r ? alt.r : out.r
      out.n = alt.n ? alt.n : out.n
      out.h = alt.h ? alt.h : out.h
      out.a = alt.a ? alt.a : out.a
      out.u = alt.u ? alt.u : out.u
    }

    ctx.log && ctx.log(
      S.parse,
      rule.name + '~' + rule.id,
      RuleState[rule.state],
      altI < alts.length ? 'alt=' + altI : 'no-alt',
      altI < alts.length &&
        (alt as any).s ?
        '[' + (alt as any).s.map((pin: Tin) => t[pin]).join(' ') + ']' : '[]',
      'tc=' + ctx.tC,
      'p=' + (out.p || MT),
      'r=' + (out.r || MT),
      'b=' + (out.b || MT),
      out.m.map((tkn: Token) => t[tkn.tin]).join(' '),
      ctx.F(out.m.map((tkn: Token) => tkn.src)),
      'c:' + ((alt && alt.c) ? cond : MT),
      'n:' + entries(rule.n).map(n => n[0] + '=' + n[1]).join(';'),
      'u:' + entries(rule.use).map(u => u[0] + '=' + u[1]).join(';'),
      out)

    return out
  }
}


type RuleSpecMap = { [name: string]: RuleSpec }
type RuleDefiner = (rs: RuleSpec, rsm: RuleSpecMap) => RuleSpec


class Parser {
  options: Options
  config: Config
  rsm: RuleSpecMap = {}

  constructor(options: Options, config: Config) {
    this.options = options
    this.config = config
  }

  init() {
    let t = this.config.t

    let OB = t.OB
    let CB = t.CB
    let OS = t.OS
    let CS = t.CS
    let CL = t.CL
    let CA = t.CA

    let TX = t.TX
    let NR = t.NR
    let ST = t.ST
    let VL = t.VL

    let AA = t.AA
    let ZZ = t.ZZ

    let VAL = [TX, NR, ST, VL]

    let finish: AltError = (_rule: Rule, ctx: Context) => {
      if (!this.options.rule.finish) {
        // TODO: needs own error code
        ctx.t0.src = S.END_OF_SOURCE
        return ctx.t0
      }
    }

    let rules: any = {
      val: {
        open: [
          { s: [OB], p: S.map, b: 1 },

          { s: [OS], p: S.list, b: 1 },

          { s: [VAL, CL], p: S.map, b: 2, n: { im: 1 } },

          { s: [VAL] },

          // Implicit ends `{a:}` -> {"a":null}, `[a:]` -> [{"a":null}]
          { s: [[CB, CS]], b: 1 },

          { s: [CA], d: 0, p: S.list, b: 1 },

          // Value is null.
          { s: [CA], b: 1, g: S.imp_list },


          /*
          // Implicit map. Reset implicit map depth counter.
          { s: [OB, CA], p: S.map, n: { im: 0 }, g: S.imp_map },

          // Standard JSON.
          { s: [OB], p: S.map, n: { im: 0 } },
          { s: [OS], p: S.list },

          // Implicit list at top level
          { s: [CA], d: 0, p: S.list, b: 1, g: S.imp_list },

          // Value is null.
          { s: [CA], b: 1, g: S.imp_list },


          // FIX: move to close of pair?
          // Implicit map - operates at any depth. Increment counter.
          // NOTE: `n.im` counts depth of implicit maps
          { s: [[TX, NR, ST, VL], CL], p: S.map, b: 2, n: { im: 1 }, g: S.imp_map },

          // Standard JSON (apart from TX).
          { s: [[TX, NR, ST, VL]] },

          // Implicit end `{a:}` -> {"a":null}
          {
            s: [CB],
            b: 1,
            g: S.imp_null
          },

          // Implicit end `[a:]` -> [{"a":null}]
          {
            s: [CS],
            b: 1,
            g: S.imp_null
          },
          */
        ],

        close: [
          {
            s: [CA], d: 0, r: S.elem,
            a: (rule: Rule) => rule.node = [rule.node],
            g: S.imp_list
          },

          // top level "a b"
          {
            c: (_rule: Rule, ctx: Context, _alt: Alt) => {
              return (TX === ctx.t0.tin ||
                NR === ctx.t0.tin ||
                ST === ctx.t0.tin ||
                VL === ctx.t0.tin
              ) && 0 === ctx.rs.length
            },
            r: S.elem,
            a: (rule: Rule) => rule.node = [rule.node],
            g: S.imp_list
          },


          { b: 1 },

          /* BAD
          { s: [[CA, CL, CB, CS, ZZ]], b: 1 },

          {
            r: S.elem, b: 1,
            a: (r: Rule) => {
              r.node = Array.isArray(r.node) ? r.node : [r.node]
            }
          },
          */


          /*
          // Implicit list works only at top level

          {
            s: [CA], d: 0, r: S.elem,
            a: (rule: Rule) => rule.node = [rule.node],
            g: S.imp_list
          },

          // TODO: merge with above - cond outputs `out` for match
          // and thus can specify m to move lex forward
          // Handle space separated elements (no CA)
          {
            c: (_rule: Rule, ctx: Context, _alt: Alt) => {
              return (TX === ctx.t0.tin ||
                NR === ctx.t0.tin ||
                ST === ctx.t0.tin ||
                VL === ctx.t0.tin
              ) && 0 === ctx.rs.length
            },
            r: S.elem,
            a: (rule: Rule) => rule.node = [rule.node],
            g: S.imp_list
          },
          

          // Close value, and map or list, but perhaps there are more elem?
          { s: [AA], b: 1 },
          */
        ],
        bc: (rule: Rule) => {
          // NOTE: val can be undefined when there is no value at all
          // (eg. empty string, thus no matched opening token)
          rule.node =
            undefined === rule.child.node ?
              (null == rule.open[0] ? undefined : rule.open[0].val) :
              rule.child.node
        },
      },


      map: {
        bo: () => {
          return { node: {} }
        },
        open: [
          { s: [OB, CB] },

          { s: [OB], p: S.pair, n: { im: 0 } },

          { s: [VAL, CL], p: S.pair, b: 2 },

          /*
          { s: [CB] }, // empty
          { p: S.pair } // no tokens, pass node
          */
        ],
        close: [
        ]
      },

      list: {
        bo: () => {
          return { node: [] }
        },
        open: [
          { s: [OS, CS] },

          { s: [OS], p: S.elem },

          { s: [CA], p: S.elem, b: 1 },

          { p: S.elem },

          /*
          { s: [CS] }, // empty
          { p: S.elem } // no tokens, pass node
          */
        ],
        close: [
        ]
      },


      // sets key:val on node
      pair: {
        open: [
          { s: [VAL, CL], p: S.val, u: { key: true } },

          { s: [CA] },

          /*
          { s: [[TX, NR, ST, VL], CL], p: S.val, u: { key: true } },
          { s: [CB], b: 1 }, // empty
          */
        ],
        close: [
          { s: [CB], c: { n: { im: 0 } } },

          { s: [CA, CB], c: { n: { im: 0 } } },

          { s: [CA], c: { n: { im: 0 } }, r: S.pair },

          { s: [VAL], c: { n: { im: 0 } }, r: S.pair, b: 1 },

          { s: [[CB, CA, ...VAL]], b: 1 },

          // Close implicit single prop map inside list
          {
            s: [CS],
            b: 1
          },

          { s: [ZZ], e: finish, g: S.end },

          /*
          { s: [CB] },

          { s: [CA], c: { n: { im: 1 } }, r: S.pair },

          // Walk back up the implicit pairs until we reach im=1
          { s: [CA], b: 1 },

          // Who needs commas anyway?
          // NOTE: only proceed if im<=1 to prevent greedy pairs.
          { s: [[TX, NR, ST, VL], CL], c: { n: { im: 1 } }, r: S.pair, b: 2 },

          // Walk back up the implicit pairs until we reach im=1
          { s: [[TX, NR, ST, VL], CL], b: 2 },

          // Close implicit single prop map inside list
          {
            s: [CS],
            b: 1
          },

          { s: [ZZ], e: finish, g: S.end },
          */
        ],
        bc: (r: Rule, ctx: Context) => {

          // If top level implicit map, correct `im` count.
          // rs=val,map => len 2
          if (2 === ctx.rs.length) {
            r.n.im = 0
          }

          if (r.use.key) {
            let key_token = r.open[0]
            let key = ST === key_token.tin ? key_token.val : key_token.src
            let val = r.child.node
            let prev = r.node[key]

            // Convert undefined to null when there was no pair value
            // Otherwise leave it alone (eg. dynamic plugin sets undefined)
            if (undefined === val && CL === ctx.v1.tin) {
              val = null
            }
            r.node[key] = null == prev ? val :
              (ctx.opts.map.merge ? ctx.opts.map.merge(prev, val) :
                (ctx.opts.map.extend ? deep(prev, val) : val))
          }
        },
      },


      // push onto node
      elem: {
        open: [
          // b:2 as close consumes 1 CA
          { s: [CA, CA], b: 2, a: (r: Rule) => r.node.push(null), g: S.nUll, },
          { s: [CA], a: (r: Rule) => r.node.push(null), g: S.nUll, },

          { p: S.val },



          /*
          { s: [OB], p: S.map, n: { im: 0 } },
          { s: [OS], p: S.list },

          // Insert null for initial comma
          { s: [CA, CA], b: 2, g: S.nUll, a: (r: Rule) => r.node.push(null) },
          { s: [CA], g: S.nUll, a: (r: Rule) => r.node.push(null) },

          { p: S.val, n: { im: 1 } },
          */
        ],
        close: [
          { s: [CA, CS] },

          { s: [CA], r: S.elem },

          { s: [[...VAL, OB, OS]], r: S.elem, b: 1 },

          { s: [CS] },

          { s: [ZZ], e: finish, g: S.end },

          /*
          // Ignore trailing comma
          { s: [CA, CS] },

          // Next element
          { s: [CA], r: S.elem },

          // End list
          { s: [CS] },

          { s: [OB], p: S.map, n: { im: 0 } },
          { s: [OS], p: S.list, },

          // Who needs commas anyway?
          { s: [[TX, NR, ST, VL]], r: S.elem, b: 1 },

          { s: [ZZ], e: finish, g: S.end },
          */
        ],
        bc: (rule: Rule) => {
          if (undefined !== rule.child.node) {
            rule.node.push(rule.child.node)
          }
        },
      }
    }

    // TODO: just create the RuleSpec directly
    this.rsm = keys(rules).reduce((rsm: any, rn: string) => {
      rsm[rn] = new RuleSpec(rules[rn])
      rsm[rn].name = rn
      return rsm
    }, {})
  }


  // Multi-functional get/set for rules.
  rule(name?: string, define?: RuleDefiner): RuleSpec | RuleSpecMap {

    // If no name, get all the rules.
    if (null == name) {
      return this.rsm
    }

    // Else get a rule by name.
    let rs: RuleSpec = this.rsm[name]

    // Else delete a specific rule by name.
    if (null === define) {
      delete this.rsm[name]
    }

    // Else add or redefine a rule by name.
    else if (undefined !== define) {
      rs = this.rsm[name] = (define(this.rsm[name], this.rsm) || this.rsm[name])
      rs.name = name
    }

    return rs
  }


  start(
    lexer: Lexer,
    src: string,
    jsonic: Jsonic,
    meta?: any,
    parent_ctx?: any
  ): any {
    let root: Rule

    let ctx: Context = {
      uI: 1,
      opts: this.options,
      cnfg: this.config,
      meta: meta || {},
      src: () => src, // Avoid printing src
      root: () => root.node,
      plgn: () => jsonic.internal().plugins,
      rule: NONE,
      xs: -1,
      v2: lexer.end,
      v1: lexer.end,
      t0: lexer.end,
      t1: lexer.end,
      tC: -2,  // Prepare count for 2-token lookahead.
      next,
      rs: [],
      rsm: this.rsm,
      log: (meta && meta.log) || undefined,
      F: srcfmt(this.config),
      use: {}
    }

    ctx = deep(ctx, parent_ctx)

    makelog(ctx)

    let tn = (pin: Tin): string => tokenize(pin, this.config)
    let lex: Lex =
      badlex(lexer.start(ctx), tokenize('#BD', this.config), ctx)
    let startspec = this.rsm[this.options.rule.start]

    // The starting rule is always 'val'
    if (null == startspec) {
      return undefined
    }

    let rule = new Rule(startspec, ctx)

    root = rule

    // Maximum rule iterations (prevents infinite loops). Allow for
    // rule open and close, and for each rule on each char to be
    // virtual (like map, list), and double for safety margin (allows
    // lots of backtracking), and apply a multipler options as a get-out-of-jail.
    let maxr = 2 * keys(this.rsm).length * lex.src.length *
      2 * this.options.rule.maxmul

    // Lex next token.
    function next() {
      ctx.v2 = ctx.v1
      ctx.v1 = ctx.t0
      ctx.t0 = ctx.t1

      let t1
      do {
        t1 = lex(rule)
        ctx.tC++
      } while (ctx.cnfg.ts.IGNORE[t1.tin])

      ctx.t1 = { ...t1 }

      return ctx.t0
    }

    // Look two tokens ahead
    next()
    next()

    // Process rules on tokens
    let rI = 0

    // This loop is the heart of the engine. Keep processing rule
    // occurrences until there's none left.
    while (NONE !== rule && rI < maxr) {
      ctx.log &&
        ctx.log(S.rule, rule.name + '~' + rule.id, RuleState[rule.state],
          'rs=' + ctx.rs.length, 'tc=' + ctx.tC, '[' + tn(ctx.t0.tin) + ' ' + tn(ctx.t1.tin) + ']',
          '[' + ctx.F(ctx.t0.src) + ' ' + ctx.F(ctx.t1.src) + ']', rule, ctx)

      ctx.rule = rule
      rule = rule.process(ctx)

      ctx.log &&
        ctx.log(S.stack, ctx.rs.length,
          ctx.rs.map((r: Rule) => r.name + '~' + r.id).join('/'),
          rule, ctx)
      rI++
    }

    // TODO: option to allow trailing content
    if (tokenize('#ZZ', this.config) !== ctx.t0.tin) {
      throw new JsonicError(S.unexpected, {}, ctx.t0, NONE, ctx)
    }

    // NOTE: by returning root, we get implicit closing of maps and lists.
    return root.node
  }


  clone(options: Options, config: Config) {
    let parser = new Parser(options, config)

    parser.rsm = Object
      .keys(this.rsm)
      .reduce((a, rn) => (a[rn] = clone(this.rsm[rn]), a), ({} as any))

    return parser
  }
}


let util = {
  tokenize,
  srcfmt,
  deep,
  clone,
  charset,
  longest,
  marr,
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
  ender,
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
      configure(config,
        deep(merged_options, change_options))
      for (let k in merged_options) {
        jsonic.options[k] = merged_options[k]
      }
      assign(jsonic.token, config.t)
    }
    return { ...jsonic.options }
  }


  // Define the API
  let api: JsonicAPI = {
    token: (function token<A extends string | Tin, B extends string | Tin>(ref: A)
      : A extends string ? B : string {
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

    lex: function lex(state?: Tin, match?: LexMatcher):
      LexMatcherListMap | LexMatcher[] {
      let lexer = jsonic.internal().lexer
      return lexer.lex(state, match)
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
    config = ({
      tI: 1,
      t: {}
    } as Config)

    configure(config, merged_options)

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



// Utility functions

function srcfmt(config: Config) {
  return (s: any, _?: any) =>
    null == s ? MT : (_ = JSON.stringify(s),
      _.substring(0, config.d.maxlen) +
      (config.d.maxlen < _.length ? '...' : MT))
}


// Uniquely resolve or assign token pin number
function tokenize<R extends string | Tin, T extends string | Tin>(
  ref: R,
  config: Config,
  jsonic?: Jsonic):
  T {
  let tokenmap: any = config.t
  let token: string | Tin = tokenmap[ref]

  if (null == token && S.string === typeof (ref)) {
    token = config.tI++
    tokenmap[token] = ref
    tokenmap[ref] = token
    tokenmap[(ref as string).substring(1)] = token

    if (null != jsonic) {
      assign(jsonic.token, config.t)
    }
  }

  return (token as T)
}

// Deep override for plain data. Retains base object and array.
// Array merge by `over` index, `over` wins non-matching types, expect:
// `undefined` always loses, `over` plain objects inject into functions,
// and `over` functions always win. Over always copied.
function deep(base?: any, ...rest: any): any {
  let base_isf = S.function === typeof (base)
  let base_iso = null != base &&
    (S.object === typeof (base) || base_isf)
  for (let over of rest) {
    let over_isf = S.function === typeof (over)
    let over_iso = null != over &&
      (S.object === typeof (over) || over_isf)
    if (base_iso &&
      over_iso &&
      !over_isf &&
      (Array.isArray(base) === Array.isArray(over))
    ) {
      for (let k in over) {
        base[k] = deep(base[k], over[k])
      }
    }
    else {
      base = undefined === over ? base :
        over_isf ? over :
          (over_iso ?
            deep(Array.isArray(over) ? [] : {}, over) : over)

      base_isf = S.function === typeof (base)
      base_iso = null != base &&
        (S.object === typeof (base) || base_isf)
    }
  }
  return base
}


function clone(class_instance: any) {
  return deep(Object.create(Object.getPrototypeOf(class_instance)),
    class_instance)
}


// Lookup map for a set of chars.
function charset(...parts: (string | object | boolean)[]): CharCodeMap {
  return parts
    .filter(p => false !== p)
    .map((p: any) => 'object' === typeof (p) ? keys(p).join(MT) : p)
    .join(MT)
    .split(MT)
    .reduce((a: any, c: string) => (a[c] = c.charCodeAt(0), a), {})
}


function longest(strs: string[]) {
  return strs.reduce((a, s) => a < s.length ? s.length : a, 0)
}


// True if arrays match.
function marr(a: string[], b: string[]) {
  return (a.length === b.length && a.reduce((a, s, i) => (a && s === b[i]), true))
}


// Remove Jsonic internal lines as spurious for caller.
function trimstk(err: Error) {
  if (err.stack) {
    err.stack =
      err.stack.split('\n')
        .filter(s => !s.includes('jsonic/jsonic'))
        .map(s => s.replace(/    at /, 'at '))
        .join('\n')
  }
}


// Special debug logging to console (use Jsonic('...', {log:N})).
// log:N -> console.dir to depth N
// log:-1 -> console.dir to depth 1, omitting objects (good summary!)
function makelog(ctx: Context) {
  if ('number' === typeof ctx.log) {
    let exclude_objects = false
    let logdepth = (ctx.log as number)
    if (-1 === logdepth) {
      logdepth = 1
      exclude_objects = true
    }
    ctx.log = (...rest: any) => {
      if (exclude_objects) {
        let logstr = rest
          .filter((item: any) => S.object != typeof (item))
          .map((item: any) => S.function == typeof (item) ? item.name : item)
          .join('\t')
        ctx.opts.debug.get_console().log(logstr)
      }
      else {
        ctx.opts.debug.get_console().dir(rest, { depth: logdepth })
      }
      return undefined
    }
  }
  return ctx.log
}


function badlex(lex: Lex, BD: Tin, ctx: Context) {
  let wrap: any = (rule: Rule) => {
    let token = lex(rule)

    if (BD === token.tin) {
      let details: any = {}
      if (null != token.use) {
        details.use = token.use
      }
      throw new JsonicError(
        token.why || S.unexpected,
        details,
        token,
        rule,
        ctx,
      )
    }

    return token
  }
  wrap.src = lex.src
  return wrap
}



// Mark a string for escaping by `util.regexp`.
function mesc(s: string, _?: any) {
  return (_ = new String(s), _.esc = true, _)
}

// Construct a RegExp. Use mesc to mark string for escaping.
// NOTE: flags first allows concatenated parts to be rest.
function regexp(
  flags: string,
  ...parts: (string | (String & { esc?: boolean }))[]
): RegExp {
  return new RegExp(
    parts.map(p => (p as any).esc ?
      p.replace(/[-\\|\]{}()[^$+*?.!=]/g, '\\$&')
      : p).join(MT), flags)
}



function ender(endchars: CharCodeMap, endmarks: KV, singles?: KV) {
  let allendchars =
    keys(
      keys(endmarks)
        .reduce((a: any, em: string) => (a[em[0]] = 1, a), { ...endchars }))
      .join('')

  let endmarkprefixes =
    entries(
      keys(endmarks)
        .filter(cm =>
          1 < cm.length && // only for long marks

          // Not needed if first char is already an endchar,
          // otherwise edge case where first char won't match as ender,
          // see test custom-parser-mixed-token
          (!singles || !singles[cm[0]])
        )
        .reduce((a: any, s: string) =>
          ((a[s[0]] = (a[s[0]]) || []).push(s.substring(1)), a), {}))
      .reduce((a: any, cme: any) => (a.push([
        cme[0],
        cme[1].map((cms: string) => regexp('', mesc(cms)).source).join('|')
      ]), a), [])
      .map((cmp: any) => [
        '|(',
        mesc(cmp[0]),
        '(?!(',
        cmp[1],
        //')).)'
        ')))'
      ]).flat(1)

  return regexp(
    S.no_re_flags,
    '^(([^',
    mesc(allendchars),
    ']+)',
    ...endmarkprefixes,
    ')+'
  )
}



function errinject(
  s: string,
  code: string,
  details: KV,
  token: Token,
  rule: Rule,
  ctx: Context
) {
  return s.replace(/\$([\w_]+)/g, (_m: any, name: string) => {
    return JSON.stringify(
      'code' === name ? code : (
        details[name] ||
        (ctx.meta ? ctx.meta[name] : undefined) ||
        (token as KV)[name] ||
        (rule as KV)[name] ||
        (ctx as KV)[name] ||
        (ctx.opts as any)[name] ||
        (ctx.cnfg as any)[name] ||
        '$' + name
      )
    )
  })
}


function extract(src: string, errtxt: string, token: Token) {
  let loc = 0 < token.loc ? token.loc : 0
  let row = 0 < token.row ? token.row : 0
  let col = 0 < token.col ? token.col : 0
  let tsrc = null == token.src ? MT : token.src
  let behind = src.substring(Math.max(0, loc - 333), loc).split('\n')
  let ahead = src.substring(loc, loc + 333).split('\n')

  let pad = 2 + (MT + (row + 2)).length
  let rI = row < 2 ? 0 : row - 2
  let ln = (s: string) => '\x1b[34m' + (MT + (rI++)).padStart(pad, ' ') +
    ' | \x1b[0m' + (null == s ? MT : s)

  let blen = behind.length

  let lines = [
    2 < blen ? ln(behind[blen - 3]) : null,
    1 < blen ? ln(behind[blen - 2]) : null,
    ln(behind[blen - 1] + ahead[0]),
    (' '.repeat(pad)) + '   ' +
    ' '.repeat(col) +
    '\x1b[31m' + '^'.repeat(tsrc.length || 1) +
    ' ' + errtxt + '\x1b[0m',
    ln(ahead[1]),
    ln(ahead[2]),
  ]
    .filter((line: any) => null != line)
    .join('\n')

  return lines
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

          let token = ex.token || {
            tin: jsonic.token.UK,
            loc: loc,
            len: tsrc.length,
            row: ex.lineNumber || row,
            col: ex.columnNumber || col,
            val: undefined,
            src: tsrc,
          } as Token

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
              cnfg: ({ t: {} } as Config),
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


function errdesc(
  code: string,
  details: KV,
  token: Token,
  rule: Rule,
  ctx: Context,
): KV {
  token = { ...token }
  let options = ctx.opts
  let meta = ctx.meta
  let errtxt = errinject(
    (options.error[code] || options.error.unknown),
    code, details, token, rule, ctx
  )

  if (S.function === typeof (options.hint)) {
    // Only expand the hints on demand. Allow for plugin-defined hints.
    options.hint = { ...options.hint(), ...options.hint }
  }

  let message = [
    ('\x1b[31m[jsonic/' + code + ']:\x1b[0m ' + errtxt),
    '  \x1b[34m-->\x1b[0m ' + (meta && meta.fileName || '<no-file>') +
    ':' + token.row + ':' + token.col,
    extract(ctx.src(), errtxt, token),
    errinject(
      (options.hint[code] || options.hint.unknown)
        .replace(/^([^ ])/, ' $1')
        .split('\n')
        .map((s: string, i: number) => (0 === i ? ' ' : '  ') + s).join('\n'),
      code, details, token, rule, ctx
    ),
    '  \x1b[2mhttps://jsonic.richardrodger.com\x1b[0m',
    '  \x1b[2m--internal: rule=' + rule.name + '~' + RuleState[rule.state] +
    '; token=' + ctx.cnfg.t[token.tin] +
    (null == token.why ? '' : ('~' + token.why)) +
    '; plugins=' + ctx.plgn().map((p: any) => p.name).join(',') + '--\x1b[0m\n'
  ].join('\n')

  let desc: any = {
    internal: {
      token,
      ctx,
    }
  }

  desc = {
    ...Object.create(desc),
    message,
    code,
    details,
    meta,
    fileName: meta ? meta.fileName : undefined,
    lineNumber: token.row,
    columnNumber: token.col,
  }

  return desc
}


// Idempotent normalization of options.
function configure(config: Config, options: Options) {
  let token_names = keys(options.token)

  // Index of tokens by name.
  token_names.forEach(tn => tokenize(tn, config))

  let single_char_token_names = token_names
    .filter(tn => null != (options.token[tn] as any).c)

  config.sm = single_char_token_names
    .reduce((a, tn) => (a[(options.token[tn] as any).c] =
      (config.t as any)[tn], a), ({} as any))

  let multi_char_token_names = token_names
    .filter(tn => S.string === typeof options.token[tn])

  config.m = multi_char_token_names
    .reduce((a: any, tn) =>
    (a[tn.substring(1)] =
      (options.token[tn] as string)
        .split(MT)
        .reduce((pm, c) => (pm[c] = config.t[tn], pm), ({} as TinMap)),
      a), {})

  let tokenset_names = token_names
    .filter(tn => null != (options.token[tn] as any).s)

  // Char code arrays for lookup by char code.
  config.ts = tokenset_names
    .reduce((a: any, tsn) =>
    (a[tsn.substring(1)] =
      (options.token[tsn] as any).s.split(',')
        .reduce((a: any, tn: string) => (a[config.t[tn]] = tn, a), {}),
      a), {})


  config.vm = options.value.src
  config.vs = keys(options.value.src)
    .reduce((a: any, s: string) => (a[s[0]] = true, a), {})


  // Lookup maps for sets of characters.
  config.cs = {}

  // Lookup table for escape chars, indexed by denotating char (e.g. n for \n).
  config.esc = keys(options.string.escape)
    .reduce((a: any, ed: string) =>
      (a[ed] = options.string.escape[ed], a), {})

  // comment start markers
  config.cs.cs = {}

  // comment markers
  config.cmk = []

  if (options.comment.lex) {
    config.cm = options.comment.marker

    let comment_markers = keys(config.cm)

    comment_markers.forEach(k => {

      // Single char comment marker (eg. `#`)
      if (1 === k.length) {
        config.cs.cs[k] = k.charCodeAt(0)
      }

      // String comment marker (eg. `//`)
      else {
        config.cs.cs[k[0]] = k.charCodeAt(0)
        config.cmk.push(k)
      }
    })

    config.cmx = longest(comment_markers)
  }

  config.sc = keys(config.sm).join(MT)


  // All the characters that can appear in a number.
  config.cs.dig = charset(options.number.digital)

  // Multiline quotes
  config.cs.mln = charset(options.string.multiline)

  // Enders are char sets that end lexing for a given token.
  // Value enders...end values!
  config.cs.vend = charset(
    options.space.lex && config.m.SP,
    options.line.lex && config.m.LN,
    config.sc,
    options.comment.lex && config.cs.cs,
    options.block.lex && config.cs.bs,
  )

  // block start markers
  config.cs.bs = {}

  config.bmk = []

  // TODO: change to block.markers as per comments, then config.bm
  let block_markers = keys(options.block.marker)

  block_markers.forEach(k => {
    config.cs.bs[k[0]] = k.charCodeAt(0)
    config.bmk.push(k)
  })

  config.bmx = longest(block_markers)


  let re_ns = null != options.number.sep ?
    new RegExp(options.number.sep, 'g') : null

  // RegExp cache
  config.re = {
    ns: re_ns,

    te: ender(
      charset(
        options.space.lex && config.m.SP,
        options.line.lex && config.m.LN,
        config.sc,
        options.comment.lex && config.cs.cs,
        options.block.lex && config.cs.bs
      ),
      {
        ...(options.comment.lex ? config.cm : {}),
        ...(options.block.lex ? options.block.marker : {}),
      },
      config.sm
    ),

    nm: new RegExp(
      [
        '^[-+]?(0(',
        [
          options.number.hex ? 'x[0-9a-fA-F_]+' : null,
          options.number.oct ? 'o[0-7_]+' : null,
          options.number.bin ? 'b[01_]+' : null,
        ].filter(s => null != s).join('|'),
        ')|[0-9]+([0-9_]*[0-9])?)',
        '(\\.[0-9]+([0-9_]*[0-9])?)?',
        '([eE][-+]?[0-9]+([0-9_]*[0-9])?)?',
      ]
        .filter(s =>
          s.replace(/_/g, null == re_ns ? '' : options.number.sep))
        .join('')
    )
  }


  // Debug options
  config.d = options.debug


  // Apply any config modifiers (probably from plugins).
  keys(options.config.modify)
    .forEach((modifer: string) =>
      options.config.modify[modifer](config, options))


  // Debug the config - useful for plugin authors.
  if (options.debug.print.config) {
    options.debug.get_console().dir(config, { depth: null })
  }
}



// Generate hint text lookup.
// NOTE: generated and inserted by hint.js
function make_hint(d = (t: any, r = 'replace') => t[r](/[A-Z]/g, (m: any) => ' ' + m.toLowerCase())[r](/[~%][a-z]/g, (m: any) => ('~' == m[0] ? ' ' : '') + m[1].toUpperCase()), s = '~sinceTheErrorIsUnknown,ThisIsProbablyABugInsideJsonic\nitself,OrAPlugin.~pleaseConsiderPostingAGithubIssue -Thanks!|~theCharacter(s) $srcWereNotExpectedAtThisPointAsTheyDoNot\nmatchTheExpectedSyntax,EvenUnderTheRelaxedJsonicRules.~ifIt\nisNotObviouslyWrong,TheActualSyntaxErrorMayBeElsewhere.~try\ncommentingOutLargerAreasAroundThisPointUntilYouGetNoErrors,\nthenRemoveTheCommentsInSmallSectionsUntilYouFindThe\noffendingSyntax.~n%o%t%e:~alsoCheckIfAnyPluginsYouAreUsing\nexpectDifferentSyntaxInThisCase.|~theEscapeSequence $srcDoesNotEncodeAValidUnicodeCodePoint\nnumber.~youMayNeedToValidateYourStringDataManuallyUsingTest\ncodeToSeeHow~javaScriptWillInterpretIt.~alsoConsiderThatYour\ndataMayHaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeen\ngeneratedCorrectly.|~theEscapeSequence $srcDoesNotEncodeAValid~a%s%c%i%iCharacter.~you\nmayNeedToValidateYourStringDataManuallyUsingTestCodeToSee\nhow~javaScriptWillInterpretIt.~alsoConsiderThatYourDataMay\nhaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeenGenerated\ncorrectly.|~stringValuesCannotContainUnprintableCharacters (characterCodes\nbelow 32).~theCharacter $srcIsUnprintable.~youMayNeedToRemove\ntheseCharactersFromYourSourceData.~alsoCheckThatItHasNot\nbecomeCorrupted.|~stringValuesCannotBeMissingTheirFinalQuoteCharacter,Which\nshouldMatchTheirInitialQuoteCharacter.'.split('|')): any { return 'unknown|unexpected|invalid_unicode|invalid_ascii|unprintable|unterminated'.split('|').reduce((a: any, n, i) => (a[n] = d(s[i]), a), {}) }


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
  LexMatcher,
  LexMatcherListMap,
  LexMatcherResult,
  LexMatcherState,
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
