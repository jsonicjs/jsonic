module.exports = {
  extends: 'eslint:recommended',
  env: {
    node: true,
    es6: true,
    browser: true,
  },
  parserOptions: {
    ecmaVersion: 10,
  },
  rules: {
    'no-console': 1,
    'no-unused-vars': [2, { args: 'none' }],
    'no-extra-semi': 0,
  },
}
