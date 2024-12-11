// const {lsClient} = require('./ls.js');
// const path = require('path');
// const fs = require('fs');
// const {generateChartImage} = require('./image.js'); // Import the drawing function
// const {processAndUploadImage} = require('./epd.js'); // Import the image upload function
// const {spawn} = require('child_process');
//
// const etfs = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'config', 'etfs.json')));
// const symbols = Object.keys(etfs);
// const holdings = symbols.map(symbol => etfs[symbol].holdings);
// _intradayData = {};
//
// console.log(holdings)
//
//
// const client = new yfClient(etfs);
//
// async function main() {
//     // Fetch intraday data for each symbol
//     for (const symbol of symbols) {
//         const intradayData = JSON.parse(await client.fetchIntradayData(symbol));
//         for (quote of intradayData.quotes) {
//             // convert the date to hh:mm format
//             const quoteDate = new Date(quote.date).toLocaleTimeString('en-NL', {hour: '2-digit', minute: '2-digit'});
//             if (!_intradayData[quoteDate]) {
//                 _intradayData[quoteDate] = {};
//             }
//
//             _intradayData[quoteDate][symbol] = quote.close;
//         }
//     }
//
//     // 1. replace any null values with the previous value, this might be a few minutes ago
//     for (const quoteDate of Object.keys(_intradayData)) {
//         for (const symbol of symbols) {
//             if (_intradayData[quoteDate][symbol] === null) {
//                 const previousQuoteDate = Object.keys(_intradayData).slice(0, Object.keys(_intradayData).indexOf(quoteDate)).reverse().find(date => _intradayData[date][symbol] !== null);
//                 _intradayData[quoteDate][symbol] = _intradayData[previousQuoteDate][symbol];
//             }
//         }
//     }
//
//     // 2. do the same if any of the symbols do not exist in the current quote date
//     for (const quoteDate of Object.keys(_intradayData)) {
//         for (const symbol of symbols) {
//             if (!_intradayData[quoteDate][symbol]) {
//                 const previousQuoteDate = Object.keys(_intradayData).slice(0, Object.keys(_intradayData).indexOf(quoteDate)).reverse().find(date => _intradayData[date][symbol] !== null);
//                 _intradayData[quoteDate][symbol] = _intradayData[previousQuoteDate][symbol];
//             }
//         }
//     }
//
//
//     // calculate holdings and insert into the intraday data
//     for (const quoteDate of Object.keys(_intradayData)) {
//         const holdings = symbols.map(symbol => etfs[symbol].holdings * _intradayData[quoteDate][symbol]);
//         _intradayData[quoteDate].holdings = holdings.reduce((a, b) => a + b, 0);
//     }
//
//     console.log(_intradayData)
//     // console.log(_intradayData.length)
//
//     const imageBuffer = generateChartImage(_intradayData, etfs, true);
//     fs.writeFileSync('chart.png', imageBuffer);
//
// // //     call oepl.py
// //     const oepl = spawn('python3', ['oepl.py']);
// //     oepl.stdout.on('data', (data) => {
// //         console.log(`stdout: ${data}`);
// //     });
// //
// //     oepl.stderr.on('data', (data) => {
// //         console.error(`stderr: ${data}`);
// //     });
// //
// //     oepl.on('close', (code) => {
// //         console.log(`child process exited with code ${code}`);
// //     });
//
//     // Process and upload the image
//
// }
//
// main().catch(console.error);




const LsClient = require('./ls.js');
const path = require('path');
const fs = require('fs');
const {generateChartImage} = require('./image.js');

const etfs = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'config', 'etfs.json')));
const ids = Object.keys(etfs);
const holdings = ids.map(id => etfs[id].holdings);
console.log(holdings);

const lsClient = new LsClient();

async function main(){
    const data = await lsClient.getETFPrice(etfs, 1);
    const buffer = generateChartImage(data, etfs, true);
    fs.writeFileSync('chart.png', buffer);
}

main().catch(console.error);
