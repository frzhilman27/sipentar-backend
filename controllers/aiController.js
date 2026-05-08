const { GoogleGenAI } = require('@google/genai');

const aiController = {
  chat: async (req, res) => {
    try {
      const { message, userNameScript } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY belum dikonfigurasi." });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemInstruction = `Anda adalah "SipentarBot", AI Asisten Virtual resmi dari aplikasi Sipentar untuk Desa Lamaran Tarung. 
Tugas utama Anda:
- Menjawab pertanyaan warga seputar infrastruktur desa (contoh: jalan, jembatan, tiang listrik, saluran air, dan fasilitas umum).
- Menjelaskan prosedur pelaporan kerusakan infrastruktur melalui aplikasi Sipentar (menyebutkan bahwa mereka bisa ke menu "Buat Pengaduan").
- Bersikap ramah, sopan, profesional, dan empatik.
- Selalu tegaskan bahwa ini adalah Desa Lamaran Tarung.
- Jika pengguna menanyakan hal lain di luar infrastruktur dan pelayanan persuratan desa, sarankan mereka untuk fokus pada topik pelayanan desa atau mengunjungi langsung balai desa Lamaran Tarung.
- ${userNameScript || 'Pengguna adalah warga.'}

Jangan memberikan janji perbaikan, cukup informasikan bahwa setiap laporan akan diteruskan ke perangkat desa. Berikan jawaban yang ringkas dan mudah dipahami.`;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7
        }
      });

      res.status(200).json({ reply: response.text });
    } catch (error) {
      console.error("AI Generate Content Error:", error);
      res.status(500).json({ error: "Mohon maaf, SipentarBot sedang mengalami gangguan. Silakan coba beberapa saat lagi." });
    }
  },

  validatePhoto: async (req, res) => {
    try {
      const { imageBase64, kategoriLaporan } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY belum dikonfigurasi." });
      }

      if (!imageBase64) {
        return res.status(400).json({ error: "Gambar tidak ditemukan." });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Remove data:image/...;base64, prefix if it exists
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const kategori = kategoriLaporan || "infrastruktur atau fasilitas publik";
      const prompt = `Anda adalah AI pemeriksa kelayakan foto laporan infrastruktur desa.
Tugas Anda:
Periksa apakah gambar ini relevan atau menampilkan situasi sesuai dengan kategori laporan berikut: "${kategori}".
Jika gambar relevan dengan konteks "${kategori}" (misal: jika kategori "Jalan Rusak" harus ada jalan rusak, jika "Lampu Jalan Mati" harus menunjukkan tiang/lampu/kondisi jalan terkait, jika "Bukti penanganan" harus menunjukkan proses/hasil perbaikan), balas dengan persis kata "YES".
Jika gambar berisi foto ngasal, tidak ada hubungannya dengan "${kategori}" (seperti selfie murni, pemandangan utuh/bagus, foto layar monitor, barang/produk, dll), balas dengan persis kata "NO".
HANYA JAWAB DENGAN YES ATAU NO.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [
              { text: prompt },
              { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
          ]}
        ]
      });

      const reply = response.text.trim().toUpperCase();
      const isValid = reply.includes("YES");

      res.status(200).json({ isValid });
    } catch (error) {
      console.error("AI Photo Validation Error:", error);
      // In case of AI error, we could fallback to true to not block the user, or false.
      // Let's fallback to true but log it.
      res.status(200).json({ isValid: true });
    }
  }
};

module.exports = aiController;
