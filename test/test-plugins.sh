# Assumes plugin repos checked out at same level

cd ../path
npm link @jsonic/jsonic-next
npm test

cd ../directive
npm link @jsonic/jsonic-next
npm test

cd ../multisource
npm link @jsonic/jsonic-next
npm test

cd ../expr
npm link @jsonic/jsonic-next
npm test

cd ../csv
npm link @jsonic/jsonic-next
npm test

cd ../jsonic

