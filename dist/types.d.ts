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
    config: () => Config;
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
    sub: (spec: {
        lex?: LexSub;
        rule?: RuleSub;
    }) => Jsonic;
    util: Bag;
}
export declare type Jsonic = JsonicParse & // A function that parses.
JsonicAPI & {
    [prop: string]: any;
};
export declare type Plugin = ((jsonic: Jsonic, plugin_options?: any) => void | Jsonic) & {
    defaults?: Bag;
    options?: Bag;
};
export declare type Options = {
    tag?: string;
    fixed?: {
        lex?: boolean;
        token?: StrMap;
    };
    match?: {
        lex?: boolean;
        token?: {
            [name: string]: RegExp | LexMatcher;
        };
    };
    tokenSet?: {
        [name: string]: string[];
    };
    space?: {
        lex?: boolean;
        chars?: string;
    };
    line?: {
        lex?: boolean;
        chars?: string;
        rowChars?: string;
        single?: boolean;
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
        exclude?: RegExp;
    };
    comment?: {
        lex?: boolean;
        def?: {
            [name: string]: {
                line?: boolean;
                start?: string;
                end?: string;
                lex?: boolean;
                suffix?: string | string[] | LexMatcher;
            } | null | undefined | false;
        };
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
    list?: {
        property: boolean;
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
        emptyResult?: any;
        match?: MakeLexMatcher[];
    };
    rule?: {
        start?: string;
        finish?: boolean;
        maxmul?: number;
        include?: string;
        exclude?: string;
    };
    result?: {
        fail: any[];
    };
    config?: {
        modify?: {
            [plugin_name: string]: (config: Config, options: Options) => void;
        };
    };
    parser?: {
        start?: (lexer: any, src: string, jsonic: any, meta?: any, parent_ctx?: any) => any;
    };
    standard$?: boolean;
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
    open(a: AltSpec | AltSpecish[], flags?: any): RuleSpec;
    close(a: AltSpec | AltSpecish[], flags?: any): RuleSpec;
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
    need: number;
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
    sub: {
        lex?: LexSub[];
        rule?: RuleSub[];
    };
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
    next: (r: Rule) => Token;
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
        emptyResult: any;
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
    match: {
        lex: boolean;
        token: MatchMap;
    };
    tokenSet: {
        [name: string]: number[];
    };
    tokenSetTins: {
        [name: string]: {
            [tin: number]: boolean;
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
        single: boolean;
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
        exclude?: RegExp;
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
        def: {
            [name: string]: {
                name: string;
                line: boolean;
                start: string;
                end?: string;
                lex: boolean;
                suffixMatch?: LexMatcher;
                getSuffixMatch?: () => LexMatcher | undefined;
            };
        };
    };
    map: {
        extend: boolean;
        merge?: (prev: any, curr: any, rule: Rule, ctx: Context) => any;
    };
    list: {
        property: boolean;
    };
    debug: {
        get_console: () => any;
        maxlen: number;
        print: {
            config: boolean;
            src?: (x: any) => string;
        };
    };
    result: {
        fail: any[];
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
    ignored?: Token;
    bad(err: string, details?: any): Token;
    resolveVal(rule: Rule, ctx: Context): any;
}
export interface AltSpec {
    s?: (Tin | Tin[] | null | undefined)[] | null;
    p?: string | AltNext | null | false;
    r?: string | AltNext | null | false;
    b?: number | AltBack | null | false;
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
declare type AltSpecish = AltSpec | undefined | null | false | 0 | typeof NaN;
export declare type AddAltOps = {
    append?: boolean;
    move?: number[];
    delete?: number[];
};
export interface AltMatch {
    p?: string | null | false | 0;
    r?: string | null | false | 0;
    b?: number | null | false;
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
export declare type MatchMap = {
    [name: string]: RegExp | LexMatcher;
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
export declare type MakeLexMatcher = (cfg: Config, opts: Options) => LexMatcher | null | undefined | false;
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
export declare type AltNext = (rule: Rule, ctx: Context, alt: AltMatch) => string | null | false | 0;
export declare type AltBack = (rule: Rule, ctx: Context, alt: AltMatch) => number | null | false;
export declare type StateAction = (rule: Rule, ctx: Context, next: Rule, out?: Token | void) => Token | void;
export declare type AltError = (rule: Rule, ctx: Context, alt: AltMatch) => Token | undefined;
export declare type ValModifier = (val: any, lex: Lex, cfg: Config, opts: Options) => string;
export declare type LexSub = (tkn: Token, rule: Rule, ctx: Context) => void;
export declare type RuleSub = (rule: Rule, ctx: Context) => void;
export {};
