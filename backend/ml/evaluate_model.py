"""
Model evaluation module.
Loads the serialized model and outputs a structured evaluation report.
"""

import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.feature_extraction import extract_features_vector, FEATURE_NAMES

MODEL_PATH = os.path.join(os.path.dirname(__file__), "saved_model.joblib")
DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/sample_urls.csv"))


def evaluate_saved_model(csv_path: str = DATA_PATH):
    """Evaluate saved model on a CSV dataset."""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}")

    model = joblib.load(MODEL_PATH)
    df = pd.read_csv(csv_path).dropna().drop_duplicates(subset=["url"])

    X = np.array([extract_features_vector(u) for u in df["url"]], dtype=np.float32)
    y = df["label"].values.astype(int)

    y_pred = model.predict(X)
    y_prob = model.predict_proba(X)[:, 1]

    acc = accuracy_score(y, y_pred)
    prec = precision_score(y, y_pred, zero_division=0)
    rec = recall_score(y, y_pred, zero_division=0)
    f1 = f1_score(y, y_pred, zero_division=0)
    cm = confusion_matrix(y, y_pred).tolist()

    report = {
        "sample_count": len(df),
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "confusion_matrix": {
            "true_negative": int(cm[0][0]),
            "false_positive": int(cm[0][1]),
            "false_negative": int(cm[1][0]),
            "true_positive": int(cm[1][1]),
        },
    }
    return report


if __name__ == "__main__":
    rep = evaluate_saved_model()
    print(json.dumps(rep, indent=2))
