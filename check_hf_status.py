import os
import time
import requests
from huggingface_hub import HfApi

# Load .env
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"): continue
            if "=" in line:
                key, value = line.split("=", 1)
                os.environ[key.strip()] = value.strip().strip('"').strip("'")

HF_TOKEN = os.getenv("HF_TOKEN")
REPO_ID = "zairulanuar/bitnet-b158-api"

api = HfApi(token=HF_TOKEN)

print(f"Monitoring {REPO_ID}...")
last_log_len = 0

while True:
    try:
        runtime = api.get_space_runtime(repo_id=REPO_ID)
        stage = runtime.stage
        print(f"[{time.strftime('%H:%M:%S')}] Status: {stage}")
        
        # Fetch logs
        headers = {"Authorization": f"Bearer {HF_TOKEN}"}
        response = requests.get(f"https://huggingface.co/api/spaces/{REPO_ID}/logs/build", headers=headers)
        
        if response.status_code == 200:
            logs = response.text
            if len(logs) > last_log_len:
                new_logs = logs[last_log_len:]
                # Print only non-empty new logs
                if new_logs.strip():
                    print(new_logs)
                last_log_len = len(logs)
        
        if stage in ["RUNNING", "APP_STARTING"]:
            print("Build successful! App is starting.")
            break
        
        if stage in ["BUILD_ERROR", "RUNTIME_ERROR"]:
            print("Build/Runtime failed!")
            break
            
        time.sleep(10)
        
    except Exception as e:
        print(f"Error: {e}")
        time.sleep(10)
