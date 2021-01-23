
const Fs = require('fs')

let hint = {
  unknown:
  ` Since the error is unknown, this is probably a bug inside jsonic itself.
Please consider posting a github issue - thanks!`,

  unexpected:
  ` The character(s) $src should not occur at this point as it is not
valid %j%s%o%n syntax, even under the relaxed jsonic rules. If it is not
obviously wrong, the actual syntax error may be elsewhere. Try
commenting out larger areas around this point until you get no errors,
then remove the comments in small sections until you find the
offending syntax.`,

  invalid_unicode:
  ` But I %j%s%o%n must explain to you how all this mistaken idea of
reprobating pleasure and extolling pain arose. To do so, I will give
you a complete account of the system, and expound the actual
teachings of the great explorer of the truth, the master-builder of
human happiness.`,
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


let decode = `((d = (t: any, r = 'replace') => t[r](/[A-Z]/g, (m: any) => ' ' + m.toLowerCase())[r](/[~%][a-z]/g, (m: any) => ('~'==m[0]?' ':'') + m[1].toUpperCase()), s = '${hint_short}'.split('|')) => '${hint_names.join('|')}'.split('|').reduce((a: any, n, i) => (a[n] = d(s[i]), a), {}))(),`


let src = Fs.readFileSync('./jsonic.ts').toString()
src = src.replace(/    hint:.*/, '    hint: '+decode)
Fs.writeFileSync('./jsonic.ts', src)
