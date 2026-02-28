const http = require('http');

const data = JSON.stringify({
    identifier: "admin@sipentar.com",
    password: "admin123",
    role_target: "admin"
});

const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (error) => {
    console.error('ERROR:', error);
});

req.write(data);
req.end();
