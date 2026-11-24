# System Architecture: Malicious URL Guard

## 1. Executive Summary
Malicious URL Guard is an academic cybersecurity prototype providing real-time URL classification using lexical feature extraction and a Random Forest machine learning model. The platform is accessible via an interactive web dashboard and a Chromium Manifest V3 browser extension.

## 2. High-Level Architecture Diagram

```
+-------------------------------------------------------------------------+
|                           Client Environments                           |
|                                                                         |
|  +--------------------------------+   +------------------------------+  |
|  |     Chromium Extension (MV3)   |   |      Website Dashboard       |  |
|  |  - Popup tab scanner           |   |  - Real-time scanner studio  |  |
|  |  - Background service worker   |   |  - Telemetry & metrics       |  |
|  |  - Interstitial warning page   |   |  - Model info & limitations  |  |
|  +---------------+----------------+   +--------------+---------------+  |
+------------------|-----------------------------------|------------------+
                   |                                   |
                   | REST JSON Request                 | REST JSON Request
                   +-----------------+-----------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  Python FastAPI Backend (Port 8000)                     |
|                                                                         |
|  1. Request Validation & Length Check (schemas.py)                      |
|  2. Pure Lexical Feature Extractor (feature_extraction.py)              |
|     --> 22 Structural Features (Zero Network / DNS Requests)            |
|  3. Model Inference Engine (predictor.py)                               |
|     --> Loads saved_model.joblib & metadata                             |
|     --> Calibrates probabilities into:                                  |
|         * 'benign' (prob <= 0.40)                                       |
|         * 'uncertain' (0.40 < prob < 0.60)                              |
|         * 'potentially_malicious' (prob >= 0.60)                        |
|  4. Privacy-Preserving Persistence (database.py)                        |
|     --> Strips query parameters, tokens, credentials                   |
|     --> Stores sanitized scheme://host/path in SQLite                   |
+-------------------------------------------------------------------------+
```

## 3. Subsystem Breakdown

### 3.1 Lexical Feature Extractor (`backend/app/feature_extraction.py`)
Computes 22 structural signals from the raw URL string without connecting to the target website:
- **Lengths**: Total URL length, hostname length, path length, query length.
- **Character Frequencies**: Dots, hyphens, digits, slashes, question marks, equal signs, at-signs, percent signs, underscores.
- **Protocol**: HTTPS indicator binary flag.
- **Host Patterns**: IPv4 regex detection, non-standard port indicator (e.g. `:8080`, `:8443`), deep subdomain hierarchy count, Punycode (`xn--`) internationalized domain indicator, long hostname flag (>30 chars).
- **Semantics**: Suspicious token density (`login`, `verify`, `account`, `banking`, `token`, etc.).
- **Complexity**: Shannon entropy of URL string to identify algorithmic domain generation (DGA) or token obfuscation.

### 3.2 Machine Learning Model (`backend/ml/`)
- **Algorithm**: `RandomForestClassifier` (100 estimators, max depth 12, balanced class weighting).
- **Split Strategy**: Stratified 80/20 train/test split.
- **Artifacts**: Serialized with `joblib`, canonical feature names recorded in `feature_names.json`, metrics saved in `model_metadata.json`.

### 3.3 Backend API (`backend/app/main.py`)
- `GET /health`: Service health and model status.
- `POST /predict`: Evaluates submitted URL, computes highlights, advice, and saves sanitized log.
- `GET /metrics`: Precision, recall, F1, confusion matrix.
- `GET /model-info`: Hyperparameters, feature importances, limitations.
- `GET /history`: Privacy-sanitized scan history.
- `POST /history/clear`: Clears scan logs.
- `GET /`: Serves the responsive web dashboard from `static_dashboard/`.

### 3.4 Chromium Extension (`extension/`)
- Manifest V3 compliant.
- Least-privilege permissions: `"activeTab"`, `"storage"`.
- Intercepts malicious links and renders an interstitial warning page (`warning.html`) with safety actions and prototype override.
