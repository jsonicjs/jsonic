const { readFileSync, existsSync } = require('fs')
const { join } = require('path')

function loadTSV(name) {
  const specPath = join(__dirname, 'spec', name + '.tsv')

  if (!existsSync(specPath)) {
    throw new Error('spec file not found: ' + specPath)
  }

  const lines = readFileSync(specPath, 'utf8').split('\n').filter(Boolean)
  return lines.slice(1).map((line) => line.split('\t'))
}

module.exports = { loadTSV }
