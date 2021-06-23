/* Copyright (c) 2013-2021 Richard Rodger, MIT License */

// TODO: row numbers need to start at 1 as editors start line numbers at 1
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
  KV,
  MT,
  Meta,
  Options,
  S,
  Tin,
  TinMap,
  Token,
  assign,
  deep,
  defprop,
  entries,
  keys,
  tokenize,
  regexp,
  mesc,
  CharCodeMap,
} from './intern'


import {
  Lex,
  Lexer,
  LexMatcher,
  LexMatcherListMap,
  LexMatcherResult,
  LexMatcherState,
} from './lexer'


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




type Plugin = (jsonic: Jsonic) => void | Jsonic









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
          // A map: { ...
          { s: [OB], p: S.map, b: 1 },

          // A list: [ ...
          { s: [OS], p: S.list, b: 1 },

          // A pair key: a: ...
          { s: [VAL, CL], p: S.map, b: 2, n: { im: 1 } },

          // A plain value: x "x" 1 true.
          { s: [VAL] },

          // Implicit ends `{a:}` -> {"a":null}, `[a:]` -> [{"a":null}]
          { s: [[CB, CS]], b: 1 },

          // Implicit list at top level: a,b.
          { s: [CA], d: 0, p: S.list, b: 1 },

          // Value is null when empty before commas.
          { s: [CA], b: 1, g: S.imp_list },
        ],

        close: [
          // Implicit list only allowed at top level: 1,2.
          {
            s: [CA], d: 0, r: S.elem,
            a: (rule: Rule) => rule.node = [rule.node],
            g: S.imp_list
          },

          // TODO: find a cleaner way to handle this edge case.
          // Allow top level "a b".
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

          // Close value, map, or list, but perhaps there are more elem?
          { b: 1 },
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
          // Create a new empty map.
          return { node: {} }
        },
        open: [
          // An empty map: {}.
          { s: [OB, CB] },

          // Start matching map key-value pairs: a:1.
          // OB `{` resets implicit map counter.
          { s: [OB], p: S.pair, n: { im: 0 } },

          // Pair from implicit map.
          { s: [VAL, CL], p: S.pair, b: 2 },
        ],
        close: []
      },

      list: {
        bo: () => {
          // Create a new empty list.
          return { node: [] }
        },
        open: [
          // An empty list: [].
          { s: [OS, CS] },

          // Start matching list elements: 1,2.
          { s: [OS], p: S.elem },

          // Initial comma [, will insert null as [null,
          { s: [CA], p: S.elem, b: 1 },

          // Another element.
          { p: S.elem },
        ],
        close: [
        ]
      },


      // sets key:val on node
      pair: {
        open: [
          // Match key-colon start of pair.
          { s: [VAL, CL], p: S.val, u: { key: true } },

          // Ignore initial comma: {,a:1.
          { s: [CA] },
        ],
        close: [
          // End of map, reset implicit depth counter so that
          // a:b:c:1,d:2 -> {a:{b:{c:1}},d:2}
          { s: [CB], c: { n: { im: 0 } } },

          // Ignore trailing comma at end of map.
          { s: [CA, CB], c: { n: { im: 0 } } },

          // Comma means a new pair at same level (unless implicit a:b:1,c:2).
          { s: [CA], c: { n: { im: 0 } }, r: S.pair },

          // Who needs commas anyway?
          { s: [VAL], c: { n: { im: 0 } }, r: S.pair, b: 1 },

          // End of implicit path a:b:1,.
          { s: [[CB, CA, ...VAL]], b: 1 },

          // Close implicit single prop map inside list: [a:1,]
          { s: [CS], b: 1 },

          // Fail if auto-close option is false.
          { s: [ZZ], e: finish, g: S.end },
        ],
        bc: (r: Rule, ctx: Context) => {

          // If top level implicit map, correct `im` count.
          // rs=val,map => len 2; a:b:1 should be im=1, not 2 as with {a:b:.
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
          // Empty commas insert null elements.
          // Note that close consumes a comma, so b:2 works.
          { s: [CA, CA], b: 2, a: (r: Rule) => r.node.push(null), g: S.nUll, },
          { s: [CA], a: (r: Rule) => r.node.push(null), g: S.nUll, },

          // Anything else must a list element value.
          { p: S.val },
        ],
        close: [
          // Ignore trailing comma.
          { s: [CA, CS] },

          // Next element.
          { s: [CA], r: S.elem },

          // Who needs commas anyway?
          { s: [[...VAL, OB, OS]], r: S.elem, b: 1 },

          // End of list.
          { s: [CS] },

          // Fail if auto-close option is false.
          { s: [ZZ], e: finish, g: S.end },
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
    let lex =
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
    let token = lex.next(rule)

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
  let t = options.token
  let token_names = keys(t)

  // Index of tokens by name.
  token_names.forEach(tn => tokenize(tn, config))

  let single_char_token_names = token_names
    .filter(tn => null != (t[tn] as any).c && 1 === (t[tn] as any).c.length)

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
