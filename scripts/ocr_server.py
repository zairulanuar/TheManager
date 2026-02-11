import sys
import uvicorn
import json
import logging
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import contextlib

# Ensure 'scripts' directory is in sys.path so internal imports in ocr_service work
# (e.g. 'from extractor import ...')
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

try:
    from ocr_service import process_document, get_ocr_engine, log_time
except ImportError:
    # Fallback if somehow path setup failed, though above append should fix it
    from scripts.ocr_service import process_document, get_ocr_engine, log_time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ocr_server")

# Global engine variable
ocr_engine = None

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the model
    global ocr_engine
    
    # Check if we are using Cloud OCR
    # If HF_API_URL is set in environment (loaded from .env by python-dotenv usually, 
    # but here we rely on os.environ. We might need to load .env explicitly if not done)
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
    
    if os.environ.get("HF_API_URL"):
        logger.info("Cloud OCR detected. Skipping local PaddleOCR initialization to save RAM.")
        ocr_engine = None
    else:
        logger.info("Loading PaddleOCR engine (Local Mode)...")
        try:
            ocr_engine = get_ocr_engine()
            logger.info("PaddleOCR engine loaded and ready.")
        except Exception as e:
            logger.error(f"Failed to load OCR engine: {e}")
            
    yield
    # Shutdown
    logger.info("Shutting down OCR server...")

app = FastAPI(lifespan=lifespan)

class OCRRequest(BaseModel):
    image_path: str

@app.get("/")
def read_root():
    return {"status": "running", "service": "OCR Service"}

@app.post("/process")
def process_image(request: OCRRequest):
    if not request.image_path:
        raise HTTPException(status_code=400, detail="Image path is required")
        
    logger.info(f"Processing request for: {request.image_path}")
    
    # Use the pre-loaded engine
    # Note: process_document captures stdout/stderr logic inside? 
    # No, it returns a dict. log_time writes to stderr.
    result = process_document(request.image_path, ocr_engine=ocr_engine)
    
    if "error" in result:
        pass
        
    return result

if __name__ == "__main__":
    # Run on localhost:8000
    uvicorn.run(app, host="127.0.0.1", port=8000)
