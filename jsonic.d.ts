import { Context, JsonicError, KV, Meta, Options, Tin, badlex, deep, errdesc, errinject, extract, makelog, mesc, regexp, tokenize, trimstk, srcfmt, clone, charset, configure } from './intern';
import { Token, Lex, MakeLexMatcher } from './lexer';
import { Parser, Rule, RuleDefiner, RuleSpec, RuleSpecMap, Alt, AltCond, AltHandler, AltAction } from './parser';
declare type JsonicParse = (src: any, meta?: any, parent_ctx?: any) => any;
declare type JsonicAPI = {
    parse: JsonicParse;
    options: Options & ((change_options?: KV) => KV);
    make: (options?: Options) => Jsonic;
    use: (plugin: Plugin, plugin_options?: KV) => Jsonic;
    rule: (name?: string, define?: RuleDefiner) => RuleSpec | RuleSpecMap;
    lex: (matchmaker: MakeLexMatcher) => void;
    token: {
        [ref: string]: Tin;
    } & {
        [ref: number]: string;
    } & (<A extends string | Tin, B extends string | Tin>(ref: A) => A extends string ? B : string);
    id: string;
    toString: () => string;
};
declare type Jsonic = JsonicParse & // A function that parses.
JsonicAPI & // A utility with API methods.
{
    [prop: string]: any;
};
declare type Plugin = (jsonic: Jsonic) => void | Jsonic;
declare let util: {
    tokenize: typeof tokenize;
    srcfmt: typeof srcfmt;
    deep: typeof deep;
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
    regexp: typeof regexp;
    mesc: typeof mesc;
};
declare function make(param_options?: KV, parent?: Jsonic): Jsonic;
declare function parserwrap(parser: any): {
    start: (src: string, jsonic: Jsonic, meta?: any, parent_ctx?: any) => any;
};
declare let Jsonic: Jsonic;
export { Jsonic, Plugin, JsonicError, Tin, Lex, Parser, Rule, RuleSpec, RuleSpecMap, Token, Context, Meta, Alt, AltCond, AltHandler, AltAction, util, make, };
export default Jsonic;
