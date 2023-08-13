# TODO

* P1; Rule.use should be Rule.u for consistency
* P1; add rule.next property, referencing next rule 
  * BUT: circular ref? prev is a sibling, next may not be - inconsistent?
* P1; exception inside matcher needs own error code - too easy to miss!
* P1; remove c: { n: } and c: { d: } conditionals - just use funcs
* P1; remove console colors in browser? option
* P1; rule.use should be rule.u for consistency
* P1; tag should appear in error
* P2; quotes are value enders - x:a"a" is an err! not 'a"a"', option?
* P3; Consider: option to control comma null insertion
* P3; YAML quoted strings: https://yaml-multiline.info/ - via options 
  * provide in yaml plugin
* P3; cli - less ambiguous merging at top level
* P3; consistent use of clean on options to allow null to mean 'remove property'
* P3; data file to diff exhaust changes
* P3; define explicitly: p in close, r in open, behaviour 
  * r in open means a run of opens with one close - see TOML - needs unit test 
  * p in close means ??? - needs unit test
* P3; docs: nice tree diagram of rules (generate?)
* P3; docs: ref https://wiki.alopex.li/OnParsers
* P3; document standard g names: open, close, step, start, end, imp, top, val, map, etc
* P3; error if fixed tokens clash
* P3; http://seriot.ch/projects/parsing_json.html 
  * implement as tests
* P3; if token recognized, error needs to be about token, not characters
* P3; implicit lists in pair values: "a:1,2 b:3" -> {a:[1,2], b:3} - pair key terminates (A)
* P3; internal errors - e.g. adding a null rulespec
* P3; is s:[] needed? different from s:undefined ?
* P3; line continuation ("\" at end) should be a feature of standard JSONIC text
* P3; option for sparse arrays: https://dmitripavlutin.com/javascript-sparse-dense-arrays/
* P3; perhaps remove the # prefix from token names?
* P3; rename tokens to be user friendly - maybe?
* P3; specific error if rule name not found when parsing
* P3; string format for rule def: s:'ST,NR' -> s:[ST,NR], also "s:ST,NR,p:foo,..." - needs (A) - can only used post standard definition (thus not in grammar.ts)
* P3; support BigInt numbers: 123n
* P3; unit test for custom alt error: eg.  { e: (r: Rule) => r.close[0] } ??? bug: r.close empty!


