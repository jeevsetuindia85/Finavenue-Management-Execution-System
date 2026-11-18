#!/usr/bin/env python3
"""Run the Management Execution System API server."""
import os
import sys

# Ensure backend directory is in python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Change working directory to backend/ so relative paths work
os.chdir(backend_dir)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    # In production cloud environments, disable reload
    is_prod = os.environ.get("RENDER") is not None or os.environ.get("PORT") is not None
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=not is_prod,
        log_level="info",
    )
