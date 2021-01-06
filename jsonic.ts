/* Copyright (c) 2013-2020 Richard Rodger, MIT License */


/* Specific Features
   - comment TODO test
   
*/

// NEXT plugin: load file: { foo: @filepath }

// NEXT: error messages

// NEXT: Parser class



// Edge case notes (see unit tests):
// LNnnn: Lex Note number
// PNnnn: Parse Note number

const I = require('util').inspect


let STANDARD_OPTIONS = {

  // Token start characters.
  sc_space: ' \t',
  sc_line: '\n\r',
  sc_number: '-0123456789',
  sc_string: '"\'`',
  sc_none: '',

  // String escape chars.
  // Denoting char (follows escape char) => actual char.
  escapes: {
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t',
  },

  // Multi-charater token ending characters.
  enders: ':,[]{} \t\n\r',

  comments: {
    '#': true,
    '//': true,
    '/*': '*/'
  },

  balance: {
    comments: true,
  },

  number: {
    underscore: true,
  },

  string: {
    multiline: '`'
  },

  text: {
    hoover: true,
  },

  values: {
    'null': null,
    'true': true,
    'false': false,
  },


  digital: '-1023456789._xeEaAbBcCdDfF+',


  bad_unicode_char: String.fromCharCode('0x0000' as any),

  // Single character tokens.
  // NOTE: character is final char of Symbol name.
  OB: Symbol('#OB{'), // OPEN BRACE
  CB: Symbol('#CB}'), // CLOSE BRACE
  OS: Symbol('#OS['), // OPEN SQUARE
  CS: Symbol('#CS]'), // CLOSE SQUARE
  CL: Symbol('#CL:'), // COLON
  CA: Symbol('#CA,'), // COMMA

  // Multi character tokens.
  BD: Symbol('#BD'), // BAD
  ZZ: Symbol('#ZZ'), // END
  UK: Symbol('#UK'), // UNKNOWN
  CM: Symbol('#CM'), // COMMENT
  AA: Symbol('#AA'), // ANY

  SP: Symbol('#SP'), // SPACE
  LN: Symbol('#LN'), // LINE

  NR: Symbol('#NR'), // NUMBER
  ST: Symbol('#ST'), // STRING
  TX: Symbol('#TX'), // TEXT

  VL: Symbol('#VL'), // VALUE


  // Lexer states
  LS_TOP: Symbol('@TOP'), // TOP
  LS_CONSUME: Symbol('@CONSUME'), // CONSUME
  LS_MULTILINE: Symbol('@MULTILINE'), // MULTILINE


  VAL: ([] as Symbol[]),
  WSP: ([] as Symbol[]),


}


type Jsonic =
  // A function that parses.
  ((src: any) => any)
  &

  // A utility with methods.
  {
    parse: (src: any) => any,
    make: (opts: Opts) => Jsonic,
    use: (plugin: Plugin) => void,
  }

  // Extensible by plugin decoration. Example: `stringify`.
  &
  { [prop: string]: any }


type Plugin = (jsonic: Jsonic) => void

type Opts = { [k: string]: any }

// Tokens from the lexer.
type Token = {
  pin: symbol,  // Token kind.
  loc: number,   // Location of token index in source text.
  len: number,   // Length of Token source text.
  row: number,   // Row location of token in source text.
  col: number,   // Column location of token in source text.
  val: any,      // Value of Token if literal (eg. number).
  why?: string,  // Error code.
  use?: any,     // Custom meta data from plugins goes here.
}

// The lexing function returns the next token.
type Lex = () => Token









class Lexer {

  options: Opts = STANDARD_OPTIONS
  end: Token
  bad: any

  constructor(options?: Opts) {
    let opts = this.options = util.deep(this.options, options)

    this.end = {
      pin: opts.ZZ,
      loc: 0,
      len: 0,
      row: 0,
      col: 0,
      val: undefined,
    }

    opts.bad = function(
      why: string,
      token: Token,
      sI: number,
      pI: number,
      rI: number,
      cI: number,
      val?: any,
      use?: any
    ): Token {
      token.pin = opts.BD
      token.loc = pI
      token.row = rI
      token.col = cI
      token.len = pI - sI + 1
      token.val = val
      token.why = why
      token.use = use
      return token
    }
  }


  // Create the lexing function.
  start(src: string): Lex {
    const opts = this.options

    // NOTE: always returns this object!
    let token: Token = {
      pin: opts.ZZ,
      loc: 0,
      row: 0,
      col: 0,
      len: 0,
      val: undefined,
    }

    // Main indexes.
    let sI = 0 // Source text index.
    let rI = 0 // Source row index.
    let cI = 0 // Source column index.

    let srclen = src.length


    // Lex next Token.
    return function lex(): Token {
      token.len = 0
      token.val = undefined
      token.row = rI

      let state = opts.LS_TOP
      let state_param: any = null
      let enders = ''

      let pI = 0 // Current lex position (only update sI at end of rule).
      let s: string[] = [] // Parsed string characters and substrings.
      let cc = -1 // Character code.

      next_char:
      while (sI < srclen) {
        let c0 = src[sI]
        let c0c = src.charCodeAt(sI)

        if (opts.LS_TOP === state) {
          if (opts.SC_SPACE.includes(c0c)) {

            token.pin = opts.SP
            token.loc = sI
            token.col = cI++

            pI = sI + 1
            while (opts.sc_space.includes(src[pI])) cI++, pI++;

            token.len = pI - sI
            token.val = src.substring(sI, pI)

            sI = pI
            return token
          }

          else if (opts.SC_LINE.includes(c0c)) {

            token.pin = opts.LN
            token.loc = sI
            token.col = cI

            pI = sI
            cI = 0

            while (opts.sc_line.includes(src[pI])) {
              // Only count \n as a row increment
              rI += ('\n' === src[pI] ? 1 : 0)
              pI++
            }

            token.len = pI - sI
            token.val = src.substring(sI, pI)

            sI = pI
            return token
          }


          else if (null != opts.SINGLES[c0c]) {
            token.pin = opts.SINGLES[c0c]
            token.loc = sI
            token.col = cI++
            token.len = 1
            sI++
            return token
          }


          else if (opts.SC_NUMBER.includes(c0c)) {
            token.pin = opts.NR
            token.loc = sI
            token.col = cI

            pI = sI
            while (opts.DIGITAL.includes(src[++pI]));

            if (null == src[pI] || opts.VALUE_ENDERS.includes(src[pI])) {
              token.len = pI - sI

              // Leading 0s are text unless hex val: if at least two
              // digits and does not start with 0x, then text.
              if (1 < token.len && '0' === src[sI] && 'x' != src[sI + 1]) {
                token.val = undefined
                pI--
              }
              else {
                token.val = +(src.substring(sI, pI))

                // Allow number format 1000_000_000 === 1e9
                if (opts.number.underscore && isNaN(token.val)) {
                  token.val = +(src.substring(sI, pI).replace(/_/g, ''))
                }

                if (isNaN(token.val)) {
                  token.val = undefined
                  pI--
                }
              }
            }

            if (null != token.val) {
              cI += token.len
              sI = pI

              return token
            }

            // NOTE: else drop through to default, as this must be literal text
            // prefixed with digits.
          }

          else if (opts.SC_STRING.includes(c0c)) {
            token.pin = opts.ST
            token.loc = sI
            token.col = cI++

            let qc = c0.charCodeAt(0)
            let multiline = opts.string.multiline.includes(c0)

            s = []
            cc = -1

            for (pI = sI + 1; pI < srclen; pI++) {
              cI++

              cc = src.charCodeAt(pI)

              if (qc === cc) {
                pI++
                break // String finished.
              }
              else if (92 === cc) {
                let ec = src.charCodeAt(++pI)
                cI++

                let es = opts.ESCAPES[ec]
                if (null != es) {
                  s.push(es)
                }

                // Unicode escape \u****
                else if (117 === ec) {
                  pI++
                  let us =
                    String.fromCharCode(('0x' + src.substring(pI, pI + 4)) as any)

                  if (opts.bad_unicode_char === us) {
                    return opts.bad(
                      'invalid-unicode',
                      token, sI, pI, rI, cI, src.substring(pI - 2, pI + 4))
                  }

                  s.push(us)
                  pI += 3 // loop increments pI
                  cI += 4
                }
                else {
                  s.push(src[pI])
                }
              }
              else if (cc < 32) {
                if (multiline && opts.SC_LINE.includes(cc)) {
                  s.push(src[pI])
                }
                else {
                  return opts.bad(
                    'unprintable', token, sI, pI, rI, cI, src.charAt(pI))
                }
              }
              else {
                let bI = pI

                do {
                  cc = src.charCodeAt(++pI)
                  cI++
                }
                while (32 <= cc && qc !== cc && 92 !== cc);
                cI--

                s.push(src.substring(bI, pI))

                pI--
              }
            }

            if (qc !== cc) {
              cI = sI
              return opts.bad('unterminated', token, sI, pI - 1, rI, cI, s.join(''))
            }

            token.val = s.join('')

            token.len = pI - sI
            sI = pI

            return token
          }


          else if (opts.SC_COMMENT.includes(c0c)) {
            let is_line_comment = opts.COMMENT_SINGLE.includes(c0)

            // Also check for comment markers as single comment char could be
            // a comment marker prefix (eg. # and ###)
            let marker = src.substring(sI, sI + opts.COMMENT_MARKER_MAXLEN)
            for (let cm of opts.COMMENT_MARKER) {
              if (marker.startsWith(cm)) {

                // Multi-line comment
                if (true !== opts.comments[cm]) {
                  token.pin = opts.CM
                  token.loc = sI
                  token.col = cI
                  token.val = ''

                  state = opts.LS_MULTILINE
                  state_param = [cm, opts.comments[cm], 'comments']
                  continue next_char
                }
                else {
                  is_line_comment = true
                }
                break;
              }
            }

            if (is_line_comment) {
              token.pin = opts.CM
              token.loc = sI
              token.col = cI
              token.val = ''

              state = opts.LS_CONSUME
              enders = opts.sc_line
              continue next_char
            }
          }

          // NOTE: default section. Cases above can bail to here if lookaheads
          // fail to match (eg. SC_NUMBER).

          // No explicit token recognized. That leaves:
          // - keyword literal values (from opts.values)
          // - text values (everything up to an end char)

          token.loc = sI
          token.col = cI

          pI = sI

          // Literal values must be terminated, otherwise they are just
          // accidental prefixes to literal text
          // (e.g truex -> "truex" not `true` "x")
          do {
            cI++
            pI++
          } while (null != src[pI] && !opts.VALUE_ENDERS.includes(src[pI]))

          let txt = src.substring(sI, pI)

          // A keyword literal value? (eg. true, false, null)
          let val = opts.VALUES[txt]

          if (undefined !== val) {
            token.pin = opts.VL
            token.val = val
            token.len = pI - sI
            sI = pI
            return token
          }


          // Only thing left is literal text
          let text_enders = opts.text.hoover ? opts.HOOVER_ENDERS : opts.TEXT_ENDERS

          while (null != src[pI] && !text_enders.includes(src[pI])) {
            cI++
            pI++
          }

          token.len = pI - sI
          token.pin = opts.TX
          token.val = src.substring(sI, pI)

          // If hoovering, separate space at end from text
          if (opts.text.hoover &&
            opts.sc_space.includes(token.val[token.val.length - 1])) {

            // Find last non-space char
            let tI = token.val.length - 2
            while (0 < tI && opts.sc_space.includes(token.val[tI])) tI--;
            token.val = token.val.substring(0, tI + 1)

            // Adjust column counter backwards by end space length
            cI -= (token.len - tI - 1)

            token.len = token.val.length

            // Ensures end space will be seen as the next token 
            sI += token.len
          }
          else {
            sI = pI
          }

          return token
        }


        // Lexer State: CONSUME => all chars up to first ender
        else if (opts.LS_CONSUME === state) {
          pI = sI
          while (pI < srclen && !enders.includes(src[pI])) pI++, cI++;

          token.val += src.substring(sI, pI)
          token.len = token.val.length

          sI = pI

          state = opts.LS_TOP
          return token
        }


        // Lexer State: MULTILINE => all chars up to last close marker, or end
        else if (opts.LS_MULTILINE === state) {
          pI = sI

          let depth = 1
          let open = state_param[0]
          let close = state_param[1]
          let balance = opts.balance[state_param[2]]
          let openlen = open.length
          let closelen = close.length

          // Assume starts with open string
          pI += open.length

          while (pI < srclen && 0 < depth) {

            // Close first so that open === close case works
            if (close[0] === src[pI] &&
              close === src.substring(pI, pI + closelen)) {
              pI += closelen
              depth--
            }
            else if (balance && open[0] === src[pI] &&
              open === src.substring(pI, pI + openlen)) {
              pI += openlen
              depth++
            }
            else {
              pI++
            }
          }

          token.val = src.substring(sI, pI)
          token.len = token.val.length

          sI = pI

          state = opts.LS_TOP
          return token
        }
      }


      // LN001: keeps returning ZZ past end of input
      token.pin = opts.ZZ
      token.loc = srclen
      token.col = cI

      return token
    }
  }
}














let S = (s: symbol) => s.description



interface Context {
  opts: Opts
  node: any
  t0: Token
  t1: Token
  rs: Rule[]
  next: () => Token
  match: (pin: symbol, ignore?: symbol[]) => Token
  ignore: (pins: symbol[]) => void
}


enum RuleState {
  open,
  close,
}


class Rule {
  spec: RuleSpec
  node: any
  opts: Opts
  state: RuleState
  child: Rule
  open: Token[]
  close: Token[]

  val: any
  key: any

  constructor(spec: RuleSpec, opts: Opts) {
    this.spec = spec
    this.node = undefined
    this.opts = opts
    this.state = RuleState.open
    this.child = norule
    this.open = []
    this.close = []
  }


  process(ctx: Context) {
    let rule = norule

    if (RuleState.open === this.state) {
      rule = this.spec.open(this, ctx)
    }
    else if (RuleState.close === this.state) {
      rule = this.spec.close(this, ctx)
    }

    return rule
  }

  toString() {
    return I(this.spec)
  }
}


let norule = ({} as Rule) //new Rule(({} as RuleSpec), {})





class RuleSpec {
  name: string
  def: any
  rm: { [name: string]: RuleSpec }
  child: Rule
  match: any

  constructor(name: string, def: any, rm: { [name: string]: RuleSpec }) {
    this.name = name
    this.def = def
    this.rm = rm
    this.child = norule
  }

  open(rule: Rule, ctx: Context) {
    let next: Rule = norule

    if (this.def.before_open) {
      let out = this.def.before_open.call(this, rule)
      rule.node = out.node || rule.node
    }

    let act = this.match_alts(this.def.open, ctx)

    if (act.e) {
      throw new Error('unexpected token: ' + I(act.e))
    }

    rule.open = act.m

    if (act.p) {
      ctx.rs.push(rule)
      next = rule.child = new Rule(this.rm[act.p], rule.opts)
    }
    else if (act.r) {
      next = new Rule(this.rm[act.r], rule.opts)
    }

    if (this.def.after_open) {
      this.def.after_open.call(this, rule, next)
    }

    return next
  }


  close(rule: Rule, ctx: Context) {
    let next: Rule = norule

    if (this.def.before_close) {
      this.def.before_close.call(this, rule)
    }

    let act = this.match_alts(this.def.open, ctx)

    if (act.e) {
      throw new Error('unexpected token: ' + act.e.pin + act.e.val)
    }

    if (act.r) {
      next = new Rule(this.rm[act.r], rule.opts)
    }

    if (this.def.after_close) {
      this.def.after_close.call(this, rule, next)
    }

    return next
  }


  // first match wins
  match_alts(alts: any[], ctx: Context): any {
    if (0 < alts.length) {
      for (let alt of alts) {
        if (alt.t === ctx.opts.AA) {
          return alt
        }

        else if (alt.t === ctx.t0) {
          return alt
        }

        // 2 token lookahead
        else if (alt.s) {
          if (1 === alt.s.length && alt.s[0] === ctx.t0) {
            return alt
          }
          else if (2 === alt.s.length && alt.s[0] === ctx.t0 && alt.s[1] === ctx.t1) {
            return alt
          }
        }
      }

      return { e: ctx.t0 }
    }

    return {}
  }
}





/*
class PairRule extends Rule {

  constructor(opts: Opts, key?: string) {
    super(opts, {})

    // If implicit map, key is already parsed
    this.key = key
  }

  process(ctx: Context): Rule | undefined {
    let opts = this.opts
    ctx.ignore(opts.WSP)

    // Implicit map so key already parsed
    if (this.key) {
      ctx.rs.push(this)
      let key = this.key
      delete this.key
      return new ValueRule(opts, this.node, key, opts.OB)
    }

    let t: Token = ctx.next()
    let k = t.pin

    switch (k) {
      case opts.TX:
      case opts.NR:
      case opts.ST:
      case opts.VL:
        let value = ctx.t0.val

        ctx.match(opts.CL, opts.WSP)

        ctx.rs.push(this)
        return new ValueRule(opts, this.node, value, opts.OB)

      case opts.CA:
        return this

      default:
        let rule = ctx.rs.pop()

        // Return self as value to parent rule
        if (rule) {
          rule.val = this.node
        }
        return rule
    }
  }

  toString() {
    return 'Pair: ' + desc(this.node)
  }
}


class ListRule extends Rule {
  firstpin: symbol | undefined

  constructor(opts: Opts, firstval?: any, firstpin?: symbol) {
    super(opts, undefined === firstval ? [] : [firstval])
    this.firstpin = firstpin
  }

  process(ctx: Context): Rule | undefined {
    let opts = this.opts

    if (this.val) {
      this.node.push(this.val)
      this.val = undefined
    }

    let pk: symbol = this.firstpin || opts.UK
    this.firstpin = undefined

    while (true) {
      ctx.ignore(opts.WSP)

      let t: Token = ctx.next()
      let k = t.pin

      switch (k) {
        case opts.TX:
        case opts.NR:
        case opts.ST:
        case opts.VL:

          // A sequence of literals with internal spaces is concatenated
          let value = ctx.t0.val

          this.node.push(value)
          pk = k
          break

        case opts.CA:
          // Insert null before comma if value missing.
          // Trailing commas are ignored.
          if (opts.CA === pk || 0 === this.node.length) {
            this.node.push(null)
          }
          pk = k
          break

        case opts.OB:
          ctx.rs.push(this)
          pk = k
          return new PairRule(opts,)

        case opts.OS:
          ctx.rs.push(this)
          pk = k
          return new ListRule(opts,)

        case opts.CL:
          // TODO: proper error msgs, incl row,col etc
          throw new Error('key-value pair inside list')


        default:
          let rule = ctx.rs.pop()

          // Return self as value to parent rule
          if (rule) {
            rule.val = this.node
          }
          return rule
      }
    }
  }

  toString() {
    return 'Pair: ' + desc(this.node)
  }
}



class ValueRule extends Rule {
  parent: symbol

  constructor(opts: Opts, node: any, key: string, parent: symbol) {
    super(opts, node)
    this.key = key
    this.parent = parent
  }

  process(ctx: Context): Rule | undefined {
    let opts = this.opts
    ctx.ignore(opts.WSP)

    // Child value has resolved
    if (this.val) {
      this.node[this.key] = this.val
      this.val = undefined
      return ctx.rs.pop()
    }

    let t: Token = ctx.next()
    let k = t.pin

    switch (k) {
      case opts.OB:
        ctx.rs.push(this)
        return new PairRule(opts)

      case opts.OS:
        ctx.rs.push(this)
        return new ListRule(opts)

      // Implicit list
      case opts.CA:
        ctx.rs.push(this)
        return new ListRule(opts, null, opts.CA)

      // TODO: proper error messages
      case opts.BD:
        throw new Error(t.why)
    }

    let value = ctx.t0.val

    // Is this an implicit map?
    if (opts.CL === ctx.t1.pin) {
      this.parent = opts.OB
      ctx.next()

      ctx.rs.push(this)
      return new PairRule(opts, String(value))
    }
    // Is this an implicit list (at top level only)?
    else if (opts.CA === ctx.t1.pin && opts.OB !== this.parent) {
      this.parent = opts.OS
      ctx.next()

      ctx.rs.push(this)
      return new ListRule(opts, value, opts.CA)
    }
    else {
      this.node[this.key] = value
      return ctx.rs.pop()
    }
  }

  toString() {
    return 'Value: ' + this.key + '=' + desc(this.val) + ' node=' + desc(this.node)
  }

}
*/


class Parser {

  options: Opts = STANDARD_OPTIONS
  rules: { [name: string]: any }
  rulespecs: { [name: string]: RuleSpec }

  constructor(options?: Opts) {
    let o = this.options = util.deep(this.options, options)

    this.rules = {
      value: {
        open: [ // alternatives
          { t: o.OB, p: 'map' },  // p:push onto rule stack
          { t: o.OS, p: 'list' },
          //{ t: o.CA, r: 'list' },
          //{ s: [o.ST, o.CL], r: 'pair' },
          //{ s: [o.TX, o.CL], r: 'pair' },
          { t: o.AA },   // pop and return token value
        ],
        close: [],
        before_close: (rule: Rule) => {
          rule.node = rule.child.node ?? rule.open[0].val
        },
      },


      map: {
        before_open: () => {
          return { node: {} }
        },
        open: [
          { p: 'pair' } // no tokens, pass node
        ],
        close: []
      },

      list: {
        before_open: () => {
          return { node: [] }
        },
        open: [
          { p: 'elem' } // no tokens, pass node
        ],
        close: []
        // default output is node
      },


      // sets key:val on node
      pair: {
        state: {
          open: [
            { s: [o.ST, o.CL], p: 'value' }
          ],
          close: [
            { s: [o.CA], r: 'pair' }, // next rule (no stack push)
            { s: [o.CB] },
          ]
        },
        before_close: (rule: Rule) => {
          rule.node[rule.open[0].val] = rule.child.node
        },
        // default output is node
      },


      // push onto node
      elem: {
        open: [
          { s: [o.TX], p: 'value' }
        ],
        close: [
          { s: [o.CA], r: 'elem' }
        ],
        before_close: (open: any) => {
          open.node.push(open.output)
        },
        // default output is node
      }
    }


    this.rulespecs = Object.keys(this.rules).reduce((rs: any, rn: string) => {
      rs[rn] = new RuleSpec(rn, this.rules[rn], rs)
      return rs
    }, {})
  }


  start(lex: Lex): any {
    let opts = this.options
    //let rule: Rule | undefined = new ValueRule(opts, {}, '$', opts.UK)
    let rule = new Rule(this.rulespecs.value, opts)
    let root = rule

    let ctx: Context = {
      opts: opts,
      node: undefined,
      t0: opts.end,
      t1: opts.end,
      next,
      match,
      ignore: ignorable,
      rs: []
    }

    function next() {
      ctx.t0 = ctx.t1
      ctx.t1 = { ...lex() }
      return ctx.t0
    }

    function ignorable(ignore: symbol[]) {
      while (ignore.includes(ctx.t1.pin)) {
        next()
      }
    }

    function match(pin: symbol, ignore?: symbol[]) {
      if (ignore) {
        ignorable(ignore)
      }

      if (pin === ctx.t1.pin) {
        let t = next()

        if (ignore) {
          ignorable(ignore)
        }

        return t
      }
      throw new Error('expected: ' + String(pin) + ' saw:' + String(ctx.t1.pin) + '=' + ctx.t1.val)
    }

    next()

    while (norule !== rule) {
      rule = rule.process(ctx)
    }

    return root.node
  }
}

/*
// TODO: replace with jsonic stringify
function desc(o: any) {
  return require('util').inspect(o, { depth: null })
}
*/


let util = {

  // Deep override for plain objects. Retains base object.
  // Array indexes are treated as properties.
  // Over wins non-matching types, except at top level.
  deep: function(base?: any, over?: any): any {
    if (null != base && null != over) {
      for (let k in over) {
        base[k] = (
          'object' === typeof (base[k]) &&
          'object' === typeof (over[k]) &&
          (Array.isArray(base[k]) === Array.isArray(over[k]))
        ) ? util.deep(base[k], over[k]) : over[k]
      }
      return base
    }
    else {
      return null != over ? over : null != base ? base :
        undefined != over ? over : base
    }
  },


  // Convert string to character code array.
  // 'ab' -> [97,98]
  s2cca: function(s: string): number[] {
    return s.split('').map((c: string) => c.charCodeAt(0))
  },


  longest: (strs: string[]) =>
    strs.reduce((a, s) => a < s.length ? s.length : a, 0),

  // Idempotent normalization of options.
  norm_options: function(opts: Opts) {
    let keys = Object.keys(opts)

    // Convert character list strings to code arrays.
    // sc_foo:'ab' -> SC_FOO:[97,98]
    keys.filter(k => k.startsWith('sc_')).forEach(k => {
      opts[k.toUpperCase()] = util.s2cca(opts[k])
    })

    // Lookup table for single character tokens, indexed by char code.
    opts.SINGLES = keys
      .filter(k => 2 === k.length &&
        'symbol' === typeof (opts[k]) &&
        4 === opts[k].description.length)
      .reduce((a: number[], k) =>
        (a[opts[k].description.charCodeAt(3)] = opts[k], a), [])

    // lookup table for escape chars, indexed by denotating char (e.g. n for \n).
    opts.escapes = opts.escapes || {}
    opts.ESCAPES = Object.keys(opts.escapes)
      .reduce((a: string[], ed: string) =>
        (a[ed.charCodeAt(0)] = opts.escapes[ed], a), [])

    opts.DIGITAL = opts.digital || ''


    opts.SC_COMMENT = []
    opts.COMMENT_SINGLE = ''
    opts.COMMENT_MARKER = []

    if (opts.comments) {
      let comment_markers = Object.keys(opts.comments)

      comment_markers.forEach(k => {

        // Single character comment marker (eg. `#`)
        if (1 === k.length) {
          opts.SC_COMMENT.push(k.charCodeAt(0))
          opts.COMMENT_SINGLE += k
        }

        // String comment marker (eg. `//`)
        else {
          opts.SC_COMMENT.push(k.charCodeAt(0))
          opts.COMMENT_MARKER.push(k)
        }
      })

      opts.COMMENT_MARKER_MAXLEN = util.longest(comment_markers)
    }

    opts.SC_COMMENT_CHARS =
      opts.SC_COMMENT.map((cc: number) => String.fromCharCode(cc)).join('')

    opts.SINGLE_CHARS =
      opts.SINGLES.map((s: symbol, cc: number) => String.fromCharCode(cc)).join('')

    opts.VALUE_ENDERS =
      opts.sc_space + opts.sc_line + opts.SINGLE_CHARS + opts.SC_COMMENT_CHARS


    opts.TEXT_ENDERS = opts.VALUE_ENDERS

    opts.HOOVER_ENDERS = opts.sc_line + opts.SINGLE_CHARS + opts.SC_COMMENT_CHARS

    opts.VALUES = opts.values || {}


    // Token sets
    opts.VAL = [opts.TX, opts.NR, opts.ST, opts.VL]
    opts.WSP = [opts.SP, opts.LN, opts.CM]

    return opts
  }
}


function make(first?: Opts | Jsonic, parent?: Jsonic): Jsonic {

  let param_opts = (first as Opts)
  if ('function' === typeof (first)) {
    param_opts = {}
    parent = (first as Jsonic)
  }

  let opts = util.deep(util.deep(
    {}, parent ? parent.options : STANDARD_OPTIONS), param_opts)
  opts = util.norm_options(opts)

  let self: any = function Jsonic(src: any): any {
    if ('string' === typeof (src)) {
      return self._parser.start(self._lexer.start(src))
    }
    return src
  }

  if (parent) {
    for (let k in parent) {
      self[k] = parent
    }

    self.parent = parent
  }


  self._lexer = new Lexer(opts)
  self._parser = new Parser(opts)


  self.options = opts

  self.parse = self


  self.use = function use(plugin: Plugin): void {
    plugin(self)
  }


  self.make = function(opts: Opts) {
    return make(opts, self)
  }

  return (self as Jsonic)
}



let Jsonic: Jsonic = make()

export { Jsonic, Plugin, Lexer, util }

