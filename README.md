# Malicious URL Guard

A complete cybersecurity platform and academic prototype combining a **Random Forest URL classifier**, a **Python FastAPI backend**, a **responsive Website Dashboard**, and a **Chromium Manifest V3 Browser Extension** for real-time lexical detection of malicious websites.

> [!WARNING]
> **Academic Prototype Notice**: This project is an experimental research prototype. Machine learning predictions are probabilistic indicators and never guarantee 100% safety. Never use this prototype as the sole protection for real users.

---

## Features

- **Pure Lexical Feature Extractor**: Analyzes 22 structural signals (length, entropy, IP host, non-standard ports, deep subdomains, Punycode, suspicious keywords) without ever fetching or resolving the target URL over the network.
- **Random Forest ML Model**: Trained and evaluated using stratified cross-validation on balanced benign and malicious datasets; exports full confusion matrix, precision, recall, and feature importances.
- **Python FastAPI Backend**: High-performance REST API with input validation, rate limiting safeguards, health monitoring, and privacy-conscious SQLite storage.
- **Responsive Web Dashboard**: 5 integrated sections (Home, URL Scanner, Dashboard, Model Information, About) available both as a standalone interactive app directly served by FastAPI and as a React/Vite/TypeScript codebase.
- **Manifest V3 Browser Extension**: Minimal-permission extension (`activeTab`, `storage`) with active tab scanning, risk gauges, and interstitial warning screens with safety overrides.

---

## System Architecture

```text
User Browsing (Chrome / Edge)
        │
        ├──> Chromium Extension (Manifest V3)  [popup.html / background.js]
        │
        └──> Website Dashboard (SPA)          [http://127.0.0.1:8000/]
                    │
                    ▼  HTTPS JSON Request: POST /predict {"url": "..."}
        Python FastAPI Backend (Port 8000)
        ├── URL Validation & Input Constraints (schemas.py)
        ├── 22-Feature Pure Lexical Extractor (feature_extraction.py) - Zero Network Calls
        ├── Random Forest Classifier (predictor.py & saved_model.joblib)
        └── Privacy Sanitizer & SQLite Storage (database.py) - Query tokens stripped
                    │
                    ▼  Prediction: benign / potentially_malicious / uncertain
        Safety Advice & Interstitial Warning Display
```

---

## Directory Structure

```text
malicious-url-guard/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI server & route handlers
│   │   ├── schemas.py               # Pydantic schemas for requests/responses
│   │   ├── feature_extraction.py    # Pure lexical URL feature extractor
│   │   ├── predictor.py             # Model inference & safety advice engine
│   │   ├── database.py              # SQLite storage with privacy sanitization
│   │   └── config.py                # Environment configuration
│   ├── ml/
│   │   ├── train_model.py           # Stratified Random Forest training pipeline
│   │   ├── evaluate_model.py        # Evaluation & confusion matrix reporter
│   │   ├── saved_model.joblib       # Serialized trained model artefact
│   │   ├── feature_names.json       # Exact feature names in order
│   │   └── model_metadata.json      # Training parameters & evaluation metrics
│   ├── tests/
│   │   ├── test_features.py         # Unit tests for lexical feature extraction
│   │   ├── test_api.py              # End-to-end FastAPI endpoint tests
│   │   └── test_model.py            # Model probability & sanity tests
│   └── requirements.txt             # Python dependencies
├── static_dashboard/                # Interactive web dashboard served by FastAPI
│   ├── index.html                   # 5-section responsive dashboard
│   ├── app.js                       # Controller, live API client, simulation
│   └── style.css                    # Dark cybersecurity aesthetic styling
├── frontend/                        # React + TypeScript + Vite project source
│   ├── src/                         # Components, pages, services
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── extension/                       # Chromium Manifest V3 Extension
│   ├── manifest.json                # V3 manifest (least-privilege permissions)
│   ├── background.js                # Service worker for API queries
│   ├── popup.html / popup.js / css  # Active tab scanner popup
│   ├── warning.html / warning.js    # Interstitial warning page
│   └── icons/                       # 16px, 48px, 128px extension icons
├── data/
│   ├── README.md                    # Dataset provenance & schema
│   └── sample_urls.csv              # Balanced benign & malicious dataset
├── docs/
│   ├── architecture.md              # Technical architecture documentation
│   └── privacy.md                   # Privacy and threat model safeguards
└── README.md
```

---

## Quick Start Guide (Windows PowerShell)

### 1. Prerequisites
Ensure **Python 3.10+** is installed on your system.
Verify by running:
```powershell
python --version
```

### 2. Install Dependencies
```powershell
python -m pip install -r backend/requirements.txt
```

### 3. (Optional) Re-train or Evaluate the Model
The repository includes pre-trained model artifacts (`saved_model.joblib`). To retrain or evaluate:
```powershell
# Train Random Forest model and regenerate metadata
python backend/ml/train_model.py

# Evaluate model metrics
python backend/ml/evaluate_model.py
```

### 4. Run the Backend & Web Dashboard
Start the FastAPI server:
```powershell
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Once started, open your browser and navigate to:
👉 **`http://127.0.0.1:8000`**

The interactive website dashboard will load immediately with live URL inspection, metrics, history, and model specifications!

Interactive API documentation (Swagger UI) is also available at:
👉 **`http://127.0.0.1:8000/docs`**

---

## Load the Browser Extension in Chrome / Edge

1. Open **Google Chrome** (or **Microsoft Edge**).
2. Navigate to `chrome://extensions` (or `edge://extensions`).
3. Toggle on **Developer mode** in the top-right corner.
4. Click **Load unpacked**.
5. Select the `extension/` directory from this project workspace.
6. The **URLGuard AI** extension icon will appear in your browser toolbar.
7. Click the extension icon on any active tab and click **⚡ Scan Active Tab** to inspect the URL against the local machine learning service!

---

## Running the Automated Test Suite

Run the full pytest suite covering lexical features, API endpoints, and model reproducibility:
```powershell
python -m pytest backend/tests/ -v
```

Expected output:
```text
backend/tests/test_api.py::test_health_endpoint PASSED
backend/tests/test_api.py::test_predict_benign_url PASSED
backend/tests/test_api.py::test_predict_malicious_ip_url PASSED
backend/tests/test_api.py::test_predict_empty_url PASSED
backend/tests/test_api.py::test_predict_overlong_url PASSED
backend/tests/test_api.py::test_metrics_endpoint PASSED
backend/tests/test_api.py::test_model_info_endpoint PASSED
backend/tests/test_api.py::test_history_and_privacy_sanitization PASSED
backend/tests/test_api.py::test_clear_history PASSED
backend/tests/test_features.py::test_feature_names_list_complete PASSED
backend/tests/test_features.py::test_standard_https_url PASSED
backend/tests/test_features.py::test_ip_address_host_detection PASSED
backend/tests/test_features.py::test_punycode_detection PASSED
backend/tests/test_features.py::test_subdomain_counting PASSED
backend/tests/test_features.py::test_shannon_entropy PASSED
backend/tests/test_features.py::test_empty_and_malformed_url PASSED
backend/tests/test_model.py::test_saved_model_file_exists PASSED
backend/tests/test_model.py::test_model_predicts_probability_bounds PASSED
======================== 18 passed in 5.70s ========================
```

---

## API Endpoints Reference

| Method | Endpoint | Description | Example Request Payload |
|---|---|---|---|
| `GET` | `/health` | Service and model status | *None* |
| `POST` | `/predict` | Classify URL using lexical features | `{"url": "https://example.com/login", "save_history": true}` |
| `GET` | `/metrics` | Accuracy, Precision, Recall, F1, Confusion Matrix | *None* |
| `GET` | `/model-info` | Algorithm, feature list, and limitations | *None* |
| `GET` | `/history` | Retrieve privacy-sanitized scan history | `?limit=50` |
| `POST` | `/history/clear` | Clear local scan logs | *None* |

### Sample `/predict` Response
```json
{
  "url": "http://192.168.1.105:8080/paypal-security/login.php",
  "verdict": "potentially_malicious",
  "malicious_probability": 0.96,
  "confidence": 96.0,
  "model_version": "rf-1.0.0",
  "features": {
    "url_length": 51,
    "is_ip_address": 1,
    "has_non_standard_port": 1,
    "suspicious_token_count": 2,
    "entropy": 4.12
  },
  "feature_highlights": [
    "Host is a direct raw IPv4 address rather than a registered domain name.",
    "URL specifies a non-standard web port (outside 80/443).",
    "Contains 2 keyword(s) frequently seen in credential harvesting lures."
  ],
  "safety_advice": [
    "Exercise extreme caution: do not enter credentials, credit cards, or personal information.",
    "Verify the domain independently by navigating directly from trusted bookmarks."
  ],
  "warnings": [
    "Academic detection prototype: Machine-learning predictions can be incorrect.",
    "Lexical features analyze URL text only; web page contents were not fetched."
  ],
  "scanned_at": "2026-11-18T11:30:00"
}
```

---

## Security & Privacy Safeguards

1. **Zero Remote Fetching**: Lexical feature extraction parses string structure only; no network connections, DNS queries, or downloads are ever made to the evaluated URL.
2. **Data Minimization**: Query strings, authentication tokens, and passwords in URLs are stripped before recording into scan history.
3. **Least Privilege Extension**: Requests only `activeTab` and `storage` permissions. Does not collect form inputs, cookies, or browsing history.
