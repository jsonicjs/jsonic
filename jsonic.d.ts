import { CharCodeMap, Config, Context, JsonicError, KV, Meta, Options, Tin, Token, badlex, deep, errdesc, errinject, extract, makelog, mesc, regexp, tokenize, trimstk, srcfmt, clone, charset } from './intern';
import { Lexer, LexMatcher, LexMatcherListMap, LexMatcherResult, LexMatcherState } from './lexer';
import { Parser, Rule, RuleDefiner, RuleSpec, RuleSpecMap, Alt, AltCond, AltHandler, AltAction } from './parser';
declare type JsonicParse = (src: any, meta?: any, parent_ctx?: any) => any;
declare type JsonicAPI = {
    parse: JsonicParse;
    options: Options & ((change_options?: KV) => KV);
    make: (options?: Options) => Jsonic;
    use: (plugin: Plugin, plugin_options?: KV) => Jsonic;
    rule: (name?: string, define?: RuleDefiner) => RuleSpec | RuleSpecMap;
    lex: (state?: Tin, match?: LexMatcher) => LexMatcherListMap | LexMatcher[];
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
    longest: typeof longest;
    marr: typeof marr;
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
    ender: typeof ender;
};
declare function make(param_options?: KV, parent?: Jsonic): Jsonic;
declare function longest(strs: string[]): number;
declare function marr(a: string[], b: string[]): boolean;
declare function ender(endchars: CharCodeMap, endmarks: KV, singles?: KV): RegExp;
declare function parserwrap(parser: any): {
    start: (lexer: Lexer, src: string, jsonic: Jsonic, meta?: any, parent_ctx?: any) => any;
};
declare function configure(cfg: Config, opts: Options): void;
declare let Jsonic: Jsonic;
export { Jsonic, Plugin, JsonicError, Tin, Lexer, Parser, Rule, RuleSpec, RuleSpecMap, Token, Context, Meta, LexMatcher, LexMatcherListMap, LexMatcherResult, LexMatcherState, Alt, AltCond, AltHandler, AltAction, util, make, };
export default Jsonic;
