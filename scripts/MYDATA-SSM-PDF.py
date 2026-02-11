
import sys
import os
import json
sys.path.append(os.getcwd())
from scripts.ocr_service import process_document

def test_pdf():
    pdf_path = r"c:\laragon\www\TheManager\sample\SSM Cert\1144519-K_CP_19112025_EN.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"Error: File not found at {pdf_path}")
        return

    print(f"Processing {pdf_path}...")
    result = process_document(pdf_path)
    
    # print("\n--- Raw Text ---")
    # if "raw_result" in result:
    #      for i, item in enumerate(result["raw_result"]):
    #           print(f"{i}: {item.get('text', '')}")
    
    print("\n--- Extraction Result ---")
    print(json.dumps(result, indent=2, default=str))

if __name__ == "__main__":
    test_pdf()
