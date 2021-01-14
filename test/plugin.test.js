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
const { Multifile } = require('../plugin/multifile')

const j = Jsonic


describe('plugin', function () {
  it('json-happy', () => {
    let k = Jsonic.use(Json)
    expect(k('a:1')).equal({a:1})
    expect(k('{"a":1}',{mode:'json'})).equal({a:1})

    //k('{a:1}',{mode:'json'})
    expect(()=>k('{a:1}',{mode:'json'})).throws(JsonicError, /jsonic\/json/)


  })


  it('multifile-happy', () => {
    let k = Jsonic.use(Multifile,{plugin:{multifile:{basepath:__dirname}}})
    let d = k('@"multifile/main01.jsonic"')
    //console.dir(d, {depth:null})
    expect(d).equal({
      red: { name: 'RED' },
      green: { name: 'GREEN' },
      blue: { color: 'BLUE' },
      cyan: [ { name: 'CYAN' } ],
      tree: { stem0: 'leaf0', stem1: { caterpillar: { tummy: 'yummy!' } } }
    })
  })
})
