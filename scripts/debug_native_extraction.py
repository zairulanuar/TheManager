import os
import sys
import pdfplumber
import json
from dotenv import load_dotenv

# Add scripts directory to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from extractor.corporate_info import extract_corporate_info

def extract_text_pdfplumber(pdf_path):
    try:
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ""
            for page in pdf.pages:
                text = page.extract_text(layout=True)
                if text:
                    full_text += text + "\n"
            
            print("--- EXTRACTED TEXT START ---")
        # Print Share Capital section
        if "SUMMARY OF SHARE CAPITAL" in full_text:
            start_idx = full_text.find("SUMMARY OF SHARE CAPITAL")
            end_idx = full_text.find("DIRECTORS/OFFICERS")
            print(full_text[start_idx:end_idx+200])
        else:
            print("SUMMARY OF SHARE CAPITAL not found, printing snippets...")
            idx = full_text.find("ORDINARY")
            if idx != -1:
                print(full_text[idx-200:idx+200])
            else:
                print(full_text[:500])
        
        # Print Financial section
        if "SUMMARY OF FINANCIAL INFORMATION" in full_text:
            print("\n--- FINANCIAL SECTION ---")
            start_idx = full_text.find("SUMMARY OF FINANCIAL INFORMATION")
            end_idx = full_text.find("END OF REPORT")
            print(full_text[start_idx:end_idx+200])

        print("--- EXTRACTED TEXT END ---")

        return full_text
    except Exception as e:
        print(f"Error extracting text with pdfplumber: {e}")
        return None

def main():
    # Load env
    load_dotenv()
    
    pdf_path = r"sample/SSM Cert/1144519-K_CP_19112025_EN.pdf"
    
    if not os.path.exists(pdf_path):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        pdf_path = os.path.join(base_dir, "sample", "SSM Cert", "1144519-K_CP_19112025_EN.pdf")
        
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        return

    print(f"Processing: {pdf_path}")
    
    # 1. Extract Text
    raw_text = extract_text_pdfplumber(pdf_path)
    
    if not raw_text:
        print("Failed to extract text or empty text.")
        return

    # Debug: Write raw text sections to file
    debug_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "debug_raw_output.txt")
    print(f"Writing debug output to: {debug_file}")
    
    with open(debug_file, "w", encoding="utf-8") as f:
        nob_idx = raw_text.lower().find("nature of business")
        dir_idx = raw_text.lower().find("directors/officers")
        
        f.write(f"NOB Index: {nob_idx}, DIR Index: {dir_idx}\n")
        
        f.write("\n--- RAW TEXT SECTION: NATURE OF BUSINESS ---\n")
        if nob_idx != -1:
            f.write(raw_text[nob_idx:nob_idx+1000])
        f.write("\n--- END SECTION ---\n")
        
        f.write("\n--- RAW TEXT SECTION: DIRECTORS ---\n")
        if dir_idx != -1:
            f.write(raw_text[dir_idx:dir_idx+3000])
        f.write("\n--- END SECTION ---\n")
        
        f.write("\n--- FULL RAW TEXT ---\n")
        f.write(raw_text)

    extracted_data = extract_corporate_info(raw_text)
    
    print("\n--- EXTRACTED DATA ---")
    print(json.dumps(extracted_data, indent=2))

if __name__ == "__main__":
    main()
