

import type {
  Rule,
  RuleSpec,
} from './parser'

import type {
  Lex,
} from './lexer'

import {
  Token,
  LexMatcher,
  MakeLexMatcher,
} from './lexer'


// TODO: refactor
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
  unterminated_string: 'unterminated_string',
  unterminated_comment: 'unterminated_comment',
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
  lex: {
    match: MakeLexMatcher[]
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



// Internal configuration built from options by `configure`.
type Config = {

  lex: {
    match: LexMatcher[],
  }

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
    sepChar?: string
  }

  // String quote characters.
  string: {
    lex: boolean
    quoteMap: Chars,
    escMap: KV,
    escChar: string,
    escCharCode: number,
    multiChars: Chars,
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
      end?: string
      lex: boolean
    }[]
  }

  rePart: any,

  re: any,

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
    t: {},
    lex: {},
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
    //token: map(opts.fixed.token, ([name, src]: [string, string]) => [src, t(name)])
    token: map(opts.fixed.token,
      ([name, src]: [string, string]) => [src, tokenize(name, cfg)])
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
    sepChar: opts.number.sep,
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


  let fixedSorted = Object.keys(cfg.fixed.token)
    .sort((a: string, b: string) => b.length - a.length)

  let fixedRE = fixedSorted.map(fixed => escre(fixed)).join('|')

  let commentStartRE = opts.comment.lex ? opts.comment.marker
    .filter(c => c.lex)
    .map(c => '|' + escre(c.start)).join('')
    : ''

  // End-marker RE part
  let enderRE = [
    '([',
    escre(keys(charset(
      cfg.space.lex && cfg.space.chars,
      cfg.line.lex && cfg.line.chars,
    )).join('')),
    ']|',
    fixedRE,

    commentStartRE,

    '|$)', // EOF case
  ]

  cfg.rePart = {
    fixed: fixedRE,
    ender: enderRE,
    commentStart: commentStartRE,
  }


  // TODO: friendlier names
  cfg.re = {
    ender: regexp(null, ...enderRE),

    // TODO: prebuild these using a property on matcher?
    rowChars: regexp(null, escre(opts.line.rowChars)),

    columns: regexp(null, '[' + escre(opts.line.chars) + ']', '(.*)$'),

  }


  cfg.lex.match = opts.lex.match.map((maker: any) => maker(cfg, opts))


  cfg.debug = {
    get_console: opts.debug.get_console,
    maxlen: opts.debug.maxlen,
    print: {
      config: opts.debug.print.config
    },
  }


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
  let row = 0 < token.rI ? token.rI : 1
  let col = 0 < token.cI ? token.cI : 1
  let tsrc = null == token.src ? MT : token.src
  let behind = src.substring(Math.max(0, loc - 333), loc).split('\n')
  let ahead = src.substring(loc, loc + 333).split('\n')

  let pad = 2 + (MT + (row + 2)).length
  let rc = row < 3 ? 1 : row - 2
  let ln = (s: string) => '\x1b[34m' + (MT + (rc++)).padStart(pad, ' ') +
    ' | \x1b[0m' + (null == s ? MT : s)

  let blen = behind.length

  let lines = [
    2 < blen ? ln(behind[blen - 3]) : null,
    1 < blen ? ln(behind[blen - 2]) : null,
    ln(behind[blen - 1] + ahead[0]),
    (' '.repeat(pad)) + '   ' +
    ' '.repeat(col - 1) +
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
  map,
}
