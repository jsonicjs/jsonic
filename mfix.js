/* Copyright (c) 2021 Richard Rodger and other contributors, MIT License */
'use strict'

// Uncomments a special fix that removes the need for `.default` when
// requiring plain Node.js code.

const Fs = require('fs')

// Inject as part of build step (see package.json).
let src = Fs.readFileSync('./jsonic.js').toString()
src = src.replace(/\/\/-NODE-MODULE-FIX/, '')
Fs.writeFileSync('./jsonic.js', src)
