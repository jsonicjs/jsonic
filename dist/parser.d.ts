import type { Config, Options, Parser, RuleDefiner, RuleSpec, RuleSpecMap } from './types';
import { makeRule, makeRuleSpec } from './rules';
declare class ParserImpl implements Parser {
    options: Options;
    cfg: Config;
    rsm: RuleSpecMap;
    constructor(options: Options, cfg: Config);
    rule(name?: string, define?: RuleDefiner | null): RuleSpec | RuleSpecMap | undefined;
    start(src: string, jsonic: any, meta?: any, parent_ctx?: any): any;
    clone(options: Options, config: Config): ParserImpl;
    norm(): void;
}
declare const makeParser: (options: Options, cfg: Config) => ParserImpl;
export { makeRule, makeRuleSpec, makeParser };
