/* Copyright (c) 2013-2020 Richard Rodger and other contributors, MIT License */
'use strict'

let Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

const Code = require('@hapi/code')

const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect

const { Jsonic } = require('..')

const j = Jsonic


describe('error', function () {
  it('lex-unicode', () => {
    console.log('A',j('\n\n\n\n\n\n\n\n\n\n   "\\u0000"'))
  })

  it('parse-unexpected', () => {
    console.log('A',j('\n\n\n\n\n\n\n\n\n\n   }'))
  })
})
