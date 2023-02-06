/* Copyright (c) 2013-2022 Richard Rodger and other contributors, MIT License */
'use strict'

const JsonicCli = require('../dist/jsonic-cli')
const jr = async (...rest) => await JsonicCli.run(...rest)

describe('cli', function () {
  it('basic', () => {
    let cn = make_cn()
    jr([0, 0, 'a:1'], cn)
    expect(cn.d.log[0][0]).toEqual('{"a":1}')

    cn = make_cn()
    jr([0, 0, '-o', 'number.lex=false', 'a:1'], cn)
    expect(cn.d.log[0][0]).toEqual('{"a":"1"}')
  })

  it('args', async () => {
    let cn = make_cn()

    // TODO: fix test
    // jr([0,0,'-d',
    //     '-o','debug.maxlen=11',
    //     '--option','value.lex=false',
    //     '--',
    //     'a:true'],cn)
    // expect(cn.d.log[39][0]).toEqual('{"a":"true"}')

    // jr([0,0,'--debug',
    //     '--option','debug.maxlen=11',
    //     '-o','text.lex_value=false',
    //     'a:true'],cn)
    // expect(cn.d.log[39][0]).toEqual('{"a":"true"}')

    // TODO: review loggin via cli

    // cn = make_cn()
    // jr([0, 0, '--meta', 'log=-1', 'a:true'], cn)
    // // console.log(cn.d.log.map((e,i)=>i+': '+e))
    // expect(cn.d.log[48][0]).toEqual('{"a":true}')

    // cn = make_cn()
    // jr([0, 0, '-m', 'log=-1', 'a:true'], cn)
    // expect(cn.d.log[48][0]).toEqual('{"a":true}')

    cn = make_cn()
    jr([0, 0, '-h'], cn)
    expect(cn.d.log[0][0].includes('Usage:')).toBeTruthy()

    cn = make_cn()
    jr([0, 0, '--help'], cn)
    expect(cn.d.log[0][0].includes('Usage:')).toBeTruthy()

    cn = make_cn()
    jr([0, 0, 'a:1', 'b:[2]', 'c:{x:1}'], cn)
    expect(cn.d.log[0][0]).toEqual('{"a":1,"b":[2],"c":{"x":1}}')

    // // TODO: `{zed:2}` should work too!
    cn = make_cn()
    await jr([0, 0, '-f', './test/foo.jsonic', 'zed:2'], cn)
    expect(cn.d.log[0][0]).toEqual('{"bar":1,"zed":2}')

    // TODO: jest borks this
    // cn = make_cn()
    // await jr([0,0,'-f','./test/foo.jsonic','--file','./test/bar.jsonic'],cn)
    // //console.log('Q',cn.d.log)
    // expect(cn.d.log[0][0]).toEqual('{"bar":1,"qaz":2}')

    cn = make_cn()
    jr([0, 0, '--not-an-arg-so-ignored', 'a:1'], cn)
    expect(cn.d.log[0][0]).toEqual('{"a":1}')

    cn = make_cn()
    cn.test$ = '{a:1}'
    await jr([0, 0], cn)
    // console.log(cn.d.log)
    expect(cn.d.log[0][0]).toEqual('{"a":1}')

    cn = make_cn()
    cn.test$ = '{a:1}'
    await jr([0, 0, '-'], cn)
    // console.log(cn.d.log)
    expect(cn.d.log[0][0]).toEqual('{"a":1}')

    cn = make_cn()
    cn.test$ = '{a:1}'
    await jr([0, 0, '-', 'b:2'], cn)
    // console.log(cn.d.log)
    expect(cn.d.log[0][0]).toEqual('{"a":1,"b":2}')

    // return;
  })

  it('bad-args', async () => {
    let cn = make_cn()
    jr([0, 0, '-f', { bad: 1 }, 'a:1'], cn)
    expect(cn.d.log[0][0]).toEqual('{"a":1}')

    cn = make_cn()
    jr([0, 0, '-f', '', 'a:1'], cn)
    expect(cn.d.log[0][0]).toEqual('{"a":1}')

    cn = make_cn()
    jr([0, 0, '-o', '', 'a:1'], cn)
    expect(cn.d.log[0][0]).toEqual('{"a":1}')

    cn = make_cn()
    jr([0, 0, '-o', '=', 'a:1'], cn)
    expect(cn.d.log[0][0]).toEqual('{"a":1}')

    cn = make_cn()
    jr([0, 0, '-o', 'bad=', 'a:1'], cn)
    expect(cn.d.log[0][0]).toEqual('{"a":1}')

    // TODO: jest borks require so test won't work
    // try {
    //   cn = make_cn()
    //   await jr([0,0,'-p','./test/bad-plugin','a:1'],cn)
    //   Code.fail()
    // }
    // catch(e) {
    //   expect(e.message.includes('identifier')).toBeTruthy()
    // }
  })

  it('plugin', async () => {
    let cn = make_cn()
    await jr([0, 0, '-p', '../test/p0', '-o', 'plugin.p0.x=0', 'a:X'], cn)
    expect(cn.d.log[0][0]).toEqual('{"a":0}')

    cn = make_cn()
    await jr(
      [
        0,
        0,
        '-p',
        '../test/p0',
        '-o',
        'plugin.p0.x=0',
        '-o',
        'plugin.p0.s=W',
        'a:W',
      ],
      cn
    )
    expect(cn.d.log[0][0]).toEqual('{"a":0}')

    cn = make_cn()
    await jr([0, 0, '-o', 'plugin.p1.y=1', '-p', '../test/p1', 'a:Y'], cn)
    expect(cn.d.log[0][0]).toEqual('{"a":1}')

    cn = make_cn()
    await jr(
      [
        0,
        0,
        '-o',
        'plugin.p0.x=0',
        '-p',
        '../test/p0',
        '-o',
        'plugin.p1.y=1',
        '-p',
        '../test/p1',
        'a:X,b:Y',
      ],
      cn
    )
    expect(cn.d.log[0][0]).toEqual('{"a":0,"b":1}')

    cn = make_cn()
    await jr([0, 0, '-p', '../test/p2', '-o', 'plugin.p2.z=2', 'a:Z'], cn)
    expect(cn.d.log[0][0]).toEqual('{"a":2}')

    cn = make_cn()
    await jr(
      [0, 0, '-p', '../test/pa-qa.js', '-o', 'plugin.paqa.q=3', 'a:Q'],
      cn
    )
    expect(cn.d.log[0][0]).toEqual('{"a":3}')

    cn = make_cn()
    await jr(
      [
        0,
        0,
        '-p',
        '@jsonic/directive',
        '-o',
        'custom.x=4',
        '-o',
        'plugin.directive.name=constant',
        '-o',
        'plugin.directive.open=X',
        '-o',
        'plugin.directive.action=custom.x',
        'a:X',
      ],
      cn
    )
    expect(cn.d.log[0][0]).toEqual('{"a":4}')

    cn = make_cn()
    await jr(
      [
        0,
        0,
        '-p',
        'directive',
        '-o',
        'custom.x=5',
        '-o',
        'plugin.directive.name=constant',
        '-o',
        'plugin.directive.open=X',
        '-o',
        'plugin.directive.action=custom.x',
        'a:X',
      ],
      cn
    )
    expect(cn.d.log[0][0]).toEqual('{"a":5}')
  })

  it('stringify', async () => {
    let cn = make_cn()
    jr([0, 0, '-o', 'JSON.space=2', 'a:1'], cn)
    expect(cn.d.log[0][0]).toEqual('{\n  "a": 1\n}')

    cn = make_cn()
    jr([0, 0, '-o', 'JSON.replacer=[b]', 'a:1,b:2'], cn)
    expect(cn.d.log[0][0]).toEqual('{"b":2}')

    cn = make_cn()
    jr([0, 0, '-o', 'JSON.replacer=b', 'a:1,b:2'], cn)
    expect(cn.d.log[0][0]).toEqual('{"b":2}')
  })
})

function make_cn() {
  let d = {
    log: [],
    dir: [],
  }
  return {
    test$: true,
    d,
    log: (...rest) => d.log.push(rest),
    dir: (...rest) => d.dir.push(rest),
  }
}
