import os
import requests
import time
import sys
from dotenv import load_dotenv

load_dotenv()

# Get token
token = os.environ.get("HF_TOKEN_MALAY") or os.environ.get("HF_TOKEN")
if not token:
    print("Error: HF_TOKEN_MALAY or HF_TOKEN not set")
    sys.exit(1)

space_id = "zairulanuar/malaylanguage-mcp"
# Try different endpoints
endpoints = [
    f"https://huggingface.co/api/spaces/{space_id}/logs",
    f"https://huggingface.co/api/spaces/{space_id}/logs/runtime",
    f"https://huggingface.co/api/spaces/{space_id}/runtime"
]

headers = {"Authorization": f"Bearer {token}"}

for url in endpoints:
    print(f"Checking {url}...")
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            print(f"--- Logs from {url} ---")
            print(response.text[:2000]) # First 2000 chars
            print("...")
            print(response.text[-2000:]) # Last 2000 chars
            break
        else:
            print(f"Status: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")
