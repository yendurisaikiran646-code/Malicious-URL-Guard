"""
Main server launcher for Malicious URL Guard.
Starts Uvicorn server hosting both the FastAPI backend and the interactive dashboard.
Accessible via:
- http://localhost:8000
- http://127.0.0.1:8000
"""

import sys
import os

# Safe UTF-8 reconfiguration for Windows console
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print("[*] Starting Malicious URL Guard Server")
    print("=" * 60)
    print("Website Dashboard: http://localhost:8000")
    print("Website (Direct):  http://127.0.0.1:8000")
    print("API Documentation: http://localhost:8000/docs")
    print("Health Check:      http://localhost:8000/health")
    print("=" * 60)

    # Listen on 0.0.0.0 so both localhost and 127.0.0.1 connect seamlessly
    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
    )
