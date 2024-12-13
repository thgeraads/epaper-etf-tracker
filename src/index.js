const LsClient = require('./ls.js');
const path = require('node:path');
const fs = require('fs');
const {generateChartImage} = require('./image(400x300)(full).js');
const {spawn} = require('child_process');
const etfs = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'config', 'etfs.json')));
const ids = Object.keys(etfs);
const holdings = ids.map(id => etfs[id].holdings);
console.log(holdings);

const lsClient = new LsClient();

async function main() {
    const data = await lsClient.getETFPrice(etfs, 1);
    const buffer = generateChartImage(data, etfs, true);
    fs.writeFileSync('chart.png', buffer);

    const oepl = spawn('python3', ['src/py/oepl.py']);
    oepl.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    oepl.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    oepl.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });


}

main().catch(console.error);
