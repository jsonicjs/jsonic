

import type { Rule, RuleSpec } from './jsonic'


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


// General Key-Value map.
type KV = { [k: string]: any }


// Unique token identification number (aka "tin").
type Tin = number


// Map character to Token index.
type TinMap = { [char: string]: Tin }


// Map character to code value.
type CharCodeMap = { [char: string]: number }

// TODO: rename loc to sI, row to rI, col to cI
// Tokens from the lexer.
class Token {
  tin: Tin      // Token kind.
  val: any      // Value of Token if literal (eg. number).
  src: any      // Source text of Token.
  loc: number   // Location of token index in source text.
  row: number   // Row location of token in source text.
  col: number   // Column location of token in source text.
  use?: any     // Custom meta data from plugins goes here.
  why?: string  // Error code.
  len: number   // Length of Token source text.

  constructor(
    tin: Tin,
    val: any,
    src: any,  // TODO: string
    loc: number,
    row: number,
    col: number,
    use?: any,
    why?: string,
  ) {
    this.tin = tin
    this.src = src
    this.val = val
    this.loc = loc
    this.row = row
    this.col = col
    this.use = use
    this.why = why

    this.len = src.length
  }
}


// Meta parameters for a given parse run.
type Meta = KV


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
      lexer: any, //Lexer,
      src: string,
      jsonic: any, //Jsonic,
      meta?: any,
      parent_ctx?: any
    ) => any
  }
}


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



// Uniquely resolve or assign token pin number
function tokenize<R extends string | Tin, T extends string | Tin>(
  ref: R,
  config: Config,
  jsonic?: any):
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


export {
  Config,
  Context,
  KV,
  MT,
  Meta,
  Options,
  S,
  Tin,
  TinMap,
  Token,
  CharCodeMap,
  assign,
  deep,
  defprop,
  entries,
  keys,
  mesc,
  regexp,
  tokenize,
}
