'use strict';

const rp = require('request-promise');
const config = require('./config');
const http = require('http');

http
    .createServer(async function(req, res) {
        let urlSplit = req.url.split('?')[1].split('&'),
            query = {};

        if (urlSplit.length) {
            for (let i = 0, len = urlSplit.length; i < len; ++i) {
                let split = urlSplit[i].split('=');
                query[split[0]] = split[1];
            }
        }

        let product = query.product || 'LTC-USD',
            price = {product, stats: {}};

        await getProductPrice(price);
        let dir = price.stats.last < price.stats.open ? '-' : '+',
            percentageChange = parseFloat(((price.stats.last - price.stats.open)/price.stats.open) * 100).toFixed(2),
            currentPrice = parseFloat(price.stats.last).toFixed(2);

        res.writeHead(200, {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*'
        });

        res.end(`
<html>
    <head>
        <title>${product} - $${currentPrice}</title>
    </head>
    <body style="text-align: center;">
        <h1>${product} Price is: $${currentPrice} (${dir}${percentageChange}%)</h1>
        <select id="product" onchange="var slct = document.getElementById('product'); window.location.href='/?product=' + slct.options[slct.selectedIndex].value">
            <option ${product === 'BTC-USD' ? 'selected' : ''} value="BTC-USD">BTC/USD</option>
            <option ${product === 'ETH-USD' ? 'selected' : ''} value="ETH-USD">ETH/USD</option>
            <option ${product === 'LTC-USD' ? 'selected' : ''} value="LTC-USD">LTC/USD</option>
        </select>
    </body>
</html>
`
        );
    })
    .listen(3000)

async function getProductPrice(price) {
    await rp({
        uri: `https://api.gdax.com/products/${price.product}/stats`,
        headers: {
            'User-Agent': 'Chrome',
            'CB-ACCESS-KEY': config.gdax.key,
            'CB-ACCESS-SIGN': config.gdax.secret,
            'CB-ACCESS-PASSPHRASE': config.gdax.passPhrase,
            'CB-ACCESS-TIMESTAMP': Math.ceil(new Date().getTime()/1000)
        },
        json: true
    })
        .then(stats => {
            price.stats = stats;
        });
}
