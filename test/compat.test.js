/* Copyright (c) 2013-2020 Richard Rodger and other contributors, MIT License */
'use strict'

var Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

var Code = require('@hapi/code')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect

var { Jsonic } = require('..')

let j = Jsonic
// let lexer = Jsonic.lexer

function testlog(...rest) {
  console.log(rest.filter(x=>'object'!=typeof(x)))
}

describe('compat', function () {

  // https://hjson.github.io/
  it('hjson-readme', () => {
    j = Jsonic.make({
      text: {
        endofline: true
      }
    })
    
    expect(j(`{
  first: 1
  second: 2
}`)).equals({first: 1,second: 2})

    expect(j(`{
  # hash style comments
  # (because it's just one character)

  // line style comments
  // (because it's like C/JavaScript/...)

  /* block style comments because
     it allows you to comment out a block */

  # Everything you do in comments,
  # stays in comments ;-}
}`)).equals({})


    expect(j(`{
  # specify rate in requests/second
  rate: 1000
}`)).equals({rate: 1000})



    expect(j(`{
  JSON: "a string"

  Hjson: a string

  # notice, no escape necessary:
  RegEx: \\s+
}`)).equals({JSON: 'a string', Hjson: 'a string', RegEx: '\\s+'})


   expect(j(`{
  one: 1
  two: 2,
  more: [3,4,5]
  trailing: 6,
}`)).equals({
  one: 1,
  two: 2,
  more: [3,4,5],
  trailing: 6
})

    
    // TODO: Plugin needed, or maybe mode?
    /*
{
  md:
    '''
    First line.
    Second line.
      This line is indented by two spaces.
    '''
}
    */
    

   expect(j(`{
  "key name": "{ sample }"
  "{}": " spaces at the start/end "
  this: is OK though: {}[],:
}`)).equals({
  "key name": "{ sample }",
  "{}": " spaces at the start/end ",
  "this": "is OK though: {}[],:",
})

    
  })
})
