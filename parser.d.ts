import { Config, Context, RuleState, Token, Relate, Counters } from './utility';
import type { Tin, Jsonic, Options } from './jsonic';
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
    use: Relate;
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
    s?: (Tin | Tin[] | null | undefined)[];
    p?: string;
    r?: string;
    b?: number;
    c?: AltCond | {
        d?: number;
        n: Counters;
    };
    n?: Counters;
    a?: AltAction;
    m?: AltModifier;
    u?: Relate;
    g?: string | // Named group tags for the alternate (allows filtering).
    string[];
    e?: AltError;
}
interface NormAltSpec extends AltSpec {
    c?: AltCond;
    g?: string[];
}
declare type AltCond = (rule: Rule, ctx: Context, alt: AltMatch) => boolean;
declare type AltModifier = (rule: Rule, ctx: Context, alt: AltMatch, next: Rule) => AltMatch;
declare type AltAction = (rule: Rule, ctx: Context, alt: AltMatch) => void | Token;
declare type AltError = (rule: Rule, ctx: Context, alt: AltMatch) => Token | undefined;
declare class AltMatch {
    m: Token[];
    p: string;
    r: string;
    b: number;
    c?: AltCond;
    n?: any;
    a?: AltAction;
    h?: AltModifier;
    u?: any;
    g?: string[];
    e?: Token;
}
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
    parse_alts(is_open: boolean, alts: NormAltSpec[], rule: Rule, ctx: Context): AltMatch;
    bad(tkn: Token, rule: Rule, ctx: Context, parse: {
        is_open: boolean;
    }): Rule;
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
export type { RuleDefiner, RuleSpecMap, RuleState, AltSpec, AltCond, AltError, AltAction, AltModifier, };
export { Parser, Rule, RuleSpec, NONE, };
