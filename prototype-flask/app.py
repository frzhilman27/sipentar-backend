from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
import sqlite3
import os
import pickle
import re
import json
import pandas as pd
from datetime import datetime
from werkzeug.utils import secure_filename
from functools import wraps

app = Flask(__name__)
app.secret_key = 'lapor_warga_smart_city_2024'
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
DB_PATH = 'database.db'

# ─── Load SVM Model ────────────────────────────────────────────
svm_model = None
try:
    model_path = os.path.join('models', 'svm_model.pkl')
    with open(model_path, 'rb') as f:
        svm_model = pickle.load(f)
    print("✅ Model SVM berhasil dimuat")
except Exception as e:
    print(f"⚠️  Model SVM tidak tersedia: {e} — fallback ke 'Umum'")

# ─── Database ──────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.executescript('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS laporan (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                username TEXT NOT NULL,
                keluhan TEXT NOT NULL,
                kategori TEXT DEFAULT 'Umum',
                prioritas TEXT DEFAULT 'Sedang',
                status TEXT DEFAULT 'Menunggu',
                foto TEXT,
                lokasi TEXT,
                latitude REAL,
                longitude REAL,
                confidence REAL DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        ''')
        # Seed admin
        existing = conn.execute("SELECT id FROM users WHERE username='admin'").fetchone()
        if not existing:
            conn.execute(
                "INSERT INTO users (username, password, role) VALUES (?,?,?)",
                ('admin', 'admin123', 'admin')
            )
        conn.commit()
    print("✅ Database siap")

init_db()

# ─── Helpers ───────────────────────────────────────────────────
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    stopwords = {'yang', 'di', 'ke', 'dari', 'dan', 'atau', 'ini', 'itu',
                 'ada', 'dengan', 'untuk', 'pada', 'tidak', 'sudah', 'saya',
                 'kami', 'kita', 'mereka', 'adalah', 'juga', 'lebih', 'sangat',
                 'bisa', 'akan', 'sudah', 'telah', 'harus', 'masih', 'nya'}
    words = [w for w in text.split() if w not in stopwords and len(w) > 2]
    return ' '.join(words)

PRIORITAS_KEYWORDS = {
    'Tinggi': ['rusak parah', 'sangat rusak', 'berbahaya', 'darurat', 'urgent',
               'banjir', 'kecelakaan', 'roboh', 'mau roboh', 'darurat', 'parah',
               'listrik mati', 'air tidak ada', 'terendam', 'longsor'],
    'Rendah': ['kecil', 'ringan', 'sedikit', 'kurang', 'perlu perbaikan kecil',
               'bisa ditunda', 'estetika', 'kurang nyaman']
}

def determine_prioritas(text):
    text_lower = text.lower()
    for kw in PRIORITAS_KEYWORDS['Tinggi']:
        if kw in text_lower:
            return 'Tinggi'
    for kw in PRIORITAS_KEYWORDS['Rendah']:
        if kw in text_lower:
            return 'Rendah'
    return 'Sedang'

def classify_complaint(text):
    processed = preprocess_text(text)
    if svm_model:
        try:
            prediction = svm_model.predict([processed])[0]
            probas = svm_model.predict_proba([processed])[0]
            confidence = float(max(probas))
            return prediction, confidence
        except Exception as e:
            print(f"Predict error: {e}")
    return 'Umum', 0.0

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            flash('Silakan login terlebih dahulu.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        if session.get('role') != 'admin':
            flash('Akses ditolak. Hanya admin yang dapat mengakses halaman ini.', 'error')
            return redirect(url_for('lapor'))
        return f(*args, **kwargs)
    return decorated

# ─── Routes ────────────────────────────────────────────────────
@app.route('/')
def index():
    with get_db() as conn:
        total = conn.execute("SELECT COUNT(*) as c FROM laporan").fetchone()['c']
        selesai = conn.execute("SELECT COUNT(*) as c FROM laporan WHERE status='Selesai'").fetchone()['c']
        users = conn.execute("SELECT COUNT(*) as c FROM users WHERE role='user'").fetchone()['c']
    return render_template('index.html', total=total, selesai=selesai, users=users)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('dashboard') if session.get('role') == 'admin' else url_for('lapor'))
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        with get_db() as conn:
            user = conn.execute(
                "SELECT * FROM users WHERE username=? AND password=?",
                (username, password)
            ).fetchone()
        if user:
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']
            if user['role'] == 'admin':
                return redirect(url_for('dashboard'))
            return redirect(url_for('lapor'))
        flash('Username atau password salah.', 'error')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        confirm = request.form.get('confirm_password', '').strip()
        if not username or not password:
            flash('Username dan password wajib diisi.', 'error')
        elif password != confirm:
            flash('Password tidak cocok.', 'error')
        elif len(password) < 6:
            flash('Password minimal 6 karakter.', 'error')
        else:
            try:
                with get_db() as conn:
                    conn.execute(
                        "INSERT INTO users (username, password, role) VALUES (?,?,?)",
                        (username, password, 'user')
                    )
                    conn.commit()
                flash('Registrasi berhasil! Silakan login.', 'success')
                return redirect(url_for('login'))
            except sqlite3.IntegrityError:
                flash('Username sudah digunakan. Pilih username lain.', 'error')
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/lapor', methods=['GET', 'POST'])
@login_required
def lapor():
    if request.method == 'POST':
        keluhan = request.form.get('keluhan', '').strip()
        lokasi = request.form.get('lokasi', '').strip()
        latitude = request.form.get('latitude', '')
        longitude = request.form.get('longitude', '')

        if not keluhan or len(keluhan) < 10:
            flash('Keluhan minimal 10 karakter.', 'error')
            return render_template('lapor.html')

        foto_filename = None
        if 'foto' in request.files:
            foto = request.files['foto']
            if foto and foto.filename and allowed_file(foto.filename):
                filename = secure_filename(foto.filename)
                ts = datetime.now().strftime('%Y%m%d%H%M%S')
                foto_filename = f"{ts}_{filename}"
                os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
                foto.save(os.path.join(app.config['UPLOAD_FOLDER'], foto_filename))

        kategori, confidence = classify_complaint(keluhan)
        prioritas = determine_prioritas(keluhan)

        try:
            lat = float(latitude) if latitude else None
            lng = float(longitude) if longitude else None
        except ValueError:
            lat = lng = None

        with get_db() as conn:
            conn.execute(
                '''INSERT INTO laporan
                   (user_id, username, keluhan, kategori, prioritas, foto, lokasi, latitude, longitude, confidence)
                   VALUES (?,?,?,?,?,?,?,?,?,?)''',
                (session['user_id'], session['username'], keluhan, kategori,
                 prioritas, foto_filename, lokasi, lat, lng, confidence)
            )
            conn.commit()

        flash(f'Laporan berhasil dikirim! Diklasifikasikan sebagai: <strong>{kategori}</strong>', 'success')
        return redirect(url_for('riwayat'))

    return render_template('lapor.html')

@app.route('/riwayat')
@login_required
def riwayat():
    with get_db() as conn:
        if session.get('role') == 'admin':
            rows = conn.execute("SELECT * FROM laporan ORDER BY created_at DESC").fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM laporan WHERE user_id=? ORDER BY created_at DESC",
                (session['user_id'],)
            ).fetchall()
    return render_template('riwayat.html', laporan=rows)

@app.route('/dashboard')
@admin_required
def dashboard():
    with get_db() as conn:
        laporan = conn.execute("SELECT * FROM laporan ORDER BY created_at DESC").fetchall()
        total = len(laporan)
        menunggu = sum(1 for l in laporan if l['status'] == 'Menunggu')
        diproses = sum(1 for l in laporan if l['status'] == 'Diproses')
        selesai = sum(1 for l in laporan if l['status'] == 'Selesai')
        tinggi = sum(1 for l in laporan if l['prioritas'] == 'Tinggi')
    return render_template('dashboard.html',
                           laporan=laporan, total=total,
                           menunggu=menunggu, diproses=diproses,
                           selesai=selesai, tinggi=tinggi)

@app.route('/analytics')
@admin_required
def analytics():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM laporan").fetchall()

    if not rows:
        return render_template('analytics.html',
                               chart_kategori=json.dumps([]),
                               chart_tren=json.dumps([]),
                               chart_prioritas=json.dumps([]),
                               chart_status=json.dumps([]),
                               total=0, avg_per_bulan=0)

    df = pd.DataFrame([dict(r) for r in rows])
    df['created_at'] = pd.to_datetime(df['created_at'])

    # Bar chart: distribusi kategori
    kat_counts = df['kategori'].value_counts().reset_index()
    kat_counts.columns = ['kategori', 'jumlah']
    chart_kategori = json.dumps({
        'labels': kat_counts['kategori'].tolist(),
        'data': kat_counts['jumlah'].tolist()
    })

    # Line chart: tren per bulan
    df['bulan'] = df['created_at'].dt.to_period('M').astype(str)
    tren = df.groupby('bulan').size().reset_index(name='jumlah')
    chart_tren = json.dumps({
        'labels': tren['bulan'].tolist(),
        'data': tren['jumlah'].tolist()
    })

    # Doughnut: prioritas
    pri_counts = df['prioritas'].value_counts()
    chart_prioritas = json.dumps({
        'labels': pri_counts.index.tolist(),
        'data': pri_counts.values.tolist()
    })

    # Doughnut: status
    stat_counts = df['status'].value_counts()
    chart_status = json.dumps({
        'labels': stat_counts.index.tolist(),
        'data': stat_counts.values.tolist()
    })

    total = len(df)
    avg_per_bulan = round(total / max(df['bulan'].nunique(), 1), 1)

    return render_template('analytics.html',
                           chart_kategori=chart_kategori,
                           chart_tren=chart_tren,
                           chart_prioritas=chart_prioritas,
                           chart_status=chart_status,
                           total=total,
                           avg_per_bulan=avg_per_bulan)

@app.route('/update_status/<int:laporan_id>', methods=['POST'])
@admin_required
def update_status(laporan_id):
    new_status = request.form.get('status')
    if new_status in ['Menunggu', 'Diproses', 'Selesai']:
        with get_db() as conn:
            conn.execute(
                "UPDATE laporan SET status=?, updated_at=? WHERE id=?",
                (new_status, datetime.now(), laporan_id)
            )
            conn.commit()
    return redirect(url_for('dashboard'))

@app.route('/api/classify', methods=['POST'])
def api_classify():
    data = request.get_json()
    text = data.get('text', '')
    if not text:
        return jsonify({'error': 'No text'}), 400
    kategori, confidence = classify_complaint(text)
    prioritas = determine_prioritas(text)
    return jsonify({'kategori': kategori, 'confidence': round(confidence * 100, 1), 'prioritas': prioritas})

@app.route('/api/seed_demo')
def seed_demo():
    """Endpoint untuk mengisi data demo"""
    demo_data = [
        ("Jalan di depan pasar rusak parah berlubang besar sangat berbahaya", "Jalan & Infrastruktur", "Tinggi"),
        ("Sampah tidak diangkut sudah seminggu menumpuk bau sekali", "Sampah & Kebersihan", "Sedang"),
        ("Banjir menggenangi rumah warga RT 5 air masuk ke dalam rumah", "Banjir & Drainase", "Tinggi"),
        ("Lampu jalan mati sudah 3 malam gelap berbahaya", "Jalan & Infrastruktur", "Sedang"),
        ("Air PDAM tidak mengalir sudah 2 hari warga kesulitan", "Air & Sanitasi", "Tinggi"),
        ("Taman bermain anak rusak berbahaya perlu diperbaiki", "Taman & Ruang Publik", "Sedang"),
        ("Listrik sering padam tanpa pemberitahuan mengganggu aktivitas", "Listrik & Utilitas", "Sedang"),
        ("Pelayanan KTP sangat lambat antrian panjang tidak teratur", "Administrasi & Pelayanan", "Rendah"),
        ("PKL mengganggu lalu lintas di depan sekolah berbahaya", "Ketertiban & Keamanan", "Sedang"),
        ("Gorong gorong tersumbat sampah menyebabkan banjir setiap hujan", "Banjir & Drainase", "Tinggi"),
    ]
    with get_db() as conn:
        for keluhan, kategori, prioritas in demo_data:
            conn.execute(
                "INSERT INTO laporan (user_id, username, keluhan, kategori, prioritas, lokasi) VALUES (?,?,?,?,?,?)",
                (1, 'admin', keluhan, kategori, prioritas, 'Kota Tangerang Selatan')
            )
        conn.commit()
    return jsonify({'message': f'{len(demo_data)} data demo berhasil ditambahkan'})

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(debug=True, port=5000)