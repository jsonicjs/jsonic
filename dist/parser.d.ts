import type { Config, Options, Parser, RuleDefiner, RuleSpec, RuleSpecMap, Jsonic } from './types';
import { makeRule, makeRuleSpec } from './rules';
declare class ParserImpl implements Parser {
    options: Options;
    cfg: Config;
    rsm: RuleSpecMap;
    ji: Jsonic;
    constructor(options: Options, cfg: Config, j: Jsonic);
    rule(name?: string, define?: RuleDefiner | null): RuleSpec | RuleSpecMap | undefined;
    start(src: string, jsonic: any, meta?: any, parent_ctx?: any): any;
    clone(options: Options, config: Config, j: Jsonic): ParserImpl;
    norm(): void;
}
declare const makeParser: (...params: ConstructorParameters<typeof ParserImpl>) => ParserImpl;
export { makeRule, makeRuleSpec, makeParser };
