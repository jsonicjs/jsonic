import type { Config, Context, Counters, Bag, Tin, Point, Token, Rule, RuleSpec, Lex, RuleDefiner, RuleState, RuleSpecMap, LexMatcher, MakeLexMatcher, AltSpec, AltMatch, AltAction, AltCond, AltModifier, AltError, Options, JsonicAPI, JsonicParse, Plugin, StateAction, Parser, NormAltSpec, LexCheck } from './types';
import { OPEN, CLOSE, BEFORE, AFTER, EMPTY } from './types';
import { JsonicError, S, badlex, deep, errdesc, errinject, extract, makelog, mesc, regexp, tokenize, trimstk, srcfmt, clone, charset, configure, escre, parserwrap, prop, str, clean } from './utility';
import { makePoint, makeToken, makeLex, makeFixedMatcher, makeSpaceMatcher, makeLineMatcher, makeStringMatcher, makeCommentMatcher, makeNumberMatcher, makeTextMatcher } from './lexer';
import { makeRule, makeRuleSpec, makeParser } from './parser';
declare const util: {
    tokenize: typeof tokenize;
    srcfmt: typeof srcfmt;
    clone: typeof clone;
    charset: typeof charset;
    trimstk: typeof trimstk;
    makelog: typeof makelog;
    badlex: typeof badlex;
    extract: typeof extract;
    errinject: typeof errinject;
    errdesc: typeof errdesc;
    configure: typeof configure;
    parserwrap: typeof parserwrap;
    mesc: typeof mesc;
    escre: typeof escre;
    regexp: typeof regexp;
    prop: typeof prop;
    str: typeof str;
    clean: typeof clean;
    deep: typeof deep;
    omap: (o: any, f?: ((e: any) => any) | undefined) => any;
    keys: (x: any) => string[];
    values: <T>(x: {
        [key: string]: T;
    } | null | undefined) => T[];
    entries: <T_1>(x: {
        [key: string]: T_1;
    } | null | undefined) => [string, T_1][];
};
type Jsonic = JsonicParse & // A function that parses.
JsonicAPI & {
    [prop: string]: any;
};
declare function make(param_options?: Bag | string, parent?: Jsonic): Jsonic;
declare let root: any;
declare let Jsonic: Jsonic;
export type { Plugin, Options, Config, Context, Token, Point, Rule, RuleSpec, Lex, Counters, Bag, Tin, MakeLexMatcher, LexMatcher, RuleDefiner, RuleState, RuleSpecMap, AltSpec, AltMatch, AltCond, AltAction, AltModifier, AltError, StateAction, NormAltSpec, LexCheck, };
export { Jsonic as Jsonic, JsonicError, Parser, util, make, makeToken, makePoint, makeRule, makeRuleSpec, makeLex, makeParser, makeFixedMatcher, makeSpaceMatcher, makeLineMatcher, makeStringMatcher, makeCommentMatcher, makeNumberMatcher, makeTextMatcher, OPEN, CLOSE, BEFORE, AFTER, EMPTY, S, root, };
export default Jsonic;
