"""Configuration settings for the Malicious URL Detection backend."""

import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ML_DIR = os.path.join(BASE_DIR, "ml")

MODEL_PATH = os.path.join(ML_DIR, "saved_model.joblib")
FEATURE_NAMES_PATH = os.path.join(ML_DIR, "feature_names.json")
METADATA_PATH = os.path.join(ML_DIR, "model_metadata.json")
DB_PATH = os.path.join(BASE_DIR, "scans.db")

# Thresholds for classification
# prob >= MALICIOUS_THRESHOLD -> potentially_malicious
# prob <= BENIGN_THRESHOLD -> benign
# in between -> uncertain
MALICIOUS_THRESHOLD = 0.60
BENIGN_THRESHOLD = 0.40

# Input safety constraints
MAX_URL_LENGTH = 2048

# CORS configuration: Allow localhost, Vite dev servers, and browser extension protocols
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*",
]
