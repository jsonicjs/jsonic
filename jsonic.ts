/* Copyright (c) 2013-2020 Richard Rodger, MIT License */


/* Specific Features
   - comment TODO test
   
*/

// NEXT: organize option names
// NEXT: remove hard-coded chars
// NEXT: multi-char single-line comments
// NEXT: keywords
// NEXT: optimise/parameterize string lex
// NEXT: text hoovering (optional) 
// NEXT: error messages


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
  SC_SPACE: s2cca(' \t'),
  SC_LINE: s2cca('\r\n'),
  SC_NUMBER: s2cca('-0123456789'),
  SC_STRING: s2cca('"\''),
  SC_COMMENT: s2cca('#'),
  SC_SINGLES: s2cca('{}[]:,'),
  SC_NONE: s2cca(''),

  SINGLES: ([] as symbol[]),

  CHARS_END: '\n\r',
  VALUES: ({
    'null': null,
    'true': true,
    'false': false,
  } as any),
  MAXVLEN: 0,
  VREGEXP: new RegExp(''),


  ender: {
    ':': true,
    ',': true,
    ']': true,
    '}': true,
    ' ': true,
    '\t': true,
    '\n': true,
    '\r': true,
    undefined: true
  },

  digital: {
    '0': true,
    '1': true,
    '2': true,
    '3': true,
    '4': true,
    '5': true,
    '6': true,
    '7': true,
    '8': true,
    '9': true,
    '.': true,
    '_': true,
    'x': true,
    'e': true,
    'E': true,
    'a': true,
    'A': true,
    'b': true,
    'B': true,
    'c': true,
    'C': true,
    'd': true,
    'D': true,
    'f': true,
    'F': true,
    '+': true,
    '-': true,
  },

  spaces: {
    ' ': true,
    '\t': true,
  },

  lines: {
    '\n': true,
    '\r': true,
  },

  escapes: new Array(256),


  // Lexer states
  LS_TOP: Symbol('@TOP'), // LEXER STATE TOP
  LS_CONSUME: Symbol('@CONSUME'), // LEXER STATE CONSUME


  // Character classes
  BD: Symbol('#BD'), // BAD
  ZZ: Symbol('#ZZ'), // END
  UK: Symbol('#UK'), // UNKNOWN
  CM: Symbol('#CM'), // COMMENT

  SP: Symbol('#SP'), // SPACE
  LN: Symbol('#LN'), // LINE

  OB: Symbol('#OB'), // OPEN BRACE
  CB: Symbol('#CB'), // CLOSE BRACE
  OS: Symbol('#OS'), // OPEN SQUARE
  CS: Symbol('#CS'), // CLOSE SQUARE
  CL: Symbol('#CL'), // COLON
  CA: Symbol('#CA'), // COMMA

  NR: Symbol('#NR'), // NUMBER
  ST: Symbol('#ST'), // STRING
  TX: Symbol('#TX'), // TEXT

  VL: Symbol('#VL'),

  VAL: ([] as Symbol[]),
  WSP: ([] as Symbol[]),
}


let so = STANDARD_OPTIONS

so.escapes[98] = '\b'
so.escapes[102] = '\f'
so.escapes[110] = '\n'
so.escapes[114] = '\r'
so.escapes[116] = '\t'


so.VAL = [so.TX, so.NR, so.ST, so.VL]
so.WSP = [so.SP, so.LN, so.CM]


so.SINGLES['{'.charCodeAt(0)] = so.OB
so.SINGLES['}'.charCodeAt(0)] = so.CB
so.SINGLES['['.charCodeAt(0)] = so.OS
so.SINGLES[']'.charCodeAt(0)] = so.CS
so.SINGLES[':'.charCodeAt(0)] = so.CL
so.SINGLES[','.charCodeAt(0)] = so.CA



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

function s2cca(s: string) { return s.split('').map((c: string) => c.charCodeAt(0)) }





class Lexer {

  options: { [k: string]: any } = STANDARD_OPTIONS
  end: Token
  bad: any

  constructor(opts?: { [k: string]: any }) {
    let options = this.options = deep(this.options, opts)

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


    // Parse next Token.
    return function lex(): Token {
      token.len = 0
      token.val = undefined
      token.row = rI

      let state = opts.LS_TOP
      let endchars = ''
      let pI = 0 // Current lex position (only update sI at end of rule).
      let s: string[] = [] // Parsed string characters and substrings.
      let cc = -1 // Character code.
      let qc = -1 // Quote character code.
      let ec = -1 // Escape character code.
      let us: string // Unicode character string.

      while (sI < srclen) {
        let cur = src[sI]
        let curc = src.charCodeAt(sI)

        // console.log('LEXW', state, cur, sI, src.substring(sI, sI + 11))

        if (opts.LS_TOP === state) {
          if (opts.SC_SPACE.includes(curc)) {

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

          else if (opts.SC_LINE.includes(curc)) {

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


          else if (opts.SC_SINGLES.includes(curc)) {
            token.pin = opts.SINGLES[curc]
            token.loc = sI
            token.col = cI++
            token.len = 1
            sI++
            return token
          }


          else if (opts.SC_NUMBER.includes(curc)) {
            token.pin = opts.NR
            token.loc = sI
            token.col = cI

            pI = sI
            while (opts.digital[src[++pI]]);

            // console.log('NR', pI, sI, src[sI], src[sI + 1])


            if (opts.ender[src[pI]]) {
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

            // not a number
            if (null == token.val) {
              while (!opts.ender[src[++pI]]);
              token.pin = opts.TX
              token.len = pI - sI
              token.val = src.substring(sI, pI)
            }

            cI += token.len
            sI = pI

            return token
          }

          //case '"': case '\'':
          else if (opts.SC_STRING.includes(curc)) {
            // console.log('STRING:' + src.substring(sI))
            token.pin = opts.ST
            token.loc = sI
            token.col = cI++

            qc = cur.charCodeAt(0)
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
                // console.log('B', pI, ec, src[pI])

                cI++

                switch (ec) {
                  case 110:
                  case 116:
                  case 114:
                  case 98:
                  case 102:
                    s.push(opts.escapes[ec])
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


          //case '#':
          else if (opts.SC_COMMENT.includes(curc)) {
            token.pin = opts.CM
            token.loc = sI++
            token.col = cI++
            token.val = cur
            state = opts.LS_CONSUME
            endchars = opts.CHARS_END
          }

          else {
            token.loc = sI
            token.col = cI

            // VALUE
            let m = src.substring(sI, sI + opts.MAXVLEN + 1).match(opts.VREGEXP)
            if (m) {
              token.pin = opts.VL
              token.len = m[1].length
              token.val = opts.VALUES[m[1]]

              cI += token.len
              sI += token.len
            }

            // TEXT
            else {

              pI = sI

              do {
                cI++
              } while (!opts.ender[src[++pI]] && '#' !== src[pI])

              token.pin = opts.TX
              token.len = pI - sI
              token.val = src.substring(sI, pI)

              sI = pI
            }

            return token
          }
        }

        else if (opts.LS_CONSUME === state) {
          pI = sI
          while (pI < srclen && !endchars.includes(src[pI])) pI++, cI++;

          token.val += src.substring(sI, pI)
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
      while (ignore.includes(ctx.t1.pin)) {
        next()
      }
    }

    if (pin === ctx.t1.pin) {
      let t = next()

      if (ignore) {
        while (ignore.includes(ctx.t1.pin)) {
          next()
        }
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


/*
let Jsonic: Jsonic = Object.assign(parse, {
  use,
  parse: (src: any) => parse(src),

  lexer,
  process,
})
*/


function deep(base?: { [k: string]: any }, parent?: { [k: string]: any }): any {
  // TODO: implement
  return parent || base
}



function make(param_opts?: Opts, parent?: Jsonic): Jsonic {

  let opts = deep(param_opts, parent ? parent.options : STANDARD_OPTIONS)

  let vstrs = Object.keys(opts.VALUES)
  opts.MAXVLEN = vstrs.reduce((a, s) => a < s.length ? s.length : a, 0)

  // TODO: insert enders dynamically
  opts.VREGEXP =
    new RegExp('^(' + vstrs.join('|') + ')([ \\t\\r\\n{}:,[\\]]|$)')


  let self: any = parent ? { ...parent } : function(src: any): any {
    if ('string' === typeof (src)) {
      return process(opts, self.lexer.start(src))
    }
    return src
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

export { Jsonic, Plugin, Lexer, deep }

