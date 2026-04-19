import type { BnfConvertOptions, GrammarSpec } from './types';
type BnfElement = {
    kind: 'term';
    literal: string;
} | {
    kind: 'ref';
    name: string;
};
type BnfSequence = BnfElement[];
type BnfProduction = {
    name: string;
    alts: BnfSequence[];
};
type BnfGrammar = {
    productions: BnfProduction[];
};
declare function parseBnf(src: string): BnfGrammar;
declare function emitGrammarSpec(grammar: BnfGrammar, opts?: BnfConvertOptions): GrammarSpec;
declare function bnf(src: string, opts?: BnfConvertOptions): GrammarSpec;
export { bnf, parseBnf, emitGrammarSpec };
