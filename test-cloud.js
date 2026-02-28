const https = require('https');

const data = JSON.stringify({
  identifier: "admin@sipentar.com",
  password: "admin123",
  role_target: "admin"
});

const options = {
  hostname: 'sipentar-backend-production.up.railway.app',
  port: 443,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS_AWAN: ` + res.statusCode);
  res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (error) => {
  console.error('ERROR_AWAN:', error);
});

req.write(data);
req.end();
