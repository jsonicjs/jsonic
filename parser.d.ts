import { Config, Context, KV, Options, Token, RuleState } from './utility';
import type { Jsonic } from './jsonic';
declare class Rule {
    id: number;
    name: string;
    spec: RuleSpec;
    node: any;
    state: RuleState;
    child: Rule;
    parent?: Rule;
    prev?: Rule;
    open: Token[];
    close: Token[];
    n: KV;
    use: any;
    bo: boolean;
    ao: boolean;
    bc: boolean;
    ac: boolean;
    why?: string;
    constructor(spec: RuleSpec, ctx: Context, node?: any);
    process(ctx: Context): Rule;
}
declare const NONE: Rule;
declare type AltSpec = {
    s?: any[];
    p?: string;
    r?: string;
    b?: number;
    c?: AltCond;
    d?: number;
    n?: any;
    a?: AltAction;
    h?: AltHandler;
    u?: any;
    g?: string[];
    e?: AltError;
};
declare type AltError = (rule: Rule, ctx: Context, alt: Alt) => Token | undefined;
declare class Alt {
    m: Token[];
    p: string;
    r: string;
    b: number;
    c?: AltCond;
    n?: any;
    a?: AltAction;
    h?: AltHandler;
    u?: any;
    g?: string[];
    e?: Token;
}
declare type AltCond = (rule: Rule, ctx: Context, alt: Alt) => boolean;
declare type AltHandler = (rule: Rule, ctx: Context, alt: Alt, next: Rule) => Alt;
declare type AltAction = (rule: Rule, ctx: Context, alt: Alt, next: Rule) => void;
declare class RuleSpec {
    name: string;
    def: any;
    bo: boolean;
    ao: boolean;
    bc: boolean;
    ac: boolean;
    constructor(def: any);
    process(rule: Rule, ctx: Context, state: RuleState): Rule;
    parse_alts(alts: AltSpec[], rule: Rule, ctx: Context): Alt;
}
declare type RuleSpecMap = {
    [name: string]: RuleSpec;
};
declare type RuleDefiner = (rs: RuleSpec, rsm: RuleSpecMap) => RuleSpec;
declare class Parser {
    options: Options;
    config: Config;
    rsm: RuleSpecMap;
    constructor(options: Options, config: Config);
    init(): void;
    rule(name?: string, define?: RuleDefiner): RuleSpec | RuleSpecMap;
    start(src: string, jsonic: Jsonic, meta?: any, parent_ctx?: any): any;
    clone(options: Options, config: Config): Parser;
}
export type { RuleDefiner, RuleSpecMap, };
export { Parser, Rule, RuleSpec, RuleState, NONE, };
