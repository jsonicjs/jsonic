const { readFileSync } = require('fs')
const { join } = require('path')

function loadTSV(filename) {
  const specPath = join(__dirname, 'spec', filename)
  const lines = readFileSync(specPath, 'utf8').split('\n').filter(Boolean)
  return lines.slice(1).map((line) => line.split('\t'))
}

module.exports = { loadTSV }
