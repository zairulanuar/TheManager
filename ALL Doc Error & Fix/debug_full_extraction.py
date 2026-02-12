
import sys
import os
import json
import re

# Add scripts to path
sys.path.append(os.path.join(os.getcwd(), 'scripts'))

from ocr_service import process_document

def print_separator(title):
    print(f"\n{'='*20} {title} {'='*20}")

def analyze_extraction(image_path):
    print(f"Processing: {image_path}")
    result = process_document(image_path)
    
    if not result.get("success"):
        print("OCR Failed:", result.get("error"))
        return

    data = result.get("extracted_data", {})
    raw_text = result.get("text", "")
    
    print_separator("EXTRACTED DATA")
    # Print structure (abbreviated)
    # Remove raw text from display to save space
    if "text" in result:
        result["text"] = result["text"][:200] + "... [TRUNCATED]"
    if "raw_result" in result:
        del result["raw_result"]
        
    print(json.dumps(result, indent=2))
    
    # Print the first 1000 characters of raw text to debug missing fields
    print("\n==================== RAW TEXT START ====================")
    print(raw_text[:1000])
    print("==================== RAW TEXT END ====================\n")

    print("\n==================== EXTRACTION RESULT ====================")
    # Print financials specifically to check structure
    print(json.dumps(data.get("financials", {}), indent=2))
    
    empty_fields = []
    for k, v in data.items():
        if v in [None, "", [], {}] and k not in ["oldRegistrationNumber", "notes", "qrPayload", "trace"]:
            empty_fields.append(k)
            print(f"[MISSING] {k}")
    
    # print_separator("RAW TEXT SNIPPET (First 2000 chars)")
    # if "text" in result:
    #     print(result["text"][:2000].replace('\n', '\n'))
        
    print_separator("REGEX DIAGNOSIS")
    # We will try to run some regexes manually on the full text to see why they failed
    full_text = result.get("text", "")
    
    # 1. Incorporation Date Diagnosis
    print("Checking 'Incorporation Date' patterns:")
    patterns = [
        r'(?:Incorporation|Registration) Date\s*[:\.]?\s*(\d{2}[-\.]\s*\d{2}[-\.]\s*\d{4})',
        r'Date\s*[:\.]?\s*(\d{2}[-\.]\s*\d{2}[-\.]\s*\d{4})'
    ]
    for p in patterns:
        m = re.search(p, raw_text, re.IGNORECASE)
        print(f"  Pattern '{p}': {'MATCH: ' + m.group(1) if m else 'NO MATCH'}")
        
    # Look for the header specifically
    header = re.search(r'(?:Incorporation|Registration) Date', raw_text, re.IGNORECASE)
    if header:
        print(f"  Header found at index {header.start()}. Next 100 chars:")
        print(f"  '{raw_text[header.end():header.end()+100].replace(chr(10), '<NL>')}'")
    else:
        print("  Header 'Incorporation Date' NOT FOUND")

    # 2. Financials Diagnosis
    print("\nChecking Financials patterns:")
    fin_section = re.search(r'#?\s*SUMMARY OF FINANCIAL INFORMATION(.+?)END OF REPORT', raw_text, re.DOTALL | re.IGNORECASE)
    if fin_section:
        print("  Financial Section FOUND")
        fin_text = fin_section.group(1)
        # Check a few keys
        rev_match = re.search(r'Revenue\s*:\s*([\d\-,\.]+)', fin_text)
        print(f"  Revenue Match: {rev_match.group(1) if rev_match else 'NO MATCH'}")
    else:
        print("  Financial Section NOT FOUND")

if __name__ == "__main__":
    path = "sample/SSM Cert/1144519-K_CP_19112025_EN.pdf"
    analyze_extraction(path)
