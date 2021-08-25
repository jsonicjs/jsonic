import { Config, Context, RuleState, Token } from './utility';
import type { Jsonic, Options } from './jsonic';
declare class Rule {
    id: number;
    name: string;
    spec: RuleSpec;
    node: any;
    state: RuleState;
    child: Rule;
    parent: Rule;
    prev: Rule;
    open: Token[];
    close: Token[];
    n: Record<string, number>;
    d: number;
    use: Record<string, any>;
    bo: boolean;
    ao: boolean;
    bc: boolean;
    ac: boolean;
    why?: string;
    constructor(spec: RuleSpec, ctx: Context, node?: any);
    process(ctx: Context): Rule;
}
declare const NONE: Rule;
interface AltSpec {
    s?: any[];
    p?: string;
    r?: string;
    b?: number;
    c?: AltCond | Record<string, any>;
    d?: number;
    n?: any;
    a?: AltAction;
    h?: AltHandler;
    u?: any;
    g?: string[];
    e?: AltError;
}
interface NormAltSpec extends AltSpec {
    c?: AltCond;
}
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
declare type AltAction = (rule: Rule, ctx: Context, alt: Alt) => void;
declare class RuleSpec {
    name: string;
    def: any;
    bo: boolean;
    ao: boolean;
    bc: boolean;
    ac: boolean;
    constructor(def: any);
    static norm(a: AltSpec): NormAltSpec;
    add(state: RuleState, a: AltSpec | AltSpec[], flags: any): RuleSpec;
    open(a: AltSpec | AltSpec[], flags?: any): RuleSpec;
    close(a: AltSpec | AltSpec[], flags?: any): RuleSpec;
    process(rule: Rule, ctx: Context, state: RuleState): Rule;
    parse_alts(is_open: boolean, alts: NormAltSpec[], rule: Rule, ctx: Context): Alt;
}
declare type RuleSpecMap = {
    [name: string]: RuleSpec;
};
declare type RuleDefiner = (rs: RuleSpec, rsm: RuleSpecMap) => RuleSpec;
declare class Parser {
    options: Options;
    cfg: Config;
    rsm: RuleSpecMap;
    constructor(options: Options, cfg: Config);
    init(): void;
    rule(name?: string, define?: RuleDefiner): RuleSpec | RuleSpecMap;
    start(src: string, jsonic: Jsonic, meta?: any, parent_ctx?: any): any;
    clone(options: Options, config: Config): Parser;
}
export type { RuleDefiner, RuleSpecMap, RuleState, AltAction, };
export { Parser, Rule, RuleSpec, NONE, };
