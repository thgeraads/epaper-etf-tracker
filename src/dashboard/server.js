const express = require('express');
const fetch = require('node-fetch');
const path = require('node:path');
const fs = require('fs');
const ejs = require('ejs');
const app = express();
const port = 3000;

const etfPath = path.join(__dirname, '..', '..', 'config', '/etfs.json');

app.use(express.static(path.join(__dirname, 'static')));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    const etfsJson = require(etfPath);
    res.render('index', {etfs: etfsJson});
});

app.post('/findInstrument', async (req, res) => {
    const query = req.body.query;

    await fetch(`https://www.ls-x.de/_rpc/json/.lstc/instrument/search/main?q=${query}&localeId=2`, {
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
        },
        "method": "GET",
    }).then(response => response.json())
    .then(data => {
        if (data.length > 0) {
            const etf = data[0];
            res.json({success: true, etf: etf});
        }
        else {
            res.json({success: false, error: 'No results found'});
        }
    })
    .catch(error => {
        res.json({success: false, error: error});
    });
});

app.post('/etfs/:id', (req, res) => {
    const etfsJson = require(etfPath);
    etfsJson[req.params.id] = req.body;

    fs.writeFileSync(etfPath, JSON.stringify(etfsJson, null, 2));
    res.send({success: true});
});

app.patch('/etfs/:id', (req, res) => {
    const etfsJson = require(etfPath);
    etfsJson[req.params.id] = {...etfsJson[req.params.id], ...req.body};

    fs.writeFileSync(etfPath, JSON.stringify(etfsJson, null, 2));
    res.send({success: true});
});

app.delete('/etfs/:id', (req, res) => {
    const etfsJson = require(etfPath);
    delete etfsJson[req.params.id];

    fs.writeFileSync(etfPath, JSON.stringify(etfsJson, null, 2));
    res.send({success: true});
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})
