/* Copyright (c) 2013-2021 Richard Rodger and other contributors, MIT License */
'use strict'

let Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

const Code = require('@hapi/code')

const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect

const { Jsonic } = require('..')
// const { Csv } = require('../plugin/csv')


function testlog(...rest) {
  console.log(rest.filter(x=>'object'!=typeof(x)))
}

describe('compat', function () {

  /*
  it('csv-with-json', () => {
    let j = Jsonic.make().use(Csv)

    expect(j('a,b\n1,2')).equals([ { a: 1, b: 2 } ])
    expect(j('a,b\n{x:1},2')).equals([ { a: {x:1}, b: 2 } ])
    expect(j('a,b\n{x:1},[c]')).equals([ { a: {x:1}, b: [ 'c' ] } ])
    expect(j('a,b\n{x:1},[c]\ntrue,false'))
      .equals([ { a: {x:1}, b: [ 'c' ] }, {a:true, b:false} ])
    expect(()=>j('a,b\n{x:1},[c]\ntrue,false,null')).throws('JsonicError',/csv_unexpected_field/)

    // and without
    let k = Jsonic.make().use(Csv,{strict:true})
    expect(k('a,b\n1,"2"')).equals([ { a: '1', b: '2' } ])
    expect(k('a,b\n{x:1},#2')).equals([ { a: '{x:1}', b: '#2' } ])
    
  })
  */
  
})
