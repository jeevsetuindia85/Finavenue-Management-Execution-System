#!/usr/bin/env python3
"""Run the Management Execution System API server."""
import os
import sys
import traceback

# Ensure backend directory is in python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Change working directory to backend/ so relative paths work
os.chdir(backend_dir)

print(f"ExecFlow starting up...")
print(f"Python: {sys.version}")
print(f"Working directory: {os.getcwd()}")
print(f"Backend directory: {backend_dir}")

try:
    import uvicorn
    from app.main import app
    print("FastAPI app imported successfully!")
except Exception as e:
    print(f"FATAL: Error importing app: {e}", file=sys.stderr)
    traceback.print_exc()
    sys.exit(1)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    is_prod = os.environ.get("RENDER") is not None or os.environ.get("PORT") is not None
    print(f"Starting server on port {port} (is_prod={is_prod})...")
    try:
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=port,
            log_level="info",
        )
    except Exception as e:
        print(f"FATAL: Error running server: {e}", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)
