import type {
  Config,
  Context,
  Counters,
  Relate,
  Tin,
  Point,
  Token,
  Rule,
  RuleSpec,
  Lex,
  RuleDefiner,
  RuleState,
  RuleSpecMap,
  LexMatcher,
  MakeLexMatcher,
  AltSpec,
  AltMatch,
  AltAction,
  AltCond,
  AltModifier,
  AltError,
  Options,
  JsonicAPI,
  JsonicParse,
  Plugin,
} from './types'
import { OPEN, CLOSE, BEFORE, AFTER } from './types'
import {
  JsonicError,
  badlex,
  deep,
  errdesc,
  errinject,
  extract,
  makelog,
  mesc,
  regexp,
  tokenize,
  trimstk,
  srcfmt,
  clone,
  charset,
  configure,
  escre,
  parserwrap,
  prop,
  str,
} from './utility'
import {
  makePoint,
  makeToken,
  makeLex,
  makeFixedMatcher,
  makeSpaceMatcher,
  makeLineMatcher,
  makeStringMatcher,
  makeCommentMatcher,
  makeNumberMatcher,
  makeTextMatcher,
} from './lexer'
import { makeRule, makeRuleSpec, Parser } from './parser'
declare const util: {
  tokenize: typeof tokenize
  srcfmt: typeof srcfmt
  deep: typeof deep
  clone: typeof clone
  charset: typeof charset
  trimstk: typeof trimstk
  makelog: typeof makelog
  badlex: typeof badlex
  extract: typeof extract
  errinject: typeof errinject
  errdesc: typeof errdesc
  configure: typeof configure
  parserwrap: typeof parserwrap
  mesc: typeof mesc
  escre: typeof escre
  regexp: typeof regexp
  prop: typeof prop
  str: typeof str
  omap: (o: any, f?: ((e: any) => any) | undefined) => any
  keys: (x: any) => string[]
  values: (x: any) => unknown[]
  entries: (x: any) => [string, unknown][]
}
declare type Jsonic = JsonicParse & // A function that parses.
  JsonicAPI & {
    // A utility with API methods.
    [prop: string]: any
  }
declare function make(param_options?: Relate, parent?: Jsonic): Jsonic
declare let Jsonic: Jsonic
export type {
  Plugin,
  Options,
  Config,
  Context,
  Token,
  Point,
  Rule,
  RuleSpec,
  Lex,
  Counters,
  Relate,
  Tin,
  MakeLexMatcher,
  LexMatcher,
  RuleDefiner,
  RuleState,
  RuleSpecMap,
  AltSpec,
  AltMatch,
  AltCond,
  AltAction,
  AltModifier,
  AltError,
}
export {
  Jsonic as Jsonic,
  JsonicError,
  Parser,
  util,
  make,
  makeToken,
  makePoint,
  makeRule,
  makeRuleSpec,
  makeLex,
  makeFixedMatcher,
  makeSpaceMatcher,
  makeLineMatcher,
  makeStringMatcher,
  makeCommentMatcher,
  makeNumberMatcher,
  makeTextMatcher,
  OPEN,
  CLOSE,
  BEFORE,
  AFTER,
}
export default Jsonic
