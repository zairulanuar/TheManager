import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

token = os.environ.get("HF_TOKEN_MALAY") or os.environ.get("HF_TOKEN")
base_url = "https://zairulanuar-malaylanguage-mcp.hf.space"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

def test_tool(name, args):
    print(f"\n--- Testing Tool: {name} ---")
    print(f"Args: {args}")
    url = f"{base_url}/tools/execute"
    payload = {
        "name": name,
        "arguments": args
    }
    
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=60)
        if resp.status_code == 200:
            print("✅ Success!")
            print(json.dumps(resp.json(), indent=2))
        else:
            print(f"❌ Failed: {resp.status_code}")
            print(resp.text)
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print(f"Testing MCP Tools on {base_url}...")
    
    # 1. Detect Language
    test_tool("detect_language", {"text": "Selamat pagi dunia"})
    
    # 2. Normalize
    test_tool("normalize_malay", {"text": "ak x tau nk g mana"})
    
    # 3. Spelling Correction
    test_tool("correct_spelling", {"text": "saye suke mkan nasi lemaak"})
    
    # 4. Translate (T5)
    test_tool("translate", {"text": "Saya suka makan nasi lemak", "source_lang": "ms", "target_lang": "en"})
