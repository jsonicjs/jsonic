/* Copyright (c) 2013-2020 Richard Rodger, MIT License */


/* Specific Features
   - comment TODO test
   
*/

// NEXT: norm enders
// NEXT: backticks multiline
// NEXT: organize option names
// NEXT: remove hard-coded chars
// NEXT: keywords
// NEXT: optimise/parameterize string lex
// NEXT: text hoovering (optional) 
// NEXT: error messages

// NEXT: Parser class


// TODO: back ticks or allow newlines in strings?
// TODO: nested comments? also support //?
// TODO: parsing options? e.g. hoovering on/off?
// TODO: hoovering should happen at lex time


// Edge case notes (see unit tests):
// LNnnn: Lex Note number
// PNnnn: Parse Note number

// const I = require('util').inspect


let STANDARD_OPTIONS = {

  // Token start characters.
  sc_space: ' \t',
  sc_line: '\r\n',
  sc_number: '-0123456789',
  sc_string: '"\'',
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

  line_enders: '\n\r',

  comments: {
    '#': true,
    '//': true,
    '/*': '*/'
  },

  balance: {
    comments: true,
  },

  values: {
    'null': null,
    'true': true,
    'false': false,
  },


  digital: '-1023456789._xeEaAbBcCdDfF+',


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

  SP: Symbol('#SP'), // SPACE
  LN: Symbol('#LN'), // LINE

  NR: Symbol('#NR'), // NUMBER
  ST: Symbol('#ST'), // STRING
  TX: Symbol('#TX'), // TEXT

  VL: Symbol('#VL'), // VALUE




  spaces: {
    ' ': true,
    '\t': true,
  },

  lines: {
    '\n': true,
    '\r': true,
  },


  // Lexer states
  LS_TOP: Symbol('@TOP'), // TOP
  LS_CONSUME: Symbol('@CONSUME'), // CONSUME
  LS_MULTILINE: Symbol('@MULTILINE'), // MULTILINE


  VAL: ([] as Symbol[]),
  WSP: ([] as Symbol[]),
}


let so = STANDARD_OPTIONS



so.VAL = [so.TX, so.NR, so.ST, so.VL]
so.WSP = [so.SP, so.LN, so.CM]



type Jsonic =
  // A function that parses.
  ((src: any) => any)
  &

  // A utility with methods.
  {
    parse: (src: any) => any,
    use: (plugin: Plugin) => void
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


const BAD_UNICODE_CHAR = String.fromCharCode('0x0000' as any)






class Lexer {

  options: { [k: string]: any } = STANDARD_OPTIONS
  end: Token
  bad: any

  constructor(opts?: { [k: string]: any }) {
    let options = this.options = util.deep(this.options, opts)

    this.end = {
      pin: options.ZZ,
      loc: 0,
      len: 0,
      row: 0,
      col: 0,
      val: undefined,
    }

    options.bad = function(
      why: string,
      token: Token,
      sI: number,
      pI: number,
      rI: number,
      cI: number,
      val?: any,
      use?: any
    ): Token {
      token.pin = options.BD
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
      let qc = -1 // Quote character code.
      let ec = -1 // Escape character code.
      let us: string // Unicode character string.

      next_char:
      while (sI < srclen) {
        let c0 = src[sI]
        let c0c = src.charCodeAt(sI)

        // console.log('LEXW', state, cur, sI, src.substring(sI, sI + 11))

        if (opts.LS_TOP === state) {
          if (opts.SC_SPACE.includes(c0c)) {

            token.pin = opts.SP
            token.loc = sI
            token.col = cI++

            pI = sI + 1
            while (opts.spaces[src[pI]]) cI++, pI++;

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

            while (opts.lines[src[pI]]) {
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

                if (isNaN(token.val)) {
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

          //case '"': case '\'':
          else if (opts.SC_STRING.includes(c0c)) {
            // console.log('STRING:' + src.substring(sI))
            token.pin = opts.ST
            token.loc = sI
            token.col = cI++

            qc = c0.charCodeAt(0)
            s = []
            cc = -1

            for (pI = sI + 1; pI < srclen; pI++) {
              cI++

              cc = src.charCodeAt(pI)
              // console.log(src[pI] + '=' + cc, 's[' + s + ']')

              if (cc < 32) {
                return opts.bad('unprintable', token, sI, pI, rI, cI, src.charAt(pI))
              }
              else if (qc === cc) {
                // console.log('qc === cc', qc, cc, sI, pI)
                pI++
                break
              }
              else if (92 === cc) {
                ec = src.charCodeAt(++pI)
                cI++

                switch (ec) {
                  case 110:
                  case 116:
                  case 114:
                  case 98:
                  case 102:
                    s.push(opts.ESCAPES[ec])
                    break

                  case 117:
                    pI++
                    us = String.fromCharCode(('0x' + src.substring(pI, pI + 4)) as any)
                    if (BAD_UNICODE_CHAR === us) {
                      return opts.bad('invalid-unicode',
                        token, sI, pI, rI, cI, src.substring(pI - 2, pI + 4))
                    }

                    s.push(us)
                    pI += 3 // loop increments pI
                    cI += 4
                    break

                  default:
                    // console.log('D', sI, pI, src.substring(pI))
                    s.push(src[pI])
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

                // console.log('T', bI, pI, src.substring(bI, pI))

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

            //if (!is_line_comment) {
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
            //}

            if (is_line_comment) {
              token.pin = opts.CM
              token.loc = sI
              token.col = cI
              token.val = ''

              state = opts.LS_CONSUME
              enders = opts.line_enders
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

          while (null != src[pI] && !opts.TEXT_ENDERS.includes(src[pI])) {
            cI++
            pI++
          }

          token.len = pI - sI
          token.pin = opts.TX
          token.val = src.substring(sI, pI)

          sI = pI
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

      // console.log('ZZ', token)

      return token

    }
  }
}














let S = (s: symbol) => s.description



interface Context {
  node: any
  t0: Token
  t1: Token
  rs: Rule[]
  next: () => Token
  match: (pin: symbol, ignore?: symbol[]) => Token
  ignore: (pins: symbol[]) => void
}

abstract class Rule {
  node: any
  opts: Opts
  val: any
  key: any

  constructor(opts: Opts, node: any) {
    this.node = node
    this.opts = opts
  }

  abstract process(ctx: Context): Rule | undefined
  abstract toString(): string
}


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

        // A sequence of literals with internal spaces is concatenated
        let value: any = hoover(
          ctx,
          opts.VAL,
          [opts.SP]
        )

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

      // console.log('LIST:' + S(k) + '=' + t.value)

      switch (k) {
        case opts.TX:
        case opts.NR:
        case opts.ST:
        case opts.VL:

          // A sequence of literals with internal spaces is concatenated
          let value: any = hoover(ctx, opts.VAL, [opts.SP])

          // console.log('LR val=' + value)

          this.node.push(value)
          pk = k
          break

        case opts.CA:
          // console.log('LR comma')
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

    // console.log('VR S', this.value)
    // Child value has resolved
    if (this.val) {
      this.node[this.key] = this.val
      this.val = undefined
      return ctx.rs.pop()
    }

    let t: Token = ctx.next()
    let k = t.pin

    // console.log('VR:' + S(k) + '=' + t.value)

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

    }

    // Any sequence of literals with internal spaces is considered a single string
    let value: any = hoover(
      ctx,
      opts.VAL,
      [opts.SP]
    )


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


// Hoover up tokens into a string, possible containing whitespace, but trimming end
// Thus: ['a', ' ', 'b', ' '] => 'a b'
// NOTE: single tokens return token value, not a string!
function hoover(ctx: Context, pins: symbol[], trims: symbol[]): any {

  // Is this potentially a hoover?
  let trimC = 0
  if ((trims.includes(ctx.t1.pin) && ++trimC) || pins.includes(ctx.t1.pin)) {
    let b: Token[] = [ctx.t0, ctx.t1]

    ctx.next()

    while ((trims.includes(ctx.t1.pin) && ++trimC) ||
      (pins.includes(ctx.t1.pin) && (trimC = 0, true))) {
      b.push(ctx.t1)
      ctx.next()
    }

    // Trim end.
    b = b.splice(0, b.length - trimC)

    if (1 === b.length) {
      return b[0].val
    }
    else {
      return b.map(t => String(t.val)).join('')
    }
  }
  else {
    return ctx.t0.val
  }
}


// TODO: move inside a Parser object
function process(opts: Opts, lex: Lex): any {
  let rule: Rule | undefined = new ValueRule(opts, {}, '$', opts.UK)
  let root = rule

  let ctx: Context = {
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

  while (rule) {
    rule = rule.process(ctx)
  }

  return root.node.$
}


// TODO: replace with jsonic stringify
function desc(o: any) {
  return require('util').inspect(o, { depth: null })
}



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

    opts.SINGLE_CHARS =
      opts.SINGLES.map((s: symbol, cc: number) => String.fromCharCode(cc)).join('')

    opts.VALUE_ENDERS = opts.sc_space + opts.sc_line + opts.SINGLE_CHARS +
      opts.SC_COMMENT.map((cc: number) => String.fromCharCode(cc)).join('')

    opts.TEXT_ENDERS = opts.VALUE_ENDERS

    opts.VALUES = opts.values || {}


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
      return process(opts, self.lexer.start(src))
    }
    return src
  }

  if (parent) {
    for (let k in parent) {
      self[k] = parent
    }

    self.parent = parent
  }


  self.options = opts


  self.lexer = new Lexer(opts)

  // TODO
  // self._parser = new Parser(opts, self._lexer)


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

