import sys
import pickle
import os
import json
import re

def preprocess_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No text provided"}))
        sys.exit(1)

    input_text = sys.argv[1]
    processed_text = preprocess_text(input_text)

    if not processed_text:
        print(json.dumps({"prioritas": "Sedang", "confidence": 0.0}))
        sys.exit(0)

    model_path = os.path.join(os.path.dirname(__file__), 'models', 'priority_model.pkl')
    
    try:
        with open(model_path, 'rb') as f:
            pipeline = pickle.load(f)
    except Exception as e:
        print(json.dumps({"error": f"Failed to load model: {str(e)}"}))
        sys.exit(1)

    try:
        # Predict
        prediction = pipeline.predict([processed_text])[0]
        # Get confidence
        probas = pipeline.predict_proba([processed_text])[0]
        confidence = float(max(probas))

        result = {
            "prioritas": prediction,
            "confidence": round(confidence, 4)
        }
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": f"Prediction failed: {str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()
