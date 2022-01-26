console.log('>>> do copy networks.json')
const fs = require('fs')
fs.createReadStream('./src/networks.json').pipe(fs.createWriteStream('./build/networks.json'))
console.log('>>> clean build ready')