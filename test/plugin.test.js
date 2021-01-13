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

const j = Jsonic


describe('plugin', function () {
  it('json-happy', () => {
    let k = Jsonic.use(Json)
    expect(k('a:1')).equal({a:1})
    expect(k('{"a":1}',{mode:'json'})).equal({a:1})

    //k('{a:1}',{mode:'json'})
    expect(()=>k('{a:1}',{mode:'json'})).throws(JsonicError, /jsonic\/json/)


  })
})
