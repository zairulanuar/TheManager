import os
import requests
import json
import sys
from dotenv import load_dotenv

load_dotenv()

token = os.environ.get("HF_TOKEN_MALAY") or os.environ.get("HF_TOKEN")
space_id = "zairulanuar/malaylanguage-mcp"
url = f"https://huggingface.co/api/spaces/{space_id}/logs/build"

print(f"Starting log monitor for {space_id}...")
print("Filtering out verbose array dumps. Press Ctrl+C to stop.")

headers = {"Authorization": f"Bearer {token}"}

try:
    with requests.get(url, headers=headers, stream=True, timeout=60) as r:
        if r.status_code != 200:
            print(f"Error connecting: {r.status_code} {r.text}")
            sys.exit(1)
            
        for line in r.iter_lines():
            if not line:
                continue
                
            decoded = line.decode('utf-8')
            if not decoded.startswith('data:'):
                continue
                
            try:
                # Remove "data: " prefix
                json_str = decoded[6:]
                payload = json.loads(json_str)
                log_content = payload.get("data", "")
                timestamp = payload.get("timestamp", "")
                
                # Filter noise
                if "dtype=" in log_content or "array([" in log_content or "        [" in log_content:
                    continue
                    
                if log_content.strip():
                    # Simple timestamp formatting
                    time_part = timestamp.split('T')[1][:-1] if 'T' in timestamp else timestamp
                    print(f"[{time_part}] {log_content.strip()}")
                    
            except json.JSONDecodeError:
                pass
            except Exception as e:
                print(f"Parse error: {e}")

except KeyboardInterrupt:
    print("\nMonitor stopped.")
except Exception as e:
    print(f"\nConnection error: {e}")
