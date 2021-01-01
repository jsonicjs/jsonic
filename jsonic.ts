/* Copyright (c) 2013-2020 Richard Rodger, MIT License */


/* Specific Features
   - comment TODO test
   
*/

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


// This function is the core Jsonic object.
// Only parses strings, everything else is returned as-is.
function parse(src: any): any {
  if ('string' === typeof (src)) {
    return process(lexer(src))
  }
  return src
}


// Plugins are given the core Jsonic object (`parse`) to modify.
function use(plugin: Plugin): void {
  plugin(parse as Jsonic)
}


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

const lexer_opts = {
  // Token start characters.
  SC_SPACE: s2cca(' \t'),
  SC_LINE: s2cca('\r\n'),
  SC_NUMBER: s2cca('-0123456789'),
  SC_STRING: s2cca('"\''),
  SC_COMMENT: s2cca('#'),
  SC_SINGLES: s2cca('{}[]:,'),
  SC_NONE: s2cca(''),
  SC_OB: s2cca('{'),
  SC_CB: s2cca('}'),
  SC_OS: s2cca('['),
  SC_CS: s2cca(']'),
  SC_CL: s2cca(':'),
  SC_CA: s2cca(','),

  SINGLES: ([] as symbol[]),
  CHARS_END: '\n\r',
}


// Create the lexing function.
function lexer(src: string, param_opts?: { [k: string]: any }): Lex {
  const opts = { ...lexer_opts, ...param_opts }

  // NOTE: always returns this object!
  let token: Token = {
    pin: ZZ,
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

    let state = LS_TOP
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

      if (LS_TOP === state) {
        if (opts.SC_SPACE.includes(curc)) {

          token.pin = SP
          token.loc = sI
          token.col = cI++

          pI = sI + 1
          while (lexer.spaces[src[pI]]) cI++, pI++;

          token.len = pI - sI
          token.val = src.substring(sI, pI)

          sI = pI
          return token
        }

        if (opts.SC_LINE.includes(curc)) {

          token.pin = lexer.LN
          token.loc = sI
          token.col = cI

          pI = sI
          cI = 0

          while (lexer.lines[src[pI]]) {
            // Only count \n as a row increment
            rI += ('\n' === src[pI] ? 1 : 0)
            pI++
          }

          token.len = pI - sI
          token.val = src.substring(sI, pI)

          sI = pI
          return token
        }

        if (opts.SC_SINGLES.includes(curc)) {
          token.pin = opts.SINGLES[curc]
          token.loc = sI
          token.col = cI++
          token.len = 1
          sI++
          return token
        }

        //case 't':
        if ('t' === cur) {
          token.pin = lexer.BL
          token.loc = sI
          token.col = cI

          pI = sI

          if ('rue' === src.substring(pI + 1, pI + 4) &&
            lexer.ender[src[pI + 4]]) {
            token.val = true
            token.len = 4
            pI += 4
          }

          // not a true literal
          else {
            while (!lexer.ender[src[++pI]]);
            token.pin = lexer.TX
            token.len = pI - sI
            token.val = src.substring(sI, pI)
          }

          cI += token.len
          sI = pI
          return token
        }

        //case 'f':
        if ('f' === cur) {
          token.pin = lexer.BL
          token.loc = sI
          token.col = cI

          pI = sI

          if ('alse' === src.substring(pI + 1, pI + 5) &&
            lexer.ender[src[pI + 5]]) {
            token.val = false
            token.len = 5
            pI += 5
          }

          // not a `false` literal
          else {
            while (!lexer.ender[src[++pI]]);
            token.pin = lexer.TX
            token.len = pI - sI
            token.val = src.substring(sI, pI)
          }

          sI = cI = pI
          return token
        }


        //case 'n':
        if ('n' === cur) {
          token.pin = NL
          token.loc = sI
          token.col = cI

          pI = sI

          if ('ull' === src.substring(pI + 1, pI + 4) &&
            lexer.ender[src[pI + 4]]) {
            token.val = null
            token.len = 4
            pI += 4
          }

          // not a `null` literal
          else {
            while (!lexer.ender[src[++pI]]);
            token.pin = lexer.TX
            token.len = pI - sI
            token.val = src.substring(sI, pI)
          }

          cI += token.len
          sI = pI
          return token
        }

        if (opts.SC_NUMBER.includes(curc)) {
          token.pin = NR
          token.loc = sI
          token.col = cI

          pI = sI
          while (lexer.digital[src[++pI]]);

          // console.log('NR', pI, sI, src[sI], src[sI + 1])


          if (lexer.ender[src[pI]]) {
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
            while (!lexer.ender[src[++pI]]);
            token.pin = lexer.TX
            token.len = pI - sI
            token.val = src.substring(sI, pI)
          }

          cI += token.len
          sI = pI

          return token
        }

        //case '"': case '\'':
        if (opts.SC_STRING.includes(curc)) {
          // console.log('STRING:' + src.substring(sI))
          token.pin = ST
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
              return lexer.bad('unprintable', token, sI, pI, rI, cI, src.charAt(pI))
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
                  s.push(escapes[ec])
                  break

                case 117:
                  pI++
                  us = String.fromCharCode(('0x' + src.substring(pI, pI + 4)) as any)
                  if (BAD_UNICODE_CHAR === us) {
                    return lexer.bad('invalid-unicode',
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
            return lexer.bad('unterminated', token, sI, pI - 1, rI, cI, s.join(''))
          }

          token.val = s.join('')

          token.len = pI - sI
          sI = pI

          return token
        }


        //case '#':
        if (opts.SC_COMMENT.includes(curc)) {
          token.pin = CM
          token.loc = sI++
          token.col = cI++
          token.val = cur
          state = LS_CONSUME
          endchars = opts.CHARS_END
        }

        else {
          //default:
          // TEXT
          token.loc = sI
          token.col = cI

          pI = sI

          do {
            cI++
          } while (!lexer.ender[src[++pI]] && '#' !== src[pI])

          token.pin = lexer.TX
          token.len = pI - sI
          token.val = src.substring(sI, pI)

          sI = pI
          return token
        }
      }

      else if (LS_CONSUME === state) {
        pI = sI
        while (pI < srclen && !endchars.includes(src[pI])) pI++, cI++;

        token.val += src.substring(sI, pI)
        token.len = token.val.length

        sI = pI

        state = LS_TOP
        return token
      }
    }



    // LN001: keeps returning ZZ past end of input
    token.pin = ZZ
    token.loc = srclen
    token.col = cI

    // console.log('ZZ', token)

    return token

  }
}

function bad(
  why: string,
  token: Token,
  sI: number,
  pI: number,
  rI: number,
  cI: number,
  val?: any,
  use?: any
): Token {
  token.pin = BD
  token.loc = pI
  token.row = rI
  token.col = cI
  token.len = pI - sI + 1
  token.val = val
  token.why = why
  token.use = use
  return token
}





let ender: { [key: string]: boolean } = {
  ':': true,
  ',': true,
  ']': true,
  '}': true,
  ' ': true,
  '\t': true,
  '\n': true,
  '\r': true,
  undefined: true
}

let digital: { [key: string]: boolean } = {
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
}

let spaces: { [key: string]: boolean } = {
  ' ': true,
  '\t': true,
}

let lines: { [key: string]: boolean } = {
  '\n': true,
  '\r': true,
}

let escapes: string[] = new Array(116)
escapes[98] = '\b'
escapes[102] = '\f'
escapes[110] = '\n'
escapes[114] = '\r'
escapes[116] = '\t'


lexer.bad = bad
lexer.ender = ender
lexer.digital = digital
lexer.spaces = spaces
lexer.lines = lines
lexer.escapes = escapes


// Lexer states
const LS_TOP = lexer.S_TOP = Symbol('@TOP') // LEXER STATE TOP
const LS_CONSUME = lexer.S_CONSUME = Symbol('@CONSUME') // LEXER STATE CONSUME


// Character classes
const BD = lexer.BD = Symbol('#BD') // BAD
const ZZ = lexer.ZZ = Symbol('#ZZ') // END
const UK = lexer.UK = Symbol('#UK') // UNKNOWN
const CM = lexer.CM = Symbol('#CM') // COMMENT

const SP = lexer.SP = Symbol('#SP') // SPACE
const LN = lexer.LN = Symbol('#LN') // LINE

const OB = lexer.OB = Symbol('#OB') // OPEN BRACE
const CB = lexer.CB = Symbol('#CB') // CLOSE BRACE
const OS = lexer.OS = Symbol('#OS') // OPEN SQUARE
const CS = lexer.CS = Symbol('#CS') // CLOSE SQUARE
const CL = lexer.CL = Symbol('#CL') // COLON
const CA = lexer.CA = Symbol('#CA') // COMMA

const NR = lexer.NR = Symbol('#NR') // NUMBER
const ST = lexer.ST = Symbol('#ST') // STRING
const TX = lexer.TX = Symbol('#TX') // TEXT

const BL = lexer.BL = Symbol('#BL')
const NL = lexer.NL = Symbol('#NL')

const VAL = [TX, NR, ST, BL, NL]
const WSP = [SP, LN, CM]


lexer_opts.SINGLES['{'.charCodeAt(0)] = lexer.OB
lexer_opts.SINGLES['}'.charCodeAt(0)] = lexer.CB
lexer_opts.SINGLES['['.charCodeAt(0)] = lexer.OS
lexer_opts.SINGLES[']'.charCodeAt(0)] = lexer.CS
lexer_opts.SINGLES[':'.charCodeAt(0)] = lexer.CL
lexer_opts.SINGLES[','.charCodeAt(0)] = lexer.CA





lexer.end = {
  pin: ZZ,
  loc: 0,
  len: 0,
  row: 0,
  col: 0,
  val: undefined,
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
  val: any
  key: any

  constructor(node: any) {
    this.node = node
  }

  abstract process(ctx: Context): Rule | undefined
  abstract toString(): string
}


class PairRule extends Rule {

  constructor(key?: string) {
    super({})

    // If implicit map, key is already parsed
    this.key = key
  }

  process(ctx: Context): Rule | undefined {
    ctx.ignore(WSP)

    // Implicit map so key already parsed
    if (this.key) {
      ctx.rs.push(this)
      let key = this.key
      delete this.key
      return new ValueRule(this.node, key, OB)
    }

    let t: Token = ctx.next()
    let k = t.pin

    // console.log('PR:' + S(k) + '=' + t.value)

    switch (k) {
      case TX:
      case NR:
      case ST:
      case BL:
      case NL:

        // A sequence of literals with internal spaces is concatenated
        let value: any = hoover(
          ctx,
          VAL,
          [SP]
        )

        // console.log('PR val=' + value)
        ctx.match(CL, WSP)

        ctx.rs.push(this)
        return new ValueRule(this.node, value, OB)

      case CA:
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

  constructor(firstval?: any, firstpin?: symbol) {
    super(undefined === firstval ? [] : [firstval])
    this.firstpin = firstpin
  }

  process(ctx: Context): Rule | undefined {
    if (this.val) {
      this.node.push(this.val)
      this.val = undefined
    }

    let pk: symbol = this.firstpin || UK
    this.firstpin = undefined

    while (true) {
      ctx.ignore(WSP)

      let t: Token = ctx.next()
      let k = t.pin

      // console.log('LIST:' + S(k) + '=' + t.value)

      switch (k) {
        case TX:
        case NR:
        case ST:
        case BL:
        case NL:

          // A sequence of literals with internal spaces is concatenated
          let value: any = hoover(ctx, VAL, [SP])

          // console.log('LR val=' + value)

          this.node.push(value)
          pk = k
          break

        case CA:
          // console.log('LR comma')
          // Insert null before comma if value missing.
          // Trailing commas are ignored.
          if (CA === pk || 0 === this.node.length) {
            this.node.push(null)
          }
          pk = k
          break

        case OB:
          ctx.rs.push(this)
          pk = k
          return new PairRule()

        case OS:
          ctx.rs.push(this)
          pk = k
          return new ListRule()

        case CL:
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

  constructor(node: any, key: string, parent: symbol) {
    super(node)
    this.key = key
    this.parent = parent
  }

  process(ctx: Context): Rule | undefined {
    ctx.ignore(WSP)

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
      case OB:
        ctx.rs.push(this)
        return new PairRule()

      case OS:
        ctx.rs.push(this)
        return new ListRule()

      // Implicit list
      case CA:
        ctx.rs.push(this)
        return new ListRule(null, CA)

    }

    // Any sequence of literals with internal spaces is considered a single string
    let value: any = hoover(
      ctx,
      VAL,
      [SP]
    )


    // Is this an implicit map?
    if (CL === ctx.t1.pin) {
      this.parent = OB
      ctx.next()

      ctx.rs.push(this)
      return new PairRule(String(value))
    }
    // Is this an implicit list (at top level only)?
    else if (CA === ctx.t1.pin && OB !== this.parent) {
      this.parent = OS
      ctx.next()

      ctx.rs.push(this)
      return new ListRule(value, CA)
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


function process(lex: Lex): any {
  let rule: Rule | undefined = new ValueRule({}, '$', UK)
  let root = rule

  //let t0: Token = lexer.end
  //let t1: Token = lexer.end

  let ctx: Context = {
    node: undefined,
    t0: lexer.end,
    t1: lexer.end,
    next,
    match,
    ignore,
    rs: []
  }

  function next() {
    ctx.t0 = ctx.t1
    ctx.t1 = { ...lex() }
    return ctx.t0
  }

  function ignore(ignore: symbol[]) {
    // console.log('IGNORE', ignore, t0, t1)

    while (ignore.includes(ctx.t1.pin)) {
      next()
    }

  }


  function match(pin: symbol, ignore?: symbol[]) {
    // console.log('MATCH', pin, ignore, t0, t1)

    if (ignore) {
      // console.log('IGNORE PREFIX', ignore, t0, t1)
      while (ignore.includes(ctx.t1.pin)) {
        next()
      }
    }

    if (pin === ctx.t1.pin) {
      let t = next()

      if (ignore) {
        // console.log('IGNORE SUFFIX', ignore, t0, t1)
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
    // console.log('W:' + rule + ' rs:' + ctx.rs.map(r => r.constructor.name))
    rule = rule.process(ctx)
  }

  // console.log('Z:', root.node.$)
  return root.node.$
}


// TODO: replace with jsonic stringify
function desc(o: any) {
  return require('util').inspect(o, { depth: null })
}



let Jsonic: Jsonic = Object.assign(parse, {
  use,
  parse: (src: any) => parse(src),

  lexer,
  process,
})


export { Jsonic, Plugin }

