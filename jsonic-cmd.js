const jsonic = require('../jsonic');
const json = process.argv.slice(2).join(' ');
const obj = jsonic(json);
console.log(JSON.stringify(obj));
