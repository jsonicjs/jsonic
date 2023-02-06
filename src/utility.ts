/* Copyright (c) 2013-2022 Richard Rodger, MIT License */

/*  utility.ts
 *  Utility functions and constants.
 */

import type {
  AltMatch,
  AltSpec,
  Bag,
  Chars,
  Config,
  Context,
  Lex,
  LexMatcher,
  NormAltSpec,
  Options,
  Rule,
  RuleSpec,
  Tin,
  Token,
  ValModifier,
  Point,
  ListMods,
} from './types'

import { OPEN, EMPTY, STRING } from './types'

import { makeToken, makePoint } from './lexer'

// Null-safe object and array utilities
// TODO: should use proper types:
// https://github.com/microsoft/TypeScript/tree/main/src/lib
const keys = (x: any) => (null == x ? [] : Object.keys(x))
const values = <T>(x: { [key: string]: T } | undefined | null): T[] =>
  null == x ? ([] as T[]) : Object.values(x)
const entries = <T>(
  x: { [key: string]: T } | undefined | null
): [string, T][] => (null == x ? ([] as [string, T][]) : Object.entries(x))
const assign = (x: any, ...r: any[]) => Object.assign(null == x ? {} : x, ...r)
const isarr = (x: any) => Array.isArray(x)
const defprop = Object.defineProperty

// Map object properties using entries.
const omap = (o: any, f?: (e: any) => any) => {
  return Object.entries(o || {}).reduce((o: any, e: any) => {
    let me = f ? f(e) : e
    if (undefined === me[0]) {
      delete o[e[0]]
    } else {
      o[me[0]] = me[1]
    }

    // Additional pairs set additional keys.
    let i = 2
    while (undefined !== me[i]) {
      o[me[i]] = me[i + 1]
      i += 2
    }

    return o
  }, {})
}

// TODO: remove!
// A bit pedantic, but let's be strict about strings.
// Also improves minification a little.
const S = {
  indent: '. ',
  logindent: '  ',
  space: ' ',
  gap: '  ',
  Object: 'Object',
  Array: 'Array',
  object: 'object',
  string: 'string',
  function: 'function',
  unexpected: 'unexpected',
  map: 'map',
  list: 'list',
  elem: 'elem',
  pair: 'pair',
  val: 'val',
  node: 'node',
  no_re_flags: EMPTY,
  unprintable: 'unprintable',
  invalid_ascii: 'invalid_ascii',
  invalid_unicode: 'invalid_unicode',
  invalid_lex_state: 'invalid_lex_state',
  unterminated_string: 'unterminated_string',
  unterminated_comment: 'unterminated_comment',
  lex: 'lex',
  parse: 'parse',
  error: 'error',
  none: 'none',
  imp_map: 'imp,map',
  imp_list: 'imp,list',
  imp_null: 'imp,null',
  end: 'end',
  open: 'open',
  close: 'close',
  rule: 'rule',
  stack: 'stack',
  nUll: 'null',
  name: 'name',
  make: 'make',
  colon: ':',
}

// Jsonic errors with nice formatting.
class JsonicError extends SyntaxError {
  constructor(
    code: string,
    details: Bag,
    token: Token,
    rule: Rule,
    ctx: Context
  ) {
    details = deep({}, details)
    let desc = errdesc(code, details, token, rule, ctx)
    super(desc.message)
    assign(this, desc)
    trimstk(this)
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

// Idempotent normalization of options.
// See Config type for commentary.
function configure(
  jsonic: any,
  incfg: Config | undefined,
  opts: Options
): Config {
  const cfg = incfg || ({} as Config)

  cfg.t = cfg.t || {}
  cfg.tI = cfg.tI || 1

  const t = (tn: string) => tokenize(tn, cfg)

  // Standard tokens. These names should not be changed.
  if (false !== opts.standard$) {
    t('#BD') // BAD
    t('#ZZ') // END
    t('#UK') // UNKNOWN
    t('#AA') // ANY
    t('#SP') // SPACE
    t('#LN') // LINE
    t('#CM') // COMMENT
    t('#NR') // NUMBER
    t('#ST') // STRING
    t('#TX') // TEXT
    t('#VL') // VALUE
  }

  cfg.fixed = {
    lex: !!opts.fixed?.lex,
    token: opts.fixed
      ? omap(clean(opts.fixed.token), ([name, src]: [string, string]) => [
          src,
          tokenize(name, cfg),
        ])
      : {},
    ref: undefined as any,
  }

  cfg.fixed.ref = omap(cfg.fixed.token, ([tin, src]: [string, string]) => [
    tin,
    src,
  ])
  cfg.fixed.ref = Object.assign(
    cfg.fixed.ref,
    omap(cfg.fixed.ref, ([tin, src]: [string, string]) => [src, tin])
  )

  cfg.match = {
    lex: !!opts.match?.lex,
    value: opts.match
      ? omap(clean(opts.match.value), ([name, spec]: [string, any]) => [
          name,
          spec,
        ])
      : {},
    token: opts.match
      ? omap(
          clean(opts.match.token),
          ([name, matcher]: [string, RegExp | LexMatcher]) => [
            tokenize(name, cfg),
            matcher,
          ]
        )
      : {},
  }

  // Lookup tin directly from matcher
  omap(cfg.match.token, ([tin, matcher]: [number, any]) => [
    tin,
    ((matcher.tin$ = +tin), matcher),
  ])

  // Convert tokenSet tokens names to tins
  const tokenSet = opts.tokenSet
    ? Object.keys(opts.tokenSet).reduce(
        (a: any, n: string) => (
          (a[n] = (opts.tokenSet as any)[n]
            .filter((x: any) => null != x)
            .map((n: string) => t(n))),
          a
        ),
        {}
      )
    : {}

  cfg.tokenSet = cfg.tokenSet || {}
  entries(tokenSet).map((entry: any[]) => {
    let name = entry[0]
    let tinset = entry[1]

    if (cfg.tokenSet[name]) {
      cfg.tokenSet[name].length = 0
      cfg.tokenSet[name].push(...tinset)
    } else {
      cfg.tokenSet[name] = tinset
    }
  })

  // Lookup table for token tin in given tokenSet
  cfg.tokenSetTins = entries(cfg.tokenSet).reduce(
    (a: any, en: any[]) => (
      (a[en[0]] = a[en[0]] || {}),
      en[1].map((tin: number) => (a[en[0]][tin] = true)),
      a
    ),
    {}
  )

  // The IGNORE tokenSet is special and should always exist, even if empty.
  cfg.tokenSetTins.IGNORE = cfg.tokenSetTins.IGNORE || {}

  cfg.space = {
    lex: !!opts.space?.lex,
    chars: charset(opts.space?.chars),
  }

  cfg.line = {
    lex: !!opts.line?.lex,
    chars: charset(opts.line?.chars),
    rowChars: charset(opts.line?.rowChars),
    single: !!opts.line?.single,
  }

  cfg.text = {
    lex: !!opts.text?.lex,
    modify: (cfg.text?.modify || [])
      .concat(([opts.text?.modify] || []).flat() as ValModifier[])
      .filter((m) => null != m),
  }

  cfg.number = {
    lex: !!opts.number?.lex,
    hex: !!opts.number?.hex,
    oct: !!opts.number?.oct,
    bin: !!opts.number?.bin,
    sep: null != opts.number?.sep && '' !== opts.number.sep,
    exclude: opts.number?.exclude,
    sepChar: opts.number?.sep,
  }

  // NOTE: these are not value ending tokens
  cfg.value = {
    lex: !!opts.value?.lex,
    def: entries(opts.value?.def || {}).reduce(
      (a: any, e: any[]) => (
        null == e[1] || false === e[1] || e[1].match || (a[e[0]] = e[1]), a
      ),
      {} as any
    ),
    defre: entries(opts.value?.def || {}).reduce(
      (a: any, e: any[]) => (
        e[1] &&
          e[1].match &&
          ((a[e[0]] = e[1]), (a[e[0]].consume = !!a[e[0]].consume)),
        a
      ),
      {} as any
    ),

    // TODO: just testing, move to a plugin for extended values
    // 'undefined': { v: undefined },
    // 'NaN': { v: NaN },
    // 'Infinity': { v: Infinity },
    // '+Infinity': { v: +Infinity },
    // '-Infinity': { v: -Infinity },
  }

  cfg.rule = {
    start: null == opts.rule?.start ? 'val' : opts.rule.start,
    maxmul: null == opts.rule?.maxmul ? 3 : opts.rule.maxmul,
    finish: !!opts.rule?.finish,
    include: opts.rule?.include
      ? opts.rule.include.split(/\s*,+\s*/).filter((g) => '' !== g)
      : [],
    exclude: opts.rule?.exclude
      ? opts.rule.exclude.split(/\s*,+\s*/).filter((g) => '' !== g)
      : [],
  }

  cfg.map = {
    extend: !!opts.map?.extend,
    merge: opts.map?.merge,
  }

  cfg.list = {
    property: !!opts.list?.property,
  }

  let fixedSorted = Object.keys(cfg.fixed.token).sort(
    (a: string, b: string) => b.length - a.length
  )

  let fixedRE = fixedSorted.map((fixed) => escre(fixed)).join('|')

  let commentStartRE = opts.comment?.lex
    ? (opts.comment.def ? values(opts.comment.def) : [])
        .filter((c) => c && c.lex)
        .map((c: any) => escre(c.start))
        .join('|')
    : ''

  // End-marker RE part
  let enderRE = [
    '([',
    escre(
      keys(
        charset(
          cfg.space.lex && cfg.space.chars,
          cfg.line.lex && cfg.line.chars
        )
      ).join('')
    ),
    ']',

    ('string' === typeof opts.ender
      ? opts.ender.split('')
      : Array.isArray(opts.ender)
      ? opts.ender
      : []
    )
      .map((c: string) => '|' + escre(c))
      .join(''),

    '' === fixedRE ? '' : '|',
    fixedRE,

    '' === commentStartRE ? '' : '|',
    commentStartRE,

    '|$)', // EOF case
  ]

  cfg.rePart = {
    fixed: fixedRE,
    ender: enderRE,
    commentStart: commentStartRE,
  }

  // TODO: friendlier names
  cfg.re = {
    ender: regexp(null, ...enderRE),

    // TODO: prebuild these using a property on matcher?
    rowChars: regexp(null, escre(opts.line?.rowChars)),

    columns: regexp(null, '[' + escre(opts.line?.chars) + ']', '(.*)$'),
  }

  cfg.lex = {
    empty: !!opts.lex?.empty,
    emptyResult: opts.lex?.emptyResult,
    match: opts.lex?.match
      ? entries(opts.lex.match)
          .reduce((list: any[], entry: any) => {
            let name = entry[0]
            let matchspec = entry[1]
            if (matchspec) {
              let matcher = matchspec.make(cfg, opts)
              if (matcher) {
                matcher.matcher = name
                matcher.make = matchspec.make
                matcher.order = matchspec.order
              }
              list.push(matcher)
            }
            return list
          }, [])
          .filter((m) => null != m && false !== m && -1 < +m.order)
          .sort((a, b) => a.order - b.order)
      : [],
  }

  cfg.parse = {
    prepare: values(opts.parse?.prepare),
  }

  cfg.debug = {
    get_console: opts.debug?.get_console || (() => console),
    maxlen: null == opts.debug?.maxlen ? 99 : opts.debug.maxlen,
    print: {
      config: !!opts.debug?.print?.config,
      src: opts.debug?.print?.src,
    },
  }

  cfg.error = opts.error || {}
  cfg.hint = opts.hint || {}

  // Apply any config modifiers (probably from plugins).
  if (opts.config?.modify) {
    keys(opts.config.modify).forEach((modifer: string) =>
      (opts.config as any).modify[modifer](cfg, opts)
    )
  }

  // Debug the config - useful for plugin authors.
  if (cfg.debug.print.config) {
    cfg.debug.get_console().dir(cfg, { depth: null })
  }

  cfg.result = {
    fail: [],
  }

  if (opts.result) {
    cfg.result.fail = [...opts.result.fail]
  }

  assign(jsonic.options, opts)
  assign(jsonic.token, cfg.t)
  assign(jsonic.tokenSet, cfg.tokenSet)
  assign(jsonic.fixed, cfg.fixed.ref)

  return cfg
}

// Uniquely resolve or assign token by name (string) or identification number (Tin),
// returning the associated Tin (for the name) or name (for the Tin).
function tokenize<
  R extends string | Tin,
  T extends R extends Tin ? string : Tin
>(ref: R, cfg: Config, jsonic?: any): T {
  let tokenmap: any = cfg.t
  let token: string | Tin = tokenmap[ref]

  if (null == token && STRING === typeof ref) {
    token = cfg.tI++
    tokenmap[token] = ref
    tokenmap[ref] = token
    tokenmap[(ref as string).substring(1)] = token

    if (null != jsonic) {
      assign(jsonic.token, cfg.t)
    }
  }

  return token as T
}

// Find a tokenSet by name, or find the name of the TokenSet containing a given Tin.
function findTokenSet<
  R extends string | Tin,
  T extends R extends Tin ? string : Tin
>(ref: R, cfg: Config): T {
  let tokenSetMap: any = cfg.tokenSet
  let found: string | Tin[] = tokenSetMap[ref]
  return found as T
}

// Mark a string for escaping by `util.regexp`.
function mesc(s: string, _?: any) {
  return (_ = new String(s)), (_.esc = true), _
}

// Construct a RegExp. Use mesc to mark string for escaping.
// NOTE: flags first allows concatenated parts to be rest.
function regexp(
  flags: string | null,
  ...parts: (string | (String & { esc?: boolean }))[]
): RegExp {
  return new RegExp(
    parts
      .map((p) =>
        (p as any).esc
          ? //p.replace(/[-\\|\]{}()[^$+*?.!=]/g, '\\$&')
            escre(p.toString())
          : p
      )
      .join(EMPTY),
    null == flags ? '' : flags
  )
}

function escre(s: string | undefined) {
  return null == s
    ? ''
    : s
        .replace(/[-\\|\]{}()[^$+*?.!=]/g, '\\$&')
        .replace(/\t/g, '\\t')
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n')
}

// Deep override for plain data. Mutates base object and array.
// Array merge by `over` index, `over` wins non-matching types, except:
// `undefined` always loses, `over` plain objects inject into functions,
// and `over` functions always win. Over always copied.
function deep(base?: any, ...rest: any): any {
  let base_isf = S.function === typeof base
  let base_iso = null != base && (S.object === typeof base || base_isf)
  for (let over of rest) {
    let over_isf = S.function === typeof over
    let over_iso = null != over && (S.object === typeof over || over_isf)
    let over_ctor
    if (
      base_iso &&
      over_iso &&
      !over_isf &&
      Array.isArray(base) === Array.isArray(over)
    ) {
      for (let k in over) {
        base[k] = deep(base[k], over[k])
      }
    } else {
      base =
        undefined === over
          ? base
          : over_isf
          ? over
          : over_iso
          ? S.function === typeof (over_ctor = over.constructor) &&
            S.Object !== over_ctor.name &&
            S.Array !== over_ctor.name
            ? over
            : deep(Array.isArray(over) ? [] : {}, over)
          : over

      base_isf = S.function === typeof base
      base_iso = null != base && (S.object === typeof base || base_isf)
    }
  }
  return base
}

// Inject value text into an error message. The value is taken from
// the `details` parameter to JsonicError. If not defined, the value is
// determined heuristically from the Token and Context.
function errinject(
  s: string,
  code: string,
  details: Bag,
  token: Token,
  rule: Rule,
  ctx: Context
): string {
  let ref: Record<string, any> = { code, details, token, rule, ctx }
  return null == s
    ? ''
    : s.replace(/\$([\w_]+)/g, (_m: any, name: string) => {
        let instr = JSON.stringify(
          null != ref[name]
            ? ref[name]
            : null != details[name]
            ? details[name]
            : ctx.meta && null != ctx.meta[name]
            ? ctx.meta[name]
            : null != (token as Bag)[name]
            ? (token as Bag)[name]
            : null != (rule as Bag)[name]
            ? (rule as Bag)[name]
            : null != (ctx.opts as any)[name]
            ? (ctx.opts as any)[name]
            : null != (ctx.cfg as any)[name]
            ? (ctx.cfg as any)[name]
            : null != (ctx as Bag)[name]
            ? (ctx as Bag)[name]
            : '$' + name
        )
        return null == instr ? '' : instr
      })
}

// Remove Jsonic internal lines as spurious for caller.
function trimstk(err: Error) {
  if (err.stack) {
    err.stack = err.stack
      .split('\n')
      .filter((s) => !s.includes('jsonic/jsonic'))
      .map((s) => s.replace(/    at /, 'at '))
      .join('\n')
  }
}

function extract(src: string, errtxt: string, token: Token) {
  let loc = 0 < token.sI ? token.sI : 0
  let row = 0 < token.rI ? token.rI : 1
  let col = 0 < token.cI ? token.cI : 1
  let tsrc = null == token.src ? EMPTY : token.src
  let behind = src.substring(Math.max(0, loc - 333), loc).split('\n')
  let ahead = src.substring(loc, loc + 333).split('\n')

  let pad = 2 + (EMPTY + (row + 2)).length
  let rc = row < 3 ? 1 : row - 2
  let ln = (s: string) =>
    '\x1b[34m' +
    (EMPTY + rc++).padStart(pad, ' ') +
    ' | \x1b[0m' +
    (null == s ? EMPTY : s)

  let blen = behind.length

  let lines = [
    2 < blen ? ln(behind[blen - 3]) : null,
    1 < blen ? ln(behind[blen - 2]) : null,
    ln(behind[blen - 1] + ahead[0]),
    ' '.repeat(pad) +
      '   ' +
      ' '.repeat(col - 1) +
      '\x1b[31m' +
      '^'.repeat(tsrc.length || 1) +
      ' ' +
      errtxt +
      '\x1b[0m',
    ln(ahead[1]),
    ln(ahead[2]),
  ]
    .filter((line: any) => null != line)
    .join('\n')

  return lines
}

function errdesc(
  code: string,
  details: Bag,
  token: Token,
  rule: Rule,
  ctx: Context
): Bag {
  try {
    let cfg = ctx.cfg
    let meta = ctx.meta

    let errtxt = errinject(
      cfg.error[code] ||
        (details?.use?.err &&
          (details.use.err.code || details.use.err.message)) ||
        cfg.error.unknown,
      code,
      details,
      token,
      rule,
      ctx
    )

    if (S.function === typeof cfg.hint) {
      // Only expand the hints on demand. Allows for plugin-defined hints.
      cfg.hint = { ...cfg.hint(), ...cfg.hint }
    }

    let message = [
      '\x1b[31m[jsonic/' + code + ']:\x1b[0m ' + errtxt,
      '  \x1b[34m-->\x1b[0m ' +
        ((meta && meta.fileName) || '<no-file>') +
        ':' +
        token.rI +
        ':' +
        token.cI,
      extract(ctx.src(), errtxt, token),
      '',
      errinject(
        (cfg.hint[code] || details.use?.err?.message || cfg.hint.unknown || '')
          .trim()
          .split('\n')
          .map((s: string) => '  ' + s)
          .join('\n'),
        code,
        details,
        token,
        rule,
        ctx
      ),
      '',
      '  \x1b[2mhttps://jsonic.senecajs.org\x1b[0m',
      '  \x1b[2m--internal: rule=' +
        rule.name +
        '~' +
        rule.state +
        '; token=' +
        tokenize(token.tin, ctx.cfg) +
        (null == token.why ? '' : '~' + token.why) +
        '; plugins=' +
        ctx
          .plgn()
          .map((p: any) => p.name)
          .join(',') +
        '--\x1b[0m\n',
    ].join('\n')

    let desc: any = {
      internal: {
        token,
        ctx,
      },
    }

    desc = {
      ...Object.create(desc),
      message,
      code,
      details,
      meta,
      fileName: meta ? meta.fileName : undefined,
      lineNumber: token.rI,
      columnNumber: token.cI,
    }

    return desc
  } catch (e) {
    // TODO: fix
    console.log(e)
    return {}
  }
}

function badlex(lex: Lex, BD: Tin, ctx: Context) {
  let next = lex.next.bind(lex)

  lex.next = (rule: Rule, alt: NormAltSpec, altI: number, tI: number) => {
    let token = next(rule, alt, altI, tI)

    if (BD === token.tin) {
      let details: any = {}
      if (null != token.use) {
        details.use = token.use
      }
      throw new JsonicError(
        token.why || S.unexpected,
        details,
        token,
        rule,
        ctx
      )
    }

    return token
  }

  return lex
}

// Special debug logging to console (use Jsonic('...', {log:N})).
// log:N -> console.dir to depth N
// log:-1 -> console.dir to depth 1, omitting objects (good summary!)
function makelog(ctx: Context, meta: any) {
  let trace = ctx.opts?.plugin?.debug?.trace

  if (meta || trace) {
    if ('number' === typeof meta?.log || trace) {
      let exclude_objects = false
      let logdepth = meta?.log
      if (-1 === logdepth || trace) {
        logdepth = 1
        exclude_objects = true
      }
      ctx.log = (...rest: any) => {
        if (exclude_objects) {
          let logstr = rest
            .filter((item: any) => S.object != typeof item)
            .map((item: any) => (S.function == typeof item ? item.name : item))
            .join(S.gap)
          ctx.cfg.debug.get_console().log(logstr)
        } else {
          ctx.cfg.debug.get_console().dir(rest, { depth: logdepth })
        }
        return undefined
      }
    } else if ('function' === typeof meta.log) {
      ctx.log = meta.log
    }
  }
  return ctx.log
}

function srcfmt(config: Config): (s: any) => string {
  return 'function' === typeof config.debug.print.src
    ? config.debug.print.src
    : (s: any) => {
        let out =
          null == s
            ? EMPTY
            : Array.isArray(s)
            ? JSON.stringify(s).replace(
                /]$/,
                entries(s as any)
                  .filter((en: any) => isNaN(en[0]))
                  .map(
                    (en, i) =>
                      (0 === i ? ', ' : '') +
                      en[0] +
                      ': ' +
                      JSON.stringify(en[1])
                  ) + // Just one level of array props!
                  ']'
              )
            : JSON.stringify(s)
        out =
          out.substring(0, config.debug.maxlen) +
          (config.debug.maxlen < out.length ? '...' : EMPTY)
        return out
      }
}

function str(o: any, len: number = 44) {
  let s
  try {
    s = 'object' === typeof o ? JSON.stringify(o) : '' + o
  } catch (e: any) {
    s = '' + o
  }
  return snip(len < s.length ? s.substring(0, len - 3) + '...' : s, len)
}

function snip(s: any, len: number = 5) {
  return undefined === s
    ? ''
    : ('' + s).substring(0, len).replace(/[\r\n\t]/g, '.')
}

function clone(class_instance: any) {
  return deep(
    Object.create(Object.getPrototypeOf(class_instance)),
    class_instance
  )
}

// Lookup map for a set of chars.
function charset(...parts: (string | object | boolean | undefined)[]): Chars {
  return null == parts
    ? {}
    : parts
        .filter((p) => false !== p)
        .map((p: any) => ('object' === typeof p ? keys(p).join(EMPTY) : p))
        .join(EMPTY)
        .split(EMPTY)
        .reduce((a: any, c: string) => ((a[c] = c.charCodeAt(0)), a), {})
}

// Remove all properties with values null or undefined. Note: mutates argument.
function clean<T>(o: T): T {
  for (let p in o) {
    if (null == o[p]) {
      delete o[p]
    }
  }
  return o
}

function filterRules(rs: RuleSpec, cfg: Config) {
  let rsnames: (keyof RuleSpec['def'])[] = ['open', 'close']
  for (let rsn of rsnames) {
    ;(rs.def[rsn] as AltSpec[]) = (rs.def[rsn] as AltSpec[])

      // Convert comma separated rule group name list to string[].
      .map(
        (as: AltSpec) => (
          (as.g =
            'string' === typeof as.g
              ? (as.g || '').split(/\s*,+\s*/)
              : as.g || []),
          as
        )
      )

      // Keep rule if any group name matches, or if there are no includes.
      .filter((as: AltSpec) =>
        cfg.rule.include.reduce(
          (a: boolean, g) => a || (null != as.g && -1 !== as.g.indexOf(g)),
          0 === cfg.rule.include.length
        )
      )

      // Drop rule if any group name matches, unless there are no excludes.
      .filter((as: AltSpec) =>
        cfg.rule.exclude.reduce(
          (a: boolean, g) => a && (null == as.g || -1 === as.g.indexOf(g)),
          true
        )
      )
  }

  return rs
}

function prop(obj: any, path: string, val: any): any {
  let root = obj
  try {
    let parts = path.split('.')
    let pn: any
    for (let pI = 0; pI < parts.length; pI++) {
      pn = parts[pI]
      if (pI < parts.length - 1) {
        obj = obj[pn] = obj[pn] || {}
      }
    }
    if (undefined !== val) {
      obj[pn] = val
    }
    return obj[pn]
  } catch (e: any) {
    throw new Error(
      'Cannot ' +
        (undefined === val ? 'get' : 'set') +
        ' path ' +
        path +
        ' on object: ' +
        str(root) +
        (undefined === val ? '' : ' to value: ' + str(val, 22))
    )
  }
}

// Mutates list based on ListMods.
function modlist(list: any[], mods?: ListMods) {
  if (mods && list && 0 < list.length) {
    // Delete before move so indexes still make sense, using null to preserve index.
    if (mods.delete && 0 < mods.delete.length) {
      for (let i = 0; i < mods.delete.length; i++) {
        let mdI = mods.delete[i]
        if (mdI < 0 ? -1 * mdI <= list.length : mdI < list.length) {
          let dI = (list.length + mdI) % list.length
          list[dI] = null
        }
      }
    }

    // Format: [from,to, from,to, ...]
    if (mods.move) {
      for (let i = 0; i < mods.move.length; i += 2) {
        let fromI = (list.length + mods.move[i]) % list.length
        let toI = (list.length + mods.move[i + 1]) % list.length
        let entry = list[fromI]
        list.splice(fromI, 1)
        list.splice(toI, 0, entry)
      }
    }

    // Filter out any deletes.
    // return list.filter((a: AltSpec) => null != a)
    let filtered = list.filter((entry) => null != entry)
    if (filtered.length !== list.length) {
      list.length = 0
      list.push(...filtered)
    }
  }

  return list
}

function parserwrap(parser: any) {
  return {
    start: function (
      src: string,
      // jsonic: Jsonic,
      jsonic: any,
      meta?: any,
      parent_ctx?: any
    ) {
      try {
        return parser.start(src, jsonic, meta, parent_ctx)
      } catch (ex: any) {
        if ('SyntaxError' === ex.name) {
          let loc = 0
          let row = 0
          let col = 0
          let tsrc = EMPTY
          let errloc = ex.message.match(
            /^Unexpected token (.) .*position\s+(\d+)/i
          )
          if (errloc) {
            tsrc = errloc[1]
            loc = parseInt(errloc[2])
            row = src.substring(0, loc).replace(/[^\n]/g, EMPTY).length
            let cI = loc - 1
            while (-1 < cI && '\n' !== src.charAt(cI)) cI--
            col = Math.max(src.substring(cI, loc).length, 0)
          }

          let token =
            ex.token ||
            makeToken(
              '#UK',
              // tokenize('#UK', jsonic.config),
              tokenize('#UK', jsonic.internal().config),
              undefined,
              tsrc,
              makePoint(
                tsrc.length,
                loc,
                ex.lineNumber || row,
                ex.columnNumber || col
              )
            )

          throw new JsonicError(
            ex.code || 'json',
            ex.details || {
              msg: ex.message,
            },
            token,
            {} as Rule,
            ex.ctx ||
              ({
                uI: -1,
                opts: jsonic.options,
                cfg: jsonic.internal().config,
                token: token,
                meta,
                src: () => src,
                root: () => undefined,
                plgn: () => jsonic.internal().plugins,
                rule: { name: 'no-rule' } as Rule,
                sub: {},
                xs: -1,
                v2: token,
                v1: token,
                t0: token,
                t1: token, // TODO: should be end token
                tC: -1,
                kI: -1,
                rs: [],
                rsI: 0,
                // next: () => token, // TODO: should be end token
                rsm: {},
                n: {},
                log: meta ? meta.log : undefined,
                F: srcfmt(jsonic.internal().config),
                use: {},
                NORULE: { name: 'no-rule' } as Rule,
                NOTOKEN: { name: 'no-token' } as Token,
              } as Context)
          )
        } else {
          throw ex
        }
      }
    },
  }
}

export {
  JsonicError,
  S,
  // LOG,
  assign,
  badlex,
  charset,
  clean,
  clone,
  configure,
  deep,
  defprop,
  entries,
  errdesc,
  errinject,
  escre,
  extract,
  filterRules,
  isarr,
  makelog,
  mesc,
  regexp,
  snip,
  srcfmt,
  tokenize,
  trimstk,
  parserwrap,
  prop,
  str,
  omap,
  keys,
  values,
  findTokenSet,
  modlist,
}
