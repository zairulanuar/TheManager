import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

token = os.environ.get("HF_TOKEN_MALAY") or os.environ.get("HF_TOKEN")
space_id = "zairulanuar/malaylanguage-mcp"
base_url = "https://zairulanuar-malaylanguage-mcp.hf.space"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

print(f"Checking endpoints for {base_url}...")

# 1. Health Check
try:
    print("\n1. Checking /health...")
    resp = requests.get(f"{base_url}/health", headers=headers, timeout=10)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
except Exception as e:
    print(f"Error: {e}")

# 2. Root Check
try:
    print("\n2. Checking root /...")
    resp = requests.get(f"{base_url}/", headers=headers, timeout=10)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
except Exception as e:
    print(f"Error: {e}")

print("\n3. Checking tool execution (detect_language)...")
try:
    tool_url = f"{base_url}/tools/execute"
    payload = {
        "name": "detect_language",
        "arguments": {"text": "Selamat pagi"}
    }
    tool_response = requests.post(tool_url, json=payload, headers={"Authorization": f"Bearer {token}"})
    print(f"Status: {tool_response.status_code}")
    print(f"Response: {tool_response.text}")
except Exception as e:
    print(f"Tool check failed: {e}")
