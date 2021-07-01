
const inspect = Symbol.for('nodejs.util.inspect.custom')

import type { Rule } from './jsonic'


import {
  S,
  MT,
  Config,
  Context,
  Tin,
  tokenize,
  snip,
} from './intern'



class Point {
  len: number = -1
  sI: number = 0
  rI: number = 1
  cI: number = 1
  token: Token[] = []
  end: Token | undefined = undefined

  constructor(len: number, sI?: number, rI?: number, cI?: number) {
    this.len = len
    if (null != sI) { this.sI = sI }
    if (null != rI) { this.rI = rI }
    if (null != cI) { this.cI = cI }
  }

  toString() {
    return 'Point[' + [this.sI, this.rI, this.cI] + ';' + this.token + ']'
  }

  [inspect]() {
    return this.toString()
  }
}


// TODO: rename loc to sI, row to rI, col to cI
// Tokens from the lexer.
class Token {
  name: string  // Token name.
  tin: Tin      // Token identification number.
  val: any      // Value of Token if literal (eg. number).
  src: string   // Source text of Token.
  sI: number    // Location of token index in source text.
  rI: number    // Row location of token in source text.
  cI: number    // Column location of token in source text.
  use?: any     // Custom meta data from plugins goes here.
  why?: string  // Error code.
  len: number   // Length of Token source text.

  constructor(
    name: string,
    tin: Tin,
    val: any,
    src: any,  // TODO: string
    pnt: Point,
    use?: any,
    why?: string,
  ) {
    this.name = name
    this.tin = tin
    this.src = src
    this.val = val
    this.sI = pnt.sI
    this.rI = pnt.rI
    this.cI = pnt.cI
    this.use = use
    this.why = why

    this.len = src.length

    // console.log(this)
    // console.trace()
  }

  toString() {
    return 'Token[' +
      this.name + '=' + this.tin + ' ' +

      snip(this.src) +

      // TODO: make configurable?
      (undefined === this.val || '#ST' === this.name || '#TX' === this.name ? '' :
        '=' + snip(this.val)) + ' ' +

      [this.sI, this.rI, this.cI] +

      (null == this.use ? '' : ' ' +
        snip(('' + JSON.stringify(this.use).replace(/"/g, '')), 22)) +

      (null == this.why ? '' : ' ' + snip('' + this.why), 22) +
      ']'
  }

  [inspect]() {
    return this.toString()
  }

}



type LexMatcher = (lex: Lex, rule: Rule) => Token | undefined



const matchFixed: LexMatcher = (lex: Lex) => {
  if (!lex.cfg.fixed.lex) return undefined

  let pnt = lex.pnt
  let fwd = lex.src.substring(pnt.sI)

  let m = fwd.match((lex.cfg.re.fixed as RegExp))
  if (m) {
    let tsrc = m[1]
    let tknlen = tsrc.length
    if (0 < tknlen) {
      let tkn: Token | undefined = undefined

      let tin = lex.cfg.fixed.token[tsrc]
      if (null != tin) {
        tkn = lex.token(
          tin,
          undefined,
          tsrc,
          pnt,
        )

        pnt.sI += tsrc.length
      }

      return tkn
    }
  }
}


const matchComment: LexMatcher = (lex: Lex) => {
  if (!lex.cfg.comment.lex) return undefined

  let pnt = lex.pnt
  let fwd = lex.src.substring(pnt.sI)

  let m = fwd.match((lex.cfg.re.commentLine as RegExp))
  if (m) {
    let msrc = m[1]
    let mlen = msrc.length
    if (0 < mlen) {
      let tkn: Token | undefined = undefined

      tkn = lex.token(
        '#CM',
        undefined,
        msrc,
        pnt,
      )

      pnt.sI += msrc.length

      return tkn
    }
  }
}


// Match text, checking for literal values, optionally followed by a fixed token.
// Text strings are terminated by end markers.
const matchTextEndingWithFixed: LexMatcher = (lex: Lex) => {
  if (!lex.cfg.text.lex) return undefined

  let pnt = lex.pnt
  let fwd = lex.src.substring(pnt.sI)
  let vm = lex.cfg.value.m

  let m = fwd.match((lex.cfg.re.textEnder as RegExp))
  if (m) {
    let msrc = m[1]
    let tsrc = m[2]

    let out: Token | undefined = undefined

    if (null != msrc) {
      let mlen = msrc.length
      if (0 < mlen) {

        let vs = undefined
        if (lex.cfg.value.lex && undefined !== (vs = vm[msrc])) {
          // TODO: get name from cfg  
          out = lex.token('#VL', vs.v, msrc, pnt)
        }
        else {
          out = lex.token('#TX', msrc, msrc, pnt)
        }
        pnt.sI += mlen
      }
    }

    out = subMatchFixed(lex, out, tsrc)

    return out
  }
}





const matchNumberEndingWithFixed: LexMatcher = (lex: Lex) => {
  if (!lex.cfg.number.lex) return undefined

  let pnt = lex.pnt
  let fwd = lex.src.substring(pnt.sI)
  let vm = lex.cfg.value.m

  let m = fwd.match((lex.cfg.re.numberEnder as RegExp))
  if (m) {
    let msrc = m[1]
    let tsrc = m[2]

    let out: Token | undefined = undefined

    if (null != msrc) {
      let mlen = msrc.length
      if (0 < mlen) {

        let vs = undefined
        if (lex.cfg.value.lex && undefined !== (vs = vm[msrc])) {
          out = lex.token('#VL', vs.v, msrc, pnt)
        }
        else {
          let num = +(msrc)
          if (!isNaN(num)) {
            out = lex.token('#NR', num, msrc, pnt)
          }
          pnt.sI += mlen
        }
      }
    }

    out = subMatchFixed(lex, out, tsrc)

    return out
  }
}


// TODO: complete
// String matcher.
const matchString = (lex: Lex) => {
  if (!lex.cfg.string.lex) return undefined

  let {
    quoteMap,
    escMap,
    escChar,
    escCharCode,
    doubleEsc,
    multiLine
  } = lex.cfg.string
  let { pnt, src } = lex
  let { sI, rI, cI } = pnt
  let srclen = src.length

  if (quoteMap[src[sI]]) {
    const q = src[sI] // Quote character
    const isMultiLine = multiLine[q]
    sI++
    cI++

    let s: string[] = []


    for (sI; sI < srclen; sI++) {
      cI++
      let c = src[sI]

      // Quote char.
      if (q === c) {
        if (doubleEsc && q === src[sI + 1]) {
          s.push(src[sI])
          sI++
        }
        else {
          sI++
          break // String finished.
        }
      }

      // Escape char. 
      else if (escChar === c) {
        sI++
        cI++

        let es = escMap[src[sI]]

        if (null != es) {
          s.push(es)
        }

        // ASCII escape \x**
        else if ('x' === src[sI]) {
          sI++
          let cc = parseInt(src.substring(sI, sI + 2), 16)

          if (isNaN(cc)) {
            sI = sI - 2
            cI -= 2
            //throw new Error('ST-x')
            // return badx(S.invalid_ascii, sI + 2, src.substring(sI - 2, sI + 2))
            return lex.bad(S.invalid_ascii, sI - 2, sI + 2)
          }

          let us = String.fromCharCode(cc)

          s.push(us)
          sI += 1 // Loop increments sI.
          cI += 2
        }

        // Unicode escape \u**** and \u{*****}.
        else if ('u' === src[sI]) {
          sI++
          let ux = '{' === src[sI] ? (sI++, 1) : 0
          let ulen = ux ? 6 : 4

          let cc = parseInt(src.substring(sI, sI + ulen), 16)

          if (isNaN(cc)) {
            sI = sI - 2 - ux
            cI -= 2
            // throw new Error('ST-u')
            //return badx(S.invalid_unicode, sI + ulen + 1,
            //  src.substring(sI - 2 - ux, sI + ulen + ux))
            return lex.bad(S.invalid_unicode, sI - 2 - ux, sI + ulen + ux)
          }

          let us = String.fromCodePoint(cc)

          s.push(us)
          sI += (ulen - 1) + ux // Loop increments sI.
          cI += ulen + ux
        }
        else {
          s.push(src[sI])
        }
      }

      // Body part of string.
      else {
        let bI = sI

        // TODO: move to cfgx
        let qc = q.charCodeAt(0)
        let cc = src.charCodeAt(sI)

        while (sI < srclen && 32 <= cc && qc !== cc && escCharCode !== cc) {
          cc = src.charCodeAt(++sI)
          cI++
        }
        cI--

        // TODO: confirm this works; Must end with quote
        // TODO: maybe rename back to cs as confusing
        //q = src[sI]

        if (cc < 32) {
          if (isMultiLine && lex.cfg.line.charMap[src[sI]]) {
            if (lex.cfg.line.rowCharMap[src[sI]]) {
              rI++
            }

            cI = 0
            s.push(src.substring(bI, sI + 1))
          }
          else {
            return lex.bad(S.unprintable, sI, sI + 1)
          }
        }
        else {
          s.push(src.substring(bI, sI))
          sI--
        }
      }
    }

    if (src[sI - 1] !== q) {
      return lex.bad(S.unterminated, sI - 1, sI)
      //console.log(pnt, sI, q, s, src.substring(pnt.sI))
      //throw new Error('ST-s')
    }

    const tkn = lex.token(
      '#ST',
      s.join(MT),
      src.substring(pnt.sI, sI),
      pnt,
    )

    pnt.sI = sI
    pnt.rI = rI
    pnt.cI = cI
    return tkn
  }
}


// Line ending matcher.
const matchLineEnding = (lex: Lex) => {
  if (!lex.cfg.line.lex) return undefined

  let { charMap, rowCharMap } = lex.cfg.line
  let { pnt, src } = lex
  let { sI, rI } = pnt

  while (charMap[src[sI]]) {
    sI++
    rI += (rowCharMap[src[sI]] ? 1 : 0)
  }

  if (pnt.sI < sI) {
    let msrc = src.substring(pnt.sI, sI)
    const tkn = lex.token(
      '#LN',
      undefined,
      msrc,
      pnt,
    )
    pnt.sI += msrc.length
    pnt.rI = rI
    pnt.cI = 1
    return tkn
  }
}


// Space matcher.
const matchSpace = (lex: Lex) => {
  if (!lex.cfg.space.lex) return undefined

  let { charMap, tokenName } = lex.cfg.space
  let { pnt, src } = lex
  let { sI, cI } = pnt

  while (charMap[src[sI]]) {
    sI++
    cI++
  }

  if (pnt.sI < sI) {
    let msrc = src.substring(pnt.sI, sI)
    const tkn = lex.token(
      tokenName,
      undefined,
      msrc,
      pnt,
    )
    pnt.sI += msrc.length
    pnt.cI = cI
    return tkn
  }
}


function subMatchFixed(
  lex: Lex,
  first: Token | undefined,
  tsrc: string | undefined,

): Token | undefined {
  let pnt = lex.pnt
  let out = first

  if (lex.cfg.fixed.lex && null != tsrc) {
    let tknlen = tsrc.length
    if (0 < tknlen) {
      let tkn: Token | undefined = undefined

      let tin = lex.cfg.fixed.token[tsrc]
      if (null != tin) {
        tkn = lex.token(
          tin,
          undefined,
          tsrc,
          pnt,
        )
      }

      if (null != tkn) {
        pnt.sI += tkn.src.length

        if (null == first) {
          out = tkn
        }
        else {
          pnt.token.push(tkn)
        }
      }
    }
  }
  return out
}




class Lexer {
  cfg: Config
  end: Token
  mat: LexMatcher[]

  constructor(cfg: Config) {
    this.cfg = cfg

    this.end = new Token(
      '#ZZ',
      tokenize('#ZZ', cfg),
      undefined,
      '',
      new Point(-1)
    )

    this.mat = [
      matchFixed,
      matchSpace,
      matchLineEnding,
      matchString,
      matchComment,
      matchNumberEndingWithFixed,
      matchTextEndingWithFixed,
    ]
  }

  start(ctx: Context): Lex {
    return new Lex(ctx.src(), this.mat, ctx, this.cfg)
  }

  // Clone the Lexer, and in particular the registered matchers.
  clone(config: Config) {
    let lexer = new Lexer(config)
    // deep(lexer.match, this.match)
    return lexer
  }

}


class Lex {
  src: String
  ctx: Context
  cfg: Config
  pnt: Point
  mat: LexMatcher[]


  constructor(src: String, mat: LexMatcher[], ctx: Context, cfg: Config) {
    this.src = src
    this.ctx = ctx
    this.cfg = cfg
    this.pnt = new Point(src.length)
    this.mat = mat
  }


  token(
    ref: Tin | string,
    val: any,
    src: string,
    pnt?: Point,
    use?: any,
    why?: string,
  ): Token {
    let tin: Tin
    let name: string
    if ('string' === typeof (ref)) {
      name = ref
      tin = tokenize(name, this.cfg)
    }
    else {
      tin = ref
      name = tokenize(ref, this.cfg)
    }

    let tkn = new Token(
      name,
      tin,
      val,
      src,
      pnt || this.pnt,
      use,
      why,
    )

    // console.log(tkn)

    return tkn
  }


  next(rule: Rule): Token {
    let pnt = this.pnt

    if (pnt.end) {
      return pnt.end
    }

    if (0 < pnt.token.length) {
      return (pnt.token.shift() as Token)
    }


    if (pnt.len <= pnt.sI) {
      pnt.end = this.token(
        '#ZZ',
        undefined,
        '',
        pnt,
      )

      return pnt.end
    }

    let tkn: Token | undefined
    for (let mat of this.mat) {
      if (tkn = mat(this, rule)) {
        return tkn
      }
    }

    tkn = this.token(
      '#BD',
      undefined,
      this.src[pnt.sI],
      pnt,
      undefined,
      'bad'
    )

    return tkn
  }

  tokenize<
    R extends string | Tin,
    T extends (R extends Tin ? string : Tin)
  >(ref: R):
    T {
    return tokenize(ref, this.cfg)
  }

  bad(why: string, pstart: number, pend: number) {
    return this.token(
      '#BD',
      undefined,
      0 <= pstart && pstart <= pend ?
        this.src.substring(pstart, pend) :
        this.src[this.pnt.sI],
      undefined,
      undefined,
      why
    )
  }
}


export {
  Point,
  Token,
  Lex,
  LexMatcher,
  Lexer,
}


