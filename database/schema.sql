CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nik VARCHAR(16) UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    jenis_kelamin VARCHAR(20),
    no_hp VARCHAR(20),
    rt VARCHAR(10),
    rw VARCHAR(10),
    tempat_lahir VARCHAR(100),
    tanggal_lahir DATE,
    agama VARCHAR(50),
    pekerjaan VARCHAR(100),
    foto_profil VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE laporan (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    judul VARCHAR(255) NOT NULL,
    isi TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Menunggu',
    image_url VARCHAR(255),
    admin_evidence_urls JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE laporan_history (
    id SERIAL PRIMARY KEY,
    laporan_id INTEGER REFERENCES laporan(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    laporan_id INTEGER REFERENCES laporan(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
