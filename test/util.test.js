/* Copyright (c) 2013-2020 Richard Rodger and other contributors, MIT License */
'use strict'

let Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

const Code = require('@hapi/code')

const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect

const { util } = require('..')
const deep = util.deep
const s2cca = util.s2cca
const norm_options = util.norm_options


describe('util', () => {
  it('deep', () => {

    expect(deep()).equals(undefined)
    expect(deep(undefined)).equals(undefined)
    expect(deep(undefined,undefined)).equals(undefined)
    expect(deep(null)).equals(null)
    expect(deep(null,null)).equals(null)

    expect(deep({})).equals({})
    expect(deep(null,{})).equals({})
    expect(deep({},null)).equals({})
    expect(deep(undefined,{})).equals({})
    expect(deep({},undefined)).equals({})

    expect(deep({a:1})).equals({a:1})
    expect(deep(null,{a:1})).equals({a:1})
    expect(deep({a:1},null)).equals({a:1})
    expect(deep(undefined,{a:1})).equals({a:1})
    expect(deep({a:1},undefined)).equals({a:1})

    expect(deep({a:1},{})).equals({a:1})
    expect(deep({a:1},{b:2})).equals({a:1,b:2})
    expect(deep({a:1},{b:2,a:3})).equals({a:3,b:2})

    expect(deep({a:1,b:{c:2}},{})).equals({a:1,b:{c:2}})
    expect(deep({a:1,b:{c:2}},{a:3})).equals({a:3,b:{c:2}})
    expect(deep({a:1,b:{c:2}},{a:3,b:{}})).equals({a:3,b:{c:2}})
    expect(deep({a:1,b:{c:2}},{a:3,b:{d:4}})).equals({a:3,b:{c:2,d:4}})
    expect(deep({a:1,b:{c:2}},{a:3,b:{c:5}})).equals({a:3,b:{c:5}})
    expect(deep({a:1,b:{c:2}},{a:3,b:{c:5,e:6}})).equals({a:3,b:{c:5,e:6}})

    expect(deep([])).equals([])
    expect(deep(null,[])).equals([])
    expect(deep([],null)).equals([])
    expect(deep(undefined,[])).equals([])
    expect(deep([],undefined)).equals([])

    expect(deep([1])).equals([1])
    expect(deep(null,[1])).equals([1])
    expect(deep([1],null)).equals([1])
    expect(deep(undefined,[1])).equals([1])
    expect(deep([1],undefined)).equals([1])

    expect(deep([1],[])).equals([1])
    expect(deep([],[1])).equals([1])
    expect(deep([1],[2])).equals([2])
    expect(deep([1,3],[2])).equals([2,3])


    expect(deep({a:1,b:[]})).equals({a:1,b:[]})
    expect(deep({a:1,b:[2]})).equals({a:1,b:[2]})
    expect(deep({a:1,b:[2],c:[{d:3}]})).equals({a:1,b:[2],c:[{d:3}]})
    expect(deep({a:1,b:[2],c:[{d:3}]},{a:4,b:[5],c:[{d:6}]}))
      .equals({a:4,b:[5],c:[{d:6}]})

    // NOTE: does not override top level
    expect(deep([],{})).equals([])
    expect(deep({},[])).equals({})

    expect(deep({a:[]},{a:{}})).equals({a:{}})
    expect(deep({a:{}},{a:[]})).equals({a:[]})

    expect(deep([[]],[{}])).equals([{}])
    expect(deep([{}],[[]])).equals([[]])

  })


  it('s2cca', () => {
    expect(s2cca('')).equal([])
    expect(s2cca('a')).equal([97])
    expect(s2cca('ab')).equal([97,98])
  })


  it('norm_options', () => {
    expect(norm_options({
      sc_foo: ' \t',
      sc_bar: 'ab',
      sc_escapes: '\r\n'
    })).includes({
      SC_FOO: [32,9],
      SC_BAR: [97,98],
      SC_ESCAPES: [13,10],
    })

    
    let singles = []
    singles[97] = ['#AAa']
    singles[98] = ['#BBb']
    expect(norm_options({
      AA: singles[97],
      BB: singles[98],
    })).includes({
      SINGLES: singles
    })

    
    let escapes = []
    escapes[110] = '\n'
    escapes[116] = '\t'
    expect(norm_options({
      escapes: {
        n: '\n',
        t: '\t',
      },
    })).includes({
      ESCAPES: escapes
    })

  })

})
