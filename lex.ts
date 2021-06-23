

type Config = {
  tkn: { [name: string]: boolean }
}

type Context = {
  src: () => string
}


class Token {
  tin: string
  sI: number = -1
  src: string = ''

  constructor(
    tin: string,
    pI: number,
    src: string
  ) {
    this.tin = tin
    this.sI = pI
    this.src = src
  }
}


class Point {
  len: number = -1
  sI: number = 0
  token: Token[] = []
  end: Token | undefined = undefined

  constructor(len: number) {
    this.len = len
  }
}


abstract class Matcher {
  abstract match(lex: Lex): Token | undefined
}


class TextTokenMatcher extends Matcher {
  match(lex: Lex) {
    let pnt = lex.pnt
    let srcfwd = lex.src.substring(pnt.sI)

    let m = srcfwd.match(/^([^ ]*?)(false|true|null|=>|=|,|[ ]|$)/)
    if (m) {
      let txtsrc = m[1]
      let tknsrc = m[2]

      let out: Token | undefined = undefined

      if (null != txtsrc) {
        let txtlen = txtsrc.length
        if (0 < txtlen) {
          out = new Token(
            'txt',
            pnt.sI,
            txtsrc,
          )
          pnt.sI += txtlen
        }
      }

      if (null != tknsrc) {
        let tknlen = tknsrc.length
        if (0 < tknlen) {

          if (lex.cfg.tkn[tknsrc]) {
            // TODO: lookup if actual token
            let tkn = new Token(
              'tkn',
              pnt.sI,
              tknsrc
            )
            pnt.sI += tknsrc.length

            if (null == out) {
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
  }
}


class SpaceMatcher extends Matcher {
  space: { [char: string]: boolean } = {
    ' ': true,
  }

  match(lex: Lex) {
    let pnt = lex.pnt
    let pI = pnt.sI
    let src = lex.src

    while (this.space[src[pI]]) {
      pI++
    }

    if (pnt.sI < pI) {
      let spcsrc = src.substring(pnt.sI, pI)
      pnt.sI += spcsrc.length
      return new Token(
        'spc',
        pnt.sI,
        spcsrc
      )
    }
  }
}


class NumberMatcher extends Matcher {
  numchar: { [char: string]: boolean } = {
    '1': true,
    '2': true,
  }

  match(lex: Lex) {
    let pnt = lex.pnt
    let pI = pnt.sI
    let src = lex.src

    while (this.numchar[src[pI]]) {
      pI++
    }

    // TODO: value ender
    if (pnt.sI < pI) {
      let numsrc = src.substring(pnt.sI, pI)
      pnt.sI += numsrc.length
      return new Token(
        'num',
        pnt.sI,
        numsrc
      )
    }
  }
}





class Lexer {
  cfg: Config

  constructor(cfg: Config) {
    this.cfg = cfg
  }

  start(ctx: Context): Lex {
    return new Lex(ctx.src(), ctx, this.cfg)
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

    // TODO: via config?
    this.mat = [
      new NumberMatcher(),
      new TextTokenMatcher(),
      new SpaceMatcher(),
    ]
  }

  next(): Token {
    let pnt = this.pnt

    if (pnt.end) {
      return pnt.end
    }

    if (0 < pnt.token.length) {
      return (pnt.token.shift() as Token)
    }


    if (pnt.len <= pnt.sI) {
      pnt.end = new Token('end', -1, '')
      return pnt.end
    }

    let tkn: Token | undefined
    for (let m of this.mat) {
      if (tkn = m.match(this)) {
        return tkn
      }
    }

    tkn = new Token('bad', pnt.sI, this.src[pnt.sI])

    return tkn
  }
}


export {
  Lexer,
}
