export declare const OPEN: RuleState;
export declare const CLOSE: RuleState;
export declare const BEFORE: RuleStep;
export declare const AFTER: RuleStep;
export declare const EMPTY = "";
export declare const INSPECT: unique symbol;
export declare const STRING = "string";
export declare type JsonicParse = (src: any, meta?: any, parent_ctx?: any) => any;
export interface JsonicAPI {
    parse: JsonicParse;
    options: Options & ((change_options?: Bag) => Bag);
    make: (options?: Options) => Jsonic;
    use: (plugin: Plugin, plugin_options?: Bag) => Jsonic;
    rule: (name?: string, define?: RuleDefiner | null) => Jsonic | RuleSpec | RuleSpecMap;
    lex: (matchmaker: MakeLexMatcher) => void;
    empty: (options?: Options) => Jsonic;
    token: {
        [ref: string]: Tin;
    } & {
        [ref: number]: string;
    } & (<A extends string | Tin>(ref: A) => A extends string ? Tin : string);
    fixed: {
        [ref: string]: Tin;
    } & {
        [ref: number]: string;
    } & (<A extends string | Tin>(ref: A) => undefined | (A extends string ? Tin : string));
    id: string;
    toString: () => string;
    util: Bag;
}
export declare type Jsonic = JsonicParse & // A function that parses.
JsonicAPI & {
    [prop: string]: any;
};
export declare type Plugin = ((jsonic: Jsonic, plugin_options?: any) => void | Jsonic) & {
    defaults?: Bag;
};
export declare type Options = {
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
        modify?: ValModifier | ValModifier[];
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
        replace?: {
            [char: string]: string | null;
        };
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
    ender?: string | string[];
    plugin?: Bag;
    debug?: {
        get_console?: () => any;
        maxlen?: number;
        print?: {
            config?: boolean;
            src?: (x: any) => string;
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
    defaults$?: boolean;
    grammar$?: boolean;
};
export interface RuleSpec {
    name: string;
    def: {
        open: AltSpec[];
        close: AltSpec[];
        bo: StateAction[];
        bc: StateAction[];
        ao: StateAction[];
        ac: StateAction[];
    };
    tin<R extends string | Tin, T extends R extends Tin ? string : Tin>(ref: R): T;
    add(state: RuleState, a: AltSpec | AltSpec[], flags: any): RuleSpec;
    open(a: AltSpec | AltSpec[], flags?: any): RuleSpec;
    close(a: AltSpec | AltSpec[], flags?: any): RuleSpec;
    action(prepend: boolean, step: RuleStep, state: RuleState, action: StateAction): RuleSpec;
    bo(first: StateAction | boolean, second?: StateAction): RuleSpec;
    ao(first: StateAction | boolean, second?: StateAction): RuleSpec;
    bc(first: StateAction | boolean, second?: StateAction): RuleSpec;
    ac(first: StateAction | boolean, second?: StateAction): RuleSpec;
    clear(): RuleSpec;
    process(rule: Rule, ctx: Context, state: RuleState): Rule;
    parse_alts(is_open: boolean, alts: NormAltSpec[], rule: Rule, ctx: Context): AltMatch;
    bad(tkn: Token, rule: Rule, ctx: Context, parse: {
        is_open: boolean;
    }): Rule;
}
export interface Rule {
    id: number;
    name: string;
    spec: RuleSpec;
    node: any;
    state: RuleState;
    child: Rule;
    parent: Rule;
    prev: Rule;
    os: number;
    o0: Token;
    o1: Token;
    cs: number;
    c0: Token;
    c1: Token;
    n: Counters;
    d: number;
    use: Bag;
    keep: Bag;
    bo: boolean;
    ao: boolean;
    bc: boolean;
    ac: boolean;
    why?: string;
    process(ctx: Context): Rule;
}
export declare type Context = {
    uI: number;
    opts: Options;
    cfg: Config;
    meta: Bag;
    src: () => string;
    root: () => any;
    plgn: () => Plugin[];
    rule: Rule;
    xs: Tin;
    v2: Token;
    v1: Token;
    t0: Token;
    t1: Token;
    tC: number;
    rs: Rule[];
    rsI: number;
    rsm: {
        [name: string]: RuleSpec;
    };
    next: () => Token;
    log?: (...rest: any) => undefined;
    F: (s: any) => string;
    use: Bag;
    NOTOKEN: Token;
    NORULE: Rule;
};
export interface Lex {
    src: String;
    ctx: Context;
    cfg: Config;
    pnt: Point;
    token(ref: Tin | string, val: any, src: string, pnt?: Point, use?: any, why?: string): Token;
    next(rule: Rule): Token;
    tokenize<R extends string | Tin, T extends R extends Tin ? string : Tin>(ref: R): T;
    bad(why: string, pstart: number, pend: number): Token;
}
export declare type Config = {
    lex: {
        match: LexMatcher[];
        empty: boolean;
    };
    rule: {
        start: string;
        maxmul: number;
        finish: boolean;
        include: string[];
        exclude: string[];
    };
    fixed: {
        lex: boolean;
        token: TokenMap;
        ref: Record<string | Tin, Tin | string>;
    };
    tokenSet: {
        ignore: {
            [name: number]: boolean;
        };
    };
    space: {
        lex: boolean;
        chars: Chars;
    };
    line: {
        lex: boolean;
        chars: Chars;
        rowChars: Chars;
    };
    text: {
        lex: boolean;
        modify: ValModifier[];
    };
    number: {
        lex: boolean;
        hex: boolean;
        oct: boolean;
        bin: boolean;
        sep: boolean;
        sepChar?: string | null;
    };
    string: {
        lex: boolean;
        quoteMap: Chars;
        escMap: Bag;
        escChar?: string;
        escCharCode?: number;
        multiChars: Chars;
        allowUnknown: boolean;
        replaceCodeMap: {
            [charCode: number]: string;
        };
        hasReplace: boolean;
    };
    value: {
        lex: boolean;
        map: {
            [src: string]: {
                val: any;
            };
        };
    };
    comment: {
        lex: boolean;
        marker: {
            line: boolean;
            start: string;
            end?: string;
            lex: boolean;
        }[];
    };
    map: {
        extend: boolean;
        merge?: (prev: any, curr: any) => any;
    };
    debug: {
        get_console: () => any;
        maxlen: number;
        print: {
            config: boolean;
            src?: (x: any) => string;
        };
    };
    error: {
        [code: string]: string;
    };
    hint: any;
    rePart: any;
    re: any;
    tI: number;
    t: any;
};
export interface Point {
    len: number;
    sI: number;
    rI: number;
    cI: number;
    token: Token[];
    end?: Token;
}
export interface Token {
    isToken: boolean;
    name: string;
    tin: Tin;
    val: any;
    src: string;
    sI: number;
    rI: number;
    cI: number;
    len: number;
    use?: Bag;
    err?: string;
    why?: string;
    bad(err: string, details?: any): Token;
    resolveVal(rule: Rule, ctx: Context): any;
}
export interface AltSpec {
    s?: (Tin | Tin[] | null | undefined)[] | null;
    p?: string | AltNext;
    r?: string | AltNext;
    b?: number | AltBack;
    c?: AltCond | {
        d?: number;
        n?: Counters;
    };
    n?: Counters;
    a?: AltAction;
    h?: AltModifier;
    u?: Bag;
    k?: Bag;
    g?: string | string[];
    e?: AltError;
}
export interface AltMatch {
    p: string;
    r: string;
    b: number;
    c?: AltCond;
    n?: Counters;
    a?: AltAction;
    h?: AltModifier;
    u?: Bag;
    k?: Bag;
    g?: string[];
    e?: Token;
}
export declare type Bag = {
    [key: string]: any;
};
export declare type Counters = {
    [key: string]: number;
};
export declare type Tin = number;
export declare type TokenMap = {
    [name: string]: Tin;
};
export declare type Chars = {
    [char: string]: number;
};
export declare type StrMap = {
    [name: string]: string;
};
export declare type RuleState = 'o' | 'c';
export declare type RuleStep = 'b' | 'a';
export declare type LexMatcher = (lex: Lex, rule: Rule) => Token | undefined;
export declare type MakeLexMatcher = (cfg: Config, opts: Options) => LexMatcher;
export declare type RuleSpecMap = {
    [name: string]: RuleSpec;
};
export declare type RuleDefiner = (rs: RuleSpec, rsm: RuleSpecMap) => void | RuleSpec;
export interface NormAltSpec extends AltSpec {
    s: (Tin | Tin[] | null | undefined)[];
    S0: number[] | null;
    S1: number[] | null;
    c?: AltCond;
    g?: string[];
}
export declare type AltCond = (rule: Rule, ctx: Context, alt: AltMatch) => boolean;
export declare type AltModifier = (rule: Rule, ctx: Context, alt: AltMatch, next: Rule) => AltMatch;
export declare type AltAction = (rule: Rule, ctx: Context, alt: AltMatch) => any;
export declare type AltNext = (rule: Rule, ctx: Context, alt: AltMatch) => string;
export declare type AltBack = (rule: Rule, ctx: Context, alt: AltMatch) => number;
export declare type StateAction = (this: RuleSpec, rule: Rule, ctx: Context, out?: Token | void) => Token | void;
export declare type AltError = (rule: Rule, ctx: Context, alt: AltMatch) => Token | undefined;
export declare type ValModifier = (val: any, lex: Lex, cfg: Config, opts: Options) => string;
