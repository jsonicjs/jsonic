/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  // preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  testTimeout: 9999,
  // collectCoverageFrom: ['*.js'],
  coveragePathIgnorePatterns: ['test'],
};
