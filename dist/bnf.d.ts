import type { BnfConvertOptions, GrammarSpec, Rule } from './types';
type BnfElement = {
    kind: 'term';
    literal: string;
} | {
    kind: 'ref';
    name: string;
} | {
    kind: 'regex';
    pattern: string;
    flags: string;
} | {
    kind: 'opt';
    inner: BnfElement;
} | {
    kind: 'star';
    inner: BnfElement;
} | {
    kind: 'plus';
    inner: BnfElement;
} | {
    kind: 'group';
    alts: BnfSequence[];
};
type BnfSequence = BnfElement[];
type BnfProduction = {
    name: string;
    alts: BnfSequence[];
};
type BnfGrammar = {
    productions: BnfProduction[];
};
declare const bnfRules: Record<string, {
    bo?: (r: Rule) => void;
    bc?: (r: Rule) => void;
    open?: any[];
    close?: any[];
}>;
declare function eliminateLeftRecursion(grammar: BnfGrammar): BnfGrammar;
declare class BnfParseError extends Error {
    readonly line?: number;
    readonly column?: number;
    readonly cause?: unknown;
    constructor(message: string, location?: {
        line?: number;
        column?: number;
    }, cause?: unknown);
}
declare function parseBnf(src: string): BnfGrammar;
declare function emitGrammarSpec(grammar: BnfGrammar, opts?: BnfConvertOptions): GrammarSpec;
declare function bnf(src: string, opts?: BnfConvertOptions): GrammarSpec;
export { bnf, parseBnf, emitGrammarSpec, eliminateLeftRecursion, bnfRules, BnfParseError, };
