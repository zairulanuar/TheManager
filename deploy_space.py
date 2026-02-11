import os
from huggingface_hub import HfApi, create_repo

# Load .env manually
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, value = line.split("=", 1)
                os.environ[key.strip()] = value.strip().strip('"').strip("'")

# Configuration
HF_TOKEN = os.getenv("HF_TOKEN")
if not HF_TOKEN:
    raise ValueError("HF_TOKEN environment variable is not set")
    
SPACE_NAME = "bitnet-b158-api"
USERNAME = "zairulanuar-ocr" # Assuming based on HF_API_URL
REPO_ID = f"{USERNAME}/{SPACE_NAME}"

api = HfApi(token=HF_TOKEN)
user_info = api.whoami()
USERNAME = user_info["name"]
REPO_ID = f"{USERNAME}/{SPACE_NAME}"
print(f"Deploying to {REPO_ID}...")

# 1. Create the Space (Docker SDK)
try:
    create_repo(
        repo_id=REPO_ID,
        repo_type="space",
        space_sdk="docker",
        token=HF_TOKEN,
        exist_ok=True
    )
    print(f"Space {REPO_ID} created/verified.")
except Exception as e:
    print(f"Error creating space: {e}")

# 2. Define files content

# Dockerfile: Builds BitNet and sets up the server
dockerfile_content = """
FROM python:3.9-slim

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    git \
    cmake \
    clang \
    wget \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Clone BitNet
RUN git clone --recursive https://github.com/microsoft/BitNet.git

# Install BitNet dependencies FIRST
WORKDIR /app/BitNet
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install huggingface_hub cmake

# Build bitnet.cpp using setup_env.py
# Manual download to avoid setup_env.py argument restrictions
RUN huggingface-cli download microsoft/bitnet-b1.58-2B-4T-gguf --local-dir models/BitNet-b1.58-2B-4T --include "*.gguf"

# Fix compilation error in ggml-bitnet-mad.cpp (const correctness)
RUN sed -i 's/int8_t \* y_col = y + col \* by;/const int8_t * y_col = y + col * by;/g' src/ggml-bitnet-mad.cpp

# Setup environment (compile kernels) using the local model directory
RUN python setup_env.py -md models/BitNet-b1.58-2B-4T -q i2_s || (cat logs/compile.log && exit 1)

# Install Python server dependencies
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

# Expose port 7860 (HF Space default)
EXPOSE 7860

# Run the server
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
"""

# requirements.txt
requirements_content = """
fastapi
uvicorn
huggingface_hub
"""

# app.py: The API server
app_content = """
import subprocess
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

# Path to the model and binary
# The setup_env.py in Dockerfile should have downloaded the model to /app/BitNet/models/...
# We need to find the exact path. 
# Based on bitnet setup_env.py, it likely puts it in models/BitNet-b1.58-2B-4T/ggml-model-i2_s.gguf
MODEL_PATH = "/app/BitNet/models/BitNet-b1.58-2B-4T/ggml-model-i2_s.gguf"
# The binary is built? setup_env.py usually just downloads. We might need to build it manually if setup_env doesn't.
# Checking bitnet repo: setup_env.py does 'python setup_env.py -md ...' which might build?
# Let's assume we need to build it explicitly in Dockerfile if setup_env doesn't.
# But for now, we will assume we use the python wrapper if available, or subprocess.

# Actually, let's use the run_inference.py provided by BitNet
# python run_inference.py -m models/BitNet-b1.58-2B-4T/ggml-model-i2_s.gguf -p "prompt"
# We need to make sure we are in the BitNet directory when running this.

BITNET_DIR = "/app/BitNet"

class GenerateRequest(BaseModel):
    prompt: str
    max_tokens: int = 100

@app.get("/")
def home():
    return {"status": "running", "model": "BitNet b1.58 2B"}

@app.post("/generate")
def generate(req: GenerateRequest):
    try:
        # Construct command
        # Note: run_inference.py might print to stdout. We capture it.
        # Usage: python run_inference.py -m <model> -p <prompt> -n <tokens>
        cmd = [
            "python", 
            "run_inference.py", 
            "-m", "models/BitNet-b1.58-2B-4T/ggml-model-i2_s.gguf",
            "-p", req.prompt,
            "-n", str(req.max_tokens)
        ]
        
        result = subprocess.run(
            cmd, 
            cwd=BITNET_DIR, 
            capture_output=True, 
            text=True
        )
        
        if result.returncode != 0:
            return {"error": result.stderr, "stdout": result.stdout}
            
        return {"response": result.stdout}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
"""

# 3. Upload files
operations = [
    {"path": "Dockerfile", "content": dockerfile_content},
    {"path": "requirements.txt", "content": requirements_content},
    {"path": "app.py", "content": app_content},
]

for op in operations:
    try:
        api.upload_file(
            path_or_fileobj=op["content"].encode("utf-8"),
            path_in_repo=op["path"],
            repo_id=REPO_ID,
            repo_type="space",
            token=HF_TOKEN,
            commit_message=f"Add {op['path']}"
        )
        print(f"Uploaded {op['path']}")
    except Exception as e:
        print(f"Error uploading {op['path']}: {e}")

print("Deployment triggered. Check your Space URL.")
