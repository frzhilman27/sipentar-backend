const https = require('https');

const options = {
    hostname: 'sipentar-backend-production.up.railway.app',
    port: 443,
    path: '/api/debug',
    method: 'GET'
};

const req = https.request(options, (res) => {
    console.log(`STATUS_DEBUG: ` + res.statusCode);
    res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (error) => {
    console.error('ERROR_DEBUG:', error);
});

req.end();
