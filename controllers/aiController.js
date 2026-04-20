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
        model: 'gemini-2.5-flash',
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
      res.status(500).json({ error: "Mohon maaf, SipentarBot sedang mengalami gangguan atau sibuk. Silakan coba beberapa saat lagi." });
    }
  }
};

module.exports = aiController;
