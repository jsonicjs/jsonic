const { readFileSync, existsSync } = require('fs')
const { join } = require('path')

function unescape(str) {
  return str.replace(/\\r\\n|\\n|\\r/g, (m) => {
    if (m === '\\r\\n') return '\r\n'
    if (m === '\\n') return '\n'
    if (m === '\\r') return '\r'
    return m
  })
}

function loadTSV(name) {
  const specPath = join(__dirname, 'spec', name + '.tsv')

  if (!existsSync(specPath)) {
    throw new Error('spec file not found: ' + specPath)
  }

  const lines = readFileSync(specPath, 'utf8').split('\n').filter(Boolean)
  return lines.slice(1).map((line, i) => {
    const cols = line.split('\t').map(unescape)
    return { cols, row: i + 1 }
  })
}

module.exports = { loadTSV }
