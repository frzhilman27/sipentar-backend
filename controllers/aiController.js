const { GoogleGenAI } = require('@google/genai');

const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';
const VISION_MODEL = process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash';

function extractResponseText(response) {
  if (!response) return '';
  if (typeof response.text === 'string') return response.text.trim();
  if (typeof response.text === 'function') {
    try {
      return String(response.text()).trim();
    } catch (_) {
      /* fall through */
    }
  }
  const parts = response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    return parts.map((p) => p.text || '').join('').trim();
  }
  return '';
}

const aiController = {
  chat: async (req, res) => {
    try {
      const { message, userNameScript } = req.body;

      if (!message || !String(message).trim()) {
        return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY belum dikonfigurasi di server. Hubungi administrator.',
        });
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
        model: CHAT_MODEL,
        contents: String(message).trim(),
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = extractResponseText(response);
      if (!replyText) {
        console.error('AI chat: empty response', JSON.stringify(response, null, 2)?.slice(0, 500));
        return res.status(502).json({ error: 'Model AI tidak mengembalikan jawaban. Silakan coba lagi.' });
      }

      res.status(200).json({ reply: replyText });
    } catch (error) {
      console.error('AI Generate Content Error:', error?.message || error);
      const detail = error?.message || String(error);
      const isQuota = /quota|429|rate/i.test(detail);
      const isAuth = /api.?key|401|403|permission/i.test(detail);

      if (isAuth) {
        return res.status(503).json({
          error: 'Kunci API Gemini tidak valid. Periksa GEMINI_API_KEY di Vercel.',
        });
      }
      if (isQuota) {
        return res.status(503).json({
          error: 'Kuota API Gemini habis. Silakan coba beberapa saat lagi.',
        });
      }

      res.status(500).json({
        error: 'Mohon maaf, SipentarBot sedang mengalami gangguan. Silakan coba beberapa saat lagi.',
      });
    }
  },

  validatePhoto: async (req, res) => {
    try {
      const { imageBase64, kategoriLaporan } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'GEMINI_API_KEY belum dikonfigurasi.' });
      }

      if (!imageBase64) {
        return res.status(400).json({ error: 'Gambar tidak ditemukan.' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const kategori = kategoriLaporan || 'infrastruktur atau fasilitas publik';
      const prompt = `Anda adalah AI pemeriksa kelayakan foto laporan infrastruktur desa.
Periksa apakah gambar ini relevan dengan kategori laporan: "${kategori}".
Jika relevan, balas persis "YES". Jika tidak relevan (selfie, pemandangan tidak terkait, dll), balas persis "NO".
HANYA JAWAB YES ATAU NO.`;

      const response = await ai.models.generateContent({
        model: VISION_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
            ],
          },
        ],
      });

      const reply = extractResponseText(response).toUpperCase();
      const isValid = reply.includes('YES');

      res.status(200).json({ isValid });
    } catch (error) {
      console.error('AI Photo Validation Error:', error?.message || error);
      res.status(503).json({
        isValid: false,
        error: 'Validasi foto sementara tidak tersedia. Silakan coba lagi atau hubungi admin desa.',
      });
    }
  },
};

module.exports = aiController;
