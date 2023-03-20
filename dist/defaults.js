"use strict";
/* Copyright (c) 2013-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaults = void 0;
// Functions that create token matching lexers.
// The `make*Matcher` functions may optionally initialise
// and validate Config properties specific to their lexing.
const lexer_1 = require("./lexer");
const defaults = {
    // Prevent prototype pollution
    safe: {
        key: true,
    },
    // Default tag - set your own!
    tag: '-',
    // Fixed token lexing.
    fixed: {
        // Recognize fixed tokens in the Lexer.
        lex: true,
        // Token names.
        token: {
            '#OB': '{',
            '#CB': '}',
            '#OS': '[',
            '#CS': ']',
            '#CL': ':',
            '#CA': ',',
        },
    },
    match: {
        lex: true,
        token: {},
    },
    // Token sets.
    tokenSet: {
        IGNORE: ['#SP', '#LN', '#CM'],
        VAL: ['#TX', '#NR', '#ST', '#VL'],
        KEY: ['#TX', '#NR', '#ST', '#VL'],
    },
    // Recognize space characters in the lexer.
    space: {
        // Recognize space in the Lexer.
        lex: true,
        // Space characters are kept to a minimal set.
        // Add more from https://en.wikipedia.org/wiki/Whitespace_character as needed.
        chars: ' \t',
    },
    // Line lexing.
    line: {
        // Recognize lines in the Lexer.
        lex: true,
        // Line characters.
        chars: '\r\n',
        // Increments row (aka line) counter.
        rowChars: '\n',
        // Generate separate lexer tokens for each newline.
        // Note: '\r\n' counts as one newline.
        single: false,
    },
    // Text formats.
    text: {
        // Recognize text (non-quoted strings) in the Lexer.
        lex: true,
    },
    // Control number formats.
    number: {
        // Recognize numbers in the Lexer.
        lex: true,
        // Recognize hex numbers (eg. 10 === 0x0a).
        hex: true,
        // Recognize octal numbers (eg. 10 === 0o12).
        oct: true,
        // Recognize ninary numbers (eg. 10 === 0b1010).
        bin: true,
        // All possible number chars. |+-|0|xob|0-9a-fA-F|.e|+-|0-9a-fA-F|
        // digital: '-1023456789._xoeEaAbBcCdDfF+',
        // Allow embedded separator. `null` to disable.
        sep: '_',
        // Exclude number strings matching this RegExp
        exclude: undefined,
    },
    // Comment markers.
    // <mark-char>: true -> single line comments
    // <mark-start>: <mark-end> -> multiline comments
    comment: {
        // Recognize comments in the Lexer.
        lex: true,
        // TODO: plugin
        // Balance multiline comments.
        // balance: true,
        // Comment markers.
        def: {
            hash: { line: true, start: '#', lex: true, eatline: false },
            slash: { line: true, start: '//', lex: true, eatline: false },
            multi: {
                line: false,
                start: '/' + '*',
                end: '*' + '/',
                lex: true,
                eatline: false,
            },
        },
    },
    // String formats.
    string: {
        // Recognize strings in the Lexer.
        lex: true,
        // Quote characters
        chars: '\'"`',
        // Multiline quote chars.
        multiChars: '`',
        // Escape character.
        escapeChar: '\\',
        // String escape chars.
        // Denoting char (follows escape char) => actual char.
        escape: {
            b: '\b',
            f: '\f',
            n: '\n',
            r: '\r',
            t: '\t',
            v: '\v',
            // These preserve standard escapes when allowUnknown=false.
            '"': '"',
            "'": "'",
            '`': '`',
            '\\': '\\',
            '/': '/',
        },
        // Allow unknown escape characters - they are copied to output: '\w' -> 'w'.
        allowUnknown: true,
        // If string lexing fails, instead of error, allow other matchers to try.
        abandon: false,
    },
    // Object formats.
    map: {
        // TODO: or trigger error?
        // Later duplicates extend earlier ones, rather than replacing them.
        extend: true,
        // Custom merge function for duplicates (optional).
        // TODO: needs function signature
        merge: undefined,
    },
    // Array formats.
    list: {
        // Allow arrays to have properties: `[a:9,0,1]`
        property: true,
    },
    // Keyword values.
    value: {
        lex: true,
        def: {
            true: { val: true },
            false: { val: false },
            null: { val: null },
        },
    },
    // Additional text ending characters
    ender: [],
    // Plugin custom options, (namespace by plugin name).
    plugin: {},
    // Debug settings
    debug: {
        // Default console for logging.
        get_console: () => console,
        // Max length of parse value to print.
        maxlen: 99,
        // Print internal structures
        print: {
            // Print config built from options.
            config: false,
            // Custom string formatter for src and node values.
            src: undefined,
        },
    },
    // Error messages.
    error: {
        unknown: 'unknown error: $code',
        unexpected: 'unexpected character(s): $src',
        invalid_unicode: 'invalid unicode escape: $src',
        invalid_ascii: 'invalid ascii escape: $src',
        unprintable: 'unprintable character: $src',
        unterminated_string: 'unterminated string: $src',
        unterminated_comment: 'unterminated comment: $src',
        unknown_rule: 'unknown rule: $rulename',
    },
    // Error hints: {error-code: hint-text}.
    hint: make_hint,
    // Lexer
    lex: {
        match: {
            match: { order: 1e6, make: lexer_1.makeMatchMatcher },
            fixed: { order: 2e6, make: lexer_1.makeFixedMatcher },
            space: { order: 3e6, make: lexer_1.makeSpaceMatcher },
            line: { order: 4e6, make: lexer_1.makeLineMatcher },
            string: { order: 5e6, make: lexer_1.makeStringMatcher },
            comment: { order: 6e6, make: lexer_1.makeCommentMatcher },
            number: { order: 7e6, make: lexer_1.makeNumberMatcher },
            text: { order: 8e6, make: lexer_1.makeTextMatcher },
        },
        // Empty string is allowed and returns undefined
        empty: true,
        emptyResult: undefined,
    },
    // Parser
    parse: {
        // Plugin custom functions to prepare parser context.
        prepare: {},
    },
    // Parser rule options.
    rule: {
        // Name of the starting rule.
        start: 'val',
        // Automatically close remaining structures at EOF.
        finish: true,
        // Multiplier to increase the maximum number of rule occurences.
        maxmul: 3,
        // Include only those alts with matching group tags (comma sep).
        // NOTE: applies universally, thus also for subsequent rules.
        include: '',
        // Exclude alts with matching group tags (comma sep).
        // NOTE: applies universally, thus also for subsequent rules.
        exclude: '',
    },
    // Result value options.
    result: {
        // Fail if result matches any of these.
        fail: [],
    },
    // Configuration options.
    config: {
        // Configuration modifiers.
        modify: {},
    },
    // Provide a custom parser.
    parser: {
        start: undefined,
    },
};
exports.defaults = defaults;
// Generate hint text lookup.
// NOTE: generated and inserted by hint.js
// prettier-ignore
function make_hint(d = (t, r = 'replace') => t[r](/[A-Z]/g, (m) => ' ' + m.toLowerCase())[r](/[~%][a-z]/g, (m) => ('~' == m[0] ? ' ' : '') + m[1].toUpperCase()), s = '~sinceTheErrorIsUnknown,ThisIsProbablyABugInsideJsonic\nitself,OrAPlugin.~pleaseConsiderPostingAGithubIssue -Thanks!\n\n~code: $code,~details: \n$details|~theCharacter(s) $srcWereNotExpectedAtThisPointAsTheyDoNot\nmatchTheExpectedSyntax,EvenUnderTheRelaxedJsonicRules.~ifIt\nisNotObviouslyWrong,TheActualSyntaxErrorMayBeElsewhere.~try\ncommentingOutLargerAreasAroundThisPointUntilYouGetNoErrors,\nthenRemoveTheCommentsInSmallSectionsUntilYouFindThe\noffendingSyntax.~n%o%t%e:~alsoCheckIfAnyPluginsYouAreUsing\nexpectDifferentSyntaxInThisCase.|~theEscapeSequence $srcDoesNotEncodeAValidUnicodeCodePoint\nnumber.~youMayNeedToValidateYourStringDataManuallyUsingTest\ncodeToSeeHow~javaScriptWillInterpretIt.~alsoConsiderThatYour\ndataMayHaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeen\ngeneratedCorrectly.|~theEscapeSequence $srcDoesNotEncodeAValid~a%s%c%i%iCharacter.~you\nmayNeedToValidateYourStringDataManuallyUsingTestCodeToSee\nhow~javaScriptWillInterpretIt.~alsoConsiderThatYourDataMay\nhaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeenGenerated\ncorrectly.|~stringValuesCannotContainUnprintableCharacters (characterCodes\nbelow 32).~theCharacter $srcIsUnprintable.~youMayNeedToRemove\ntheseCharactersFromYourSourceData.~alsoCheckThatItHasNot\nbecomeCorrupted.|~thisStringHasNoEndQuote.|~thisCommentIsNeverClosed.|~noRuleNamed $rulenameIsDefined.~thisIsProbablyAnErrorInThe\ngrammarOfAPlugin.'.split('|')) { return 'unknown|unexpected|invalid_unicode|invalid_ascii|unprintable|unterminated_string|unterminated_comment|unknown_rule'.split('|').reduce((a, n, i) => (a[n] = d(s[i]), a), {}); }
//# sourceMappingURL=defaults.js.map