const express = require('express');
const request = require('request');
const Brakes = require('brakes');
const http = require('http');

function promiseCall() {
    return new Promise((resolve, reject) => {
        request('https://www.facebook.com', (err, response, body) => {
            console.error('res:', err);
            if (err) {
                reject(err);
                return;
            }
            resolve(body);
        })
    });
}

const app = express();

const brakeOptions = { timeout: 2000, circuitDuration: 30000, waitThreshold: 1 };
const brake = new Brakes(promiseCall, brakeOptions);

app.get('/test', (req, res) => {
    brake.fallback(() => {
        res.send('==> fallback');
    });

    brake.exec(req.query.pass)
        .then((result) => {
            res.send('==> success');
        })
        .catch(err => {
            res.send('error');
        });
});
app.listen(8080, () => {
    console.log('==> app running on port 8080')
});

const globalStats = Brakes.getGlobalStats();
http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/event-stream;charset=UTF-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    globalStats.getHystrixStream().pipe(res);
}).listen(8081, () => {
    console.log('---------------------');
    console.log('Hystrix Stream now live at localhost:8081/hystrix.stream');
    console.log('---------------------');
});