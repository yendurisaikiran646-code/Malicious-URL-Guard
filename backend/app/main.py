"""
FastAPI Backend Application for Malicious URL Detection.
Exposes RESTful endpoints for health checks, model inference, metrics, and scan history.
Mounts responsive interactive dashboard for seamless web access.
"""

import os
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from .config import CORS_ORIGINS, MAX_URL_LENGTH
from .schemas import (
    URLPredictionRequest,
    PredictionResponse,
    ModelMetricsResponse,
    ModelInfoResponse,
    ScanHistoryResponse,
    HealthResponse,
)
from .predictor import predictor
from .database import init_db, record_scan, get_history, clear_all_history

# Initialize database schema on startup
init_db()

app = FastAPI(
    title="Malicious URL Detection Service",
    description="Academic prototype combining pure lexical feature extraction and Random Forest classification.",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Service health and model readiness check."""
    return HealthResponse(
        status="healthy",
        model_loaded=predictor.is_loaded,
        model_version=predictor.metadata.get("model_version", "rf-1.0.0"),
    )


@app.post("/predict", response_model=PredictionResponse, tags=["Inference"])
async def predict_url(req: URLPredictionRequest):
    """
    Classify a URL using lexical features without network requests.
    Stores privacy-sanitized scan record if save_history is True.
    """
    url = req.url.strip()
    if not url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL parameter cannot be empty.",
        )
    if len(url) > MAX_URL_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"URL exceeds maximum allowed length of {MAX_URL_LENGTH} characters.",
        )

    # Perform inference
    result = predictor.predict(url)

    # Save to privacy-sanitized database if requested
    if req.save_history:
        try:
            record_scan(url, result["verdict"], result["malicious_probability"])
        except Exception as e:
            # History recording error shouldn't fail prediction response
            print(f"Warning: Failed to save scan history: {e}")

    return PredictionResponse(**result)


@app.get("/metrics", response_model=ModelMetricsResponse, tags=["Model"])
async def get_model_metrics():
    """Retrieve held-out test set evaluation metrics and confusion matrix."""
    return ModelMetricsResponse(**predictor.get_metrics())


@app.get("/model-info", response_model=ModelInfoResponse, tags=["Model"])
async def get_model_info():
    """Retrieve model training provenance, feature catalog, and limitations."""
    return ModelInfoResponse(**predictor.get_info())


@app.get("/history", response_model=ScanHistoryResponse, tags=["History"])
async def get_scan_history(limit: int = 50):
    """Retrieve privacy-conscious local scan logs (query tokens redacted)."""
    return ScanHistoryResponse(**get_history(limit=limit))


@app.post("/history/clear", tags=["History"])
async def clear_scan_history():
    """Clear all recorded scan history from local database."""
    clear_all_history()
    return {"status": "success", "message": "Scan history cleared."}


# Mount static interactive dashboard if directory exists
STATIC_DASHBOARD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../static_dashboard")
)

if os.path.isdir(STATIC_DASHBOARD_DIR):
    app.mount(
        "/static",
        StaticFiles(directory=STATIC_DASHBOARD_DIR),
        name="static",
    )

    @app.get("/", include_in_schema=False)
    @app.get("/index.html", include_in_schema=False)
    async def serve_index():
        index_file = os.path.join(STATIC_DASHBOARD_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return JSONResponse({"message": "Static dashboard index not found."})
