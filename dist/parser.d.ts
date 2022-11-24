import type { Config, RuleSpec, RuleSpecMap, RuleDefiner, Options } from './types';
import { makeRule, makeRuleSpec } from './rules';
declare class Parser {
    options: Options;
    cfg: Config;
    rsm: RuleSpecMap;
    constructor(options: Options, cfg: Config);
    rule(name?: string, define?: RuleDefiner | null): RuleSpec | RuleSpecMap | undefined;
    start(src: string, jsonic: any, meta?: any, parent_ctx?: any): any;
    clone(options: Options, config: Config): Parser;
}
export { makeRule, makeRuleSpec, Parser };
