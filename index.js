const express = require('express')
const axios = require('axios')
const config = require('./config')
const app = express()
const path = require("path")

app.set('views', path.join(__dirname, 'views/'));
app.engine('.html', require('ejs').renderFile);
app.set('view engine', 'html');

async function getTokenPrice() {
    const tokens = config.token
    let tokenRequest = []
    tokens.forEach(a => {
        tokenRequest.push(axios.get("https://api.huobi.pro/market/history/kline?period=1day&size=1&symbol=" + a.symbol))
    })
    let tokenResponse = await Promise.all(tokenRequest);
    let tokenResult = [];
    for (let i = 0; i < tokens.length; i++) {
        let close = tokenResponse[i].data.data[0].close;
        let open = tokenResponse[i].data.data[0].open;
        tokenResult.push({ name: tokens[i].name, value: close, rate: (100 * ((close - open) / open)).toFixed(2) });
    }
    return tokenResult;
}
async function getDollarPrice() {
    let resp = await axios.get("https://api.exchangerate-api.com/v4/latest/USD");
    let result = [];
    result.push({ name: "美元对人民币", value: resp.data.rates.CNY });
    return result;
}
async function getStockPrice() {
    const stocks2Query = config.stock;

    let queryString = [];
    stocks2Query.forEach(a => { queryString.push("s_" + a.symbol) })
    let reqString = `http://qt.gtimg.cn/r=0.8409869808238q=${queryString.join(",")}`;
    // v_s_sz000559="51~万向钱潮~000559~5.81~0.07~1.22~110475~6384~~191.95~GP-A";
    let resp = await axios.get(reqString);
    const stocks = resp.data.split(";");
    let result = [];
    for (let i = 0; i < stocks.length; i++) {
        if (i >= stocks2Query.length)
            continue
        let info = stocks[i].split("~");
        result.push({ name: stocks2Query[i].name, value: info[3], rate: info[5] })
    }

    return result;
}
app.get('/', async (req, res) => {
    let result = []
    let [token, dollar, stock] = await Promise.all([getTokenPrice(), getDollarPrice(), getStockPrice()])
    result.push(...token)
    result.push(...dollar)
    result.push(...stock)

    res.render("index", { items: result })
})

app.listen(config.port, "0.0.0.0", () => {
    console.log(`Example app listening on port ${config.port}`)
})

//http://qt.gtimg.cn/r=0.8409869808238q=s_sz000559,s_sh600895,s_sz002048,s_sz002085,s_sz002126,s_sz002284,s_sz002434,s_sz002472,s_sz002488