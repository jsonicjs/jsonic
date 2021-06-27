
const inspect = Symbol.for('nodejs.util.inspect.custom')

import type { Rule } from './jsonic'


import {
  MT,
  Config,
  Context,
  Tin,
  tokenize,
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
  }

  toString() {
    return 'Token[' +
      this.name + '=' + this.tin + ';' +
      ('' + this.src).substring(0, 5) + '=' + ('' + this.val).substring(0, 5) + ';' +
      [this.sI, this.rI, this.cI] +
      (null == this.use ? '' : ';' +
        ('' + JSON.stringify(this.use).replace(/"/g, '')).substring(0, 22)) +
      (null == this.why ? '' : ';' + ('' + this.why).substring(0, 22)) +
      ']'
  }

  [inspect]() {
    return this.toString()
  }

}



type Matcher = (lex: Lex, rule: Rule) => Token | undefined





// Match text, checking for literal values, optionally followed by a fixed token.
// Text strings are terminated by end markers.
const matchTextEndingWithFixed: Matcher = (lex: Lex) => {
  if (!lex.cfg.text.active) return undefined

  let pnt = lex.pnt
  let fwd = lex.src.substring(pnt.sI)
  let vm = lex.cfg.value.m

  let m = fwd.match((lex.cfg.re.TXem as RegExp))
  if (m) {
    let msrc = m[1]
    let tsrc = m[2]

    let out: Token | undefined = undefined

    if (null != msrc) {
      let mlen = msrc.length
      if (0 < mlen) {

        let vs = undefined
        if (lex.cfg.value.active && undefined !== (vs = vm[msrc])) {
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





const matchNumberEndingWithFixed: Matcher = (lex: Lex) => {
  if (!lex.cfg.number.active) return undefined

  let pnt = lex.pnt
  let fwd = lex.src.substring(pnt.sI)
  let vm = lex.cfg.value.m

  let m = fwd.match((lex.cfg.re.NRem as RegExp))
  if (m) {
    let msrc = m[1]
    let tsrc = m[2]

    let out: Token | undefined = undefined

    if (null != msrc) {
      let mlen = msrc.length
      if (0 < mlen) {

        let vs = undefined
        if (lex.cfg.value.active && undefined !== (vs = vm[msrc])) {
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
  if (!lex.cfg.string.active) return undefined

  let { c, e, b, d } = lex.cfg.string
  let { pnt, src } = lex
  let { sI, rI, cI } = pnt
  let srclen = src.length

  if (c[src[sI]]) {
    let q = src[sI] // Quote character
    sI++
    cI++

    let s: string[] = []


    for (sI; sI < srclen; sI++) {
      cI++

      // Quote char.
      if (src[sI] === q) {
        if (d && q === src[sI + 1]) {
          s.push(src[sI])
          sI++
        }
        else {
          sI++
          break // String finished.
        }
      }

      // Escape char. 
      else if ('\\' === q) {
        sI++
        cI++

        let es = e[src[sI]]
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
            throw new Error('ST-x')
            // return bad(S.invalid_ascii, sI + 2, src.substring(sI - 2, sI + 2))
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
            throw new Error('ST-u')
            //return bad(S.invalid_unicode, sI + ulen + 1,
            //  src.substring(sI - 2 - ux, sI + ulen + ux))
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

        while (sI < srclen && 32 <= cc && qc !== cc && b !== cc) {
          cc = src.charCodeAt(++sI)
          cI++
        }
        cI--

        // TODO: confirm this works; Must end with quote
        // TODO: maybe rename back to cs as confusing
        q = src[sI]

        if (cc < 32) {
          if (lex.cfg.string.multiline[q]) {
            rI++
            cI = 0
          }
          else {
            throw new Error('ST-c')
          }
        }
        else {
          s.push(src.substring(bI, sI))
          sI--
        }
      }
    }

    if (src[sI - 1] !== q) {
      console.log(pnt, sI, q, s, src.substring(pnt.sI))
      throw new Error('ST-s')
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
  if (!lex.cfg.line.active) return undefined

  let { c, r } = lex.cfg.line
  let { pnt, src } = lex
  let { sI, rI } = pnt

  while (c[src[sI]]) {
    sI++
    rI += (r === src[sI] ? 1 : 0)
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
  if (!lex.cfg.space.active) return undefined

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

  if (lex.cfg.fixed.active && null != tsrc) {
    let tknlen = tsrc.length
    if (0 < tknlen) {
      let tkn: Token | undefined = undefined

      let tin = lex.cfg.tm[tsrc]
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

  constructor(cfg: Config) {
    this.cfg = cfg

    this.end = new Token(
      '#ZZ',
      tokenize('#ZZ', cfg),
      undefined,
      '',
      new Point(-1)
    )
  }

  start(ctx: Context): Lex {
    return new Lex(ctx.src(), ctx, this.cfg)
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
  mat: Matcher[]


  constructor(src: String, ctx: Context, cfg: Config) {
    this.src = src
    this.ctx = ctx
    this.cfg = cfg
    this.pnt = new Point(src.length)

    // TODO: move to Lexer
    this.mat = [
      // matchFixed
      matchSpace,
      matchLineEnding,
      matchString,
      matchNumberEndingWithFixed,
      matchTextEndingWithFixed,
    ]
  }


  token(
    ref: Tin | string,
    val: any,
    src: string,
    pnt: Point,
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

    return new Token(
      name,
      tin,
      val,
      src,
      pnt,
      use,
      why,
    )
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
}






// The lexing function returns the next token.
// type Lex = ((rule: Rule) => Token) & { src: string }



type LexMatcherState = {
  sI: number,
  rI: number,
  cI: number,
  src: string,
  token: Token,
  ctx: Context,
  rule: Rule,
  bad: any,
}

type LexMatcher = (lms: LexMatcherState) => LexMatcherResult
type LexMatcherListMap = { [state: number]: LexMatcher[] }

type LexMatcherResult = undefined | {
  sI: number,
  rI: number
  cI: number,
  state?: number,
  state_param?: any,
}


/*
class Lexer {
  end: Token
  match: LexMatcherListMap = {}

  constructor(config: Config) {

    // The token indexer is also used to generate lex state indexes.
    // Lex state names have the prefix `@L`
    tokenize('@LTP', config) // TOP
    tokenize('@LTX', config) // TEXT
    tokenize('@LCS', config) // CONSUME
    tokenize('@LML', config) // MULTILINE

    // End token instance (returned once end-of-source is reached).
    this.end = {
      tin: tokenize('#ZZ', config),
      loc: 0,
      len: 0,
      row: 0,
      col: 0,
      val: undefined,
      src: undefined,
    }
  }


  // Create the lexing function, which will then return the next token on each call.
  // NOTE: lexing is context-free with n-token lookahead (n=2). There is no
  // deterministic relation between the current rule and the current lex.
  start(
    ctx: Context
  ): Lex {

    // Convenience vars
    const options = ctx.opts
    const config = ctx.cnfg

    let tpin = (name: string): Tin => tokenize(name, config)
    let tn = (pin: Tin): string => tokenize(pin, config)
    let F = ctx.F

    let LTP = tpin('@LTP')
    let LTX = tpin('@LTX')
    let LCS = tpin('@LCS')
    let LML = tpin('@LML')

    let ZZ = tpin('#ZZ')
    let SP = tpin('#SP')
    let CM = tpin('#CM')
    let NR = tpin('#NR')
    let ST = tpin('#ST')
    let TX = tpin('#TX')
    let VL = tpin('#VL')
    let LN = tpin('#LN')


    // NOTE: always returns this object instance!
    // Yes, this is deliberate. The parser clones tokens as needed.
    let token: Token = {
      tin: ZZ,
      loc: 0,
      row: 0,
      col: 0,
      len: 0,
      val: undefined,
      src: undefined,
    }


    // Main indexes.
    let sI = 0 // Source text index.
    let rI = 0 // Source row index.
    let cI = 0 // Source column index.


    // Lex state.
    let state = LTP // Starting state.
    let state_param: any = null // Parameters for the new state.


    // This is not a streaming lexer, sorry.
    let src = ctx.src()
    let srclen = src.length


    // Shortcut logging function for the lexer.
    // If undefined, don't log.
    // TS2722 impedes this definition unless Context is
    // refined to (Context & { log: any })
    let lexlog: ((token: Token, ...rest: any) => undefined) | undefined =
      (null != ctx.log) ?
        ((...rest: any) => (ctx as (Context & { log: any }))
          .log(
            S.lex,         // Log entry prefix.
            tn(token.tin), // Name of token from tin (token identification numer).
            F(token.src),  // Format token src for log.
            sI,            // Current source index.
            rI + ':' + cI, // Row and column.
            tn(state),     // Name of lex state.
            { ...token },  // Copy of the token.
            ...rest)       // Context-specific additional entries.
        ) : undefined


    // Convenience function to return a bad token.
    let bad = (code: string, cpI: number, badsrc: string, use?: any) => {
      return this.bad(ctx, lexlog, code, token, sI, cpI, rI, cI, badsrc, badsrc, use)
    }


    // Check for custom matchers on current lex state, and call the first
    // (if any) that returns a match.
    // NOTE: deliberately grabs local state (token,sI,rI,cI,...)
    let matchers = (rule: Rule) => {
      let matchers = this.match[state]
      if (null != matchers) {
        // token.loc = sI // TODO: move to top of while for all rules?

        for (let matcher of matchers) {
          let match = matcher({ sI, rI, cI, src, token, ctx, rule, bad })

          // Adjust lex location if there was a match.
          if (match) {
            sI = match.sI ? match.sI : sI
            rI = match.rI ? match.rI : rI
            cI = match.cI ? match.cI : cI
            state = null == match.state ? state : match.state
            state_param = null == match.state_param ? state_param : match.state_param

            lexlog && lexlog(token, matcher)
            return token
          }
        }
      }
    }


    // Lex next Token.
    let lex: Lex = (function lex(rule: Rule): Token {
      token.len = 0
      token.val = undefined
      token.src = undefined
      token.row = rI
      token.use = undefined

      let enders: TinMap = {}

      let pI = 0 // Current lex position (only update sI at end of rule).
      let s: string[] = [] // Parsed string chars and substrings.

      next_char:
      while (sI < srclen) {
        let c0 = src[sI]

        token.loc = sI
        token.col = cI

        ctx.xs = state

        if (LTP === state) {

          if (matchers(rule)) {
            return token
          }


          // FIXED-REGEXP
          // Space chars.
          //if (options.space.lex && config.s.SP[c0]) {
          if (options.space.lex && config.m.SP[c0]) {
            token.tin = SP
            cI++
            pI = sI + 1

            while (config.m.SP[src[pI]]) cI++, pI++;

            token.len = pI - sI
            token.val = src.substring(sI, pI)
            token.src = token.val

            sI = pI

            lexlog && lexlog(token)
            return token
          }


          // FIXED-REGEXP
          // CHAR-COUNTER
          // Newline chars.
          //if (options.line.lex && config.s.LN[c0]) {
          if (options.line.lex && config.m.LN[c0]) {
            token.tin = LN
            pI = sI
            cI = 0

            while (config.m.LN[src[pI]]) {
              // Count rows.
              rI += (options.line.row === src[pI] ? 1 : 0)
              pI++
            }

            token.len = pI - sI
            token.val = src.substring(sI, pI)
            token.src = token.val

            sI = pI

            lexlog && lexlog(token)
            return token
          }

          // FIXED-REGEXP
          // MATCHER-FUNC
          // ABANDON
          // Number chars.
          if (options.number.lex && config.m.NR[c0]) {
            let num_match = src.substring(sI).match((config.re.nm as RegExp))

            if (null != num_match) {
              let numstr = num_match[0]
              pI = sI + numstr.length

              // Numbers must end with a value ender char, otherwise
              // it must just be text with prefixed digits: '1a' -> "1a"
              if (null == src[pI] || config.cs.vend[src[pI]]) {
                let numval =
                  +(config.re.ns ? numstr.replace(config.re.ns, '') : numstr)

                if (!isNaN(numval)) {
                  token.tin = NR
                  token.src = numstr
                  token.val = numval
                  token.len = numstr.length
                  sI += token.len
                  cI += token.len

                  lexlog && lexlog(token)
                  return token
                }
              }
            }
          }


          // FIXED-REGEXP
          // Single char tokens.
          if (null != config.sm[c0]) {
            token.tin = config.sm[c0]
            token.len = 1
            token.src = c0
            sI++
            cI++

            lexlog && lexlog(token)
            return token
          }

          // FIXED-REGEXP
          // CHANGE-STATE
          // LEX-STATE?
          // TWO MATCHERS?
          // Block chars.
          if (options.block.lex && config.cs.bs[c0]) {
            let marker = src.substring(sI, sI + config.bmx)

            for (let bm of config.bmk) {
              if (marker.startsWith(bm)) {
                token.tin = ST

                state = LML
                state_param = [bm, options.block.marker[bm], null, true]
                continue next_char
              }
            }
          }


          // FIXED-REGEXP
          // MATCHER-FUNC
          // LEX-STATE?
          // String chars.
          //if (options.string.lex && config.s.ST[c0]) {
          if (options.string.lex && config.m.ST[c0]) {
            token.tin = ST
            cI++

            let multiline = config.cs.mln[c0]

            s = []
            let cs = MT

            for (pI = sI + 1; pI < srclen; pI++) {
              cI++

              cs = src[pI]

              // Quote char.
              if (c0 === cs) {
                if (options.string.escapedouble && c0 === src[pI + 1]) {
                  s.push(src[pI])
                  pI++
                }
                else {
                  pI++
                  break // String finished.
                }
              }

              // Escape char. 
              else if ('\\' === cs) {
                pI++
                cI++

                let es = config.esc[src[pI]]
                if (null != es) {
                  s.push(es)
                }

                // ASCII escape \x**
                else if ('x' === src[pI]) {
                  pI++
                  let cc = parseInt(src.substring(pI, pI + 2), 16)

                  if (isNaN(cc)) {
                    sI = pI - 2
                    cI -= 2
                    return bad(S.invalid_ascii, pI + 2, src.substring(pI - 2, pI + 2))
                  }

                  let us = String.fromCharCode(cc)

                  s.push(us)
                  pI += 1 // Loop increments pI.
                  cI += 2
                }

                // Unicode escape \u**** and \u{*****}.
                else if ('u' === src[pI]) {
                  pI++
                  let ux = '{' === src[pI] ? (pI++, 1) : 0
                  let ulen = ux ? 6 : 4

                  let cc = parseInt(src.substring(pI, pI + ulen), 16)

                  if (isNaN(cc)) {
                    sI = pI - 2 - ux
                    cI -= 2
                    return bad(S.invalid_unicode, pI + ulen + 1,
                      src.substring(pI - 2 - ux, pI + ulen + ux))
                  }

                  let us = String.fromCodePoint(cc)

                  s.push(us)
                  pI += (ulen - 1) + ux // Loop increments pI.
                  cI += ulen + ux
                }
                else {
                  s.push(src[pI])
                }
              }

              // Body part of string.
              else {
                let bI = pI

                let qc = c0.charCodeAt(0)
                let esc = '\\'.charCodeAt(0)
                let cc = src.charCodeAt(pI)

                while (pI < srclen && 32 <= cc && qc !== cc && esc !== cc) {
                  cc = src.charCodeAt(++pI)
                  cI++
                }
                cI--

                cs = src[pI]

                if (cc < 32) {
                  if (multiline && config.m.LN[cs]) {
                    //if (multiline && config.s.LN[cs]) {
                    if (cs === options.line.row) {
                      rI++
                      cI = 0
                    }

                    s.push(src.substring(bI, pI + 1))
                  }
                  else {
                    return bad(S.unprintable, pI,
                      'char-code=' + src[pI].charCodeAt(0))
                  }
                }
                else {
                  s.push(src.substring(bI, pI))

                  // Handle qc, esc, END-OF-SOURCE at top of loop
                  pI--
                }
              }
            }

            if (c0 !== cs) {
              return bad(S.unterminated, pI, s.join(MT))
            }

            token.val = s.join(MT)
            token.src = src.substring(sI, pI)

            token.len = pI - sI
            sI = pI

            lexlog && lexlog(token)
            return token
          }


          // FIXED-REGEXP
          // THEN SAME AS BML
          // Comment chars.
          if (options.comment.lex && config.cs.cs[c0]) {

            // Check for comment markers as single comment char could be
            // a comment marker prefix (eg. # and ###, / and //, /*).
            let marker = src.substring(sI, sI + config.cmx)

            for (let cm of config.cmk) {
              if (marker.startsWith(cm)) {

                // Multi-line comment.
                if (true !== config.cm[cm]) {
                  token.tin = CM
                  //token.loc = sI
                  //token.col = cI
                  token.val = MT // intialize for LCS.

                  state = LML
                  state_param = [cm, config.cm[cm], options.comment.balance]
                  continue next_char
                }

                break;
              }
            }

            // It's a single line comment.
            token.tin = CM
            token.val = MT // intialize for LCS.

            state = LCS
            enders = config.m.LN
            continue next_char
          }

          // FIXED-REGEXP
          // Literal values.
          if (options.value.lex && config.vs[c0]) {
            pI = sI

            do {
              pI++
            } while (null != src[pI] && !config.cs.vend[src[pI]])

            let txt = src.substring(sI, pI)

            // A keyword literal value? (eg. true, false, null)
            let val = config.vm[txt]
            val = S.function === typeof (val) ?
              val({ sI, rI, cI, src, token, ctx, rule, bad }) : val

            if (undefined !== val) {
              token.tin = VL
              token.val = val
              token.src = txt
              token.len = pI - sI

              cI += token.len
              sI = pI

              lexlog && lexlog(token)
              return token
            }
          }


          // Text values.
          // No explicit token recognized. That means a text value
          // (everything up to a value_ender char (eg. newline)) NOTE:
          // default section. Cases above bail to here if lookaheads
          // fail to match (eg. NR).

          if (options.text.lex) {
            state = LTX
            continue next_char
          }
        }
        else if (LTX === state) {
          if (matchers(rule)) {
            return token
          }

          pI = sI

          // FIXED-REGEXP
          // UNTIL-MATCH
          let m = src.substring(sI).match((config.re.te as RegExp))
          if (m) {
            let txlen = m[0].length
            pI += txlen
            cI += txlen
          }

          token.len = pI - sI
          token.tin = TX
          token.val = src.substring(sI, pI)
          token.src = token.val

          sI = pI
          state = LTP

          lexlog && lexlog(token)
          return token
        }


        // Lexer State: CONSUME => all chars up to first ender
        else if (LCS === state) {
          if (matchers(rule)) {
            return token
          }

          pI = sI

          // FIXED-REGEXP
          // UNTIL-MATCH
          while (pI < srclen && !enders[src[pI]]) pI++, cI++;

          token.val += src.substring(sI, pI)
          token.src = token.val
          token.len = token.val.length

          sI = pI

          state = LTP

          lexlog && lexlog(token)
          return token
        }


        // Lexer State: MULTILINE => all chars up to last close marker, or end
        else if (LML === state) {
          if (matchers(rule)) {
            return token
          }

          // FIXED-REGEXP
          // UNTIL-MATCH
          // STATE DEPTH?

          pI = sI

          // Balance open and close markers (eg. if options.balance.comment=true).
          let depth = 1
          let open = state_param[0]
          let close = state_param[1]
          let balance = state_param[2]
          let has_indent = !!state_param[3]
          let indent_str = MT
          let indent_len = 0
          let openlen = open.length
          let closelen = close.length

          if (has_indent) {
            let uI = sI - 1
            while (-1 < uI && config.m.SP[src[uI]]) uI--;

            indent_len = sI - uI - 1
            if (0 < indent_len) {
              indent_str = keys(config.m.SP)[0].repeat(indent_len)
            }
          }

          // Assume starts with open string
          pI += open.length

          while (pI < srclen && 0 < depth) {

            // Close first so that open === close case works
            if (close[0] === src[pI] &&
              close === src.substring(pI, pI + closelen)) {
              pI += closelen
              cI += closelen
              depth--
            }
            else if (balance && open[0] === src[pI] &&
              open === src.substring(pI, pI + openlen)) {
              pI += openlen
              cI += closelen
              depth++
            }
            else {
              // Count rows.
              if (options.line.row === src[pI]) {
                rI++
                cI = 0
              }
              else {
                cI++
              }
              pI++
            }
          }

          token.val = src.substring(sI, pI)
          token.src = token.val
          token.len = token.val.length

          // Assume indent means block
          if (has_indent) {
            token.val =
              token.val.substring(openlen, token.val.length - closelen)

            // Remove spurious space at start
            if (null == config.re.block_prefix) {
              config.re.block_prefix = regexp(
                S.no_re_flags,
                '^[',
                // TODO: need config val here?
                mesc((options.token['#SP'] as string)),
                ']*(',
                options.line.sep,
                ')',
              )
            }
            token.val =
              token.val.replace(config.re.block_prefix, MT)

            // Remove spurious space at end
            if (null == config.re.block_suffix) {
              config.re.block_suffix = regexp(
                S.no_re_flags,
                options.line.sep,
                '[',
                // TODO: need config val here?
                mesc(options.token['#SP'] as string),
                ']*$'
              )
            }
            token.val =
              token.val.replace(config.re.block_suffix, MT)

            // Remove indent
            let block_indent_RE = config.re[S.block_indent_ + indent_str] =
              config.re[S.block_indent_ + indent_str] || regexp(
                'g',
                '^(',
                mesc(indent_str),
                ')|((',
                options.line.sep,
                ')',
                mesc(indent_str),
                ')'
              )

            token.val =
              token.val.replace(block_indent_RE, '$3')
          }

          sI = pI

          state = LTP

          lexlog && lexlog(token)
          return token
        }
        else {
          return bad(S.invalid_lex_state, sI, src[sI], { state: state })
        }

        // Some token must match.
        return bad(S.unexpected, sI, src[sI])
      }


      // Keeps returning ZZ past end of input.
      token.tin = ZZ
      token.loc = srclen
      token.col = cI

      lexlog && lexlog(token)
      return token
    } as Lex)

    lex.src = src

    return lex
  }


  // Describe state when lexing goes wrong using the signal token "#BD" (bad token!).
  bad(
    ctx: Context,
    log: ((...rest: any) => undefined) | undefined,
    why: string,
    token: Token,
    sI: number,
    pI: number,
    rI: number,
    cI: number,
    val?: any,
    src?: any,
    use?: any
  ): Token {
    token.why = why
    token.tin = tokenize('#BD', ctx.cnfg)
    token.loc = sI
    token.row = rI
    token.col = cI
    token.len = pI - sI
    token.val = val
    token.src = src
    token.use = use

    log && log(tokenize(token.tin, ctx.cnfg), ctx.F(token.src),
      sI, rI + ':' + cI, { ...token },
      S.error, why)
    return token
  }


  // Register a custom lexing matcher to be attempted first for given lex state.
  // See _plugin_ folder for examples.
  lex(state?: Tin, matcher?: LexMatcher): LexMatcherListMap | LexMatcher[] {

    // If no state, return all the matchers.
    if (null == state) {
      return this.match
    }

    // Else return the list of matchers for the state.
    let matchers: LexMatcher[] = this.match[state]

    // Else add a new matcher and possible a new state.
    if (null != matcher) {
      if (null == matchers) {
        matchers = this.match[state] = []
      }

      matchers.push(matcher)
    }

    // Explicitly remove all matchers for state
    else if (null === matcher) {
      matchers = this.match[state]
      delete this.match[state]
    }

    return matchers
  }


  // Clone the Lexer, and in particular the registered matchers.
  clone(config: Config) {
    let lexer = new Lexer(config)
    deep(lexer.match, this.match)
    return lexer
  }
}

*/



export {
  Point,
  Token,
  Lex,
  Lexer,
  LexMatcher,
  LexMatcherListMap,
  LexMatcherResult,
  LexMatcherState,
}


