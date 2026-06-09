import pickle
import os
import pandas as pd
from sklearn.svm import SVC
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import re

# 1. Define Priority Keywords (Heuristic labeling based on real data)
PRIORITAS_KEYWORDS = {
    'Tinggi': [
        'rusak parah', 'sangat rusak', 'berbahaya', 'darurat', 'urgent',
        'banjir', 'kecelakaan', 'roboh', 'mau roboh', 'kritis', 'parah',
        'listrik mati', 'air tidak mengalir', 'terendam', 'longsor', 'ancaman',
        'nyawa', 'bocor', 'mati total', 'kriminal', 'pencurian', 'begal'
    ],
    'Rendah': [
        'kecil', 'ringan', 'sedikit', 'kurang', 'perlu perbaikan kecil',
        'bisa ditunda', 'estetika', 'kurang nyaman', 'pertanyaan', 'informasi',
        'saran', 'masukan'
    ]
}

def determine_prioritas(text):
    if not isinstance(text, str):
        return 'Sedang'
    text_lower = text.lower()
    for kw in PRIORITAS_KEYWORDS['Tinggi']:
        if kw in text_lower:
            return 'Tinggi'
    for kw in PRIORITAS_KEYWORDS['Rendah']:
        if kw in text_lower:
            return 'Rendah'
    return 'Sedang'

def preprocess_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def main():
    # 2. Load the dataset
    excel_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'sipentar-admin', 'new-augmented_keluhan_masyarakat (1).xlsx')
    print(f"Membaca dataset dari: {excel_path}")
    
    try:
        df = pd.read_excel(excel_path)
    except Exception as e:
        print(f"Gagal membaca Excel: {e}")
        return

    # Combine text columns to get richer features
    df['combined_text'] = df['Keluhan'].fillna('') + ' ' + df['Topik Keluhan'].fillna('')
    
    # 3. Label the dataset automatically
    df['Prioritas'] = df['combined_text'].apply(determine_prioritas)
    
    print("Distribusi Prioritas setelah otomatisasi pelabelan:")
    print(df['Prioritas'].value_counts())

    # 4. Preprocess text
    df['processed_text'] = df['combined_text'].apply(preprocess_text)
    
    texts = df['processed_text'].tolist()
    labels = df['Prioritas'].tolist()

    # Split for evaluation
    X_train, X_test, y_train, y_test = train_test_split(texts, labels, test_size=0.2, random_state=42)

    # 5. Build and train Pipeline
    print("\nMemulai training model SVM...")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=5000,
            sublinear_tf=True
        )),
        ('svm', SVC(
            kernel='linear', # Linear kernel often works best for text classification
            C=1.0,
            probability=True,
            random_state=42,
            class_weight='balanced'
        ))
    ])

    pipeline.fit(X_train, y_train)

    # Evaluate
    print("\nEvaluasi Model:")
    y_pred = pipeline.predict(X_test)
    print(classification_report(y_test, y_pred, zero_division=0))

    # 6. Save the model
    model_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, 'priority_model.pkl')
    
    with open(model_path, 'wb') as f:
        pickle.dump(pipeline, f)

    print(f"\nModel SVM untuk Prioritas berhasil dilatih dan disimpan di: {model_path}")

if __name__ == "__main__":
    main()
