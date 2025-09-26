"""
Simple test script to check if we can run the FastAPI server
"""
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import uvicorn
    print("✓ uvicorn imported successfully")
except ImportError as e:
    print(f"✗ Failed to import uvicorn: {e}")
    sys.exit(1)

try:
    from app.main import app
    print("✓ FastAPI app imported successfully")
except ImportError as e:
    print(f"✗ Failed to import app: {e}")
    sys.exit(1)

if __name__ == "__main__":
    print("Starting Network Simulator Backend...")
    print("API Documentation: http://localhost:8000/docs")
    print("WebSocket: ws://localhost:8000/ws/{session_id}")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )