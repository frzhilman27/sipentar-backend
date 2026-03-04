const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
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

        // 2. Prepare FormData
        const form = new FormData();
        form.append('newEmail', 'budi@test.com');
        form.append('jenis_kelamin', 'Laki-laki');
        form.append('no_hp', '081234567890');
        // dummy file
        fs.writeFileSync('dummy.jpg', 'fake image data');
        form.append('foto_profil', fs.createReadStream('dummy.jpg'));

        // 3. Send PUT request
        const putRes = await axios.put(`${API_URL}/auth/profile/info`, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Success:', putRes.data);
    } catch (e) {
        if (e.response) {
            console.error('API Error:', e.response.status, e.response.data);
        } else {
            console.error('Error:', e.message);
        }
    }
}

testUpload();
