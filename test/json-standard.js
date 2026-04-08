/* Copyright (c) 2021 Richard Rodger and other contributors, MIT License */
'use strict'

const assert = require('node:assert')

// 
const P = JSON.parse

module.exports = function json(j, E) {
  let s

  // V
  s = '{}'
  assert.deepEqual(j(s), P(s))
  s = '[]'
  assert.deepEqual(j(s), P(s))
  s = '0'
  assert.deepEqual(j(s), P(s))
  s = '""'
  assert.deepEqual(j(s), P(s))
  s = 'true'
  assert.deepEqual(j(s), P(s))
  s = 'false'
  assert.deepEqual(j(s), P(s))
  s = 'null'
  assert.deepEqual(j(s), P(s))

  // {K:V}
  s = '{"a":{}}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":0}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":""}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":true}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":false}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":null}'
  assert.deepEqual(j(s), P(s))

  // {K:V,K:V}
  s = '{"a":{},"b":{}}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[],"b":[]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":0,"b":0}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"","b":""}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":true,"b":true}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":false,"b":false}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":null,"b":null}'
  assert.deepEqual(j(s), P(s))

  // [V]
  s = '[{}]'
  assert.deepEqual(j(s), P(s))
  s = '[[]]'
  assert.deepEqual(j(s), P(s))
  s = '[0]'
  assert.deepEqual(j(s), P(s))
  s = '[""]'
  assert.deepEqual(j(s), P(s))
  s = '[true]'
  assert.deepEqual(j(s), P(s))
  s = '[false]'
  assert.deepEqual(j(s), P(s))
  s = '[null]'
  assert.deepEqual(j(s), P(s))

  // [V,V]
  s = '[{},{}]'
  assert.deepEqual(j(s), P(s))
  s = '[[],[]]'
  assert.deepEqual(j(s), P(s))
  s = '[0,0]'
  assert.deepEqual(j(s), P(s))
  s = '["",""]'
  assert.deepEqual(j(s), P(s))
  s = '[true,true]'
  assert.deepEqual(j(s), P(s))
  s = '[false,false]'
  assert.deepEqual(j(s), P(s))
  s = '[null,null]'
  assert.deepEqual(j(s), P(s))

  // N
  s = '1'
  assert.deepEqual(j(s), P(s))
  s = '-2'
  assert.deepEqual(j(s), P(s))
  s = '51'
  assert.deepEqual(j(s), P(s))
  s = '-62'
  assert.deepEqual(j(s), P(s))
  s = '0.3'
  assert.deepEqual(j(s), P(s))
  s = '-0.4'
  assert.deepEqual(j(s), P(s))
  s = '0.37'
  assert.deepEqual(j(s), P(s))
  s = '-0.48'
  assert.deepEqual(j(s), P(s))
  s = '9.3'
  assert.deepEqual(j(s), P(s))
  s = '-1.4'
  assert.deepEqual(j(s), P(s))
  s = '2.37'
  assert.deepEqual(j(s), P(s))
  s = '-3.48'
  assert.deepEqual(j(s), P(s))
  s = '94.3'
  assert.deepEqual(j(s), P(s))
  s = '-15.4'
  assert.deepEqual(j(s), P(s))
  s = '26.37'
  assert.deepEqual(j(s), P(s))
  s = '-37.48'
  assert.deepEqual(j(s), P(s))

  s = '1e8'
  assert.deepEqual(j(s), P(s))
  s = '-2e9'
  assert.deepEqual(j(s), P(s))
  s = '51e0'
  assert.deepEqual(j(s), P(s))
  s = '-62e1'
  assert.deepEqual(j(s), P(s))
  s = '1e82'
  assert.deepEqual(j(s), P(s))
  s = '-2e93'
  assert.deepEqual(j(s), P(s))
  s = '51e04'
  assert.deepEqual(j(s), P(s))
  s = '-62e15'
  assert.deepEqual(j(s), P(s))
  s = '1E8'
  assert.deepEqual(j(s), P(s))
  s = '-2E9'
  assert.deepEqual(j(s), P(s))
  s = '51E0'
  assert.deepEqual(j(s), P(s))
  s = '-62E1'
  assert.deepEqual(j(s), P(s))
  s = '1E82'
  assert.deepEqual(j(s), P(s))
  s = '-2E93'
  assert.deepEqual(j(s), P(s))
  s = '51E04'
  assert.deepEqual(j(s), P(s))
  s = '-62E15'
  assert.deepEqual(j(s), P(s))

  s = '1e-8'
  assert.deepEqual(j(s), P(s))
  s = '-2e-9'
  assert.deepEqual(j(s), P(s))
  s = '51e-0'
  assert.deepEqual(j(s), P(s))
  s = '-62e-1'
  assert.deepEqual(j(s), P(s))
  s = '1e-82'
  assert.deepEqual(j(s), P(s))
  s = '-2e-93'
  assert.deepEqual(j(s), P(s))
  s = '51e-04'
  assert.deepEqual(j(s), P(s))
  s = '-62e-15'
  assert.deepEqual(j(s), P(s))
  s = '1E-8'
  assert.deepEqual(j(s), P(s))
  s = '-2E-9'
  assert.deepEqual(j(s), P(s))
  s = '51E-0'
  assert.deepEqual(j(s), P(s))
  s = '-62E-1'
  assert.deepEqual(j(s), P(s))
  s = '1E-82'
  assert.deepEqual(j(s), P(s))
  s = '-2E-93'
  assert.deepEqual(j(s), P(s))
  s = '51E-04'
  assert.deepEqual(j(s), P(s))
  s = '-62E-15'
  assert.deepEqual(j(s), P(s))

  s = '1e+8'
  assert.deepEqual(j(s), P(s))
  s = '-2e+9'
  assert.deepEqual(j(s), P(s))
  s = '51e+0'
  assert.deepEqual(j(s), P(s))
  s = '-62e+1'
  assert.deepEqual(j(s), P(s))
  s = '1e+82'
  assert.deepEqual(j(s), P(s))
  s = '-2e+93'
  assert.deepEqual(j(s), P(s))
  s = '51e+04'
  assert.deepEqual(j(s), P(s))
  s = '-62e+15'
  assert.deepEqual(j(s), P(s))
  s = '1E+8'
  assert.deepEqual(j(s), P(s))
  s = '-2E+9'
  assert.deepEqual(j(s), P(s))
  s = '51E+0'
  assert.deepEqual(j(s), P(s))
  s = '-62E+1'
  assert.deepEqual(j(s), P(s))
  s = '1E+82'
  assert.deepEqual(j(s), P(s))
  s = '-2E+93'
  assert.deepEqual(j(s), P(s))
  s = '51E+04'
  assert.deepEqual(j(s), P(s))
  s = '-62E+15'
  assert.deepEqual(j(s), P(s))

  // S
  s = '"a"'
  assert.deepEqual(j(s), P(s))
  s = '"aa"'
  assert.deepEqual(j(s), P(s))
  s = '"\\""'
  assert.deepEqual(j(s), P(s))
  s = '"\\\\"'
  assert.deepEqual(j(s), P(s))
  s = '"\\/"'
  assert.deepEqual(j(s), P(s))
  s = '"\\b"'
  assert.deepEqual(j(s), P(s))
  s = '"\\f"'
  assert.deepEqual(j(s), P(s))
  s = '"\\n"'
  assert.deepEqual(j(s), P(s))
  s = '"\\r"'
  assert.deepEqual(j(s), P(s))
  s = '"\\t"'
  assert.deepEqual(j(s), P(s))
  s = '"\\u0000"'
  assert.deepEqual(j(s), P(s))

  // {K:N}
  s = '{"a":1}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":0.3}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-0.4}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":0.37}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-0.48}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":9.3}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-1.4}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":2.37}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-3.48}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":94.3}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-15.4}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":26.37}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-37.48}'
  assert.deepEqual(j(s), P(s))

  s = '{"a":1e8}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2e9}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51e0}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62e1}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":1e82}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2e93}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51e04}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62e15}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":1E8}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2E9}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51E0}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62E1}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":1E82}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2E93}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51E04}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62E15}'
  assert.deepEqual(j(s), P(s))

  s = '{"a":1e-8}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2e-9}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51e-0}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62e-1}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":1e-82}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2e-93}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51e-04}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62e-15}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":1E-8}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2E-9}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51E-0}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62E-1}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":1E-82}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2E-93}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51E-04}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62E-15}'
  assert.deepEqual(j(s), P(s))

  s = '{"a":1e+8}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2e+9}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51e+0}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62e+1}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":1e+82}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2e+93}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51e+04}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62e+15}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":1E+8}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2E+9}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51E+0}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62E+1}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":1E+82}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2E+93}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51E+04}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62E+15}'
  assert.deepEqual(j(s), P(s))

  // {K:S}
  s = '{"a":"a"}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"aa"}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"\\""}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"\\\\"}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"\\/"}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"\\b"}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"\\f"}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"\\n"}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"\\r"}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"\\t"}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"\\u0000"}'
  assert.deepEqual(j(s), P(s))

  // {K:B}
  s = '{"a":true}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":false}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":null}'
  assert.deepEqual(j(s), P(s))

  // [N]
  s = '[1]'
  assert.deepEqual(j(s), P(s))
  s = '[-2]'
  assert.deepEqual(j(s), P(s))
  s = '[51]'
  assert.deepEqual(j(s), P(s))
  s = '[-62]'
  assert.deepEqual(j(s), P(s))
  s = '[0.3]'
  assert.deepEqual(j(s), P(s))
  s = '[-0.4]'
  assert.deepEqual(j(s), P(s))
  s = '[0.37]'
  assert.deepEqual(j(s), P(s))
  s = '[-0.48]'
  assert.deepEqual(j(s), P(s))
  s = '[9.3]'
  assert.deepEqual(j(s), P(s))
  s = '[-1.4]'
  assert.deepEqual(j(s), P(s))
  s = '[2.37]'
  assert.deepEqual(j(s), P(s))
  s = '[-3.48]'
  assert.deepEqual(j(s), P(s))
  s = '[94.3]'
  assert.deepEqual(j(s), P(s))
  s = '[-15.4]'
  assert.deepEqual(j(s), P(s))
  s = '[26.37]'
  assert.deepEqual(j(s), P(s))
  s = '[-37.48]'
  assert.deepEqual(j(s), P(s))

  s = '[1e8]'
  assert.deepEqual(j(s), P(s))
  s = '[-2e9]'
  assert.deepEqual(j(s), P(s))
  s = '[51e0]'
  assert.deepEqual(j(s), P(s))
  s = '[-62e1]'
  assert.deepEqual(j(s), P(s))
  s = '[1e82]'
  assert.deepEqual(j(s), P(s))
  s = '[-2e93]'
  assert.deepEqual(j(s), P(s))
  s = '[51e04]'
  assert.deepEqual(j(s), P(s))
  s = '[-62e15]'
  assert.deepEqual(j(s), P(s))
  s = '[1E8]'
  assert.deepEqual(j(s), P(s))
  s = '[-2E9]'
  assert.deepEqual(j(s), P(s))
  s = '[51E0]'
  assert.deepEqual(j(s), P(s))
  s = '[-62E1]'
  assert.deepEqual(j(s), P(s))
  s = '[1E82]'
  assert.deepEqual(j(s), P(s))
  s = '[-2E93]'
  assert.deepEqual(j(s), P(s))
  s = '[51E04]'
  assert.deepEqual(j(s), P(s))
  s = '[-62E15]'
  assert.deepEqual(j(s), P(s))

  s = '[1e-8]'
  assert.deepEqual(j(s), P(s))
  s = '[-2e-9]'
  assert.deepEqual(j(s), P(s))
  s = '[51e-0]'
  assert.deepEqual(j(s), P(s))
  s = '[-62e-1]'
  assert.deepEqual(j(s), P(s))
  s = '[1e-82]'
  assert.deepEqual(j(s), P(s))
  s = '[-2e-93]'
  assert.deepEqual(j(s), P(s))
  s = '[51e-04]'
  assert.deepEqual(j(s), P(s))
  s = '[-62e-15]'
  assert.deepEqual(j(s), P(s))
  s = '[1E-8]'
  assert.deepEqual(j(s), P(s))
  s = '[-2E-9]'
  assert.deepEqual(j(s), P(s))
  s = '[51E-0]'
  assert.deepEqual(j(s), P(s))
  s = '[-62E-1]'
  assert.deepEqual(j(s), P(s))
  s = '[1E-82]'
  assert.deepEqual(j(s), P(s))
  s = '[-2E-93]'
  assert.deepEqual(j(s), P(s))
  s = '[51E-04]'
  assert.deepEqual(j(s), P(s))
  s = '[-62E-15]'
  assert.deepEqual(j(s), P(s))

  s = '[1e+8]'
  assert.deepEqual(j(s), P(s))
  s = '[-2e+9]'
  assert.deepEqual(j(s), P(s))
  s = '[51e+0]'
  assert.deepEqual(j(s), P(s))
  s = '[-62e+1]'
  assert.deepEqual(j(s), P(s))
  s = '[1e+82]'
  assert.deepEqual(j(s), P(s))
  s = '[-2e+93]'
  assert.deepEqual(j(s), P(s))
  s = '[51e+04]'
  assert.deepEqual(j(s), P(s))
  s = '[-62e+15]'
  assert.deepEqual(j(s), P(s))
  s = '[1E+8]'
  assert.deepEqual(j(s), P(s))
  s = '[-2E+9]'
  assert.deepEqual(j(s), P(s))
  s = '[51E+0]'
  assert.deepEqual(j(s), P(s))
  s = '[-62E+1]'
  assert.deepEqual(j(s), P(s))
  s = '[1E+82]'
  assert.deepEqual(j(s), P(s))
  s = '[-2E+93]'
  assert.deepEqual(j(s), P(s))
  s = '[51E+04]'
  assert.deepEqual(j(s), P(s))
  s = '[-62E+15]'
  assert.deepEqual(j(s), P(s))

  // [S]
  s = '["a"]'
  assert.deepEqual(j(s), P(s))
  s = '["aa"]'
  assert.deepEqual(j(s), P(s))
  s = '["\\""]'
  assert.deepEqual(j(s), P(s))
  s = '["\\\\"]'
  assert.deepEqual(j(s), P(s))
  s = '["\\/"]'
  assert.deepEqual(j(s), P(s))
  s = '["\\b"]'
  assert.deepEqual(j(s), P(s))
  s = '["\\f"]'
  assert.deepEqual(j(s), P(s))
  s = '["\\n"]'
  assert.deepEqual(j(s), P(s))
  s = '["\\r"]'
  assert.deepEqual(j(s), P(s))
  s = '["\\t"]'
  assert.deepEqual(j(s), P(s))
  s = '["\\u0000"]'
  assert.deepEqual(j(s), P(s))

  // [B]
  s = '[true]'
  assert.deepEqual(j(s), P(s))
  s = '[false]'
  assert.deepEqual(j(s), P(s))
  s = '[null]'
  assert.deepEqual(j(s), P(s))

  // [{K:V}]
  s = '[{"a":1}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":0.3}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-0.4}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":0.37}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-0.48}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":9.3}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-1.4}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":2.37}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-3.48}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":94.3}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-15.4}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":26.37}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-37.48}]'
  assert.deepEqual(j(s), P(s))

  s = '[{"a":1e8}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2e9}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51e0}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62e1}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":1e82}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2e93}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51e04}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62e15}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":1E8}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2E9}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51E0}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62E1}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":1E82}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2E93}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51E04}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62E15}]'
  assert.deepEqual(j(s), P(s))

  s = '[{"a":1e-8}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2e-9}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51e-0}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62e-1}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":1e-82}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2e-93}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51e-04}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62e-15}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":1E-8}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2E-9}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51E-0}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62E-1}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":1E-82}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2E-93}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51E-04}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62E-15}]'
  assert.deepEqual(j(s), P(s))

  s = '[{"a":1e+8}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2e+9}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51e+0}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62e+1}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":1e+82}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2e+93}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51e+04}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62e+15}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":1E+8}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2E+9}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51E+0}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62E+1}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":1E+82}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2E+93}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51E+04}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62E+15}]'
  assert.deepEqual(j(s), P(s))

  s = '[{"a":"a"}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":"aa"}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":"\\""}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":"\\\\"}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":"\\/"}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":"\\b"}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":"\\f"}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":"\\n"}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":"\\r"}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":"\\t"}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":"\\u0000"}]'
  assert.deepEqual(j(s), P(s))

  s = '[{"a":true}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":false}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":null}]'
  assert.deepEqual(j(s), P(s))

  // {K:[V]}
  s = '{"a":[1]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[0.3]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-0.4]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[0.37]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-0.48]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[9.3]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-1.4]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[2.37]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-3.48]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[94.3]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-15.4]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[26.37]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-37.48]}'
  assert.deepEqual(j(s), P(s))

  s = '{"a":[1e8]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2e9]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51e0]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62e1]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[1e82]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2e93]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51e04]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62e15]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[1E8]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2E9]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51E0]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62E1]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[1E82]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2E93]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51E04]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62E15]}'
  assert.deepEqual(j(s), P(s))

  s = '{"a":[1e-8]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2e-9]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51e-0]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62e-1]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[1e-82]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2e-93]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51e-04]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62e-15]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[1E-8]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2E-9]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51E-0]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62E-1]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[1E-82]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2E-93]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51E-04]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62E-15]}'
  assert.deepEqual(j(s), P(s))

  s = '{"a":[1e+8]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2e+9]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51e+0]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62e+1]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[1e+82]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2e+93]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51e+04]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62e+15]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[1E+8]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2E+9]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51E+0]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62E+1]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[1E+82]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2E+93]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51E+04]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62E+15]}'
  assert.deepEqual(j(s), P(s))

  s = '{"a":[true]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[false]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[null]}'
  assert.deepEqual(j(s), P(s))

  // {K:N,K:N}
  s = '{"a":1,"b":1}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2,"b":-2}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51,"b":51}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62,"b":-62}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":0.3,"b":0.3}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-0.4,"b":-0.4}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":0.37,"b":0.37}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-0.48,"b":-0.48}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":9.3,"b":9.3}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-1.4,"b":-1.4}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":2.37,"b":2.37}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-3.48,"b":-3.48}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":94.3,"b":94.3}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-15.4,"b":-15.4}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":26.37,"b":26.37}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-37.48,"b":-37.48}'
  assert.deepEqual(j(s), P(s))

  s = '{"a":1e8,"b":1e8}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2e9,"b":-2e9}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51e0,"b":51e0}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62e1,"b":-62e1}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":1e82,"b":1e82}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2e93,"b":-2e93}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51e04,"b":51e04}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62e15,"b":-62e15}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":1E8,"b":1E8}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2E9,"b":-2E9}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51E0,"b":51E0}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62E1,"b":-62E1}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":1E82,"b":1E82}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2E93,"b":-2E93}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51E04,"b":51E04}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62E15,"b":-62E15}'
  assert.deepEqual(j(s), P(s))

  s = '{"a":1e-8,"b":1e-8}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2e-9,"b":-2e-9}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51e-0,"b":51e-0}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62e-1,"b":-62e-1}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":1e-82,"b":1e-82}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2e-93,"b":-2e-93}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51e-04,"b":51e-04}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62e-15,"b":-62e-15}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":1E-8,"b":1E-8}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2E-9,"b":-2E-9}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51E-0,"b":51E-0}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62E-1,"b":-62E-1}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":1E-82,"b":1E-82}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2E-93,"b":-2E-93}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51E-04,"b":51E-04}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62E-15,"b":-62E-15}'
  assert.deepEqual(j(s), P(s))

  s = '{"a":1e+8,"b":1e+8}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2e+9,"b":-2e+9}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51e+0,"b":51e+0}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62e+1,"b":-62e+1}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":1e+82,"b":1e+82}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2e+93,"b":-2e+93}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51e+04,"b":51e+04}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62e+15,"b":-62e+15}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":1E+8,"b":1E+8}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2E+9,"b":-2E+9}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51E+0,"b":51E+0}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62E+1,"b":-62E+1}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":1E+82,"b":1E+82}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-2E+93,"b":-2E+93}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":51E+04,"b":51E+04}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":-62E+15,"b":-62E+15}'
  assert.deepEqual(j(s), P(s))

  // {K:S,K:S}
  s = '{"a":"A","b":"B"}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"AA","b":"BB"}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"\\"","b":"\\""}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"\\\\","b":"\\\\"}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"\\/","b":"\\/"}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"\\b","b":"\\b"}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"\\f","b":"\\f"}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"\\n","b":"\\n"}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"\\r","b":"\\r"}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"\\t","b":"\\t"}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":"\\u0000","b":"\\u0000"}'
  assert.deepEqual(j(s), P(s))

  // {K:B,K:B}
  s = '{"a":true,"b":true}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":false,"b":false}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":null,"b":null}'
  assert.deepEqual(j(s), P(s))

  // [N,N]
  s = '[1,1]'
  assert.deepEqual(j(s), P(s))
  s = '[-2,-2]'
  assert.deepEqual(j(s), P(s))
  s = '[51,51]'
  assert.deepEqual(j(s), P(s))
  s = '[-62,-62]'
  assert.deepEqual(j(s), P(s))
  s = '[0.3,0.3]'
  assert.deepEqual(j(s), P(s))
  s = '[-0.4,-0.4]'
  assert.deepEqual(j(s), P(s))
  s = '[0.37,0.37]'
  assert.deepEqual(j(s), P(s))
  s = '[-0.48,-0.48]'
  assert.deepEqual(j(s), P(s))
  s = '[9.3,9.3]'
  assert.deepEqual(j(s), P(s))
  s = '[-1.4,-1.4]'
  assert.deepEqual(j(s), P(s))
  s = '[2.37,2.37]'
  assert.deepEqual(j(s), P(s))
  s = '[-3.48,-3.48]'
  assert.deepEqual(j(s), P(s))
  s = '[94.3,94.3]'
  assert.deepEqual(j(s), P(s))
  s = '[-15.4,-15.4]'
  assert.deepEqual(j(s), P(s))
  s = '[26.37,26.37]'
  assert.deepEqual(j(s), P(s))
  s = '[-37.48,-37.48]'
  assert.deepEqual(j(s), P(s))

  s = '[1e8,1e8]'
  assert.deepEqual(j(s), P(s))
  s = '[-2e9,-2e9]'
  assert.deepEqual(j(s), P(s))
  s = '[51e0,51e0]'
  assert.deepEqual(j(s), P(s))
  s = '[-62e1,-62e1]'
  assert.deepEqual(j(s), P(s))
  s = '[1e82,1e82]'
  assert.deepEqual(j(s), P(s))
  s = '[-2e93,-2e93]'
  assert.deepEqual(j(s), P(s))
  s = '[51e04,51e04]'
  assert.deepEqual(j(s), P(s))
  s = '[-62e15,-62e15]'
  assert.deepEqual(j(s), P(s))
  s = '[1E8,1E8]'
  assert.deepEqual(j(s), P(s))
  s = '[-2E9,-2E9]'
  assert.deepEqual(j(s), P(s))
  s = '[51E0,51E0]'
  assert.deepEqual(j(s), P(s))
  s = '[-62E1,-62E1]'
  assert.deepEqual(j(s), P(s))
  s = '[1E82,1E82]'
  assert.deepEqual(j(s), P(s))
  s = '[-2E93,-2E93]'
  assert.deepEqual(j(s), P(s))
  s = '[51E04,51E04]'
  assert.deepEqual(j(s), P(s))
  s = '[-62E15,-62E15]'
  assert.deepEqual(j(s), P(s))

  s = '[1e-8,1e-8]'
  assert.deepEqual(j(s), P(s))
  s = '[-2e-9,-2e-9]'
  assert.deepEqual(j(s), P(s))
  s = '[51e-0,51e-0]'
  assert.deepEqual(j(s), P(s))
  s = '[-62e-1,-62e-1]'
  assert.deepEqual(j(s), P(s))
  s = '[1e-82,1e-82]'
  assert.deepEqual(j(s), P(s))
  s = '[-2e-93,-2e-93]'
  assert.deepEqual(j(s), P(s))
  s = '[51e-04,51e-04]'
  assert.deepEqual(j(s), P(s))
  s = '[-62e-15,-62e-15]'
  assert.deepEqual(j(s), P(s))
  s = '[1E-8,1E-8]'
  assert.deepEqual(j(s), P(s))
  s = '[-2E-9,-2E-9]'
  assert.deepEqual(j(s), P(s))
  s = '[51E-0,51E-0]'
  assert.deepEqual(j(s), P(s))
  s = '[-62E-1,-62E-1]'
  assert.deepEqual(j(s), P(s))
  s = '[1E-82,1E-82]'
  assert.deepEqual(j(s), P(s))
  s = '[-2E-93,-2E-93]'
  assert.deepEqual(j(s), P(s))
  s = '[51E-04,51E-04]'
  assert.deepEqual(j(s), P(s))
  s = '[-62E-15,-62E-15]'
  assert.deepEqual(j(s), P(s))

  s = '[1e+8]'
  assert.deepEqual(j(s), P(s))
  s = '[-2e+9,-2e+9]'
  assert.deepEqual(j(s), P(s))
  s = '[51e+0,51e+0]'
  assert.deepEqual(j(s), P(s))
  s = '[-62e+1,-62e+1]'
  assert.deepEqual(j(s), P(s))
  s = '[1e+82,1e+82]'
  assert.deepEqual(j(s), P(s))
  s = '[-2e+93,-2e+93]'
  assert.deepEqual(j(s), P(s))
  s = '[51e+04,51e+04]'
  assert.deepEqual(j(s), P(s))
  s = '[-62e+15,-62e+15]'
  assert.deepEqual(j(s), P(s))
  s = '[1E+8,1E+8]'
  assert.deepEqual(j(s), P(s))
  s = '[-2E+9,-2E+9]'
  assert.deepEqual(j(s), P(s))
  s = '[51E+0,51E+0]'
  assert.deepEqual(j(s), P(s))
  s = '[-62E+1,-62E+1]'
  assert.deepEqual(j(s), P(s))
  s = '[1E+82,1E+82]'
  assert.deepEqual(j(s), P(s))
  s = '[-2E+93,-2E+93]'
  assert.deepEqual(j(s), P(s))
  s = '[51E+04,51E+04]'
  assert.deepEqual(j(s), P(s))
  s = '[-62E+15,-62E+15]'
  assert.deepEqual(j(s), P(s))

  // [S,S]
  s = '["a","a"]'
  assert.deepEqual(j(s), P(s))
  s = '["aa","aa"]'
  assert.deepEqual(j(s), P(s))
  s = '["\\"","\\""]'
  assert.deepEqual(j(s), P(s))
  s = '["\\\\","\\\\"]'
  assert.deepEqual(j(s), P(s))
  s = '["\\/","\\/"]'
  assert.deepEqual(j(s), P(s))
  s = '["\\b","\\b"]'
  assert.deepEqual(j(s), P(s))
  s = '["\\f","\\f"]'
  assert.deepEqual(j(s), P(s))
  s = '["\\n","\\n"]'
  assert.deepEqual(j(s), P(s))
  s = '["\\r","\\r"]'
  assert.deepEqual(j(s), P(s))
  s = '["\\t","\\t"]'
  assert.deepEqual(j(s), P(s))
  s = '["\\u0000","\\u0000"]'
  assert.deepEqual(j(s), P(s))

  // [B,B]
  s = '[true,true]'
  assert.deepEqual(j(s), P(s))
  s = '[false,false]'
  assert.deepEqual(j(s), P(s))
  s = '[null,null]'
  assert.deepEqual(j(s), P(s))

  // [{K:V},{K:V}]
  s = '[{"a":1},{"a":1}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2},{"a":-2}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51},{"a":51}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62},{"a":-62}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":0.3},{"a":0.3}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-0.4},{"a":-0.4}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":0.37},{"a":0.37}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-0.48},{"a":-0.48}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":9.3},{"a":9.3}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-1.4},{"a":-1.4}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":2.37},{"a":2.37}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-3.48},{"a":-3.48}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":94.3},{"a":94.3}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-15.4},{"a":-15.4}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":26.37},{"a":26.37}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-37.48},{"a":-37.48}]'
  assert.deepEqual(j(s), P(s))

  s = '[{"a":1e8},{"a":1e8}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2e9},{"a":-2e9}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51e0},{"a":51e0}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62e1},{"a":-62e1}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":1e82},{"a":1e82}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2e93},{"a":-2e93}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51e04},{"a":51e04}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62e15},{"a":-62e15}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":1E8},{"a":1E8}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2E9},{"a":-2E9}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51E0},{"a":51E0}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62E1},{"a":-62E1}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":1E82},{"a":1E82}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2E93},{"a":-2E93}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51E04},{"a":51E04}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62E15},{"a":-62E15}]'
  assert.deepEqual(j(s), P(s))

  s = '[{"a":1e-8},{"a":1e-8}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2e-9},{"a":-2e-9}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51e-0},{"a":51e-0}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62e-1},{"a":-62e-1}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":1e-82},{"a":1e-82}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2e-93},{"a":-2e-93}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51e-04},{"a":51e-04}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62e-15},{"a":-62e-15}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":1E-8},{"a":1E-8}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2E-9},{"a":-2E-9}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51E-0},{"a":51E-0}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62E-1},{"a":-62E-1}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":1E-82},{"a":1E-82}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2E-93},{"a":-2E-93}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51E-04},{"a":51E-04}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62E-15},{"a":-62E-15}]'
  assert.deepEqual(j(s), P(s))

  s = '[{"a":1e+8},{"a":1e+8}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2e+9},{"a":-2e+9}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51e+0},{"a":51e+0}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62e+1},{"a":-62e+1}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":1e+82},{"a":1e+82}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2e+93},{"a":-2e+93}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51e+04},{"a":51e+04}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62e+15},{"a":-62e+15}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":1E+8},{"a":1E+8}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2E+9},{"a":-2E+9}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51E+0},{"a":51E+0}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62E+1},{"a":-62E+1}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":1E+82},{"a":1E+82}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-2E+93},{"a":-2E+93}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":51E+04},{"a":51E+04}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":-62E+15},{"a":-62E+15}]'
  assert.deepEqual(j(s), P(s))

  s = '[{"a":"a"},{"a":"a"}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":"aa"},{"a":"aa"}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":"\\""},{"a":"\\""}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":"\\\\"},{"a":"\\\\"}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":"\\/"},{"a":"\\/"}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":"\\b"},{"a":"\\b"}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":"\\f"},{"a":"\\f"}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":"\\n"},{"a":"\\n"}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":"\\r"},{"a":"\\r"}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":"\\t"},{"a":"\\t"}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":"\\u0000"},{"a":"\\u0000"}]'
  assert.deepEqual(j(s), P(s))

  s = '[{"a":true},{"a":true}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":false},{"a":false}]'
  assert.deepEqual(j(s), P(s))
  s = '[{"a":null},{"a":null}]'
  assert.deepEqual(j(s), P(s))

  // {K:[V],K:[V]}
  s = '{"a":[1],"a":[1]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2],"b":[-2]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51],"b":[51]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62],"b":[-62]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[0.3],"b":[0.3]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-0.4],"b":[-0.4]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[0.37],"b":[0.37]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-0.48],"b":[-0.48]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[9.3],"b":[9.3]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-1.4],"b":[-1.4]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[2.37],"b":[2.37]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-3.48],"b":[-3.48]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[94.3],"b":[94.3]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-15.4],"b":[-15.4]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[26.37],"b":[26.37]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-37.48],"b":[-37.48]}'
  assert.deepEqual(j(s), P(s))

  s = '{"a":[1e8],"b":[1e8]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2e9],"b":[-2e9]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51e0],"b":[51e0]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62e1],"b":[-62e1]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[1e82],"b":[1e82]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2e93],"b":[-2e93]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51e04],"b":[51e04]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62e15],"b":[-62e15]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[1E8],"b":[1E8]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2E9],"b":[-2E9]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51E0],"b":[51E0]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62E1],"b":[-62E1]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[1E82],"b":[1E82]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2E93],"b":[-2E93]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51E04],"b":[51E04]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62E15],"b":[-62E15]}'
  assert.deepEqual(j(s), P(s))

  s = '{"a":[1e-8],"b":[1e-8]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2e-9],"b":[-2e-9]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51e-0],"b":[51e-0]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62e-1],"b":[-62e-1]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[1e-82],"b":[1e-82]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2e-93],"b":[-2e-93]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51e-04],"b":[51e-04]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62e-15],"b":[-62e-15]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[1E-8],"b":[1E-8]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2E-9],"b":[-2E-9]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51E-0],"b":[51E-0]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62E-1],"b":[-62E-1]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[1E-82],"b":[1E-82]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2E-93],"b":[-2E-93]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51E-04],"b":[51E-04]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62E-15],"b":[-62E-15]}'
  assert.deepEqual(j(s), P(s))

  s = '{"a":[1e+8],"b":[1e+8]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2e+9],"b":[-2e+9]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51e+0],"b":[51e+0]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62e+1],"b":[-62e+1]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[1e+82],"b":[1e+82]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2e+93],"b":[-2e+93]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51e+04],"b":[51e+04]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62e+15],"b":[-62e+15]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[1E+8],"b":[1E+8]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2E+9],"b":[-2E+9]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51E+0],"b":[51E+0]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62E+1],"b":[-62E+1]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[1E+82],"b":[1E+82]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-2E+93],"b":[-2E+93]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[51E+04],"b":[51E+04]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[-62E+15],"b":[-62E+15]}'
  assert.deepEqual(j(s), P(s))

  s = '{"a":[true],"b":[true]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[false],"b":[false]}'
  assert.deepEqual(j(s), P(s))
  s = '{"a":[null],"b":[null]}'
  assert.deepEqual(j(s), P(s))

  // SPACE

  // SPACE V
  s = ' {\n\n } '
  assert.deepEqual(j(s), P(s))
  s = '  [\t\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '0'
  assert.deepEqual(j(s), P(s))
  s = '""'
  assert.deepEqual(j(s), P(s))
  s = 'true'
  assert.deepEqual(j(s), P(s))
  s = 'false'
  assert.deepEqual(j(s), P(s))
  s = 'null'
  assert.deepEqual(j(s), P(s))

  // SPACE  {\nK:V\n }
  s = ' {\n"a": {\n\n } \n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":0\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":""\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":true\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":false\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":null\n } '
  assert.deepEqual(j(s), P(s))

  // SPACE  {\nK:V   ,\t \t\t  \r\r\n\nK:V\n }
  s = ' {\n"a": {\n\n }    ,\t \t\t  \r\r\n\n"b": {\n\n } \n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":0   ,\t \t\t  \r\r\n\n"b":0\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":""   ,\t \t\t  \r\r\n\n"b":""\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":true   ,\t \t\t  \r\r\n\n"b":true\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":false   ,\t \t\t  \r\r\n\n"b":false\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":null   ,\t \t\t  \r\r\n\n"b":null\n } '
  assert.deepEqual(j(s), P(s))

  // SPACE   [\tV\r\n]
  s = '  [\t {\n\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t  [\t\r\n]\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t0\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t""\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\ttrue\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\tfalse\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\tnull\r\n]'
  assert.deepEqual(j(s), P(s))

  // SPACE   [\tV   ,\t \t\t  \r\r\n\nV\r\n]
  s = '  [\t {\n\n }    ,\t \t\t  \r\r\n\n {\n\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t  [\t\r\n]   ,\t \t\t  \r\r\n\n  [\t\r\n]\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t0   ,\t \t\t  \r\r\n\n0\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t""   ,\t \t\t  \r\r\n\n""\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\ttrue   ,\t \t\t  \r\r\n\ntrue\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\tfalse   ,\t \t\t  \r\r\n\nfalse\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\tnull   ,\t \t\t  \r\r\n\nnull\r\n]'
  assert.deepEqual(j(s), P(s))

  // SPACE N
  s = '1'
  assert.deepEqual(j(s), P(s))
  s = '-2'
  assert.deepEqual(j(s), P(s))
  s = '51'
  assert.deepEqual(j(s), P(s))
  s = '-62'
  assert.deepEqual(j(s), P(s))
  s = '0.3'
  assert.deepEqual(j(s), P(s))
  s = '-0.4'
  assert.deepEqual(j(s), P(s))
  s = '0.37'
  assert.deepEqual(j(s), P(s))
  s = '-0.48'
  assert.deepEqual(j(s), P(s))
  s = '9.3'
  assert.deepEqual(j(s), P(s))
  s = '-1.4'
  assert.deepEqual(j(s), P(s))
  s = '2.37'
  assert.deepEqual(j(s), P(s))
  s = '-3.48'
  assert.deepEqual(j(s), P(s))
  s = '94.3'
  assert.deepEqual(j(s), P(s))
  s = '-15.4'
  assert.deepEqual(j(s), P(s))
  s = '26.37'
  assert.deepEqual(j(s), P(s))
  s = '-37.48'
  assert.deepEqual(j(s), P(s))

  s = '1e8'
  assert.deepEqual(j(s), P(s))
  s = '-2e9'
  assert.deepEqual(j(s), P(s))
  s = '51e0'
  assert.deepEqual(j(s), P(s))
  s = '-62e1'
  assert.deepEqual(j(s), P(s))
  s = '1e82'
  assert.deepEqual(j(s), P(s))
  s = '-2e93'
  assert.deepEqual(j(s), P(s))
  s = '51e04'
  assert.deepEqual(j(s), P(s))
  s = '-62e15'
  assert.deepEqual(j(s), P(s))
  s = '1E8'
  assert.deepEqual(j(s), P(s))
  s = '-2E9'
  assert.deepEqual(j(s), P(s))
  s = '51E0'
  assert.deepEqual(j(s), P(s))
  s = '-62E1'
  assert.deepEqual(j(s), P(s))
  s = '1E82'
  assert.deepEqual(j(s), P(s))
  s = '-2E93'
  assert.deepEqual(j(s), P(s))
  s = '51E04'
  assert.deepEqual(j(s), P(s))
  s = '-62E15'
  assert.deepEqual(j(s), P(s))

  s = '1e-8'
  assert.deepEqual(j(s), P(s))
  s = '-2e-9'
  assert.deepEqual(j(s), P(s))
  s = '51e-0'
  assert.deepEqual(j(s), P(s))
  s = '-62e-1'
  assert.deepEqual(j(s), P(s))
  s = '1e-82'
  assert.deepEqual(j(s), P(s))
  s = '-2e-93'
  assert.deepEqual(j(s), P(s))
  s = '51e-04'
  assert.deepEqual(j(s), P(s))
  s = '-62e-15'
  assert.deepEqual(j(s), P(s))
  s = '1E-8'
  assert.deepEqual(j(s), P(s))
  s = '-2E-9'
  assert.deepEqual(j(s), P(s))
  s = '51E-0'
  assert.deepEqual(j(s), P(s))
  s = '-62E-1'
  assert.deepEqual(j(s), P(s))
  s = '1E-82'
  assert.deepEqual(j(s), P(s))
  s = '-2E-93'
  assert.deepEqual(j(s), P(s))
  s = '51E-04'
  assert.deepEqual(j(s), P(s))
  s = '-62E-15'
  assert.deepEqual(j(s), P(s))

  s = '1e+8'
  assert.deepEqual(j(s), P(s))
  s = '-2e+9'
  assert.deepEqual(j(s), P(s))
  s = '51e+0'
  assert.deepEqual(j(s), P(s))
  s = '-62e+1'
  assert.deepEqual(j(s), P(s))
  s = '1e+82'
  assert.deepEqual(j(s), P(s))
  s = '-2e+93'
  assert.deepEqual(j(s), P(s))
  s = '51e+04'
  assert.deepEqual(j(s), P(s))
  s = '-62e+15'
  assert.deepEqual(j(s), P(s))
  s = '1E+8'
  assert.deepEqual(j(s), P(s))
  s = '-2E+9'
  assert.deepEqual(j(s), P(s))
  s = '51E+0'
  assert.deepEqual(j(s), P(s))
  s = '-62E+1'
  assert.deepEqual(j(s), P(s))
  s = '1E+82'
  assert.deepEqual(j(s), P(s))
  s = '-2E+93'
  assert.deepEqual(j(s), P(s))
  s = '51E+04'
  assert.deepEqual(j(s), P(s))
  s = '-62E+15'
  assert.deepEqual(j(s), P(s))

  // SPACE S
  s = '"a"'
  assert.deepEqual(j(s), P(s))
  s = '"aa"'
  assert.deepEqual(j(s), P(s))
  s = '"\\""'
  assert.deepEqual(j(s), P(s))
  s = '"\\\\"'
  assert.deepEqual(j(s), P(s))
  s = '"\\/"'
  assert.deepEqual(j(s), P(s))
  s = '"\\b"'
  assert.deepEqual(j(s), P(s))
  s = '"\\f"'
  assert.deepEqual(j(s), P(s))
  s = '"\\n"'
  assert.deepEqual(j(s), P(s))
  s = '"\\r"'
  assert.deepEqual(j(s), P(s))
  s = '"\\t"'
  assert.deepEqual(j(s), P(s))
  s = '"\\u0000"'
  assert.deepEqual(j(s), P(s))

  // SPACE  {\nK:N\n }
  s = ' {\n"a":1\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":0.3\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-0.4\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":0.37\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-0.48\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":9.3\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-1.4\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":2.37\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-3.48\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":94.3\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-15.4\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":26.37\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-37.48\n } '
  assert.deepEqual(j(s), P(s))

  s = ' {\n"a":1e8\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2e9\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51e0\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62e1\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":1e82\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2e93\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51e04\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62e15\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":1E8\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2E9\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51E0\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62E1\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":1E82\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2E93\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51E04\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62E15\n } '
  assert.deepEqual(j(s), P(s))

  s = ' {\n"a":1e-8\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2e-9\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51e-0\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62e-1\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":1e-82\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2e-93\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51e-04\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62e-15\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":1E-8\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2E-9\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51E-0\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62E-1\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":1E-82\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2E-93\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51E-04\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62E-15\n } '
  assert.deepEqual(j(s), P(s))

  s = ' {\n"a":1e+8\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2e+9\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51e+0\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62e+1\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":1e+82\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2e+93\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51e+04\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62e+15\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":1E+8\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2E+9\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51E+0\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62E+1\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":1E+82\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2E+93\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51E+04\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62E+15\n } '
  assert.deepEqual(j(s), P(s))

  // SPACE  {\nK:S\n }
  s = ' {\n"a":"a"\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":"aa"\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":"\\""\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":"\\\\"\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":"\\/"\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":"\\b"\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":"\\f"\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":"\\n"\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":"\\r"\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":"\\t"\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":"\\u0000"\n } '
  assert.deepEqual(j(s), P(s))

  // SPACE  {\nK:B\n }
  s = ' {\n"a":true\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":false\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":null\n } '
  assert.deepEqual(j(s), P(s))

  // SPACE   [\tN\r\n]
  s = '  [\t1\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t0.3\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-0.4\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t0.37\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-0.48\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t9.3\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-1.4\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t2.37\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-3.48\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t94.3\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-15.4\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t26.37\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-37.48\r\n]'
  assert.deepEqual(j(s), P(s))

  s = '  [\t1e8\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2e9\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51e0\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62e1\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t1e82\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2e93\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51e04\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62e15\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t1E8\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2E9\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51E0\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62E1\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t1E82\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2E93\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51E04\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62E15\r\n]'
  assert.deepEqual(j(s), P(s))

  s = '  [\t1e-8\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2e-9\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51e-0\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62e-1\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t1e-82\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2e-93\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51e-04\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62e-15\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t1E-8\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2E-9\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51E-0\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62E-1\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t1E-82\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2E-93\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51E-04\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62E-15\r\n]'
  assert.deepEqual(j(s), P(s))

  s = '  [\t1e+8\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2e+9\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51e+0\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62e+1\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t1e+82\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2e+93\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51e+04\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62e+15\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t1E+8\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2E+9\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51E+0\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62E+1\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t1E+82\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2E+93\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51E+04\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62E+15\r\n]'
  assert.deepEqual(j(s), P(s))

  // SPACE   [\tS\r\n]
  s = '  [\t"a"\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t"aa"\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t"\\""\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t"\\\\"\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t"\\/"\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t"\\b"\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t"\\f"\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t"\\n"\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t"\\r"\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t"\\t"\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t"\\u0000"\r\n]'
  assert.deepEqual(j(s), P(s))

  // SPACE   [\tB\r\n]
  s = '  [\ttrue\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\tfalse\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\tnull\r\n]'
  assert.deepEqual(j(s), P(s))

  // SPACE   [\t {\nK:V\n } \r\n]
  s = '  [\t {\n"a":1\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":0.3\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-0.4\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":0.37\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-0.48\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":9.3\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-1.4\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":2.37\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-3.48\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":94.3\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-15.4\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":26.37\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-37.48\n } \r\n]'
  assert.deepEqual(j(s), P(s))

  s = '  [\t {\n"a":1e8\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2e9\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51e0\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62e1\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":1e82\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2e93\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51e04\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62e15\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":1E8\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2E9\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51E0\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62E1\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":1E82\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2E93\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51E04\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62E15\n } \r\n]'
  assert.deepEqual(j(s), P(s))

  s = '  [\t {\n"a":1e-8\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2e-9\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51e-0\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62e-1\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":1e-82\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2e-93\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51e-04\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62e-15\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":1E-8\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2E-9\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51E-0\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62E-1\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":1E-82\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2E-93\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51E-04\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62E-15\n } \r\n]'
  assert.deepEqual(j(s), P(s))

  s = '  [\t {\n"a":1e+8\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2e+9\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51e+0\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62e+1\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":1e+82\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2e+93\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51e+04\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62e+15\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":1E+8\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2E+9\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51E+0\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62E+1\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":1E+82\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2E+93\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51E+04\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62E+15\n } \r\n]'
  assert.deepEqual(j(s), P(s))

  s = '  [\t {\n"a":"a"\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":"aa"\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":"\\""\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":"\\\\"\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":"\\/"\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":"\\b"\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":"\\f"\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":"\\n"\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":"\\r"\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":"\\t"\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":"\\u0000"\n } \r\n]'
  assert.deepEqual(j(s), P(s))

  s = '  [\t {\n"a":true\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":false\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":null\n } \r\n]'
  assert.deepEqual(j(s), P(s))

  // SPACE  {\nK:  [\tV\r\n]\n }
  s = ' {\n"a":  [\t1\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t0.3\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-0.4\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t0.37\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-0.48\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t9.3\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-1.4\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t2.37\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-3.48\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t94.3\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-15.4\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t26.37\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-37.48\r\n]\n } '
  assert.deepEqual(j(s), P(s))

  s = ' {\n"a":  [\t1e8\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2e9\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51e0\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62e1\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t1e82\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2e93\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51e04\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62e15\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t1E8\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2E9\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51E0\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62E1\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t1E82\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2E93\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51E04\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62E15\r\n]\n } '
  assert.deepEqual(j(s), P(s))

  s = ' {\n"a":  [\t1e-8\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2e-9\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51e-0\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62e-1\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t1e-82\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2e-93\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51e-04\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62e-15\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t1E-8\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2E-9\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51E-0\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62E-1\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t1E-82\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2E-93\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51E-04\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62E-15\r\n]\n } '
  assert.deepEqual(j(s), P(s))

  s = ' {\n"a":  [\t1e+8\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2e+9\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51e+0\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62e+1\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t1e+82\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2e+93\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51e+04\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62e+15\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t1E+8\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2E+9\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51E+0\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62E+1\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t1E+82\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2E+93\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51E+04\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62E+15\r\n]\n } '
  assert.deepEqual(j(s), P(s))

  s = ' {\n"a":  [\ttrue\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\tfalse\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\tnull\r\n]\n } '
  assert.deepEqual(j(s), P(s))

  // SPACE  {\nK:N   ,\t \t\t  \r\r\n\nK:N\n }
  s = ' {\n"a":1   ,\t \t\t  \r\r\n\n"b":1\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2   ,\t \t\t  \r\r\n\n"b":-2\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51   ,\t \t\t  \r\r\n\n"b":51\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62   ,\t \t\t  \r\r\n\n"b":-62\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":0.3   ,\t \t\t  \r\r\n\n"b":0.3\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-0.4   ,\t \t\t  \r\r\n\n"b":-0.4\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":0.37   ,\t \t\t  \r\r\n\n"b":0.37\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-0.48   ,\t \t\t  \r\r\n\n"b":-0.48\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":9.3   ,\t \t\t  \r\r\n\n"b":9.3\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-1.4   ,\t \t\t  \r\r\n\n"b":-1.4\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":2.37   ,\t \t\t  \r\r\n\n"b":2.37\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-3.48   ,\t \t\t  \r\r\n\n"b":-3.48\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":94.3   ,\t \t\t  \r\r\n\n"b":94.3\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-15.4   ,\t \t\t  \r\r\n\n"b":-15.4\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":26.37   ,\t \t\t  \r\r\n\n"b":26.37\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-37.48   ,\t \t\t  \r\r\n\n"b":-37.48\n } '
  assert.deepEqual(j(s), P(s))

  s = ' {\n"a":1e8   ,\t \t\t  \r\r\n\n"b":1e8\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2e9   ,\t \t\t  \r\r\n\n"b":-2e9\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51e0   ,\t \t\t  \r\r\n\n"b":51e0\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62e1   ,\t \t\t  \r\r\n\n"b":-62e1\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":1e82   ,\t \t\t  \r\r\n\n"b":1e82\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2e93   ,\t \t\t  \r\r\n\n"b":-2e93\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51e04   ,\t \t\t  \r\r\n\n"b":51e04\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62e15   ,\t \t\t  \r\r\n\n"b":-62e15\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":1E8   ,\t \t\t  \r\r\n\n"b":1E8\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2E9   ,\t \t\t  \r\r\n\n"b":-2E9\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51E0   ,\t \t\t  \r\r\n\n"b":51E0\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62E1   ,\t \t\t  \r\r\n\n"b":-62E1\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":1E82   ,\t \t\t  \r\r\n\n"b":1E82\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2E93   ,\t \t\t  \r\r\n\n"b":-2E93\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51E04   ,\t \t\t  \r\r\n\n"b":51E04\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62E15   ,\t \t\t  \r\r\n\n"b":-62E15\n } '
  assert.deepEqual(j(s), P(s))

  s = ' {\n"a":1e-8   ,\t \t\t  \r\r\n\n"b":1e-8\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2e-9   ,\t \t\t  \r\r\n\n"b":-2e-9\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51e-0   ,\t \t\t  \r\r\n\n"b":51e-0\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62e-1   ,\t \t\t  \r\r\n\n"b":-62e-1\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":1e-82   ,\t \t\t  \r\r\n\n"b":1e-82\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2e-93   ,\t \t\t  \r\r\n\n"b":-2e-93\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51e-04   ,\t \t\t  \r\r\n\n"b":51e-04\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62e-15   ,\t \t\t  \r\r\n\n"b":-62e-15\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":1E-8   ,\t \t\t  \r\r\n\n"b":1E-8\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2E-9   ,\t \t\t  \r\r\n\n"b":-2E-9\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51E-0   ,\t \t\t  \r\r\n\n"b":51E-0\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62E-1   ,\t \t\t  \r\r\n\n"b":-62E-1\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":1E-82   ,\t \t\t  \r\r\n\n"b":1E-82\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2E-93   ,\t \t\t  \r\r\n\n"b":-2E-93\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51E-04   ,\t \t\t  \r\r\n\n"b":51E-04\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62E-15   ,\t \t\t  \r\r\n\n"b":-62E-15\n } '
  assert.deepEqual(j(s), P(s))

  s = ' {\n"a":1e+8   ,\t \t\t  \r\r\n\n"b":1e+8\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2e+9   ,\t \t\t  \r\r\n\n"b":-2e+9\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51e+0   ,\t \t\t  \r\r\n\n"b":51e+0\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62e+1   ,\t \t\t  \r\r\n\n"b":-62e+1\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":1e+82   ,\t \t\t  \r\r\n\n"b":1e+82\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2e+93   ,\t \t\t  \r\r\n\n"b":-2e+93\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51e+04   ,\t \t\t  \r\r\n\n"b":51e+04\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62e+15   ,\t \t\t  \r\r\n\n"b":-62e+15\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":1E+8   ,\t \t\t  \r\r\n\n"b":1E+8\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2E+9   ,\t \t\t  \r\r\n\n"b":-2E+9\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51E+0   ,\t \t\t  \r\r\n\n"b":51E+0\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62E+1   ,\t \t\t  \r\r\n\n"b":-62E+1\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":1E+82   ,\t \t\t  \r\r\n\n"b":1E+82\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-2E+93   ,\t \t\t  \r\r\n\n"b":-2E+93\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":51E+04   ,\t \t\t  \r\r\n\n"b":51E+04\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":-62E+15   ,\t \t\t  \r\r\n\n"b":-62E+15\n } '
  assert.deepEqual(j(s), P(s))

  // SPACE  {\nK:S   ,\t \t\t  \r\r\n\nK:S\n }
  s = ' {\n"a":"A"   ,\t \t\t  \r\r\n\n"b":"B"\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":"AA"   ,\t \t\t  \r\r\n\n"b":"BB"\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":"\\""   ,\t \t\t  \r\r\n\n"b":"\\""\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":"\\\\"   ,\t \t\t  \r\r\n\n"b":"\\\\"\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":"\\/"   ,\t \t\t  \r\r\n\n"b":"\\/"\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":"\\b"   ,\t \t\t  \r\r\n\n"b":"\\b"\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":"\\f"   ,\t \t\t  \r\r\n\n"b":"\\f"\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":"\\n"   ,\t \t\t  \r\r\n\n"b":"\\n"\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":"\\r"   ,\t \t\t  \r\r\n\n"b":"\\r"\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":"\\t"   ,\t \t\t  \r\r\n\n"b":"\\t"\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":"\\u0000"   ,\t \t\t  \r\r\n\n"b":"\\u0000"\n } '
  assert.deepEqual(j(s), P(s))

  // SPACE  {\nK:B   ,\t \t\t  \r\r\n\nK:B\n }
  s = ' {\n"a":true   ,\t \t\t  \r\r\n\n"b":true\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":false   ,\t \t\t  \r\r\n\n"b":false\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":null   ,\t \t\t  \r\r\n\n"b":null\n } '
  assert.deepEqual(j(s), P(s))

  // SPACE   [\tN   ,\t \t\t  \r\r\n\nN\r\n]
  s = '  [\t1   ,\t \t\t  \r\r\n\n1\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2   ,\t \t\t  \r\r\n\n-2\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51   ,\t \t\t  \r\r\n\n51\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62   ,\t \t\t  \r\r\n\n-62\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t0.3   ,\t \t\t  \r\r\n\n0.3\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-0.4   ,\t \t\t  \r\r\n\n-0.4\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t0.37   ,\t \t\t  \r\r\n\n0.37\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-0.48   ,\t \t\t  \r\r\n\n-0.48\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t9.3   ,\t \t\t  \r\r\n\n9.3\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-1.4   ,\t \t\t  \r\r\n\n-1.4\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t2.37   ,\t \t\t  \r\r\n\n2.37\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-3.48   ,\t \t\t  \r\r\n\n-3.48\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t94.3   ,\t \t\t  \r\r\n\n94.3\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-15.4   ,\t \t\t  \r\r\n\n-15.4\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t26.37   ,\t \t\t  \r\r\n\n26.37\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-37.48   ,\t \t\t  \r\r\n\n-37.48\r\n]'
  assert.deepEqual(j(s), P(s))

  s = '  [\t1e8   ,\t \t\t  \r\r\n\n1e8\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2e9   ,\t \t\t  \r\r\n\n-2e9\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51e0   ,\t \t\t  \r\r\n\n51e0\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62e1   ,\t \t\t  \r\r\n\n-62e1\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t1e82   ,\t \t\t  \r\r\n\n1e82\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2e93   ,\t \t\t  \r\r\n\n-2e93\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51e04   ,\t \t\t  \r\r\n\n51e04\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62e15   ,\t \t\t  \r\r\n\n-62e15\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t1E8   ,\t \t\t  \r\r\n\n1E8\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2E9   ,\t \t\t  \r\r\n\n-2E9\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51E0   ,\t \t\t  \r\r\n\n51E0\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62E1   ,\t \t\t  \r\r\n\n-62E1\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t1E82   ,\t \t\t  \r\r\n\n1E82\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2E93   ,\t \t\t  \r\r\n\n-2E93\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51E04   ,\t \t\t  \r\r\n\n51E04\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62E15   ,\t \t\t  \r\r\n\n-62E15\r\n]'
  assert.deepEqual(j(s), P(s))

  s = '  [\t1e-8   ,\t \t\t  \r\r\n\n1e-8\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2e-9   ,\t \t\t  \r\r\n\n-2e-9\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51e-0   ,\t \t\t  \r\r\n\n51e-0\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62e-1   ,\t \t\t  \r\r\n\n-62e-1\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t1e-82   ,\t \t\t  \r\r\n\n1e-82\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2e-93   ,\t \t\t  \r\r\n\n-2e-93\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51e-04   ,\t \t\t  \r\r\n\n51e-04\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62e-15   ,\t \t\t  \r\r\n\n-62e-15\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t1E-8   ,\t \t\t  \r\r\n\n1E-8\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2E-9   ,\t \t\t  \r\r\n\n-2E-9\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51E-0   ,\t \t\t  \r\r\n\n51E-0\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62E-1   ,\t \t\t  \r\r\n\n-62E-1\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t1E-82   ,\t \t\t  \r\r\n\n1E-82\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2E-93   ,\t \t\t  \r\r\n\n-2E-93\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51E-04   ,\t \t\t  \r\r\n\n51E-04\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62E-15   ,\t \t\t  \r\r\n\n-62E-15\r\n]'
  assert.deepEqual(j(s), P(s))

  s = '  [\t1e+8\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2e+9   ,\t \t\t  \r\r\n\n-2e+9\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51e+0   ,\t \t\t  \r\r\n\n51e+0\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62e+1   ,\t \t\t  \r\r\n\n-62e+1\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t1e+82   ,\t \t\t  \r\r\n\n1e+82\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2e+93   ,\t \t\t  \r\r\n\n-2e+93\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51e+04   ,\t \t\t  \r\r\n\n51e+04\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62e+15   ,\t \t\t  \r\r\n\n-62e+15\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t1E+8   ,\t \t\t  \r\r\n\n1E+8\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2E+9   ,\t \t\t  \r\r\n\n-2E+9\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51E+0   ,\t \t\t  \r\r\n\n51E+0\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62E+1   ,\t \t\t  \r\r\n\n-62E+1\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t1E+82   ,\t \t\t  \r\r\n\n1E+82\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-2E+93   ,\t \t\t  \r\r\n\n-2E+93\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t51E+04   ,\t \t\t  \r\r\n\n51E+04\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t-62E+15   ,\t \t\t  \r\r\n\n-62E+15\r\n]'
  assert.deepEqual(j(s), P(s))

  // SPACE   [\tS   ,\t \t\t  \r\r\n\nS\r\n]
  s = '  [\t"a"   ,\t \t\t  \r\r\n\n"a"\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t"aa"   ,\t \t\t  \r\r\n\n"aa"\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t"\\""   ,\t \t\t  \r\r\n\n"\\""\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t"\\\\"   ,\t \t\t  \r\r\n\n"\\\\"\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t"\\/"   ,\t \t\t  \r\r\n\n"\\/"\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t"\\b"   ,\t \t\t  \r\r\n\n"\\b"\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t"\\f"   ,\t \t\t  \r\r\n\n"\\f"\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t"\\n"   ,\t \t\t  \r\r\n\n"\\n"\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t"\\r"   ,\t \t\t  \r\r\n\n"\\r"\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t"\\t"   ,\t \t\t  \r\r\n\n"\\t"\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t"\\u0000"   ,\t \t\t  \r\r\n\n"\\u0000"\r\n]'
  assert.deepEqual(j(s), P(s))

  // SPACE   [\tB   ,\t \t\t  \r\r\n\nB\r\n]
  s = '  [\ttrue   ,\t \t\t  \r\r\n\ntrue\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\tfalse   ,\t \t\t  \r\r\n\nfalse\r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\tnull   ,\t \t\t  \r\r\n\nnull\r\n]'
  assert.deepEqual(j(s), P(s))

  // SPACE   [\t {\nK:V\n }    ,\t \t\t  \r\r\n\n {\nK:V\n } \r\n]
  s = '  [\t {\n"a":1\n }    ,\t \t\t  \r\r\n\n {\n"a":1\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2\n }    ,\t \t\t  \r\r\n\n {\n"a":-2\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51\n }    ,\t \t\t  \r\r\n\n {\n"a":51\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62\n }    ,\t \t\t  \r\r\n\n {\n"a":-62\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":0.3\n }    ,\t \t\t  \r\r\n\n {\n"a":0.3\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-0.4\n }    ,\t \t\t  \r\r\n\n {\n"a":-0.4\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":0.37\n }    ,\t \t\t  \r\r\n\n {\n"a":0.37\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-0.48\n }    ,\t \t\t  \r\r\n\n {\n"a":-0.48\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":9.3\n }    ,\t \t\t  \r\r\n\n {\n"a":9.3\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-1.4\n }    ,\t \t\t  \r\r\n\n {\n"a":-1.4\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":2.37\n }    ,\t \t\t  \r\r\n\n {\n"a":2.37\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-3.48\n }    ,\t \t\t  \r\r\n\n {\n"a":-3.48\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":94.3\n }    ,\t \t\t  \r\r\n\n {\n"a":94.3\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-15.4\n }    ,\t \t\t  \r\r\n\n {\n"a":-15.4\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":26.37\n }    ,\t \t\t  \r\r\n\n {\n"a":26.37\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-37.48\n }    ,\t \t\t  \r\r\n\n {\n"a":-37.48\n } \r\n]'
  assert.deepEqual(j(s), P(s))

  s = '  [\t {\n"a":1e8\n }    ,\t \t\t  \r\r\n\n {\n"a":1e8\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2e9\n }    ,\t \t\t  \r\r\n\n {\n"a":-2e9\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51e0\n }    ,\t \t\t  \r\r\n\n {\n"a":51e0\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62e1\n }    ,\t \t\t  \r\r\n\n {\n"a":-62e1\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":1e82\n }    ,\t \t\t  \r\r\n\n {\n"a":1e82\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2e93\n }    ,\t \t\t  \r\r\n\n {\n"a":-2e93\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51e04\n }    ,\t \t\t  \r\r\n\n {\n"a":51e04\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62e15\n }    ,\t \t\t  \r\r\n\n {\n"a":-62e15\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":1E8\n }    ,\t \t\t  \r\r\n\n {\n"a":1E8\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2E9\n }    ,\t \t\t  \r\r\n\n {\n"a":-2E9\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51E0\n }    ,\t \t\t  \r\r\n\n {\n"a":51E0\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62E1\n }    ,\t \t\t  \r\r\n\n {\n"a":-62E1\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":1E82\n }    ,\t \t\t  \r\r\n\n {\n"a":1E82\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2E93\n }    ,\t \t\t  \r\r\n\n {\n"a":-2E93\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51E04\n }    ,\t \t\t  \r\r\n\n {\n"a":51E04\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62E15\n }    ,\t \t\t  \r\r\n\n {\n"a":-62E15\n } \r\n]'
  assert.deepEqual(j(s), P(s))

  s = '  [\t {\n"a":1e-8\n }    ,\t \t\t  \r\r\n\n {\n"a":1e-8\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2e-9\n }    ,\t \t\t  \r\r\n\n {\n"a":-2e-9\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51e-0\n }    ,\t \t\t  \r\r\n\n {\n"a":51e-0\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62e-1\n }    ,\t \t\t  \r\r\n\n {\n"a":-62e-1\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":1e-82\n }    ,\t \t\t  \r\r\n\n {\n"a":1e-82\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2e-93\n }    ,\t \t\t  \r\r\n\n {\n"a":-2e-93\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51e-04\n }    ,\t \t\t  \r\r\n\n {\n"a":51e-04\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62e-15\n }    ,\t \t\t  \r\r\n\n {\n"a":-62e-15\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":1E-8\n }    ,\t \t\t  \r\r\n\n {\n"a":1E-8\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2E-9\n }    ,\t \t\t  \r\r\n\n {\n"a":-2E-9\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51E-0\n }    ,\t \t\t  \r\r\n\n {\n"a":51E-0\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62E-1\n }    ,\t \t\t  \r\r\n\n {\n"a":-62E-1\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":1E-82\n }    ,\t \t\t  \r\r\n\n {\n"a":1E-82\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2E-93\n }    ,\t \t\t  \r\r\n\n {\n"a":-2E-93\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51E-04\n }    ,\t \t\t  \r\r\n\n {\n"a":51E-04\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62E-15\n }    ,\t \t\t  \r\r\n\n {\n"a":-62E-15\n } \r\n]'
  assert.deepEqual(j(s), P(s))

  s = '  [\t {\n"a":1e+8\n }    ,\t \t\t  \r\r\n\n {\n"a":1e+8\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2e+9\n }    ,\t \t\t  \r\r\n\n {\n"a":-2e+9\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51e+0\n }    ,\t \t\t  \r\r\n\n {\n"a":51e+0\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62e+1\n }    ,\t \t\t  \r\r\n\n {\n"a":-62e+1\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":1e+82\n }    ,\t \t\t  \r\r\n\n {\n"a":1e+82\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2e+93\n }    ,\t \t\t  \r\r\n\n {\n"a":-2e+93\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51e+04\n }    ,\t \t\t  \r\r\n\n {\n"a":51e+04\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62e+15\n }    ,\t \t\t  \r\r\n\n {\n"a":-62e+15\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":1E+8\n }    ,\t \t\t  \r\r\n\n {\n"a":1E+8\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2E+9\n }    ,\t \t\t  \r\r\n\n {\n"a":-2E+9\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51E+0\n }    ,\t \t\t  \r\r\n\n {\n"a":51E+0\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62E+1\n }    ,\t \t\t  \r\r\n\n {\n"a":-62E+1\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":1E+82\n }    ,\t \t\t  \r\r\n\n {\n"a":1E+82\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-2E+93\n }    ,\t \t\t  \r\r\n\n {\n"a":-2E+93\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":51E+04\n }    ,\t \t\t  \r\r\n\n {\n"a":51E+04\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":-62E+15\n }    ,\t \t\t  \r\r\n\n {\n"a":-62E+15\n } \r\n]'
  assert.deepEqual(j(s), P(s))

  s = '  [\t {\n"a":"a"\n }    ,\t \t\t  \r\r\n\n {\n"a":"a"\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":"aa"\n }    ,\t \t\t  \r\r\n\n {\n"a":"aa"\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":"\\""\n }    ,\t \t\t  \r\r\n\n {\n"a":"\\""\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":"\\\\"\n }    ,\t \t\t  \r\r\n\n {\n"a":"\\\\"\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":"\\/"\n }    ,\t \t\t  \r\r\n\n {\n"a":"\\/"\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":"\\b"\n }    ,\t \t\t  \r\r\n\n {\n"a":"\\b"\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":"\\f"\n }    ,\t \t\t  \r\r\n\n {\n"a":"\\f"\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":"\\n"\n }    ,\t \t\t  \r\r\n\n {\n"a":"\\n"\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":"\\r"\n }    ,\t \t\t  \r\r\n\n {\n"a":"\\r"\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":"\\t"\n }    ,\t \t\t  \r\r\n\n {\n"a":"\\t"\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s =
    '  [\t {\n"a":"\\u0000"\n }    ,\t \t\t  \r\r\n\n {\n"a":"\\u0000"\n } \r\n]'
  assert.deepEqual(j(s), P(s))

  s = '  [\t {\n"a":true\n }    ,\t \t\t  \r\r\n\n {\n"a":true\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":false\n }    ,\t \t\t  \r\r\n\n {\n"a":false\n } \r\n]'
  assert.deepEqual(j(s), P(s))
  s = '  [\t {\n"a":null\n }    ,\t \t\t  \r\r\n\n {\n"a":null\n } \r\n]'
  assert.deepEqual(j(s), P(s))

  // SPACE  {\nK:  [\tV\r\n]   ,\t \t\t  \r\r\n\nK:  [\tV\r\n]\n }
  s = ' {\n"a":  [\t1\r\n]   ,\t \t\t  \r\r\n\n"a":  [\t1\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t0.3\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t0.3\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-0.4\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-0.4\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t0.37\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t0.37\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-0.48\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-0.48\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t9.3\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t9.3\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-1.4\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-1.4\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t2.37\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t2.37\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-3.48\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-3.48\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t94.3\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t94.3\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-15.4\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-15.4\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t26.37\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t26.37\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-37.48\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-37.48\r\n]\n } '
  assert.deepEqual(j(s), P(s))

  s = ' {\n"a":  [\t1e8\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1e8\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2e9\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2e9\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51e0\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51e0\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62e1\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62e1\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t1e82\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1e82\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2e93\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2e93\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51e04\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51e04\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62e15\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62e15\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t1E8\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1E8\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2E9\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2E9\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51E0\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51E0\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62E1\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62E1\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t1E82\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1E82\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2E93\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2E93\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51E04\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51E04\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62E15\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62E15\r\n]\n } '
  assert.deepEqual(j(s), P(s))

  s = ' {\n"a":  [\t1e-8\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1e-8\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2e-9\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2e-9\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51e-0\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51e-0\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62e-1\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62e-1\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t1e-82\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1e-82\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2e-93\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2e-93\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51e-04\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51e-04\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62e-15\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62e-15\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t1E-8\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1E-8\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2E-9\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2E-9\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51E-0\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51E-0\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62E-1\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62E-1\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t1E-82\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1E-82\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2E-93\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2E-93\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51E-04\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51E-04\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62E-15\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62E-15\r\n]\n } '
  assert.deepEqual(j(s), P(s))

  s = ' {\n"a":  [\t1e+8\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1e+8\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2e+9\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2e+9\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51e+0\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51e+0\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62e+1\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62e+1\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t1e+82\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1e+82\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2e+93\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2e+93\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51e+04\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51e+04\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62e+15\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62e+15\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t1E+8\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1E+8\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2E+9\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2E+9\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51E+0\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51E+0\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62E+1\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62E+1\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t1E+82\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t1E+82\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-2E+93\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-2E+93\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t51E+04\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t51E+04\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\t-62E+15\r\n]   ,\t \t\t  \r\r\n\n"b":  [\t-62E+15\r\n]\n } '
  assert.deepEqual(j(s), P(s))

  s = ' {\n"a":  [\ttrue\r\n]   ,\t \t\t  \r\r\n\n"b":  [\ttrue\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\tfalse\r\n]   ,\t \t\t  \r\r\n\n"b":  [\tfalse\r\n]\n } '
  assert.deepEqual(j(s), P(s))
  s = ' {\n"a":  [\tnull\r\n]   ,\t \t\t  \r\r\n\n"b":  [\tnull\r\n]\n } '
  assert.deepEqual(j(s), P(s))
}
