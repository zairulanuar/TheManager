import os
import requests
import json
import time
from dotenv import load_dotenv

load_dotenv()

token = os.environ.get("HF_TOKEN_MALAY") or os.environ.get("HF_TOKEN")
base_url = "https://zairulanuar-malaylanguage-mcp.hf.space"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

def check_endpoint(url):
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        return resp.status_code == 200, resp.text
    except Exception as e:
        return False, str(e)

def run_tool(name, args):
    url = f"{base_url}/tools/execute"
    payload = {"name": name, "arguments": args}
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=60)
        if resp.status_code == 200:
            return True, resp.json()
        else:
            return False, resp.text
    except Exception as e:
        return False, str(e)

def main():
    print("=== Final Verification of Malay MCP Server ===")
    
    # 1. Health Check
    print("\n1. Health Check...")
    ok, res = check_endpoint(f"{base_url}/health")
    if ok:
        print("✅ Health Check Passed")
    else:
        print(f"❌ Health Check Failed: {res}")
        return

    # 2. Tool Verification
    tools = [
        ("detect_language", {"text": "Selamat pagi"}),
        ("normalize_malay", {"text": "ak x tau"}),
        ("translate", {"text": "Saya suka makan nasi lemak", "source_lang": "ms", "target_lang": "en"}),
        ("correct_spelling", {"text": "saye suke makan"})
    ]
    
    for name, args in tools:
        print(f"\nTesting {name}...")
        ok, res = run_tool(name, args)
        if ok:
            result_content = res.get('result', [])
            if result_content and isinstance(result_content, list) and len(result_content) > 0:
                item = result_content[0]
                if isinstance(item, dict) and item.get('type') == 'text':
                    text = item['text']
                    if "Error" in text:
                        print(f"⚠️ Tool executed but returned error: {text}")
                    elif name == "detect_language" and "v1.2" not in text:
                        print(f"⚠️ Warning: Old version detected (missing v1.2 tag). Result: {text}")
                    else:
                        print(f"✅ Success: {text.strip()}")
                else:
                     print(f"⚠️ Unexpected item format: {item}")
            else:
                print(f"⚠️ Empty or invalid result: {res}")
        else:
            print(f"❌ Tool Execution Failed: {res}")

if __name__ == "__main__":
    main()
