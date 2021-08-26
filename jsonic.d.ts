import type { Relate, Tin, Point, Token, StrMap } from './types';
import { Config, Context, JsonicError, badlex, deep, errdesc, errinject, extract, makelog, mesc, regexp, tokenize, trimstk, srcfmt, clone, charset, configure, escre, parserwrap } from './utility';
import type { MakeLexMatcher } from './lexer';
import { Lex, makePoint, makeToken } from './lexer';
import type { AltAction } from './parser';
import { Parser, Rule, RuleDefiner, RuleSpec, RuleSpecMap } from './parser';
declare type Jsonic = JsonicParse & // A function that parses.
JsonicAPI & // A utility with API methods.
{
    [prop: string]: any;
};
declare type JsonicParse = (src: any, meta?: any, parent_ctx?: any) => any;
declare type JsonicAPI = {
    parse: JsonicParse;
    options: Options & ((change_options?: Relate) => Relate);
    make: (options?: Options) => Jsonic;
    use: (plugin: Plugin, plugin_options?: Relate) => Jsonic;
    rule: (name?: string, define?: RuleDefiner) => RuleSpec | RuleSpecMap;
    lex: (matchmaker: MakeLexMatcher) => void;
    token: {
        [ref: string]: Tin;
    } & {
        [ref: number]: string;
    } & (<A extends string | Tin>(ref: A) => A extends string ? Tin : string);
    fixed: {
        [ref: string]: Tin;
    } & {
        [ref: number]: string;
    } & (<A extends string | Tin>(ref: A) => A extends string ? Tin : string);
    id: string;
    toString: () => string;
    util: Relate;
};
declare type Plugin = ((jsonic: Jsonic, plugin_options?: any) => void | Jsonic) & {
    defaults?: Relate;
};
declare type Options = {
    tag?: string;
    fixed?: {
        lex?: boolean;
        token?: StrMap;
    };
    tokenSet?: {
        ignore?: string[];
    };
    space?: {
        lex?: boolean;
        chars?: string;
    };
    line?: {
        lex?: boolean;
        chars?: string;
        rowChars?: string;
    };
    text?: {
        lex?: boolean;
    };
    number?: {
        lex?: boolean;
        hex?: boolean;
        oct?: boolean;
        bin?: boolean;
        sep?: string | null;
    };
    comment?: {
        lex?: boolean;
        marker?: {
            line?: boolean;
            start?: string;
            end?: string;
            lex?: boolean;
        }[];
    };
    string?: {
        lex?: boolean;
        chars?: string;
        multiChars?: string;
        escapeChar?: string;
        escape?: {
            [char: string]: string | null;
        };
        allowUnknown?: boolean;
    };
    map?: {
        extend?: boolean;
        merge?: (prev: any, curr: any) => any;
    };
    value?: {
        lex?: boolean;
        map?: {
            [src: string]: {
                val: any;
            };
        };
    };
    plugin?: Relate;
    debug?: {
        get_console?: () => any;
        maxlen?: number;
        print?: {
            config?: boolean;
        };
    };
    error?: {
        [code: string]: string;
    };
    hint?: any;
    lex?: {
        empty?: boolean;
        match?: MakeLexMatcher[];
    };
    rule?: {
        start?: string;
        finish?: boolean;
        maxmul?: number;
        include?: string;
        exclude?: string;
    };
    config?: {
        modify?: {
            [plugin_name: string]: (config: Config, options: Options) => void;
        };
    };
    parser?: {
        start?: (lexer: any, //Lexer,
        src: string, jsonic: any, //Jsonic,
        meta?: any, parent_ctx?: any) => any;
    };
};
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
    mesc: typeof mesc;
    escre: typeof escre;
    regexp: typeof regexp;
};
declare function make(param_options?: Relate, parent?: Jsonic): Jsonic;
declare let Jsonic: Jsonic;
export type { Plugin, Tin, RuleSpecMap, Context, Options, AltAction, Point, Token, };
export { Jsonic, JsonicError, Lex, Parser, Rule, RuleSpec, util, make, makeToken, makePoint, };
export default Jsonic;
