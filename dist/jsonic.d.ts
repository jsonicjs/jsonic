import type { AltAction, AltCond, AltError, AltMatch, AltModifier, AltSpec, Bag, Config, Context, Counters, FuncRef, JsonicAPI, JsonicParse, Lex, LexCheck, LexMatcher, MakeLexMatcher, NormAltSpec, Options, Parser, Plugin, Point, Rule, RuleDefiner, RuleSpec, RuleSpecMap, RuleState, StateAction, Tin, Token } from './types';
import { OPEN, CLOSE, BEFORE, AFTER, EMPTY } from './types';
import { S, badlex, deep, makelog, mesc, regexp, tokenize, srcfmt, clone, charset, configure, escre, parserwrap, str, clean } from './utility';
import { JsonicError, errdesc, errinject, errsite, errmsg, trimstk, strinject, prop } from './error';
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
    errsite: typeof errsite;
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
    errmsg: typeof errmsg;
    strinject: typeof strinject;
    deep: typeof deep;
    omap: (o: any, f?: (e: any) => any) => any;
    keys: (x: any) => string[];
    values: <T>(x: {
        [key: string]: T;
    } | undefined | null) => T[];
    entries: <T>(x: {
        [key: string]: T;
    } | undefined | null) => [string, T][];
};
type Jsonic = JsonicParse & // A function that parses.
JsonicAPI & {
    [prop: string]: any;
};
declare function make(param_options?: Bag | string, parent?: Jsonic): Jsonic;
declare let root: any;
declare let Jsonic: Jsonic;
export type { AltAction, AltCond, AltError, AltMatch, AltModifier, AltSpec, Bag, Config, Context, Counters, FuncRef, Lex, LexCheck, LexMatcher, MakeLexMatcher, NormAltSpec, Options, Plugin, Point, Rule, RuleDefiner, RuleSpec, RuleSpecMap, RuleState, StateAction, Tin, Token, };
export { Jsonic as Jsonic, JsonicError, Parser, util, make, makeToken, makePoint, makeRule, makeRuleSpec, makeLex, makeParser, makeFixedMatcher, makeSpaceMatcher, makeLineMatcher, makeStringMatcher, makeCommentMatcher, makeNumberMatcher, makeTextMatcher, OPEN, CLOSE, BEFORE, AFTER, EMPTY, S, root, };
export default Jsonic;
