"use strict";
/* Copyright (c) 2013-2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaults = void 0;
const lexer_1 = require("./lexer");
const defaults = {
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
        }
    },
    // Token sets.
    tokenSet: {
        ignore: ['#SP', '#LN', '#CM']
    },
    // Recognize space characters in the lexer.
    space: {
        // Recognize space in the Lexer.
        lex: true,
        // Space characters.
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
        marker: [
            { line: true, start: '#', lex: true },
            { line: true, start: '//', lex: true },
            { line: false, start: '/' + '*', end: '*' + '/', lex: true },
        ],
    },
    /* TODO: PLUGIN
        // Multiline blocks.
        block: {
    
          // Recognize blocks in the Lexer.
          lex: true,
    
          // Block markers
          marker: {
            '\'\'\'': '\'\'\''
          },
        },
    */
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
            '\'': '\'',
            '`': '`',
            '\\': '\\',
            '/': '/',
        },
        // Allow unknown escape characters - they are copied to output: '\w' -> 'w'.
        allowUnknown: true,
        // TODO: PLUGIN csv
        // CSV-style double quote escape.
        // doubleEscape: false,
    },
    // Object formats.
    map: {
        // TODO: or trigger error?
        // Later duplicates extend earlier ones, rather than replacing them.
        extend: true,
        // Custom merge function for duplicates (optional).
        merge: undefined,
    },
    // Keyword values.
    value: {
        lex: true,
        map: {
            'true': { val: true },
            'false': { val: false },
            'null': { val: null },
        }
    },
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
            config: false
        }
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
    },
    // Error hints: {error-code: hint-text}. 
    hint: make_hint,
    // Lexer 
    lex: {
        match: [
            lexer_1.makeFixedMatcher,
            lexer_1.makeSpaceMatcher,
            lexer_1.makeLineMatcher,
            lexer_1.makeStringMatcher,
            lexer_1.makeCommentMatcher,
            lexer_1.makeNumberMatcher,
            lexer_1.makeTextMatcher,
        ]
    },
    // Parser rule options.
    rule: {
        // Name of the starting rule.
        start: 'val',
        // Automatically close remaining structures at EOF.
        finish: true,
        // Multiplier to increase the maximum number of rule occurences.
        maxmul: 3,
        include: '',
        exclude: '',
    },
    // Configuration options.
    config: {
        // Configuration modifiers.
        modify: {}
    },
    // Provide a custom parser.
    parser: {
        start: undefined
    }
};
exports.defaults = defaults;
// Generate hint text lookup.
// NOTE: generated and inserted by hint.js
function make_hint(d = (t, r = 'replace') => t[r](/[A-Z]/g, (m) => ' ' + m.toLowerCase())[r](/[~%][a-z]/g, (m) => ('~' == m[0] ? ' ' : '') + m[1].toUpperCase()), s = '~sinceTheErrorIsUnknown,ThisIsProbablyABugInsideJsonic\nitself,OrAPlugin.~pleaseConsiderPostingAGithubIssue -Thanks!|~theCharacter(s) $srcWereNotExpectedAtThisPointAsTheyDoNot\nmatchTheExpectedSyntax,EvenUnderTheRelaxedJsonicRules.~ifIt\nisNotObviouslyWrong,TheActualSyntaxErrorMayBeElsewhere.~try\ncommentingOutLargerAreasAroundThisPointUntilYouGetNoErrors,\nthenRemoveTheCommentsInSmallSectionsUntilYouFindThe\noffendingSyntax.~n%o%t%e:~alsoCheckIfAnyPluginsYouAreUsing\nexpectDifferentSyntaxInThisCase.|~theEscapeSequence $srcDoesNotEncodeAValidUnicodeCodePoint\nnumber.~youMayNeedToValidateYourStringDataManuallyUsingTest\ncodeToSeeHow~javaScriptWillInterpretIt.~alsoConsiderThatYour\ndataMayHaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeen\ngeneratedCorrectly.|~theEscapeSequence $srcDoesNotEncodeAValid~a%s%c%i%iCharacter.~you\nmayNeedToValidateYourStringDataManuallyUsingTestCodeToSee\nhow~javaScriptWillInterpretIt.~alsoConsiderThatYourDataMay\nhaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeenGenerated\ncorrectly.|~stringValuesCannotContainUnprintableCharacters (characterCodes\nbelow 32).~theCharacter $srcIsUnprintable.~youMayNeedToRemove\ntheseCharactersFromYourSourceData.~alsoCheckThatItHasNot\nbecomeCorrupted.|~thisStringHasNoEndQuote.|~thisCommentIsNeverClosed.'.split('|')) { return 'unknown|unexpected|invalid_unicode|invalid_ascii|unprintable|unterminated_string|unterminated_comment'.split('|').reduce((a, n, i) => (a[n] = d(s[i]), a), {}); }
//# sourceMappingURL=defaults.js.map