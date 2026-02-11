import os
from dotenv import load_dotenv
from huggingface_hub import HfApi

load_dotenv()
token = os.environ.get("HF_TOKEN")
repo_id = "zairulanuar/ocr"
file_paths = [
    ("scripts/hf_space/app.py", "app.py"),
    ("scripts/hf_space/Dockerfile", "Dockerfile"),
    ("scripts/hf_space/requirements.txt", "requirements.txt")
]

if not token:
    print("Error: HF_TOKEN not found in .env")
    exit(1)

api = HfApi(token=token)

for local_path, repo_path in file_paths:
    print(f"Uploading {local_path} to {repo_id}/{repo_path}...")
    try:
        api.upload_file(
            path_or_fileobj=local_path,
            path_in_repo=repo_path,
            repo_id=repo_id,
            repo_type="space"
        )
        print(f"Upload of {repo_path} successful!")
    except Exception as e:
        print(f"Error uploading {repo_path}: {e}")
