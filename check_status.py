
import requests
import os

url = "https://zairulanuar-ocr.hf.space"
try:
    print(f"Checking status of {url}...")
    resp = requests.get(url, timeout=10)
    print(f"Status Code: {resp.status_code}")
    print(f"Response: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
