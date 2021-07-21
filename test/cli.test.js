/* Copyright (c) 2013-2021 Richard Rodger and other contributors, MIT License */
'use strict'

let Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

const Code = require('@hapi/code')

const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect

const JsonicCli = require('../jsonic-cli')
const jr = async (...rest) => await JsonicCli.run(...rest)


describe('cli', function () {


  it('happy', () => {
    let cn = make_cn()
    jr([0,0,'a:1'],cn)
    expect(cn.d.log[0][0]).equals('{"a":1}')

    cn = make_cn()
    jr([0,0,'-o','number.lex=false','a:1'],cn)
    expect(cn.d.log[0][0]).equals('{"a":"1"}')
  })


  it('args', async () => {
    let cn = make_cn()
    jr([0,0,'-d',
        '-o','debug.maxlen=11',
        '--option','value.lex=false',
        '--',
        'a:true'],cn)
    expect(cn.d.log[37][0]).equals('{"a":"true"}')

    jr([0,0,'--debug',
        '--option','debug.maxlen=11',
        '-o','text.lex_value=false',
        'a:true'],cn)
    expect(cn.d.log[37][0]).equals('{"a":"true"}')

    cn = make_cn()
    jr([0,0,'--meta', 'log=-1', 'a:true'],cn)
    expect(cn.d.log[37][0]).equals('{"a":true}')

    cn = make_cn()
    jr([0,0,'-m', 'log=-1', 'a:true'],cn)
    expect(cn.d.log[37][0]).equals('{"a":true}')

    cn = make_cn()
    jr([0,0,'-h'],cn)
    expect(cn.d.log[0][0]).contains('Usage:')

    cn = make_cn()
    jr([0,0,'--help'],cn)
    expect(cn.d.log[0][0]).contains('Usage:')

    cn = make_cn()
    jr([0,0,'a:1','b:[2]','c:{x:1}'],cn)
    expect(cn.d.log[0][0]).equals('{"a":1,"b":[2],"c":{"x":1}}')


    // TODO: use a test plugin
    /*
    cn = make_cn()
    jr([0,0,'-p','csv','a,b\n1,[2]\n'],cn)
    //console.log(cn.d.log)
    expect(cn.d.log[0][0]).equals('[{"a":1,"b":[2]}]')

    cn = make_cn()
    jr([0,0,'--plugin','csv','-o','plugin.csv.strict=true','a,b\n1,[2]\n'],cn)
    //console.log(cn.d.log)
    expect(cn.d.log[0][0]).equals('[{"a":"1","b":"[2]"}]')

    cn = make_cn()
    jr([0,0,'--plugin','csv',
        '-o','plugin.csv.strict=false',
        '-o','plugin.csv.strict=true',
        'a,b\n1,[2]\n'],cn)
    expect(cn.d.log[0][0]).equals('[{"a":"1","b":"[2]"}]')
    */
    
    cn = make_cn()
    await jr([0,0,'-p','./test/angle.js','<a:1>'],cn)
    expect(cn.d.log[0][0]).equals('{"a":1}')

    cn = make_cn()
    await jr([0,0,'-p','./test/plugin-name.js','{a:1}'],cn)
    expect(cn.d.log[0][0]).equals('{"a":1}')

    cn = make_cn()
    await jr([0,0,'-p','./test/plugin-default.js','{a:1}'],cn)
    expect(cn.d.log[0][0]).equals('{"a":1}')

    
    try {
      cn = make_cn()
      await jr([0,0,'-p','./test/also-bad-plugin.js','{a:1}'],cn)
      Code.fail()
    }
    catch(e) {
      expect(e.message).includes('not a function')
    }
    
    // TODO: `{zed:2}` should work too!
    cn = make_cn()
    await jr([0,0,'-f','./test/foo.jsonic', 'zed:2'],cn)
    expect(cn.d.log[0][0]).equals('{"bar":1,"zed":2}')

    cn = make_cn()
    await jr([0,0,'-f','./test/foo.jsonic','--file','./test/bar.jsonic'],cn)
    //console.log('Q',cn.d.log)
    expect(cn.d.log[0][0]).equals('{"bar":1,"qaz":2}')

    cn = make_cn()
    jr([0,0,'--not-an-arg-so-ignored','a:1'],cn)
    expect(cn.d.log[0][0]).equals('{"a":1}')

    cn = make_cn()
    cn.test$='{a:1}'
    await jr([0,0],cn)
    // console.log(cn.d.log)
    expect(cn.d.log[0][0]).equals('{"a":1}')

    cn = make_cn()
    cn.test$='{a:1}'
    await jr([0,0,'-'],cn)
    // console.log(cn.d.log)
    expect(cn.d.log[0][0]).equals('{"a":1}')

    cn = make_cn()
    cn.test$='{a:1}'
    await jr([0,0,'-','b:2'],cn)
    // console.log(cn.d.log)
    expect(cn.d.log[0][0]).equals('{"a":1,"b":2}')

  })


  it('bad-args', async () => {
    let cn = make_cn()
    jr([0,0,'-f',{bad:1},'a:1'],cn)
    expect(cn.d.log[0][0]).equals('{"a":1}')

    cn = make_cn()
    jr([0,0,'-f','','a:1'],cn)
    expect(cn.d.log[0][0]).equals('{"a":1}')

    cn = make_cn()
    jr([0,0,'-o','','a:1'],cn)
    expect(cn.d.log[0][0]).equals('{"a":1}')

    cn = make_cn()
    jr([0,0,'-o','=','a:1'],cn)
    expect(cn.d.log[0][0]).equals('{"a":1}')

    cn = make_cn()
    jr([0,0,'-o','bad=','a:1'],cn)
    expect(cn.d.log[0][0]).equals('{"a":1}')

    try {
      cn = make_cn()
      await jr([0,0,'-p','./test/bad-plugin','a:1'],cn)
      Code.fail()
    }
    catch(e) {
      expect(e.message).includes('identifier')
    }
    
  })

  
  it('stringify', async () => {
    let cn = make_cn()
    jr([0,0,'-o','JSON.space=2','a:1'],cn)
    expect(cn.d.log[0][0]).equals('{\n  "a": 1\n}')

    cn = make_cn()
    jr([0,0,'-o','JSON.replacer=[b]','a:1,b:2'],cn)
    expect(cn.d.log[0][0]).equals('{"b":2}')

    cn = make_cn()
    jr([0,0,'-o','JSON.replacer=b','a:1,b:2'],cn)
    expect(cn.d.log[0][0]).equals('{"b":2}')
  })

  
})


function make_cn() {
  let d = {
    log:[],
    dir:[],
  }
  return {
    test$: true,
    d,
    log: (...rest)=>d.log.push(rest),
    dir: (...rest)=>d.dir.push(rest),
  }
}
