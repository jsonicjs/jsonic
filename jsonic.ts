/* Copyright (c) 2013-2020 Richard Rodger, MIT License */

// TODO: comments


// Edge case notes (see unit tests):
// LNnnn: Lex Note number
// PNnnn: Parse Note number


// TODO: replace with jsonic stringify
function desc(o: any) {
  return require('util').inspect(o, { depth: null })
}


type Jsonic =
  ((src: any) => any)
  &
  {
    parse: (src: any) => any,
    use: (plugin: Plugin) => void
  }
  &
  { [prop: string]: any }
type Plugin = (jsonic: Jsonic) => void


// TODO: return non-strings as is
function parse(src: any): any {
  //return JSON.parse(src)
  if ('string' === typeof (src)) {
    return process(lexer(src))
  }
  return src
}


function use(plugin: Plugin): void {
  plugin(parse as Jsonic)
}



// TODO convert to on demand!

type Token = {
  kind: symbol,
  index: number,
  len: number,
  row: number,
  col: number,
  value: any,
  why?: string,
  key?: boolean
}

type Lex = () => Token


const badunicode = String.fromCharCode('0x0000' as any)

function lexer(src: string): Lex {

  // NOTE: always returns this object!
  let token: Token = {
    kind: ZZ,
    index: 0,
    len: 0,
    row: 0,
    col: 0,
    value: undefined,
  }
  let sI = 0
  let srclen = src.length
  let rI = 0
  let cI = 0


  // TODO: token.why (a code string) needed to indicate cause of lex fail
  function bad(why: string, index: number, value: any): Token {
    token.kind = BD
    token.index = index
    token.col = cI
    token.len = index - sI + 1
    token.value = value
    token.why = why
    return token
  }


  return function lex(): Token {
    token.len = 0
    token.value = undefined
    token.row = rI

    let pI = 0
    let s: string[] = []
    let cc = -1
    let qc = -1
    let ec = -1
    let ts: string

    while (sI < srclen) {
      let cur = src[sI]

      switch (cur) {

        case ' ': case '\t':
          token.kind = SP
          token.index = sI
          token.col = cI++

          pI = sI + 1
          while (lexer.spaces[src[pI++]]) cI++;
          pI--

          token.len = pI - sI
          token.value = src.substring(sI, pI)

          sI = pI
          return token


        case '\n': case '\r':
          token.kind = lexer.LN
          token.index = sI
          token.col = cI

          pI = sI + 1
          cI = 0
          rI++
          while (lexer.lines[src[pI++]]) rI++;
          pI--

          token.len = pI - sI
          token.value = src.substring(sI, pI)

          sI = pI
          return token


        case '{':
          token.kind = OB
          token.index = sI
          token.col = cI++
          token.len = 1
          sI++
          return token


        case '}':
          token.kind = lexer.CB
          token.index = sI
          token.col = cI++
          token.len = 1
          sI++
          return token

        case '[':
          token.kind = lexer.OS
          token.index = sI
          token.col = cI++
          token.len = 1
          sI++
          return token


        case ']':
          token.kind = lexer.CS
          token.index = sI
          token.col = cI++
          token.len = 1
          sI++
          return token


        case ':':
          token.kind = CL
          token.index = sI
          token.col = cI++
          token.len = 1
          sI++
          return token


        case ',':
          token.kind = CA
          token.index = sI
          token.col = cI++
          token.len = 1
          sI++
          return token


        case 't':
          token.kind = lexer.BL
          token.index = sI
          token.col = cI

          pI = sI

          if ('rue' === src.substring(pI + 1, pI + 4) &&
            lexer.ender[src[pI + 4]]) {
            token.value = true
            token.len = 4
            pI += 4
          }

          // not a true literal
          else {
            while (!lexer.ender[src[++pI]]);
            token.kind = lexer.TX
            token.len = pI - sI
            token.value = src.substring(sI, pI)
          }

          sI = cI = pI
          return token


        case 'f':
          token.kind = lexer.BL
          token.index = sI
          token.col = cI

          pI = sI

          if ('alse' === src.substring(pI + 1, pI + 5) &&
            lexer.ender[src[pI + 5]]) {
            token.value = false
            token.len = 5
            pI += 5
          }

          // not a `false` literal
          else {
            while (!lexer.ender[src[++pI]]);
            token.kind = lexer.TX
            token.len = pI - sI
            token.value = src.substring(sI, pI)
          }

          sI = cI = pI
          return token


        case 'n':
          token.kind = NL
          token.index = sI
          token.col = cI

          pI = sI

          if ('ull' === src.substring(pI + 1, pI + 4) &&
            lexer.ender[src[pI + 4]]) {
            token.value = null
            token.len = 4
            pI += 4
          }

          // not a `null` literal
          else {
            while (!lexer.ender[src[++pI]]);
            token.kind = lexer.TX
            token.len = pI - sI
            token.value = src.substring(sI, pI)
          }

          sI = cI = pI
          return token


        case '-':
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          token.kind = NR
          token.index = sI
          token.col = cI++

          pI = sI
          while (lexer.digital[src[++pI]]);

          // console.log('NR', pI, sI, src[sI], src[sI + 1])


          if (lexer.ender[src[pI]]) {
            token.len = pI - sI

            // Leading 0s are text unless hex val: if at least two
            // digits and does not start with 0x, then text.
            if (1 < token.len && '0' === src[sI] && 'x' != src[sI + 1]) {
              token.value = undefined
              pI--
            }
            else {
              token.value = +(src.substring(sI, pI))

              if (isNaN(token.value)) {
                token.value = +(src.substring(sI, pI).replace(/_/g, ''))
              }

              if (isNaN(token.value)) {
                token.value = undefined
                pI--
              }
            }
          }

          // not a number
          if (null == token.value) {
            while (!lexer.ender[src[++pI]]);
            token.kind = lexer.TX
            token.len = pI - sI
            token.value = src.substring(sI, pI)
          }

          sI = cI = pI

          return token

        case '"': case '\'':
          token.kind = ST
          token.index = sI
          token.col = cI++

          qc = cur.charCodeAt(0)
          s = []
          cc = -1

          for (pI = sI + 1; pI < srclen; pI++) {
            cI++

            cc = src.charCodeAt(pI)

            if (cc < 32) {
              return bad('unprintable', pI, src.charAt(pI))
            }
            else if (qc === cc) {
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
                  s.push(escapes[ec])
                  break

                case 117:
                  pI++
                  ts = String.fromCharCode(('0x' + src.substring(pI, pI + 4)) as any)
                  if (badunicode === ts) {
                    return bad('invalid-unicode', pI, src.substring(pI - 2, pI + 4))
                  }

                  s.push(ts)
                  pI += 3 // loop increments pI
                  cI += 4
                  break

                default:
                  s.push(src[pI])
              }
            }
            else {
              let bI = pI

              do {
                cc = src.charCodeAt(++pI)
                cI++
              }
              while (32 <= cc && qc !== cc);
              cI--

              s.push(src.substring(bI, pI))
              pI--
            }
          }

          if (qc !== cc) {
            cI = sI
            return bad('unterminated', pI - 1, s.join(''))
          }

          token.value = s.join('')

          token.len = pI - sI
          sI = pI

          return token


        default:
          token.index = sI
          token.col = cI

          pI = sI
          while (!lexer.ender[src[++pI]]);

          token.kind = lexer.TX
          token.len = pI - sI
          token.value = src.substring(sI, pI)

          sI = cI = pI
          return token
      }
    }

    // LN001: keeps returning ED past end of input
    token.kind = ZZ
    token.index = srclen
    token.col = cI

    return token
  }
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


lexer.ender = ender
lexer.digital = digital
lexer.spaces = spaces
lexer.lines = lines
lexer.escapes = escapes

const BD = lexer.BD = Symbol('#BD') // BAD
const ZZ = lexer.ZZ = Symbol('#ZZ') // END
const UK = lexer.UK = Symbol('#UK') // UNKNOWN

const SP = lexer.SP = Symbol('#SP') // SPACE
const LN = lexer.LN = Symbol('#LN') // LINE

const OB = lexer.OB = Symbol('#OB') // OPEN BRACE
const CB = lexer.CB = Symbol('#CB') // CLOSE BRACE
const OS = lexer.OS = Symbol('#OS') // OPEN SQUARE
const CS = lexer.CS = Symbol('#CS') // CLOSE SQUARE
const CL = lexer.CL = Symbol('#CL') // COLON
const CA = lexer.CA = Symbol('#CA') // COMMA

const NR = lexer.NR = Symbol('#NR')
const ST = lexer.ST = Symbol('#ST')
const TX = lexer.TX = Symbol('#TX')

const BL = lexer.BL = Symbol('#BL')
const NL = lexer.NL = Symbol('#NL')

const VAL = [TX, NR, ST, BL, NL]
const WSP = [SP, LN]

lexer.end = {
  kind: ZZ,
  index: 0,
  len: 0,
  row: 0,
  col: 0,
  value: undefined,
}



let S = (s: symbol) => s.description



interface Context {
  node: any
  t0: Token
  t1: Token
  rs: Rule[]
  next: () => Token
  match: (kind: symbol, ignore?: symbol[]) => Token
  ignore: (kinds: symbol[]) => void
}

abstract class Rule {
  node: any
  value: any
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
    let k = t.kind

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
          WSP
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
          rule.value = this.node
        }
        return rule
    }
  }

  toString() {
    return 'Pair: ' + desc(this.node)
  }
}


class ListRule extends Rule {
  firstkind: symbol | undefined

  constructor(firstval?: any, firstkind?: symbol) {
    super(undefined === firstval ? [] : [firstval])
    this.firstkind = firstkind
  }

  process(ctx: Context): Rule | undefined {
    if (this.value) {
      this.node.push(this.value)
      this.value = undefined
    }

    let pk: symbol = this.firstkind || UK
    this.firstkind = undefined

    while (true) {
      ctx.ignore(WSP)

      let t: Token = ctx.next()
      let k = t.kind

      // console.log('LIST:' + S(k) + '=' + t.value)

      switch (k) {
        case TX:
        case NR:
        case ST:
        case BL:
        case NL:

          // A sequence of literals with internal spaces is concatenated
          let value: any = hoover(ctx, VAL, WSP)

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
            rule.value = this.node
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
    if (this.value) {
      this.node[this.key] = this.value
      this.value = undefined
      return ctx.rs.pop()
    }

    let t: Token = ctx.next()
    let k = t.kind

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
      WSP
    )


    // Is this an implicit map?
    if (CL === ctx.t1.kind) {
      this.parent = OB
      ctx.next()

      ctx.rs.push(this)
      return new PairRule(String(value))
    }
    // Is this an implicit list (at top level only)?
    else if (CA === ctx.t1.kind && OB !== this.parent) {
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
    return 'Value: ' + this.key + '=' + desc(this.value) + ' node=' + desc(this.node)
  }

}


// Hoover up tokens into a string, possible containing whitespace, but trimming end
// Thus: ['a', ' ', 'b', ' '] => 'a b'
// NOTE: single tokens return token value, not a string!
function hoover(ctx: Context, kinds: symbol[], trims: symbol[]): any {

  // Is this potentially a hoover?
  let trimC = 0
  if ((trims.includes(ctx.t1.kind) && ++trimC) || kinds.includes(ctx.t1.kind)) {
    let b: Token[] = [ctx.t0, ctx.t1]

    ctx.next()

    while ((trims.includes(ctx.t1.kind) && ++trimC) ||
      (kinds.includes(ctx.t1.kind) && (trimC = 0, true))) {
      b.push(ctx.t1)
      ctx.next()
    }

    // Trim end.
    b = b.splice(0, b.length - trimC)

    if (1 === b.length) {
      return b[0].value
    }
    else {
      return b.map(t => String(t.value)).join('')
    }
  }
  else {
    return ctx.t0.value
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

    while (ignore.includes(ctx.t1.kind)) {
      next()
    }

  }


  function match(kind: symbol, ignore?: symbol[]) {
    // console.log('MATCH', kind, ignore, t0, t1)

    if (ignore) {
      // console.log('IGNORE PREFIX', ignore, t0, t1)
      while (ignore.includes(ctx.t1.kind)) {
        next()
      }
    }

    if (kind === ctx.t1.kind) {
      let t = next()

      if (ignore) {
        // console.log('IGNORE SUFFIX', ignore, t0, t1)
        while (ignore.includes(ctx.t1.kind)) {
          next()
        }
      }

      return t
    }
    throw new Error('expected: ' + String(kind) + ' saw:' + String(ctx.t1.kind) + '=' + ctx.t1.value)
  }

  next()

  while (rule) {
    // console.log('W:' + rule + ' rs:' + ctx.rs.map(r => r.constructor.name))
    rule = rule.process(ctx)
  }

  // console.log('Z:', root.node.$)
  return root.node.$
}





let Jsonic: Jsonic = Object.assign(parse, {
  use,
  parse: (src: any) => parse(src),

  lexer,
  process,
})


export { Jsonic, Plugin }

