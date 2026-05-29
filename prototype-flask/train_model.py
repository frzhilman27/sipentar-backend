import pickle
import os
from sklearn.svm import SVC
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
import numpy as np

# Training data - Indonesian complaints
training_data = [
    # Jalan & Infrastruktur
    ("jalan rusak berlubang berbahaya", "Jalan & Infrastruktur"),
    ("aspal jalan bolong parah", "Jalan & Infrastruktur"),
    ("jembatan retak mau roboh", "Jalan & Infrastruktur"),
    ("trotoar pecah tidak aman pejalan kaki", "Jalan & Infrastruktur"),
    ("lampu jalan mati gelap malam", "Jalan & Infrastruktur"),
    ("rambu lalu lintas hilang rusak", "Jalan & Infrastruktur"),
    ("jalan tergenang air tidak ada drainase", "Jalan & Infrastruktur"),
    ("lubang besar di jalan raya", "Jalan & Infrastruktur"),
    ("akses jalan ditutup proyek tanpa pemberitahuan", "Jalan & Infrastruktur"),
    ("penerangan jalan umum tidak berfungsi", "Jalan & Infrastruktur"),

    # Sampah & Kebersihan
    ("sampah menumpuk tidak diangkut berhari hari", "Sampah & Kebersihan"),
    ("tumpukan sampah bau menyengat", "Sampah & Kebersihan"),
    ("tempat pembuangan sampah liar", "Sampah & Kebersihan"),
    ("truk sampah tidak datang seminggu", "Sampah & Kebersihan"),
    ("sampah dibakar sembarangan polusi udara", "Sampah & Kebersihan"),
    ("selokan tersumbat sampah bau busuk", "Sampah & Kebersihan"),
    ("warga buang sampah di sungai", "Sampah & Kebersihan"),
    ("container sampah penuh meluber", "Sampah & Kebersihan"),
    ("kebersihan pasar sangat kotor jorok", "Sampah & Kebersihan"),
    ("limbah rumah tangga dibuang sembarangan", "Sampah & Kebersihan"),

    # Banjir & Drainase
    ("banjir menggenangi rumah warga", "Banjir & Drainase"),
    ("air masuk ke dalam rumah saat hujan", "Banjir & Drainase"),
    ("gorong gorong tersumbat menyebabkan banjir", "Banjir & Drainase"),
    ("drainase tidak berfungsi air menggenang", "Banjir & Drainase"),
    ("pompa air rusak banjir tidak surut", "Banjir & Drainase"),
    ("saluran air mampet banjir parah", "Banjir & Drainase"),
    ("banjir rob melanda pemukiman", "Banjir & Drainase"),
    ("rumah terendam banjir butuh bantuan", "Banjir & Drainase"),
    ("tanggul bocor air meluap ke jalan", "Banjir & Drainase"),
    ("normalisasi sungai tidak dilakukan banjir terus", "Banjir & Drainase"),

    # Air & Sanitasi
    ("air PDAM tidak mengalir berhari hari", "Air & Sanitasi"),
    ("air bersih mati sudah tiga hari", "Air & Sanitasi"),
    ("air keruh kecoklatan tidak layak minum", "Air & Sanitasi"),
    ("pipa air bocor jalan tergenang", "Air & Sanitasi"),
    ("tekanan air PDAM sangat lemah", "Air & Sanitasi"),
    ("air berbau tidak enak dikonsumsi", "Air & Sanitasi"),
    ("MCK umum rusak tidak terawat", "Air & Sanitasi"),
    ("sumber air bersih tercemar limbah", "Air & Sanitasi"),
    ("tagihan air tidak sesuai pemakaian", "Air & Sanitasi"),
    ("instalasi air di fasilitas umum rusak", "Air & Sanitasi"),

    # Listrik & Utilitas
    ("listrik padam sering tanpa pemberitahuan", "Listrik & Utilitas"),
    ("pemadaman listrik bergilir sangat mengganggu", "Listrik & Utilitas"),
    ("kabel listrik menjuntai berbahaya", "Listrik & Utilitas"),
    ("tegangan listrik tidak stabil naik turun", "Listrik & Utilitas"),
    ("tiang listrik miring hampir roboh", "Listrik & Utilitas"),
    ("gardu listrik rusak penyebab padam", "Listrik & Utilitas"),
    ("listrik sering byar pet merusak elektronik", "Listrik & Utilitas"),
    ("instalasi listrik liar membahayakan warga", "Listrik & Utilitas"),

    # Taman & Ruang Publik
    ("taman kota tidak terawat rumput liar", "Taman & Ruang Publik"),
    ("fasilitas bermain anak rusak berbahaya", "Taman & Ruang Publik"),
    ("ruang terbuka hijau digunakan liar", "Taman & Ruang Publik"),
    ("bangku taman rusak tidak layak pakai", "Taman & Ruang Publik"),
    ("pohon tumbang menghalangi jalan", "Taman & Ruang Publik"),
    ("taman tidak ada lampu gelap malam hari", "Taman & Ruang Publik"),
    ("fasilitas olahraga publik rusak", "Taman & Ruang Publik"),

    # Ketertiban & Keamanan
    ("bangunan liar tidak berizin", "Ketertiban & Keamanan"),
    ("PKL mengganggu lalu lintas", "Ketertiban & Keamanan"),
    ("parkir liar memacetkan jalan", "Ketertiban & Keamanan"),
    ("kebisingan malam hari ganggu istirahat", "Ketertiban & Keamanan"),
    ("reklame ilegal bertebaran menutupi marka", "Ketertiban & Keamanan"),
    ("pengemis anak anak berkeliaran di jalan", "Ketertiban & Keamanan"),

    # Administrasi & Pelayanan
    ("pelayanan KTP lambat berbelit", "Administrasi & Pelayanan"),
    ("antrian BPJS sangat panjang tidak teratur", "Administrasi & Pelayanan"),
    ("petugas tidak ramah saat mengurus dokumen", "Administrasi & Pelayanan"),
    ("sistem pelayanan online tidak bisa diakses", "Administrasi & Pelayanan"),
    ("dokumen sertifikat tanah hilang di kantor", "Administrasi & Pelayanan"),
    ("pelayanan publik tutup tanpa pengumuman", "Administrasi & Pelayanan"),
]

texts = [d[0] for d in training_data]
labels = [d[1] for d in training_data]

pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=5000,
        sublinear_tf=True
    )),
    ('svm', SVC(
        kernel='rbf',
        C=10,
        gamma='scale',
        probability=True,
        random_state=42
    ))
])

pipeline.fit(texts, labels)

model_path = os.path.join(os.path.dirname(__file__), 'models', 'svm_model.pkl')
with open(model_path, 'wb') as f:
    pickle.dump(pipeline, f)

print("✅ Model SVM berhasil dilatih dan disimpan!")
print(f"   Kategori: {list(set(labels))}")
print(f"   Jumlah data latih: {len(texts)}")