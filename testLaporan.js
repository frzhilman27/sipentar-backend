const axios = require('axios');
const fs = require('fs');

async function testLaporanUpload() {
    const API_URL = 'https://sipentar-backend.vercel.app/api';

    try {
        // 1. Login to get token using NIK for Warga
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            identifier: '1111222233334444',
            password: 'password',
            role_target: 'user'
        });
        const token = loginRes.data.token;
        console.log('Got token:', token.substring(0, 20) + '...');

        // 2. Prepare Payload
        const payload = {
            judul: 'Test Laporan Base64',
            isi: 'Ini adalah isi testing laporan dengan base64',
            imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' // 1x1 pixel base64 png
        };

        // 3. Send POST request
        const postRes = await axios.post(`${API_URL}/laporan`, payload, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Success:', postRes.data);
    } catch (e) {
        if (e.response) {
            console.error('API Error:', e.response.status, e.response.data);
        } else {
            console.error('Error:', e.message);
        }
    }
}

testLaporanUpload();
