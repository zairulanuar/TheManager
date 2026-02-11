import os
from huggingface_hub import HfApi, get_space_runtime
from dotenv import load_dotenv

load_dotenv()

token = os.environ.get("HF_TOKEN")
space_id = "zairulanuar/ocr" # inferred from zairulanuar-ocr.hf.space

print(f"Checking space: {space_id}")

try:
    api = HfApi(token=token)
    info = api.space_info(space_id)
    print(f"Space Status: {info.runtime.stage}")
    
    # Try to get logs if possible (this might not be directly supported by easy API, but let's try runtime info)
    runtime = get_space_runtime(space_id, token=token)
    print(f"Runtime Stage: {runtime.stage}")
    print(f"Hardware: {runtime.hardware}")
    
    # Unfortunately, fetching runtime logs via API is not straightforward in older versions or without specific endpoints.
    # But checking status is a start.
    
except Exception as e:
    print(f"Error: {e}")
