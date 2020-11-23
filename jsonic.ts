/* Copyright (c) 2013-2020 Richard Rodger, MIT License */


// Edge case notes (see unit tests):
// LNnnn: Lex Note number
// PNnnn: Parse Note number


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
  return JSON.parse(src)
}


function use(plugin: Plugin): void {
  plugin(parse as Jsonic)
}



// TODO convert to on demand!

type Token = {
  kind: number,
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
    kind: 0,
    index: 0,
    len: 0,
    row: 0,
    col: 0,
    value: null,
  }
  let sI = 0
  let srclen = src.length
  let rI = 0
  let cI = 0


  // TODO: token.why (a code string) needed to indicate cause of lex fail
  function bad(why: string, index: number, value: any): Token {
    token.kind = lexer.BAD
    token.index = index
    token.col = cI
    token.len = index - sI + 1
    token.value = value
    token.why = why
    return token
  }


  return function lex(): Token {
    token.len = 0
    token.value = null
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
          token.kind = lexer.SPACE
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
          token.kind = lexer.LINE
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
          token.kind = lexer.OPEN_BRACE
          token.index = sI
          token.col = cI++
          token.len = 1
          sI++
          return token


        case '}':
          token.kind = lexer.CLOSE_BRACE
          token.index = sI
          token.col = cI++
          token.len = 1
          sI++
          return token

        case '[':
          token.kind = lexer.OPEN_SQUARE
          token.index = sI
          token.col = cI++
          token.len = 1
          sI++
          return token


        case ']':
          token.kind = lexer.CLOSE_SQUARE
          token.index = sI
          token.col = cI++
          token.len = 1
          sI++
          return token


        case ':':
          token.kind = lexer.COLON
          token.index = sI
          token.col = cI++
          token.len = 1
          sI++
          return token


        case ',':
          token.kind = lexer.COMMA
          token.index = sI
          token.col = cI++
          token.len = 1
          sI++
          return token


        case 't':
          token.kind = lexer.TRUE
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
            token.kind = lexer.TEXT
            token.len = pI - sI
            token.value = src.substring(sI, pI)
          }

          sI = cI = pI
          return token


        case 'f':
          token.kind = lexer.FALSE
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
            token.kind = lexer.TEXT
            token.len = pI - sI
            token.value = src.substring(sI, pI)
          }

          sI = cI = pI
          return token


        case 'n':
          token.kind = lexer.NULL
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
            token.kind = lexer.TEXT
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
          token.kind = lexer.NUMBER
          token.index = sI
          token.col = cI++

          pI = sI
          while (lexer.digital[src[++pI]]);

          if (lexer.ender[src[pI]]) {
            token.len = pI - sI
            token.value = +(src.substring(sI, pI))

            if (isNaN(token.value)) {
              token.value = +(src.substring(sI, pI).replace(/_/g, ''))
            }

            if (isNaN(token.value)) {
              token.value = null
              pI--
            }
          }

          // not a number
          if (null == token.value) {
            while (!lexer.ender[src[++pI]]);
            token.kind = lexer.TEXT
            token.len = pI - sI
            token.value = src.substring(sI, pI)
          }

          sI = cI = pI

          return token

        case '"': case '\'':
          token.kind = lexer.STRING
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

          token.kind = lexer.TEXT
          token.len = pI - sI
          token.value = src.substring(sI, pI)

          sI = cI = pI
          return token
      }
    }

    // LN001: keeps returning END past end of input
    token.kind = lexer.END
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

lexer.BAD = 10
lexer.END = 20

lexer.SPACE = 100
lexer.LINE = 200

lexer.OPEN_BRACE = 1000
lexer.CLOSE_BRACE = 2000
lexer.OPEN_SQUARE = 3000
lexer.CLOSE_SQUARE = 4000
lexer.COLON = 5000
lexer.COMMA = 6000

lexer.NUMBER = 10000
lexer.STRING = 20000
lexer.TEXT = 30000

lexer.TRUE = 100000
lexer.FALSE = 200000
lexer.NULL = 300000


type ProcessContext = {
  tI: number
  po: any
  pk: number // previous non-whitespace kind
  tstk: any
  nstk: any
  res: any
}


function process(lex: Lex): any {


  let err: any = undefined
  let lexing = true
  let tokens: Token[] = []

  let ctx: ProcessContext = {
    tI: 0,
    po: undefined,
    pk: -1,
    tstk: [],
    nstk: [],

    // PN007: empty string parse to undefined
    res: undefined
  }

  while (lexing) {
    // PN001: parse next top level token set, one of:
    // * scalar - boolean, number, string, text, null
    // * key colon - start key:value pair
    // * value - end of key:value pair - implicitly creates parent object if needed
    // * node open - object or array
    // * ignorable - comma

    tokens[ctx.tI] = tokens[ctx.tI] || { ...lex() }
    let t0 = tokens[ctx.tI]
    let k0 = t0.kind
    // console.log('W', ctx.tI, k0 + '=' + t0.value, ctx.tstk, ctx.nstk)

    let t1: Token
    let k1: number

    if (lexer.SPACE === k0) {
      // skip, leave ctx.pk alone
      ctx.tI++
      continue;
    }
    else if (lexer.LINE === k0) {
      // skip, leave ctx.pk alone
      ctx.tI++
      continue;
    }
    else if (lexer.END === k0) {
      // console.log('END LEX S')

      // PN004: top level implicit array does not need closing
      if (ctx.po && !ctx.po.push) {
        ctx.res = close_pair(ctx)
      }

      // console.log('END LEX res', ctx.res)

      lexing = false

      break
    }
    else if (lexer.BAD === k0) {
      err = new Error(t0.why)
      err.token = t0
      lexing = false
      break
    }
    else if (lexer.OPEN_BRACE === k0) {
      open_node(k0, ctx)
      ctx.pk = k0

      continue;
    }
    else if (lexer.OPEN_SQUARE === k0) {
      open_node(k0, ctx)
      ctx.pk = k0

      continue;
    }
    else if (lexer.CLOSE_BRACE === k0) {
      close_node(ctx)
      ctx.pk = k0

      // PN002: comma after close brace optional, see PN001
      continue;
    }
    else if (lexer.CLOSE_SQUARE === k0) {
      close_node(ctx)
      ctx.pk = k0

      // PN002: comma after close square optional, see PN001
      continue;
    }

    // TODO: pair (a:b) or path (a:b:1==={a:{b:1}})?

    let nI = 1
    do {
      tokens[ctx.tI + nI] = tokens[ctx.tI + nI] || { ...lex() }
      t1 = tokens[ctx.tI + nI]
      k1 = t1.kind
      nI++
    } while (k1 == lexer.SPACE || k1 == lexer.LINE)

    // console.log('P', ctx.tI, k0 + '=' + t0.value, k1 + '=' + t1.value)

    if (lexer.COLON === k1) {
      t0.key = true
      ctx.tstk.push(t0)
      ctx.tI += nI
      ctx.pk = k0
      continue;
    }
    else if (lexer.COMMA === k0) {
      // console.log('COMMA a', k0, ctx.tI, ctx.pk, ctx.po, ctx.res)

      // PN004: bare comma implies a preceding null
      // PN005: top level commas (no colon) imply top level array
      if (null == ctx.po) {
        ctx.po = []
        ctx.res = undefined === ctx.res ? null : ctx.res
        ctx.po.push(ctx.res)
        ctx.res = ctx.po
      }
      else if (ctx.po.push &&
        (lexer.COMMA === ctx.pk || lexer.OPEN_SQUARE === ctx.pk)) {
        ctx.po.push(null)
      }

      // PN006: trailing comma is ignored

      ctx.tI++
      // console.log('COMMA z', ctx.tI, ctx.po, ctx.res)

      ctx.pk = k0
      continue;
    }
    else if (lexer.NULL === k0) {
      ctx.res = null
    }
    else if (lexer.TRUE === k0) {
      ctx.res = true
    }
    else if (lexer.FALSE === k0) {
      ctx.res = false
    }
    else if (lexer.NUMBER === k0) {
      ctx.res = t0.value
      // console.log('S N=' + ctx.res)
    }
    else if (lexer.STRING === k0) {
      ctx.res = t0.value
    }
    else if (lexer.TEXT === k0) {
      ctx.res = t0.value
    }

    ctx.pk = k0
    ctx.tI++
    //console.log('ENDa', ctx.tI, ctx.res, ctx.out, ctx.nstk)
    // console.log('ENDa', ctx.tI, ctx.res, ctx.nstk)

    ctx.res = close_pair(ctx)

    /*
    let pt = close_pair(ctx)
  
    if (!pt) {
      console.log('ENDb', ctx.nstk)
  
      // TODO: close_node - handles missing closes
      //while (ctx.po = ctx.nstk.pop()) {
      //  ctx.out = ctx.po
      //}
  
      lexing = false
      // ctx.out = ctx.out || ctx.res
    }
    */
  }

  // return err || ctx.out
  return err || ctx.res
}



function close_pair(ctx: ProcessContext) {
  // console.log('CP', ctx.po)

  if (ctx.po && ctx.po.push) {
    ctx.po.push(ctx.res)
    // console.log('CPa', ctx.po)
  }
  else {
    let pt = ctx.tstk.pop()
    if (pt && pt.key) {
      ctx.po = ctx.po || ctx.nstk.pop() || {}
      ctx.po[pt.value] = ctx.res
    }
  }


  // PN003: parent object/array || top level scalar
  return ctx.po || ctx.res
}

function open_node(kind: number, ctx: ProcessContext) {
  if (ctx.po) {
    ctx.nstk.push(ctx.po)
  }
  ctx.po = lexer.OPEN_BRACE === kind ? {} : []
  ctx.tI++
  // console.log('ON', ctx.po, ctx.tI, ctx.nstk.length)
}

function close_node(ctx: ProcessContext) {
  ctx.res = ctx.po
  ctx.po = ctx.nstk.pop()
  ctx.tI++

  close_pair(ctx)

  // console.log('CNz res', ctx.res)
  return ctx.res
}



let Jsonic: Jsonic = Object.assign(parse, {
  use,
  parse: (src: any) => parse(src),

  lexer,
  process,
})


export { Jsonic, Plugin }

