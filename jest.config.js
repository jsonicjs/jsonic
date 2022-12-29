module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  testTimeout: 9999,
  coveragePathIgnorePatterns: ['test'],
  transform: {
    "^.+\\.tsx?$": "es-jest"
  },
}
