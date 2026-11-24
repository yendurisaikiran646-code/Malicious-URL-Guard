"""
Model Training Script for Random Forest URL Classifier.
Performs data validation, stratified splitting, model fitting, test-set evaluation,
and artefact serialization.
"""

import os
import sys
import json
from datetime import datetime
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)
import joblib

# Ensure path finds app module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.feature_extraction import extract_features_vector, FEATURE_NAMES

DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/sample_urls.csv"))
MODEL_DIR = os.path.dirname(__file__)
MODEL_SAVE_PATH = os.path.join(MODEL_DIR, "saved_model.joblib")
FEATURE_NAMES_PATH = os.path.join(MODEL_DIR, "feature_names.json")
METADATA_PATH = os.path.join(MODEL_DIR, "model_metadata.json")


def load_and_validate_data(csv_path: str) -> pd.DataFrame:
    """Load CSV dataset and validate required columns."""
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at {csv_path}")

    df = pd.read_csv(csv_path)
    if "url" not in df.columns or "label" not in df.columns:
        raise ValueError("Dataset must contain 'url' and 'label' columns.")

    # Drop duplicates and missing values
    initial_count = len(df)
    df = df.dropna(subset=["url", "label"])
    df["url"] = df["url"].astype(str).str.strip()
    df["label"] = df["label"].astype(int)
    df = df.drop_duplicates(subset=["url"])
    print(f"Loaded {len(df)} unique URLs from {initial_count} initial records.")
    print("Class distribution:\n", df["label"].value_counts().to_dict())

    return df


def extract_dataset_features(df: pd.DataFrame):
    """Compute lexical features for every URL in the dataframe."""
    print("Extracting lexical features (zero network requests)...")
    feature_matrix = []
    labels = df["label"].values

    for url in df["url"]:
        vector = extract_features_vector(url)
        feature_matrix.append(vector)

    X = np.array(feature_matrix, dtype=np.float32)
    y = np.array(labels, dtype=np.int32)
    return X, y


def train_and_evaluate():
    """Execute complete training and evaluation pipeline."""
    df = load_and_validate_data(DATA_PATH)
    X, y = extract_dataset_features(df)

    # Stratified 80/20 train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}")

    # Instantiate Random Forest Classifier
    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )

    print("Fitting Random Forest classifier...")
    rf.fit(X_train, y_train)

    # Evaluate on held-out test set
    print("Evaluating model on held-out test set...")
    y_pred = rf.predict(X_test)
    y_prob = rf.predict_proba(X_test)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    cm = confusion_matrix(y_test, y_pred).tolist()  # [[TN, FP], [FN, TP]]

    tn, fp, fn, tp = int(cm[0][0]), int(cm[0][1]), int(cm[1][0]), int(cm[1][1])

    # Feature importances
    importances = rf.feature_importances_
    ranked_features = sorted(
        zip(FEATURE_NAMES, importances.tolist()),
        key=lambda pair: pair[1],
        reverse=True,
    )

    print("\n--- Model Evaluation Results ---")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    print(f"Confusion Matrix: TN={tn}, FP={fp}, FN={fn}, TP={tp}")
    print("\nTop 5 Important Lexical Features:")
    for feat, imp in ranked_features[:5]:
        print(f"  - {feat}: {imp:.4f}")

    # Serialize trained model
    joblib.dump(rf, MODEL_SAVE_PATH)
    print(f"\nSaved model artefact to {MODEL_SAVE_PATH}")

    # Save feature names list
    with open(FEATURE_NAMES_PATH, "w", encoding="utf-8") as f:
        json.dump(FEATURE_NAMES, f, indent=2)
    print(f"Saved feature names to {FEATURE_NAMES_PATH}")

    # Save metadata
    metadata = {
        "model_name": "RandomForest_Lexical_Classifier",
        "model_version": "rf-1.0.0",
        "trained_at": datetime.now().isoformat(),
        "algorithm": "RandomForestClassifier",
        "n_estimators": 100,
        "max_depth": 12,
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "confusion_matrix": {
                "true_negative": tn,
                "false_positive": fp,
                "false_negative": fn,
                "true_positive": tp,
            },
        },
        "feature_importances": [
            {"feature": name, "importance": round(imp, 4)} for name, imp in ranked_features
        ],
        "dataset_notes": "Trained on demonstration sample dataset containing balanced benign and malicious patterns. Lexical analysis only.",
        "academic_disclaimer": "Academic detection prototype. ML prediction is not a guarantee of safety.",
    }

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved model metadata to {METADATA_PATH}")

    return rf, metadata


if __name__ == "__main__":
    train_and_evaluate()
