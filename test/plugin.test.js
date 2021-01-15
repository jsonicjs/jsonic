/* Copyright (c) 2013-2020 Richard Rodger and other contributors, MIT License */
'use strict'

let Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

const Code = require('@hapi/code')

const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect

const { Jsonic, JsonicError } = require('..')
const { Json } = require('../plugin/json')
const { Csv } = require('../plugin/csv')
const { Dynamic } = require('../plugin/dynamic')
const { Multifile } = require('../plugin/multifile')

//const j = Jsonic


describe('plugin', function () {

  // FIX: infects top level Jsonic!!! make() broken for opts?
  it('dynamic-happy', () => {
    let k = Jsonic.make().use(Dynamic)
    expect(k('a:1,b:$1+1')).equal({a:1,b:2})
  })


  it('multifile-happy', () => {
    let k = Jsonic.make().use(Multifile,{plugin:{multifile:{basepath:__dirname}}})
    //let k = Jsonic.use(Multifile)
    //console.dir(k.rule('val').def.open,{depth:null})

    let d = k('@"multifile/main01.jsonic"',{xlog:-1})
    expect(d).equal({
      dynamic: '$1+1',
      red: { name: 'RED' },
      green: { name: 'GREEN' },
      blue: { color: 'BLUE' },
      cyan: [ { name: 'CYAN' } ],
      tree: { stem0: 'leaf0', stem1: { caterpillar: { tummy: 'yummy!' } } },
      again: { foo: '$1+1' },
    })
  })
  

  it('multifile-dynamic', () => {
    let k = Jsonic.make().use(Dynamic)
    //console.dir(k.rule('val').def,{depth:null})
    //console.log('Pa', k.internal().parser.mark)
    
    k = k.use(Multifile,{plugin:{multifile:{basepath:__dirname}}})
    //console.dir(k.rule('val').def,{depth:null})
    //console.log('Pb', k.internal().parser.mark)
    
    let d = k('@"multifile/main01.jsonic"')
    
    // NOTE: use JSON.parse(JSON.stringify(d)) to see literals

    // FIX: need to passs root node into sub files so Dynamic still works
    // or set on getter?
    // or pass in initial context?
    console.dir(JSON.parse(JSON.stringify(d)),{depth:null})
    expect(d).equal({
      dynamic: 2,
      red: { name: 'RED' },
      green: { name: 'GREEN' },
      blue: { color: 'BLUE' },
      cyan: [ { name: 'CYAN' } ],
      tree: { stem0: 'leaf0', stem1: { caterpillar: { tummy: 'yummy!' } } },
      again: { foo: 2 },
    })
  })


  it('json-happy', () => {
    let k = Jsonic.make().use(Json)
    expect(k('a:1')).equal({a:1})
    expect(k('{"a":1}',{mode:'json'})).equal({a:1})
    expect(()=>k('{a:1}',{mode:'json'})).throws(JsonicError, /jsonic\/json/)
  })


  it('csv-happy', () => {
    let k = Jsonic.make().use(Csv)
    expect(k('a,b\n1,2\n11,22\n')).equal([{ a: 1, b: 2 }, { a: 11, b: 22 }])
  })



})
