/* Copyright (c) 2013-2020 Richard Rodger, MIT License */


// TODO: remove plurals
// TODO: all errors as JsonicError


type KV = { [k: string]: any }

// TODO: complete
type Opts = {
  singles: string
  escapes: { [denoting_char: string]: string }
  comments: { [start_marker: string]: string | boolean }
  balance: KV
  number: KV
  string: KV
  text: KV
  values: KV
  digital: string
  tokens: KV
  mode: KV
  plugin: KV
  bad_unicode_char: string
  console: any
  error: { [code: string]: string }
  hint: { [code: string]: string }
} & KV



const NONE: any[] = []

const STANDARD_OPTIONS: Opts = {

  // Token start characters.
  // NOTE: All sc_* string properties generate SC_* char code arrays.
  sc_space: ' \t',
  sc_line: '\n\r',
  sc_number: '-0123456789',
  sc_string: '"\'`',
  sc_none: '',

  // Custom singles.
  singles: '',

  // String escape chars.
  // Denoting char (follows escape char) => actual char.
  escapes: {
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t',
  },

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
    multiline: '`',
    escapedouble: false,
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

  // Increments row (aka line) counter.
  rowchar: '\n',

  tokens: {
    value: (NONE as any[]),
    ignore: (NONE as any[]),
  },

  mode: {},

  plugin: {},

  bad_unicode_char: String.fromCharCode('0x0000' as any),

  // Default console for logging
  console,


  // Error messages.
  error: {
    unknown: 'unknown error: $code',
    unexpected: 'unexpected character(s): `$src`'
  },


  // Error hints
  hint: {
    unknown:
      `Since the error is unknown, this is probably a bug inside jsonic itself.
Please consider posting a github issue - thanks!
`,

    unexpected: `The character(s) \`$src\` should not occur at this point as it is not
valid JSON syntax, even under the relaxed jsonic rules.  If it is not
obviously wrong, the actual syntax error may be elsewhere. Try
commenting out larger areas around this point until you get no errors,
then remove the comments in small sections until you find the
offending syntax.`
  },


  // Arrays ([String]) are used for tokens to create unique internal
  // tokens protected from plugin tokens. Symbols are not used as they
  // create edge cases for string conversion.

  // Single character tokens.
  // NOTE: character is final char of Symbol name.
  OB: ['#OB{'], // OPEN BRACE
  CB: ['#CB}'], // CLOSE BRACE
  OS: ['#OS['], // OPEN SQUARE
  CS: ['#CS]'], // CLOSE SQUARE
  CL: ['#CL:'], // COLON
  CA: ['#CA,'], // COMMA

  // Multi character tokens.
  BD: ['#BD'], // BAD
  ZZ: ['#ZZ'], // END
  UK: ['#UK'], // UNKNOWN
  CM: ['#CM'], // COMMENT
  AA: ['#AA'], // ANY

  SP: ['#SP'], // SPACE
  LN: ['#LN'], // LINE

  NR: ['#NR'], // NUMBER
  ST: ['#ST'], // STRING
  TX: ['#TX'], // TEXT

  VL: ['#VL'], // VALUE


  // Lexer states
  LS_TOP: ['@TOP'], // TOP
  LS_CONSUME: ['@CONSUME'], // CONSUME
  LS_MULTILINE: ['@MULTILINE'], // MULTILINE
}


type Jsonic =
  // A function that parses.
  ((src: any, meta?: any) => any)
  &

  // A utility with methods.
  {
    parse: (src: any, meta?: any) => any
    options: Opts & ((change_opts?: KV) => Jsonic)
    make: (opts?: KV) => Jsonic
    use: (plugin: Plugin, opts?: KV) => Jsonic
    rule: (name: string, define:
      (rs: RuleSpec, rsm: { [name: string]: RuleSpec }) => RuleSpec)
      => Jsonic
  }

  // Extensible by plugin decoration. Example: `stringify`.
  &
  { [prop: string]: any }


type Plugin = (jsonic: Jsonic) => void

type Meta = { [k: string]: any }


// Tokens from the lexer.
type Token = {
  //pin: symbol,  // Token kind.
  pin: any,  // Token kind.
  loc: number,   // Location of token index in source text.
  len: number,   // Length of Token source text.
  row: number,   // Row location of token in source text.
  col: number,   // Column location of token in source text.
  val: any,      // Value of Token if literal (eg. number).
  src: any,      // Source text of Token.
  why?: string,  // Error code.
  use?: any,     // Custom meta data from plugins goes here.
}



interface Context {
  rI: number // TODO remove?
  opts: Opts
  meta: Meta
  src: () => string,
  node: any
  t0: Token
  t1: Token
  tI: number
  rs: Rule[]
  next: () => Token
  log?: (...rest: any) => undefined
  use: KV     // Custom meta data from plugins goes here.
}


// The lexing function returns the next token.
type Lex = (() => Token) & { src: string }


class JsonicError extends SyntaxError {
  constructor(
    code: string,
    details: KV,
    token: Token,
    ctx: Context,
  ) {
    details = util.deep({}, details)
    ctx = util.deep({}, ctx)
    let desc = JsonicError.make_desc(code, details, token, ctx)
    super(desc.message)
    Object.assign(this, desc)

    if (this.stack) {
      this.stack =
        this.stack.split('\n').filter(s => !s.includes('jsonic/jsonic')).join('\n')
    }
  }


  static make_desc(
    code: string,
    details: KV,
    token: Token,
    ctx: Context,
  ) {
    token = { ...token }
    let opts = ctx.opts
    let meta = ctx.meta
    let errtxt = util.errinject(
      (opts.error[code] || opts.error.unknown),
      code, details, token, ctx
    )

    let message = [
      ('\x1b[31m[jsonic/' + code + ']:\x1b[0m ' +
        ((meta && meta.mode) ? '\x1b[35m[mode:' + meta.mode + ']:\x1b[0m ' : '') +
        errtxt),
      '  \x1b[34m-->\x1b[0m ' + (meta.fileName || '<no-file>') + ':' + token.row + ':' + token.col,
      util.extract(ctx.src(), errtxt, token),
      util.errinject(
        (opts.hint[code] || opts.hint.unknown).split('\n')
          .map((s: string) => '  ' + s).join('\n'),
        code, details, token, ctx
      )
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
      fileName: meta.fileName,
      lineNumber: token.row,
      columnNumber: token.col,
    }

    return desc
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


class Lexer {
  options: Opts// = STANDARD_OPTIONS
  end: Token
  bad: any
  match: { [state_name: string]: any } = {}

  constructor(options?: Opts) {
    let opts = this.options = options || util.deep({}, STANDARD_OPTIONS)

    this.end = {
      pin: opts.ZZ,
      loc: 0,
      len: 0,
      row: 0,
      col: 0,
      val: undefined,
      src: undefined,
    }

    opts.bad = function(
      log: ((...rest: any) => undefined),
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
      token.pin = opts.BD
      token.loc = pI
      token.row = rI
      token.col = cI
      token.len = pI - sI + 1
      token.val = val
      token.src = src
      token.use = use

      log && log(token.pin[0], token.src, { ...token })
      return token
    }
  }


  // Create the lexing function.
  start(
    ctx: Context
  ): Lex {
    // TODO: should be ctx.opts to ensure consistency
    const opts = this.options

    // NOTE: always returns this object!
    let token: Token = {
      pin: opts.ZZ,
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

    let src = ctx.src()
    let srclen = src.length

    // TS2722 impedes this definition unless Context is
    // refined to (Context & { log: any })
    let lexlog: ((...rest: any) => undefined) | undefined =
      (null != ctx && null != ctx.log) ?
        ((...rest: any) => (ctx as (Context & { log: any })).log('lex', ...rest)) :
        undefined

    let self = this

    // Lex next Token.
    let lex: Lex = (function lex(): Token {
      token.len = 0
      token.val = undefined
      token.src = undefined
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
          // TODO: implement custom lexing functions for state, lookup goes here

          let matchers = self.match[opts.LS_TOP[0]]
          if (null != matchers) {
            token.loc = sI // TODO: move to top of while for all rules?

            for (let matcher of matchers) {
              //console.log('matcher', matcher)

              let match = matcher(sI, src, token, ctx)
              //console.log('match', match)
              if (match) {
                sI = match.sI
                rI = match.rD ? rI + match.rD : rI
                cI = match.cD ? cI + match.cD : cI
                lexlog &&
                  lexlog(token.pin[0], token.src, { ...token })
                return token
              }
            }
          }

          if (opts.SC_SPACE.includes(c0c)) {

            token.pin = opts.SP
            token.loc = sI
            token.col = cI++

            pI = sI + 1
            while (opts.sc_space.includes(src[pI])) cI++, pI++;
            // TODO: count rows! for csv

            token.len = pI - sI
            token.val = src.substring(sI, pI)
            token.src = token.val

            sI = pI

            lexlog && lexlog(token.pin[0], token.src, { ...token })
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
              rI += (opts.rowchar === src[pI] ? 1 : 0)
              pI++
            }

            token.len = pI - sI
            token.val = src.substring(sI, pI)
            token.src = token.val

            sI = pI

            lexlog && lexlog(token.pin[0], token.src, { ...token })
            return token
          }


          else if (null != opts.SINGLES[c0c]) {
            token.pin = opts.SINGLES[c0c]
            token.loc = sI
            token.col = cI++
            token.len = 1
            token.src = c0
            sI++

            lexlog && lexlog(token.pin[0], token.src, { ...token })
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
                token.val = undefined // unset if not a hex value
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
              token.src = src.substring(sI, pI) // src="1e6" -> val=1000000
              cI += token.len
              sI = pI

              lexlog && lexlog(token.pin[0], token.src, { ...token })
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
                if (opts.string.escapedouble && qc === src.charCodeAt(pI + 1)) {
                  s.push(src[pI])
                  pI++
                }
                else {
                  pI++
                  break // String finished.
                }
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
                      lexlog,
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
                    lexlog, 'unprintable', token, sI, pI, rI, cI, src.charAt(pI))
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
              return opts.bad(
                lexlog, 'unterminated', token, sI, pI - 1, rI, cI, s.join(''))
            }

            token.val = s.join('')
            token.src = src.substring(sI, pI)

            token.len = pI - sI
            sI = pI

            lexlog && lexlog(token.pin[0], token.src, { ...token })
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
                  token.val = '' // intialize for LS_CONSUME

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
              token.val = '' // intialize for LS_CONSUME

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
            token.src = txt
            token.len = pI - sI
            sI = pI

            lexlog && lexlog(token.pin[0], token.src, { ...token })
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
          token.src = token.val

          // If hoovering, separate space at end from text
          if (opts.text.hoover &&
            opts.sc_space.includes(token.val[token.val.length - 1])) {

            // Find last non-space char
            let tI = token.val.length - 2
            while (0 < tI && opts.sc_space.includes(token.val[tI])) tI--;
            token.val = token.val.substring(0, tI + 1)
            token.src = token.val

            // Adjust column counter backwards by end space length
            cI -= (token.len - tI - 1)

            token.len = token.val.length

            // Ensures end space will be seen as the next token 
            sI += token.len
          }
          else {
            sI = pI
          }

          lexlog && lexlog(token.pin[0], token.src, { ...token })
          return token
        }


        // Lexer State: CONSUME => all chars up to first ender
        else if (opts.LS_CONSUME === state) {
          // TODO: implement custom lexing functions for state, lookup goes here

          pI = sI
          while (pI < srclen && !enders.includes(src[pI])) pI++, cI++;

          token.val += src.substring(sI, pI)
          token.src = token.val
          token.len = token.val.length

          sI = pI

          state = opts.LS_TOP

          lexlog && lexlog(token.pin[0], token.src, { ...token })
          return token
        }


        // Lexer State: MULTILINE => all chars up to last close marker, or end
        else if (opts.LS_MULTILINE === state) {
          // TODO: implement custom lexing functions for state, lookup goes here

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
              // TODO: count rows!
            }
          }

          token.val = src.substring(sI, pI)
          token.src = token.val
          token.len = token.val.length

          sI = pI

          state = opts.LS_TOP

          lexlog && lexlog(token.pin[0], token.src, { ...token })
          return token
        }
      }


      // LN001: keeps returning ZZ past end of input
      token.pin = opts.ZZ
      token.loc = srclen
      token.col = cI

      lexlog && lexlog(token.pin[0], token.src, { ...token })
      return token
    } as Lex)

    lex.src = src

    return lex
  }


  lex(state: string[], match: (
    sI: number,
    src: string,
    token: Token,
    ctx: Context
  ) => any) {
    let sn = state[0]
    this.match[sn] = this.match[sn] || []
    this.match[sn].push(match)
  }
}


enum RuleState {
  open,
  close,
}


class Rule {
  id: number
  name: string
  spec: RuleSpec
  ctx: Context
  node: any
  opts: Opts
  state: RuleState
  child: Rule
  open: Token[]
  close: Token[]
  why?: string
  val: any
  key: any

  constructor(spec: RuleSpec, ctx: Context, opts: Opts, node?: any) {
    this.id = ctx.rI++
    this.name = spec.name
    this.spec = spec
    this.node = node
    this.ctx = ctx
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
    return JSON.stringify(this.spec)
  }
}


let norule = ({ id: 0, spec: { name: 'norule' } } as Rule)





class RuleSpec {
  name: string
  def: any
  rm: { [name: string]: RuleSpec }
  match: any

  constructor(name: string, def: any, rm: { [name: string]: RuleSpec }) {
    this.name = name
    this.def = def
    this.rm = rm
  }

  open(rule: Rule, ctx: Context) {
    let next = rule

    if (this.def.before_open) {
      let out = this.def.before_open.call(this, rule, ctx)
      rule.node = out && out.node || rule.node
    }

    let act = this.parse_alts(this.def.open, rule, ctx)

    if (act.e) {
      //throw new Error('unexpected token: ' + JSON.stringify(act.e))
      throw new JsonicError('unexpected', {}, act.e, ctx)
    }

    rule.open = act.m

    if (act.p) {
      ctx.rs.push(rule)
      next = rule.child = new Rule(this.rm[act.p], ctx, rule.opts, rule.node)
    }
    else if (act.r) {
      next = new Rule(this.rm[act.r], ctx, rule.opts, rule.node)
    }

    if (this.def.after_open) {
      this.def.after_open.call(this, rule, ctx, next)
    }

    ctx.log && ctx.log(
      'node',
      rule.name + '/' + rule.id,
      RuleState[rule.state],
      rule.node
    )

    rule.state = RuleState.close

    return next
  }


  close(rule: Rule, ctx: Context) {
    let next: Rule = norule
    let why = 's'

    if (this.def.before_close) {
      this.def.before_close.call(this, rule, ctx)
    }

    let act =
      0 < this.def.close.length ? this.parse_alts(this.def.close, rule, ctx) : {}

    if (act.e) {
      throw new Error('unexpected token: ' + act.e.pin[0] + ' ' + act.e.val)
    }

    if (act.h) {
      next = act.h(this, rule, ctx) || next
    }

    if (act.p) {
      ctx.rs.push(rule)
      next = rule.child = new Rule(this.rm[act.p], ctx, rule.opts, rule.node)
    }
    else if (act.r) {
      next = new Rule(this.rm[act.r], ctx, rule.opts, rule.node)
      why = 'r'
    }
    else {
      next = ctx.rs.pop() || norule
      why = 'p'
    }

    if (this.def.after_close) {
      this.def.after_close.call(this, rule, ctx, next)
    }

    next.why = why

    ctx.log && ctx.log(
      'node',
      rule.name + '/' + rule.id,
      RuleState[rule.state],
      why,
      rule.node
    )

    return next
  }


  // first match wins
  parse_alts(alts: any[], rule: Rule, ctx: Context): any {
    let out = undefined
    let alt

    // End token reached.
    if (ctx.opts.ZZ === ctx.t0.pin) {
      out = { m: [] }
    }

    else if (0 < alts.length) {
      for (alt of alts) {

        // Optional custom condition
        let cond = alt.c ? alt.c(alt, rule, ctx) : true
        if (cond) {

          // No tokens to match.
          if (null == alt.s || 0 === alt.s.length) {
            out = { ...alt, m: [] }
            break
          }

          // Match 1 or 2 tokens in sequence.
          else if (alt.s[0] === ctx.t0.pin) {
            if (1 === alt.s.length) {
              out = { ...alt, m: [ctx.t0] }
              break
            }
            else if (alt.s[1] === ctx.t1.pin) {
              out = { ...alt, m: [ctx.t0, ctx.t1] }
              break
            }
          }

          // Match any token.
          else if (ctx.opts.AA === alt.s[0]) {
            out = { ...alt, m: [ctx.t0] }
            break
          }
        }
      }

      out = out || { e: ctx.t0, m: [] }
    }

    out = out || { m: [] }
    ctx.log && ctx.log(
      'parse',
      rule.name + '/' + rule.id,
      RuleState[rule.state],
      'alts',

      // TODO: indicate none found (don't just show last)
      alt && alt.s ? alt.s.join('') : '',
      ctx.tI,
      'p=' + (out.p || ''),
      'r=' + (out.r || ''),
      'b=' + (out.b || ''),
      out.m.map((t: Token) => t.pin).join(' '),
      out.m.map((t: Token) => t.src).join(''),
      out)

    if (out.m) {
      let mI = 0
      let rewind = out.m.length - (out.b || 0)
      while (mI++ < rewind) {
        ctx.next()
      }
    }

    /*
    if (out.e) {
      console.log(out.e)
    }
    */

    return out
  }
}


class Parser {

  options: Opts// = STANDARD_OPTIONS
  rules: { [name: string]: any }
  rulespecs: { [name: string]: RuleSpec }

  constructor(options?: Opts) {
    let o = this.options = options || util.deep({}, STANDARD_OPTIONS)
    //let o = this.options = util.deep(this.options, options)

    let top = (alt: any, rule: Rule, ctx: Context) => 0 === ctx.rs.length

    this.rules = {
      val: {
        open: [ // alternatives
          { s: [o.OB], p: 'map' },  // p:push onto rule stack
          { s: [o.OS], p: 'list' },

          { s: [o.CA], p: 'list', b: 1 },

          // Implicit map - operates at any depth
          { s: [o.TX, o.CL], p: 'map', b: 2 },
          { s: [o.ST, o.CL], p: 'map', b: 2 },
          { s: [o.NR, o.CL], p: 'map', b: 2 },
          { s: [o.VL, o.CL], p: 'map', b: 2 },

          { s: [o.TX] },
          { s: [o.NR] },
          { s: [o.ST] },
          { s: [o.VL] },
        ],
        close: [
          // Implicit list works only at top level
          {
            s: [o.CA], c: top, r: 'elem',
            h: (spec: RuleSpec, rule: Rule, ctx: Context) => {
              rule.node = [rule.node]
            }
          },

          // Non-empty close means we need a catch-all backtrack
          { s: [o.AA], b: 1 },
        ],
        before_close: (rule: Rule) => {
          rule.node = rule.child.node ?? rule.open[0]?.val
        },
      },


      map: {
        before_open: () => {
          return { node: {} }
        },
        open: [
          { s: [o.CB] }, // empty
          { p: 'pair' } // no tokens, pass node
        ],
        close: []
      },

      list: {
        before_open: () => {
          return { node: [] }
        },
        open: [
          { s: [o.CS] }, // empty
          { p: 'elem' } // no tokens, pass node
        ],
        close: []
      },


      // sets key:val on node
      pair: {
        open: [
          { s: [o.ST, o.CL], p: 'val' },
          { s: [o.TX, o.CL], p: 'val' },
          { s: [o.NR, o.CL], p: 'val' },
          { s: [o.VL, o.CL], p: 'val' },
          { s: [o.CB], b: 1 }, // empty
        ],
        close: [
          { s: [o.CA], r: 'pair' }, // next rule (no stack push)
          { s: [o.CB] },
          // TODO: implicit close?

          // Who needs commas anyway?
          { s: [o.ST, o.CL], r: 'pair', b: 2 },
          { s: [o.TX, o.CL], r: 'pair', b: 2 },
          { s: [o.NR, o.CL], r: 'pair', b: 2 },
          { s: [o.VL, o.CL], r: 'pair', b: 2 },
        ],
        before_close: (rule: Rule) => {
          let token = rule.open[0]
          if (token) {
            let key = o.ST === token.pin ? token.val : token.src
            rule.node[key] = rule.child.node
          }
        },
      },


      // push onto node
      elem: {
        open: [
          { s: [o.OB], p: 'map' },
          { s: [o.OS], p: 'list' },
          { s: [o.TX] },
          { s: [o.NR] },
          { s: [o.ST] },
          { s: [o.VL] },

          // Insert null for initial comma
          { s: [o.CA, o.CA], b: 2 },
          { s: [o.CA] },
        ],
        close: [
          // Ignore trailing comma
          { s: [o.CA, o.CS] },

          // Next element.
          { s: [o.CA], r: 'elem' },

          // End list.
          { s: [o.CS] },

          // Who needs commas anyway?
          { s: [o.OB], p: 'map', },
          { s: [o.OS], p: 'list', },

          { s: [o.TX, o.CL], p: 'map', b: 2 },
          { s: [o.NR, o.CL], p: 'map', b: 2 },
          { s: [o.ST, o.CL], p: 'map', b: 2 },
          { s: [o.VL, o.CL], p: 'map', b: 2 },

          { s: [o.TX], r: 'elem', b: 1 },
          { s: [o.NR], r: 'elem', b: 1 },
          { s: [o.ST], r: 'elem', b: 1 },
          { s: [o.VL], r: 'elem', b: 1 },
        ],
        after_open: (rule: Rule, ctx: Context, next: Rule) => {
          if (rule === next && rule.open[0]) {
            let val = rule.open[0].val
            // Insert `null` if no value preceeded the comma (eg. [,1] -> [null, 1])
            rule.node.push(null != val ? val : null)
          }
        },
        before_close: (rule: Rule) => {
          if (rule.child.node) {
            rule.node.push(rule.child.node)
          }
        },
      }
    }

    // TODO: rulespec should normalize
    // eg. t:o.QQ => s:[o.QQ]
    this.rulespecs = Object.keys(this.rules).reduce((rs: any, rn: string) => {
      rs[rn] = new RuleSpec(rn, this.rules[rn], rs)
      return rs
    }, {})
  }


  rule(
    name: string,
    define: (rs: RuleSpec, rsm: { [n: string]: RuleSpec }) => RuleSpec
  ) {
    this.rulespecs[name] = define(this.rulespecs[name], this.rulespecs) ||
      this.rulespecs[name]
  }


  start(lexer: Lexer, src: string, meta?: any): any {
    let opts = this.options

    let ctx: Context = {
      rI: 1,
      opts: opts,
      meta: meta || {},
      src: () => src, // Avoid printing src
      node: undefined,
      t0: opts.end,
      t1: opts.end,
      tI: -2,  // adjust count for token lookahead
      next,
      rs: [],
      log: (meta && meta.log) || undefined,
      use: {}
    }

    util.make_log(ctx)

    let lex = lexer.start(ctx)

    let rule = new Rule(this.rulespecs.val, ctx, opts)

    let root = rule

    // Maximum rule iterations. Allow for rule open and close,
    // and for each rule on each char to be virtual (like map, list)
    let maxr = 2 * Object.keys(this.rulespecs).length * lex.src.length

    // Lex next token.
    function next() {
      ctx.t0 = ctx.t1

      let t1
      do {
        t1 = lex()
        ctx.tI++
      } while (opts.tokens.ignore.includes(t1.pin))

      ctx.t1 = { ...t1 }

      return ctx.t0
    }

    // Look two tokens ahead
    next()
    next()

    // Process rules on tokens
    let rI = 0

    while (norule !== rule && rI < maxr) {
      ctx.log &&
        ctx.log('rule', rule.name + '/' + rule.id, RuleState[rule.state],
          ctx.rs.length, ctx.tI, ctx.t0.pin + ' ' + ctx.t1.pin, rule, ctx)

      rule = rule.process(ctx)

      ctx.log &&
        ctx.log('stack', ctx.rs.map((r: Rule) => r.name + '/' + r.id).join(';'),
          rule, ctx)
      rI++
    }

    // TODO: must end with o.ZZ token else error

    return root.node
  }
}


let util = {

  // Deep override for plain objects. Retains base object.
  // Array indexes are treated as properties.
  // Over wins non-matching types, except at top level.
  //deep: function(base?: any, over?: any): any {
  deep: function(base?: any, ...rest: any): any {
    for (let over of rest) {
      if (null != base && null != over) {
        for (let k in over) {
          base[k] = (
            'object' === typeof (base[k]) &&
            'object' === typeof (over[k]) &&
            (Array.isArray(base[k]) === Array.isArray(over[k]))
          ) ? util.deep(base[k], over[k]) : over[k]
        }
        //return base
      }
      else {
        base = null != over ? over : null != base ? base :
          undefined != over ? over : base
      }
    }
    return base
  },


  // Convert string to character code array.
  // 'ab' -> [97,98]
  s2cca: function(s: string): number[] {
    return s.split('').map((c: string) => c.charCodeAt(0))
  },


  longest: (strs: string[]) =>
    strs.reduce((a, s) => a < s.length ? s.length : a, 0),


  // Special debug logging to console (use Jsonic('...', {log:N})).
  // log:N -> console.dir to depth N
  // log:-1 -> console.dir to depth 1, omitting objects (good summary!)
  make_log: (ctx: Context) => {
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
            .filter((item: any) => 'object' != typeof (item))
            .join('\t')

          if ('node' === rest[0]) {
            logstr += '\t' + JSON.stringify(rest[3])
          }
          ctx.opts.console.log(logstr)
        }
        else {
          ctx.opts.console.dir(rest, { depth: logdepth })
        }
        return undefined
      }
    }
  },


  errinject: (s: string, code: string, details: KV, token: Token, ctx: Context) => {
    return s.replace(/\$([\w_]+)/g, (m: any, name: string) => {
      return (
        'code' === name ? code : (
          details[name] ||
          ctx.meta[name] ||
          (token as KV)[name] ||
          (ctx as KV)[name] ||
          ctx.opts[name] ||
          '$' + name
        )
      )
    })
  },


  extract: (src: string, errtxt: string, token: Token) => {
    let loc = 0 < token.loc ? token.loc : 0
    let row = 0 < token.row ? token.row : 0
    let col = 0 < token.col ? token.col : 0
    let tsrc = null == token.src ? '' : token.src
    let behind = src.substring(Math.max(0, loc - 333), loc).split('\n')
    let ahead = src.substring(loc, loc + 333).split('\n')

    let pad = 2 + ('' + (row + 2)).length
    let rI = row < 2 ? 0 : row - 2
    let ln = (s: string) => '\x1b[34m' + ('' + (rI++)).padStart(pad, ' ') +
      ' | \x1b[0m' + (null == s ? '' : s)

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
      .filter((line: string) => null != line)
      .join('\n')

    return lines
  },


  handle_meta_mode: (self: Jsonic, src: string, meta: KV): any[] => {
    let opts = self.options
    if ('function' === typeof (opts.mode[meta.mode])) {
      try {
        return opts.mode[meta.mode].call(self, src, meta)
      }
      catch (ex) {
        if ('SyntaxError' === ex.name) {
          let loc = 0
          let row = 0
          let col = 0
          let tsrc = ''
          let errloc = ex.message.match(/^Unexpected token (.) .*position\s+(\d+)/i)
          if (errloc) {
            tsrc = errloc[1]
            loc = parseInt(errloc[2])
            row = src.substring(0, loc).replace(/[^\n]/g, '').length
            //row = row < 0 ? 0 : row
            let cI = loc - 1
            while (-1 < cI && '\n' !== src.charAt(cI)) cI--;
            col = cI < loc ? src.substring(cI, loc).length - 1 : 0
          }

          let token = ex.token || {
            pin: opts.UK,
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
            ex.ctx || {
              rI: -1,
              opts,
              meta,
              src: () => src,
              node: undefined,
              t0: token,
              t1: token, // TODO: should be end token
              tI: -1,
              rs: [],
              next: () => token, // TODO: should be end token
              log: meta.log,
              use: {}
            } as Context,
          )
        }
        else throw ex
      }
    }
    else {
      return [false]
    }
  },


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
        Array.isArray(opts[k]) &&
        '#' === opts[k][0][0] &&
        4 === opts[k][0].length)
      .reduce((a: number[], k) =>
        (a[opts[k][0].charCodeAt(3)] = opts[k], a), [])

    // Custom singles.
    // TODO: prevent override of builtins
    opts.singles = null == opts.singles ? '' : opts.singles
    opts.singles.split('').forEach((s: string, i: number) => {
      opts.SINGLES[s.charCodeAt(0)] = ['#' + s + '#' + i]
    })

    opts.TOKENS = opts.SINGLES
      .map((t: any, i: number) => null == t ? null : i)
      .filter((i: number) => null != + i)
      .reduce((a: any, i: number) =>
        (a[String.fromCharCode(i)] = opts.SINGLES[i], a), {})

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
      opts.SINGLES.map((s: any, cc: number) => String.fromCharCode(cc)).join('')

    opts.VALUE_ENDERS =
      opts.sc_space + opts.sc_line + opts.SINGLE_CHARS + opts.SC_COMMENT_CHARS


    opts.TEXT_ENDERS = opts.VALUE_ENDERS

    opts.HOOVER_ENDERS = opts.sc_line + opts.SINGLE_CHARS + opts.SC_COMMENT_CHARS

    opts.VALUES = opts.values || {}


    // Token sets
    opts.tokens = opts.tokens || {}
    opts.tokens.value = NONE !== opts.tokens.value ? opts.tokens.value :
      [opts.TX, opts.NR, opts.ST, opts.VL]
    opts.tokens.ignore = NONE !== opts.tokens.ignore ? opts.tokens.ignore :
      [opts.SP, opts.LN, opts.CM]

    return opts
  },
}



function make(first?: KV | Jsonic, parent?: Jsonic): Jsonic {
  // Handle polymorphic params.
  let param_opts = (first as KV)
  if ('function' === typeof (first)) {
    param_opts = ({} as KV)
    parent = (first as Jsonic)
  }

  // Merge options.
  let opts = util.norm_options(util.deep(
    {},
    parent ? parent.options : STANDARD_OPTIONS,
    param_opts
  ))

  // Create primary parsing function
  let self: any = function Jsonic(src: any, meta?: any): any {
    if ('string' === typeof (src)) {
      let internal = self.internal()

      let [done, out] =
        (null != meta && null != meta.mode) ? util.handle_meta_mode(self, src, meta) :
          [false]

      if (!done) {
        out = internal.parser.start(internal.lexer, src, meta)
      }

      return out
    }

    return src
  }

  // Transfer parent properties (preserves plugin decorations, etc).
  if (parent) {
    for (let k in parent) {
      self[k] = parent[k]
    }

    self.parent = parent
  }

  let lexer = new Lexer(opts)
  let parser = new Parser(opts)

  self.internal = () => ({ lexer, parser })

  self.options = util.deep((change_opts?: KV): Jsonic => {
    if (null != change_opts && 'object' === typeof (change_opts)) {
      opts = util.norm_options(util.deep(opts, change_opts))
      for (let k in opts) {
        self.options[k] = opts[k]
      }
    }
    return self
  }, opts)

  self.parse = self


  self.use = function use(plugin: Plugin, opts?: KV): Jsonic {
    let jsonic = self
    if (opts) {
      jsonic = self.make(opts)
    }
    plugin(jsonic)
    return jsonic
  }


  self.rule = function(name: string, define: (rs: RuleSpec) => RuleSpec): Jsonic {
    self.internal().parser.rule(name, define)
    return self
  }


  self.lex = function(state: string[], match: (
    sI: number,
    src: string,
    token: Token,
    ctx: Context
  ) => any) {
    let lexer = this.internal().lexer
    lexer.lex(state, match)
  }


  self.make = function(opts?: Opts) {
    return make(opts, self)
  }

  return (self as Jsonic)
}



let Jsonic: Jsonic = make()

export {
  Jsonic,
  Plugin,
  JsonicError,
  Lexer,
  Parser,
  Rule,
  RuleSpec,
  Token,
  Context,
  Meta,
  util
}





