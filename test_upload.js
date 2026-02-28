import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

const runTest = async () => {
    const uniqueId = Date.now().toString().slice(-6);
    const nik = `1234567890${uniqueId}`;
    const email = `test${uniqueId}@example.com`;

    try {
        console.log("Registering temporary test user...");
        await axios.post('http://localhost:8080/api/auth/register', {
            name: 'Test File Uploader',
            nik: nik,
            email: email,
            password: 'password123',
            role: 'warga'
        });

        console.log("Logging in...");
        const loginRes = await axios.post('http://localhost:8080/api/auth/login', {
            identifier: nik,
            password: 'password123'
        });

        const token = loginRes.data.token;
        console.log("Logged in. Token:", token.substring(0, 20) + "...");

        // 1. Create a FormData instance
        const form = new FormData();
        form.append('judul', `Laporan Test API ${uniqueId}`);
        form.append('isi', 'Ini adalah laporan uji coba API dengan gambar.');

        // 2. Attach the image file
        const imagePath = 'C:\\Users\\frzhi\\.gemini\\antigravity\\brain\\7595b470-9855-4b14-b155-81e8cd3816dc\\sample_report_image_1772214980859.png';
        form.append('image', fs.createReadStream(imagePath));

        console.log("Sending multipart request...");
        // 4. Send the POST request to create Laporan
        const response = await axios.post('http://localhost:8080/api/laporan', form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });

        console.log("Success:", response.data);

    } catch (error) {
        if (error.response) {
            console.error("API Error:", error.response.status, error.response.data);
        } else {
            console.error("Error:", error.message);
        }
    }
};

runTest();
