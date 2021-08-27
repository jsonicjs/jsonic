import type { RuleState, RuleStep, StateAction, Token, Config, Context, Rule, RuleSpec, NormAltSpec, AltMatch, RuleSpecMap, RuleDefiner, AltSpec, Options } from './types';
declare class RuleImpl implements Rule {
    id: number;
    name: string;
    spec: RuleSpec;
    node: null;
    state: RuleState;
    child: Rule;
    parent: Rule;
    prev: Rule;
    open: Token[];
    close: Token[];
    n: {};
    d: number;
    use: {};
    bo: boolean;
    ao: boolean;
    bc: boolean;
    ac: boolean;
    constructor(spec: RuleSpec, ctx: Context, node?: any);
    process(ctx: Context): Rule;
}
declare const makeRule: (spec: RuleSpec, ctx: Context, node?: any) => RuleImpl;
declare class RuleSpecImpl implements RuleSpec {
    name: string;
    def: any;
    cfg: Config;
    constructor(cfg: Config, def: any);
    add(state: RuleState, a: AltSpec | AltSpec[], flags: any): RuleSpec;
    open(a: AltSpec | AltSpec[], flags?: any): RuleSpec;
    close(a: AltSpec | AltSpec[], flags?: any): RuleSpec;
    action(step: RuleStep, state: RuleState, action: StateAction): RuleSpec;
    bo(action: StateAction): RuleSpec;
    ao(action: StateAction): RuleSpec;
    bc(action: StateAction): RuleSpec;
    ac(action: StateAction): RuleSpec;
    process(rule: Rule, ctx: Context, state: RuleState): Rule;
    parse_alts(is_open: boolean, alts: NormAltSpec[], rule: Rule, ctx: Context): AltMatch;
    bad(tkn: Token, rule: Rule, ctx: Context, parse: {
        is_open: boolean;
    }): Rule;
}
declare const makeRuleSpec: (cfg: Config, def: any) => RuleSpecImpl;
declare class Parser {
    options: Options;
    cfg: Config;
    rsm: RuleSpecMap;
    constructor(options: Options, cfg: Config);
    rule(name?: string, define?: RuleDefiner): RuleSpec | RuleSpecMap;
    start(src: string, jsonic: any, meta?: any, parent_ctx?: any): any;
    clone(options: Options, config: Config): Parser;
}
export { makeRule, makeRuleSpec, Parser, };
