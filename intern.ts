

import type {
  Rule,
  RuleSpec,
} from './parser'

import type {
  Lex,
  Token,
} from './lexer'



/* $lab:coverage:off$ */
enum RuleState {
  open,
  close,
}
/* $lab:coverage:on$ */





const MT = '' // Empty ("MT"!) string.


const keys = Object.keys
const entries = Object.entries
const assign = Object.assign
const defprop = Object.defineProperty

const map = (o: any, f: any) => {
  return Object
    .entries(o)
    .reduce((o: any, e: any) => {
      let me = f(e)
      o[me[0]] = me[1]
      return o
    }, {})
}


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


// General Key-Value map.
type KV = { [k: string]: any }


// Unique token identification number (aka "tin").
type Tin = number


// Map token string to Token index.
type TokenMap = { [token: string]: Tin }


// Map character to code value.
type Chars = { [char: string]: number }

// Map string to string value.
type StrMap = { [name: string]: string }



// Meta parameters for a given parse run.
type Meta = KV


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
    // balance: boolean

    // NOTE: comment.marker uses value structure to define comment kind.
    marker: {
      [start_marker: string]: // Start marker (eg. `/*`).
      string | // End marker (eg. `*/`).
      boolean // No end marker (eg. `#`).
    }
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
  string: {
    lex: boolean
    escape: { [char: string]: string }
    multiline: string
    escapedouble: boolean
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
      lexer: any, //Lexer,
      src: string,
      jsonic: any, //Jsonic,
      meta?: any,
      parent_ctx?: any
    ) => any
  }
}



// Internal configuration built from options by `configure`.
type Config = {

  // Fixed tokens (punctuation, operators, keywords, etc.)
  fixed: {
    lex: boolean
    token: TokenMap
  }

  // Token sets.
  tokenSet: {

    // Tokens ignored by rules.
    ignore: {
      [name: number]: boolean
    }
  }

  // Space characters.
  space: {
    lex: boolean
    chars: Chars
  }

  // Line end characters.
  line: {
    lex: boolean
    chars: Chars
    rowChars: Chars // Row counting characters.
  }

  // Unquoted text
  text: {
    lex: boolean
  }

  // Numbers
  number: {
    lex: boolean
    hex: boolean
    oct: boolean
    bin: boolean
    sep: boolean
  }

  // String quote characters.
  string: {
    lex: boolean
    quoteMap: Chars,
    escMap: KV,
    escChar: string,
    escCharCode: number,
    doubleEsc: boolean,
    multiLine: Chars,
  }

  // Literal values
  value: {
    lex: boolean
    m: { [literal: string]: { v: any } }
  }

  comment: {
    lex: boolean
    marker: {
      line: boolean
      start: string
      end: string
      active: boolean
      eof: boolean // EOF also ends comment
    }[]
  }

  re: {
    ender: RegExp
    textEnder: RegExp
    numberEnder: RegExp
    numberSep: RegExp
    fixed: RegExp
    commentLine: RegExp
    commentBlock: RegExp
    rowChars: RegExp
    columns: RegExp
  }


  debug: {
    get_console: () => any
    maxlen: number
    print: {
      config: boolean
    }
  }


  tI: number // Token identifier index.
  t: any // Token index map.
}


// Current parsing context.
type Context = {
  uI: number           // Rule index.
  opts: Options        // Jsonic instance options.
  cfg: Config         // Jsonic instance config.
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



// Idempotent normalization of options.
// See Config type for commentary.
function configure(incfg: Config | undefined, opts: Options): Config {

  const cfg = incfg || ({
    tI: 1, // Start at 1 to avoid spurious false value for first token
    t: {}
  } as Config)

  const t = (tn: string) => tokenize(tn, cfg)

  // Standard tokens. These names cannot be changed.
  t('#BD') // BAD
  t('#ZZ') // END
  t('#UK') // UNKNOWN
  t('#AA') // ANY
  t('#SP') // SPACE
  t('#LN') // LINE
  t('#CM') // COMMENT
  t('#NR') // NUMBER
  t('#ST') // STRING
  t('#TX') // TEXT
  t('#VL') // VALUE

  cfg.fixed = {
    lex: !!opts.fixed.lex,
    token: map(opts.fixed.token, ([name, src]: [string, string]) => [src, t(name)])
  }

  cfg.tokenSet = {
    ignore: Object.fromEntries(opts.tokenSet.ignore.map(tn => [t(tn), true]))
  }

  cfg.space = {
    lex: !!opts.space.lex,
    chars: charset(opts.space.chars)
  }

  cfg.line = {
    lex: !!opts.line.lex,
    chars: charset(opts.line.chars),
    rowChars: charset(opts.line.rowChars),
  }


  cfg.text = {
    lex: !!opts.text.lex,
  }

  cfg.number = {
    lex: !!opts.number.lex,
    hex: !!opts.number.hex,
    oct: !!opts.number.oct,
    bin: !!opts.number.bin,
    sep: null != opts.number.sep && '' !== opts.number.sep,
  }

  cfg.value = {
    lex: true,
    m: {
      'true': { v: true },
      'false': { v: false },
      'null': { v: null },

      // TODO: just testing, move to plugin
      // 'undefined': { v: undefined },
      // 'NaN': { v: NaN },
      // 'Infinity': { v: Infinity },
      // '+Infinity': { v: +Infinity },
      // '-Infinity': { v: -Infinity },
    }
  }

  cfg.string = {
    lex: true,
    quoteMap: {
      '\'': 39,
      '"': 34,
      '`': 96,
    },
    escMap: {
      b: '\b',
      f: '\f',
      n: '\n',
      r: '\r',
      t: '\t',
    },
    escChar: '\\',
    escCharCode: '\\'.charCodeAt(0),
    doubleEsc: false,
    multiLine: {
      '`': 96,
    }
  }

  cfg.comment = {
    lex: true,
    marker: [
      { line: true, start: '#', end: '\n', active: true, eof: true },
      { line: true, start: '//', end: '\n', active: true, eof: true },
      { line: false, start: '/*', end: '*/', active: true, eof: false },
    ],
  }

  let fixedSorted = Object.keys(cfg.fixed.token)
    .sort((a: string, b: string) => b.length - a.length)

  let fixedRE = fixedSorted.map(fixed => escre(fixed)).join('|')

  let comments = cfg.comment.lex && cfg.comment.marker.filter(c => c.active)

  // End-marker RE part
  let enderRE = [
    '([',
    escre(keys(charset(
      cfg.space.lex && cfg.space.chars,
      cfg.line.lex && cfg.line.chars,
    )).join('')),
    ']|',
    fixedRE,
    // TODO: spaces

    comments ?
      ('|' + comments.reduce((a: string[], c: any) =>
        (a.push(escre(c.start)), a), []).join('|')) : '',

    '|$)', // EOF case
  ]

  // TODO: friendlier names
  cfg.re = {
    ender: regexp(null, ...enderRE),

    // Text to end-marker.
    textEnder: regexp(
      null,
      '^(.*?)',
      ...enderRE
    ),

    // TODO: use cfg props
    // Number to end-marker.
    numberEnder: regexp(
      null,
      [
        '^([-+]?(0(',
        [
          cfg.number.hex ? 'x[0-9a-fA-F_]+' : null,
          cfg.number.oct ? 'o[0-7_]+' : null,
          cfg.number.bin ? 'b[01_]+' : null,
        ].filter(s => null != s).join('|'),
        ')|[0-9]+([0-9_]*[0-9])?)',
        '(\\.[0-9]+([0-9_]*[0-9])?)?',
        '([eE][-+]?[0-9]+([0-9_]*[0-9])?)?',
      ]
        .join('')
        .replace(/_/g, cfg.number.sep ? escre((opts.number.sep as string)) : ''),
      ')',
      ...enderRE
    ),

    numberSep: regexp('g', escre(null == opts.number.sep ? '' : opts.number.sep)),

    fixed: regexp(
      null,
      '^(',
      fixedRE,
      ')'
    ),


    // TODO: build lazily inside lexer matcher
    commentLine: regexp(
      null,
      comments ?
        comments
          .filter(c => c.line)
          .reduce((a: string[], c: any) =>
          (a.push('^(' + escre(c.start) +
            '.*(' + escre(c.end) +
            (c.eof ? '|$' : '') + ')' + ')'), a), []).join('|') : '',
    ),

    commentBlock: regexp(
      's',
      comments ?
        comments
          .filter(c => !c.line)
          .reduce((a: string[], c: any) =>
          (a.push('^(' + escre(c.start) +
            '.*?(' + escre(c.end) +
            (c.eof ? '|$' : '') + ')' + ')'), a), []).join('|') : '',
    ),


    // TODO: prebuild these using a property on matcher?
    rowChars: regexp(null, escre(opts.line.rowChars)),

    columns: regexp(null, escre(opts.line.chars), '(.*)$'),

  }


  cfg.debug = {
    get_console: opts.debug.get_console,
    maxlen: opts.debug.maxlen,
    print: {
      config: opts.debug.print.config
    },
  }


  // console.log('CONFIG')
  // console.dir(cfg, { depth: null })

  /////////



  //let ot = opts.token
  //let token_names = keys(ot)

  // // Index of tokens by name.
  // token_names.forEach(tn => tokenize(tn, cfg))

  //let fixstrs = token_names
  //  .filter(tn => null != (t[tn] as any).c)
  //  .map(tn => (t[tn] as any).c)

  // cfg.vs = keys(opts.value.src)
  //   .reduce((a: any, s: string) => (a[s[0]] = true, a), {})

  // TODO: comments, etc
  // fixstrs = fixstrs.concat(keys(opts.value.src))

  // console.log('FIXSTRS', fixstrs)

  // Sort by length descending
  //cfg.fs = fixstrs.sort((a: string, b: string) => b.length - a.length)

  // let single_char_token_names = token_names
  //   .filter(tn => null != (ot[tn] as any).c && 1 === (ot[tn] as any).c.length)

  // cfg.sm = single_char_token_names
  //   .reduce((a, tn) => (a[(opts.token[tn] as any).c] =
  //     (cfg.t as any)[tn], a), ({} as any))

  // let multi_char_token_names = token_names
  //   .filter(tn => S.string === typeof opts.token[tn])

  // cfg.m = multi_char_token_names
  //   .reduce((a: any, tn) =>
  //   (a[tn.substring(1)] =
  //     (opts.token[tn] as string)
  //       .split(MT)
  //       .reduce((pm, c) => (pm[c] = cfg.t[tn], pm), ({} as TinMap)),
  //     a), {})

  // let tokenset_names = token_names
  //   .filter(tn => null != (opts.token[tn] as any).s)

  // Char code arrays for lookup by char code.
  // cfg.ts = tokenset_names
  //   .reduce((a: any, tsn) =>
  //   (a[tsn.substring(1)] =
  //     (opts.token[tsn] as any).s.split(',')
  //       .reduce((a: any, tn: string) => (a[cfg.t[tn]] = tn, a), {}),
  //     a), {})


  // config.vm = options.value.src
  // config.vs = keys(options.value.src)
  //  .reduce((a: any, s: string) => (a[s[0]] = true, a), {})


  // Lookup maps for sets of characters.
  // cfg.cs = {}

  // Lookup table for escape chars, indexed by denotating char (e.g. n for \n).
  // cfg.esc = keys(opts.string.escape)
  //   .reduce((a: any, ed: string) =>
  //     (a[ed] = opts.string.escape[ed], a), {})

  // comment start markers
  // cfg.cs.cs = {}

  // comment markers
  // cfg.cmk = []

  // if (opts.comment.lex) {
  //   cfg.cm = opts.comment.marker

  //   let comment_markers = keys(cfg.cm)

  //   comment_markers.forEach(k => {

  //     // Single char comment marker (eg. `#`)
  //     if (1 === k.length) {
  //       cfg.cs.cs[k] = k.charCodeAt(0)
  //     }

  //     // String comment marker (eg. `//`)
  //     else {
  //       cfg.cs.cs[k[0]] = k.charCodeAt(0)
  //       cfg.cmk.push(k)
  //     }
  //   })

  //   cfg.cmx = longest(comment_markers)
  // }

  // cfg.sc = keys(cfg.sm).join(MT)


  // All the characters that can appear in a number.
  // cfg.cs.dig = charset(opts.number.digital)

  // // Multiline quotes
  // cfg.cs.mln = charset(opts.string.multiline)

  // Enders are char sets that end lexing for a given token.
  // Value enders...end values!
  // cfg.cs.vend = charset(
  //   opts.space.lex && cfg.m.SP,
  //   opts.line.lex && cfg.m.LN,
  //   cfg.sc,
  //   opts.comment.lex && cfg.cs.cs,
  //   opts.block.lex && cfg.cs.bs,
  // )

  // block start markers
  // cfg.cs.bs = {}

  // cfg.bmk = []

  // TODO: change to block.markers as per comments, then config.bm
  // let block_markers = keys(opts.block.marker)

  // block_markers.forEach(k => {
  // cfg.cs.bs[k[0]] = k.charCodeAt(0)
  // cfg.bmk.push(k)
  // })

  // cfg.bmx = longest(block_markers)


  //let re_ns = null != opts.number.sep ?
  //  new RegExp(opts.number.sep, 'g') : null

  // RegExp cache
  // cfg.re = Object.assign(cfg.re, {
  //   //ns: re_ns,

  //   // te: ender(
  //   //   charset(
  //   //     opts.space.lex && cfg.m.SP,
  //   //     opts.line.lex && cfg.m.LN,
  //   //     cfg.sc,
  //   //     opts.comment.lex && cfg.cs.cs,
  //   //     opts.block.lex && cfg.cs.bs
  //   //   ),
  //   //   {
  //   //     ...(opts.comment.lex ? cfg.cm : {}),
  //   //     ...(opts.block.lex ? opts.block.marker : {}),
  //   //   },
  //   //   cfg.sm
  //   // ),

  //   nm: new RegExp(
  //     [
  //       '^[-+]?(0(',
  //       [
  //         opts.number.hex ? 'x[0-9a-fA-F_]+' : null,
  //         opts.number.oct ? 'o[0-7_]+' : null,
  //         opts.number.bin ? 'b[01_]+' : null,
  //       ].filter(s => null != s).join('|'),
  //       ')|[0-9]+([0-9_]*[0-9])?)',
  //       '(\\.[0-9]+([0-9_]*[0-9])?)?',
  //       '([eE][-+]?[0-9]+([0-9_]*[0-9])?)?',
  //     ]
  //       .filter(s =>
  //         s.replace(/_/g, null == re_ns ? '' : opts.number.sep))
  //       .join('')
  //   )
  // })

  // console.log('cfg.re.txfs', cfg.re.txfs)

  // Debug options
  //cfg.d = opts.debug



  // Apply any config modifiers (probably from plugins).
  keys(opts.config.modify)
    .forEach((modifer: string) =>
      opts.config.modify[modifer](cfg, opts))


  // Debug the config - useful for plugin authors.
  if (opts.debug.print.config) {
    opts.debug.get_console().dir(cfg, { depth: null })
  }


  return cfg
}




// Uniquely resolve or assign token by name (string) or identification number (Tin),
// returning the associated Tin (for the name) or name (for the Tin).
function tokenize<
  R extends string | Tin,
  T extends (R extends Tin ? string : Tin)
>(
  ref: R,
  cfg: Config,
  jsonic?: any):
  T {
  let tokenmap: any = cfg.t
  let token: string | Tin = tokenmap[ref]

  if (null == token && S.string === typeof (ref)) {
    token = cfg.tI++
    tokenmap[token] = ref
    tokenmap[ref] = token
    tokenmap[(ref as string).substring(1)] = token

    if (null != jsonic) {
      assign(jsonic.token, cfg.t)
    }
  }

  return (token as T)
}


// Mark a string for escaping by `util.regexp`.
function mesc(s: string, _?: any) {
  return (_ = new String(s), _.esc = true, _)
}


// Construct a RegExp. Use mesc to mark string for escaping.
// NOTE: flags first allows concatenated parts to be rest.
function regexp(
  flags: string | null,
  ...parts: (string | (String & { esc?: boolean }))[]
): RegExp {
  return new RegExp(
    parts.map(p => (p as any).esc ?
      //p.replace(/[-\\|\]{}()[^$+*?.!=]/g, '\\$&')
      escre(p.toString())
      : p).join(MT), null == flags ? '' : flags)
}


function escre(s: string) {
  return s
    .replace(/[-\\|\]{}()[^$+*?.!=]/g, '\\$&')
    .replace(/\t/g, '\\t')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
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
        (ctx.cfg as any)[name] ||
        '$' + name
      )
    )
  })
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


function extract(src: string, errtxt: string, token: Token) {
  let loc = 0 < token.sI ? token.sI : 0
  let row = 0 < token.rI ? token.rI : 0
  let col = 0 < token.cI ? token.cI : 0
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


function errdesc(
  code: string,
  details: KV,
  token: Token,
  rule: Rule,
  ctx: Context,
): KV {
  // token = { ...token }
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
    ':' + token.rI + ':' + token.cI,
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
    //'; token=' + ctx.cfg.t[token.tin] +
    '; token=' + tokenize(token.tin, ctx.cfg) +
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
    lineNumber: token.rI,
    columnNumber: token.cI,
  }

  return desc
}


function badlex(lex: Lex, BD: Tin, ctx: Context) {
  let wrap: any = (rule: Rule) => {
    let token = lex.next(rule)
    // let token = lex(rule)

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


function srcfmt(config: Config) {
  return (s: any, _?: any) =>
    null == s ? MT : (_ = JSON.stringify(s),
      _.substring(0, config.debug.maxlen) +
      (config.debug.maxlen < _.length ? '...' : MT))
}


function snip(s: any, len: number = 5) {
  return undefined === s ? '' : ('' + s).substring(0, len).replace(/[\r\n\t]/g, '.')
}



function clone(class_instance: any) {
  return deep(Object.create(Object.getPrototypeOf(class_instance)),
    class_instance)
}


// Lookup map for a set of chars.
function charset(...parts: (string | object | boolean)[]): Chars {
  return parts
    .filter(p => false !== p)
    .map((p: any) => 'object' === typeof (p) ? keys(p).join(MT) : p)
    .join(MT)
    .split(MT)
    .reduce((a: any, c: string) => (a[c] = c.charCodeAt(0), a), {})
}


/*
function longest(strs: string[]) {
  return strs.reduce((a, s) => a < s.length ? s.length : a, 0)
}
 
 
// True if arrays match.
function marr(a: string[], b: string[]) {
  return (a.length === b.length && a.reduce((a, s, i) => (a && s === b[i]), true))
}
 
 
function ender(endchars: CharMap, endmarks: KV, singles?: KV) {
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
*/


export {
  Chars,
  Config,
  Context,
  JsonicError,
  KV,
  MT,
  Meta,
  Options,
  RuleState,
  S,
  Tin,
  Token,
  assign,
  badlex,
  deep,
  defprop,
  entries,
  errdesc,
  errinject,
  extract,
  keys,
  makelog,
  mesc,
  regexp,
  escre,
  tokenize,
  trimstk,
  srcfmt,
  clone,
  charset,
  snip,
  configure,
}
