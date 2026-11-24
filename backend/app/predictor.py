"""
Predictor service for URL classification.
Loads Random Forest model and metadata, calculates risk probabilities and safety advice.
"""

import os
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
import numpy as np
import joblib

from .config import (
    MODEL_PATH,
    METADATA_PATH,
    FEATURE_NAMES_PATH,
    MALICIOUS_THRESHOLD,
    BENIGN_THRESHOLD,
)
from .feature_extraction import (
    extract_features,
    extract_features_vector,
    FEATURE_NAMES,
)


class URLPredictor:
    def __init__(self):
        self.model = None
        self.metadata = {}
        self.feature_names = FEATURE_NAMES
        self.is_loaded = False
        self.load_model()

    def load_model(self):
        """Load trained Random Forest model and metadata if available."""
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                self.is_loaded = True
            except Exception as e:
                print(f"Error loading model from {MODEL_PATH}: {e}")
                self.is_loaded = False

        if os.path.exists(METADATA_PATH):
            try:
                with open(METADATA_PATH, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
            except Exception as e:
                print(f"Error loading metadata from {METADATA_PATH}: {e}")

        if os.path.exists(FEATURE_NAMES_PATH):
            try:
                with open(FEATURE_NAMES_PATH, "r", encoding="utf-8") as f:
                    self.feature_names = json.load(f)
            except Exception:
                self.feature_names = FEATURE_NAMES

    def generate_highlights(self, features: Dict[str, Any]) -> List[str]:
        """Highlight notable lexical risk indicators."""
        highlights = []
        if features.get("is_ip_address") == 1:
            highlights.append("Host is a direct raw IPv4 address rather than a registered domain name.")
        if features.get("has_non_standard_port") == 1:
            highlights.append("URL specifies a non-standard web port (outside 80/443).")
        if features.get("is_punycode") == 1:
            highlights.append("Host uses Internationalized Domain Name (Punycode 'xn--') which can facilitate visual spoofing.")
        if features.get("suspicious_token_count", 0) > 0:
            count = features["suspicious_token_count"]
            highlights.append(f"Contains {count} keyword(s) frequently seen in credential harvesting lures.")
        if features.get("num_subdomains", 0) >= 3:
            highlights.append(f"Deep subdomain hierarchy ({features['num_subdomains']} subdomains) detected.")
        if features.get("is_https") == 0:
            highlights.append("Unencrypted HTTP protocol in use.")
        if features.get("is_long_hostname") == 1:
            highlights.append(f"Unusually long hostname ({features.get('hostname_length')} characters).")
        if features.get("entropy", 0.0) >= 4.2:
            highlights.append("High Shannon character entropy (potential algorithmic domain generation or obfuscated token).")

        if not highlights:
            highlights.append("Standard domain structure with no prominent lexical anomaly flags detected.")
        return highlights

    def generate_safety_advice(self, verdict: str, probability: float) -> List[str]:
        """Produce actionable recommendations for the user."""
        if verdict == "potentially_malicious":
            return [
                "Exercise extreme caution: do not enter credentials, credit cards, or personal information.",
                "Verify the domain independently by navigating directly from trusted bookmarks or official search results.",
                "Check for spelling variations (typosquatting) in the address bar.",
                "Close the browser tab if you were directed here via unsolicited email, SMS, or direct message.",
            ]
        elif verdict == "uncertain":
            return [
                "The lexical model returned an ambiguous score; confidence is moderate.",
                "Carefully inspect the top-level domain and SSL certificate before proceeding.",
                "Ensure you recognize the service and expected to visit this link.",
            ]
        else:
            return [
                "No prominent malicious lexical indicators were flagged by the model.",
                "Remember: A benign score is never a 100% guarantee that a website is safe.",
                "Always look for valid HTTPS encryption and verify the legitimate brand name.",
            ]

    def predict(self, raw_url: str) -> Dict[str, Any]:
        """Perform lexical evaluation and classification on a given URL."""
        if not self.is_loaded or self.model is None:
            # Fallback heuristic if model file not yet loaded
            features = extract_features(raw_url)
            prob = 0.5
            verdict = "uncertain"
        else:
            features = extract_features(raw_url)
            vector = [float(features[name]) for name in self.feature_names]
            X = np.array([vector], dtype=np.float32)

            probs = self.model.predict_proba(X)[0]
            prob = float(probs[1]) if len(probs) > 1 else 0.0

            if prob >= MALICIOUS_THRESHOLD:
                verdict = "potentially_malicious"
            elif prob <= BENIGN_THRESHOLD:
                verdict = "benign"
            else:
                verdict = "uncertain"

        # Calculate confidence metric
        confidence = round(max(prob, 1.0 - prob) * 100, 1)
        prob_rounded = round(prob, 4)

        highlights = self.generate_highlights(features)
        advice = self.generate_safety_advice(verdict, prob_rounded)
        warnings = [
            "Academic detection prototype: Machine-learning predictions can be incorrect.",
            "Never use this prototype as the sole protection for real-world security.",
            "Lexical features analyze URL text only; web page contents were not fetched.",
        ]

        return {
            "url": raw_url,
            "verdict": verdict,
            "malicious_probability": prob_rounded,
            "confidence": confidence,
            "model_version": self.metadata.get("model_version", "rf-1.0.0"),
            "features": features,
            "feature_highlights": highlights,
            "safety_advice": advice,
            "warnings": warnings,
            "scanned_at": datetime.now().isoformat(),
        }

    def get_metrics(self) -> Dict[str, Any]:
        """Return model training metrics from metadata."""
        metrics = self.metadata.get("metrics", {})
        cm = metrics.get("confusion_matrix", {"true_negative": 0, "false_positive": 0, "false_negative": 0, "true_positive": 0})
        return {
            "accuracy": metrics.get("accuracy", 0.0),
            "precision": metrics.get("precision", 0.0),
            "recall": metrics.get("recall", 0.0),
            "f1_score": metrics.get("f1_score", 0.0),
            "confusion_matrix": cm,
            "train_samples": self.metadata.get("train_samples", 0),
            "test_samples": self.metadata.get("test_samples", 0),
            "top_features": self.metadata.get("feature_importances", [])[:10],
            "dataset_notes": self.metadata.get("dataset_notes", "Demonstration dataset"),
        }

    def get_info(self) -> Dict[str, Any]:
        """Return model metadata and configuration details."""
        return {
            "model_name": self.metadata.get("model_name", "RandomForest_Lexical_Classifier"),
            "model_version": self.metadata.get("model_version", "rf-1.0.0"),
            "algorithm": self.metadata.get("algorithm", "RandomForestClassifier"),
            "trained_at": self.metadata.get("trained_at", "N/A"),
            "n_estimators": self.metadata.get("n_estimators", 100),
            "max_depth": self.metadata.get("max_depth", 12),
            "feature_count": len(self.feature_names),
            "feature_list": self.feature_names,
            "limitations": [
                "Does not inspect page DOM, JavaScript, or downloads.",
                "Cannot identify compromised legitimate domains serving malicious content.",
                "Heuristic lexical patterns can generate false positives on complex URL structures.",
                "Adversarial evasion via URL shorteners or benign redirects cannot be resolved without network tracing.",
            ],
            "academic_disclaimer": "Academic research disclaimer: Machine learning prediction is not a guarantee of safety. This prototype is for educational and experimental analysis only.",
        }


# Singleton predictor instance
predictor = URLPredictor()
