import pytest
import os
import sys
import joblib
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.config import MODEL_PATH
from app.feature_extraction import extract_features_vector, FEATURE_NAMES


def test_saved_model_file_exists():
    """Verify saved_model.joblib exists and is loadable."""
    assert os.path.exists(MODEL_PATH), "Model file saved_model.joblib does not exist."
    model = joblib.load(MODEL_PATH)
    assert hasattr(model, "predict_proba")
    assert hasattr(model, "n_features_in_")
    assert model.n_features_in_ == len(FEATURE_NAMES)


def test_model_predicts_probability_bounds():
    """Verify model outputs valid probabilities between 0 and 1."""
    model = joblib.load(MODEL_PATH)
    sample_urls = [
        "https://www.google.com",
        "http://192.168.1.55:8080/bank/login.php",
        "https://github.com",
    ]
    for url in sample_urls:
        vec = extract_features_vector(url)
        X = np.array([vec], dtype=np.float32)
        probs = model.predict_proba(X)[0]
        assert len(probs) == 2
        assert 0.0 <= probs[0] <= 1.0
        assert 0.0 <= probs[1] <= 1.0
        assert np.isclose(probs[0] + probs[1], 1.0)
