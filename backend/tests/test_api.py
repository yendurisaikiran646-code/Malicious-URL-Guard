import pytest
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify health endpoint reports healthy and model status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert "model_version" in data


def test_predict_benign_url():
    """Test prediction for standard benign website."""
    payload = {"url": "https://www.wikipedia.org/wiki/Computer_science", "save_history": True}
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] in ["benign", "uncertain", "potentially_malicious"]
    assert "malicious_probability" in data
    assert 0.0 <= data["malicious_probability"] <= 1.0
    assert "safety_advice" in data
    assert len(data["safety_advice"]) > 0
    assert "warnings" in data
    assert "features" in data


def test_predict_malicious_ip_url():
    """Test prediction for suspicious IP-based phishing URL."""
    payload = {
        "url": "http://192.168.1.105:8080/paypal-security/login.php?token=secret123",
        "save_history": True,
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "potentially_malicious"
    assert data["malicious_probability"] >= 0.60
    assert any("IPv4" in h for h in data["feature_highlights"])


def test_predict_empty_url():
    """Verify empty URL triggers 400 or 422 validation error."""
    response = client.post("/predict", json={"url": ""})
    assert response.status_code in [400, 422]


def test_predict_overlong_url():
    """Verify overlong URL is rejected."""
    long_url = "https://example.com/" + ("a" * 2500)
    response = client.post("/predict", json={"url": long_url})
    assert response.status_code in [413, 422]


def test_metrics_endpoint():
    """Verify metrics endpoint returns evaluation results."""
    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "accuracy" in data
    assert "precision" in data
    assert "recall" in data
    assert "f1_score" in data
    assert "confusion_matrix" in data
    cm = data["confusion_matrix"]
    assert "true_negative" in cm
    assert "true_positive" in cm


def test_model_info_endpoint():
    """Verify model-info endpoint returns descriptive metadata and limitations."""
    response = client.get("/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm"] == "RandomForestClassifier"
    assert len(data["feature_list"]) > 0
    assert len(data["limitations"]) > 0
    assert "disclaimer" in data["academic_disclaimer"].lower() or "academic" in data["academic_disclaimer"].lower()


def test_history_and_privacy_sanitization():
    """Verify scan history is recorded and query strings are stripped for privacy."""
    # Send URL with sensitive query token
    secret_url = "https://example.com/checkout?token=super_secret_user_token_12345"
    client.post("/predict", json={"url": secret_url, "save_history": True})

    response = client.get("/history")
    assert response.status_code == 200
    data = response.json()
    assert data["total_scans"] >= 1

    # Ensure secret token is NOT in any sanitized URL
    for record in data["recent_scans"]:
        assert "super_secret_user_token_12345" not in record["sanitized_url"]
        assert "?" not in record["sanitized_url"]


def test_clear_history():
    """Verify history can be cleared."""
    response = client.post("/history/clear")
    assert response.status_code == 200

    hist_response = client.get("/history")
    assert hist_response.status_code == 200
    assert hist_response.json()["total_scans"] == 0
