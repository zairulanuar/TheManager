from huggingface_hub import HfApi
import os
from dotenv import load_dotenv

load_dotenv()
token = os.environ.get("HF_TOKEN_MALAY") or os.environ.get("HF_TOKEN")
repo_id = "zairulanuar/malaylanguage-mcp"

api = HfApi(token=token)
import time

while True:
    try:
        runtime = api.get_space_runtime(repo_id=repo_id)
        print(f"Current stage: {runtime.stage}")
        if runtime.stage == "RUNNING":
            print("Space is fully RUNNING!")
            break
        elif runtime.stage == "BUILDING":
            print("Still building...")
        elif runtime.stage == "RUNNING_APP_STARTING":
            print("App is starting up...")
        else:
            print(f"Status: {runtime.stage}")
    except Exception as e:
        print(f"Error checking status: {e}")
    
    time.sleep(10)
