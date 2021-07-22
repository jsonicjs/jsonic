/* Copyright (c) 2021 Richard Rodger and other contributors, MIT License */
'use strict'

// Generates the contents of the `hint` option.
//
// Since these are verbose error hint texts, they are mildly compressed
// using camelification (eg. The cat sat on the mat -> ~theCatSatOnTheMat).
// A gnarly IIFE is used to build a normal map of {code:hint} at run time.
//
// NOTE: To get capitals, use `%` as an escape (eg %j%s%o%n -> JSON)


const Fs = require('fs')

let hint = {
  unknown:
  ` Since the error is unknown, this is probably a bug inside jsonic
itself, or a plugin. Please consider posting a github issue - thanks!`,

  unexpected:
  ` The character(s) $src were not expected at this point as they do not
match the expected syntax, even under the relaxed jsonic rules. If it
is not obviously wrong, the actual syntax error may be elsewhere. Try
commenting out larger areas around this point until you get no errors,
then remove the comments in small sections until you find the
offending syntax. N%o%t%e: Also check if any plugins you are using
expect different syntax in this case.`,

  invalid_unicode:
  ` The escape sequence $src does not encode a valid unicode code point
number. You may need to validate your string data manually using test
code to see how JavaScript will interpret it. Also consider that your
data may have become corrupted, or the escape sequence has not been
generated correctly.`,

  invalid_ascii:
  ` The escape sequence $src does not encode a valid A%s%c%i%i character. You
may need to validate your string data manually using test code to see
how JavaScript will interpret it. Also consider that your data may
have become corrupted, or the escape sequence has not been generated
correctly.`,

  unprintable:
  ` String values cannot contain unprintable characters (character codes
below 32). The character $src is unprintable. You may need to remove
these characters from your source data. Also check that it has not
become corrupted.`,

  unterminated_string:
  ` This string has no end quote.`,

  unterminated_comment:
  ` This comment is never closed.`,
}


function encode(t) {
  t = t.replace(/ [A-Z]/g,(m)=>('~'+m[1].toLowerCase()))
  t = t.replace(/ [a-z]/g,(m)=>m[1].toUpperCase())
  return t
}


let hint_names = Object.keys(hint)
let hint_short = hint_names.map(name=>encode(hint[name]))
    .join('|')
    .replace(/\n/g,'\\n')


// The gnarly IIFE
//let decode = `((d = (t: any, r = 'replace') => t[r](/[A-Z]/g, (m: any) => ' ' + m.toLowerCase())[r](/[~%][a-z]/g, (m: any) => ('~' == m[0] ? ' ' : '') + m[1].toUpperCase()), s = '${hint_short}'.split('|')) => '${hint_names.join('|')}'.split('|').reduce((a: any, n, i) => (a[n] = d(s[i]), a), {}))(),`
let decode = `(d = (t: any, r = 'replace') => t[r](/[A-Z]/g, (m: any) => ' ' + m.toLowerCase())[r](/[~%][a-z]/g, (m: any) => ('~' == m[0] ? ' ' : '') + m[1].toUpperCase()), s = '${hint_short}'.split('|')): any { return '${hint_names.join('|')}'.split('|').reduce((a: any, n, i) => (a[n] = d(s[i]), a), {}) }`

// Inject as part of build step (see package.json).
let src = Fs.readFileSync('./utility.ts').toString()
src = src.replace(/function make_hint.*/, 'function make_hint'+decode)
Fs.writeFileSync('./utility.ts', src)
