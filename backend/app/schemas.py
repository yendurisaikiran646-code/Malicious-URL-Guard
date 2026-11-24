"""Pydantic schemas for request/response serialization and validation."""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class URLPredictionRequest(BaseModel):
    url: str = Field(
        ...,
        min_length=1,
        max_length=2048,
        description="The URL string to evaluate purely through lexical inspection.",
        examples=["https://example.com/login"],
    )
    save_history: bool = Field(
        default=True,
        description="Whether to record this scan in local privacy-conscious database.",
    )


class FeatureSummary(BaseModel):
    is_https: int
    is_ip_address: int
    has_non_standard_port: int
    num_subdomains: int
    suspicious_token_count: int
    entropy: float
    url_length: int
    hostname_length: int


class PredictionResponse(BaseModel):
    url: str
    verdict: str = Field(
        ...,
        description="Verdict: 'potentially_malicious', 'benign', or 'uncertain'",
    )
    malicious_probability: float = Field(
        ...,
        description="Estimated probability between 0.0 and 1.0 that URL matches malicious patterns.",
    )
    confidence: float = Field(
        ...,
        description="Model confidence score.",
    )
    model_version: str
    features: Dict[str, Any]
    feature_highlights: List[str]
    safety_advice: List[str]
    warnings: List[str]
    scanned_at: str


class ConfusionMatrixData(BaseModel):
    true_negative: int
    false_positive: int
    false_negative: int
    true_positive: int


class ModelMetricsResponse(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: ConfusionMatrixData
    train_samples: int
    test_samples: int
    top_features: List[Dict[str, Any]]
    dataset_notes: str


class ModelInfoResponse(BaseModel):
    model_name: str
    model_version: str
    algorithm: str
    trained_at: str
    n_estimators: int
    max_depth: int
    feature_count: int
    feature_list: List[str]
    limitations: List[str]
    academic_disclaimer: str


class ScanRecord(BaseModel):
    id: int
    sanitized_url: str
    verdict: str
    probability: float
    timestamp: str


class ScanHistoryResponse(BaseModel):
    total_scans: int
    benign_count: int
    malicious_count: int
    uncertain_count: int
    recent_scans: List[ScanRecord]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: str
