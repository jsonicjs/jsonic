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
const jr = JsonicCli.run


describe('compat', function () {

  it('cli', () => {
    let cn = make_cn()
    jr([0,0,'a:1'],cn)
    //console.log(cn.d)
    expect(cn.d.log[0][0]).equals('{"a":1}')
  })
})


function make_cn() {
  let d = {
    log:[],
    dir:[],
  }
  return {
    d,
    log: (...rest)=>d.log.push(rest),
    dir: (...rest)=>d.dir.push(rest),
  }
}
