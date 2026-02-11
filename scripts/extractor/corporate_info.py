from __future__ import annotations
import re
import sys
from datetime import datetime

def extract_corporate_info_simple(raw_text: str | list[str]) -> dict:
    # Handle list input (join with newlines)
    if isinstance(raw_text, list):
        raw_text = "\n".join(raw_text)
        
    # Check for Financial Header presence
    header_idx = raw_text.find("SUMMARY OF FINANCIAL INFORMATION")
    end_idx = raw_text.find("END OF REPORT")
    
    # Initialize result
    result = {
        "docType": "SSM_CORPORATE_PROFILE",
        "companyName": "",
        "registrationNumber": "",
        "oldRegistrationNumber": "",
        "incorporationDate": "",
        "companyType": "",
        "status": "",
        "registeredAddress": {},
        "businessAddress": {},
        "natureOfBusiness": [],
        "shareCapital": {
            "totalIssued": 0.0,
            "ordinaryShares": 0
        },
        "directors": [],
        "shareholders": [],
        "financials": {},
        "kycAssessment": {}
    }
    
    # ===== 1. BASIC COMPANY INFO =====
    # Company Name
    name_match = re.search(r'Name\s*:\s*([^\n]+?SDN\.?\s*BHD\.?)', raw_text, re.IGNORECASE)
    if name_match:
        result["companyName"] = name_match.group(1).strip()
    
    # Registration Number
    reg_match = re.search(r'Registration No\.?\s*:\s*(\d+)\s*\(([^)]+)\)', raw_text)
    if reg_match:
        result["registrationNumber"] = reg_match.group(1)
        result["oldRegistrationNumber"] = reg_match.group(2)
    
    # Incorporation Date
    incorp_match = re.search(r'(?:Incorporation|Registration) Date\s*[:\.]?\s*(\d{2}[-\.]\s*\d{2}[-\.]\s*\d{4})', raw_text, re.IGNORECASE)
    if incorp_match:
        date_str = incorp_match.group(1).replace(' ', '').replace('.', '-')
        result["incorporationDate"] = date_str
        # Usually registration date is same as incorporation date for SDN BHD
        result["registrationDate"] = date_str
    else:
        # Fallback 1: Try to find ANY date pattern in the first 20 lines that looks like an incorporation date
        # (e.g. "12-05-2015" sitting alone near "Incorporation Date")
        header_match = re.search(r'(?:Incorporation|Registration) Date', raw_text, re.IGNORECASE)
        if header_match:
            # Look at the text following the header (next 100 chars)
            start_idx = header_match.end()
            lookahead_text = raw_text[start_idx:start_idx+100]
            date_fallback = re.search(r'(\d{2}-\d{2}-\d{4})', lookahead_text)
            if date_fallback:
                 date_str = date_fallback.group(1)
                 result["incorporationDate"] = date_str
                 result["registrationDate"] = date_str
        
        # Fallback 2: Global scan in first 1000 chars if still empty
        if not result["incorporationDate"]:
            # Try to match a date with the Registration Number's year
            reg_no = result.get("registrationNumber", "")
            if reg_no and len(reg_no) >= 4 and reg_no[:4].isdigit():
                reg_year = reg_no[:4]
                # Find all dates in the text that end with this year
                # Pattern: dd-mm-yyyy or dd.mm.yyyy or dd/mm/yyyy
                date_candidates = re.findall(r'(\d{2}[-\./]\s*\d{2}[-\./]\s*' + reg_year + r')', raw_text)
                
                if date_candidates:
                    # Pick the first one
                    found_date = date_candidates[0].replace(' ', '').replace('/', '-').replace('.', '-')
                    # sys.stderr.write(f"DEBUG: Inferred Incorporation Date {found_date} from Reg Year {reg_year}\n")
                    result["incorporationDate"] = found_date
                    result["registrationDate"] = found_date
            
            # If still empty, try finding ANY date in first 500 chars (risky but better than null?)
            # But avoid printing date which is usually today's date
            if not result["incorporationDate"]:
                 pass

    # ===== 3. COMPANY TYPE =====
    
    # Company Type
    type_match = re.search(r'Type\s*:\s*([\s\S]+?)(?=\s*Status\s*:)', raw_text, re.IGNORECASE)
    if type_match:
        c_type = type_match.group(1).strip()
        # Normalize Company Type
        c_type_upper = c_type.upper()
        if "PRIVATE LIMITED" in c_type_upper:
             result["companyType"] = "SDN. BHD."
        elif "PUBLIC LIMITED" in c_type_upper:
             result["companyType"] = "BERHAD"
        else:
             result["companyType"] = c_type.replace('\n', ' ').strip()
    
    # Status
    status_match = re.search(r'Status\s*:\s*([^\n]+?)(?=\s*Registered Address\s*:)', raw_text, re.IGNORECASE)
    if status_match:
        result["status"] = status_match.group(1).strip()
    
    # ===== 2. ADDRESSES =====
    # Registered Address
    reg_addr_match = re.search(r'Registered Address\s*:\s*([\s\S]+?Postcode\s*:?\s*\d{5,6})', raw_text, re.IGNORECASE)
    if reg_addr_match:
        addr_text = reg_addr_match.group(1)
        postcode_match = re.search(r'Postcode\s*:?\s*(\d{5,6})', addr_text, re.IGNORECASE)
        if postcode_match:
            pc = postcode_match.group(1)
            # Remove "Postcode" and the number from address string
            # We use a more flexible replacement pattern
            address = re.sub(r'Postcode\s*:?\s*' + pc, '', addr_text, flags=re.IGNORECASE).strip()
            # Clean up trailing comma if present
            if address.endswith(','):
                address = address[:-1].strip()
            
            result["registeredAddress"] = {
                "address": "\n".join([line.strip() for line in address.split('\n') if line.strip()]),
                "postcode": pc,
                "country": "Malaysia"
            }
    
    # Business Address
    bus_addr_match = re.search(r'Business Address\s*:\s*([\s\S]+?Postcode\s*:?\s*\d{5,6})', raw_text, re.IGNORECASE)
    if bus_addr_match:
        addr_text = bus_addr_match.group(1)
        postcode_match = re.search(r'Postcode\s*:?\s*(\d{5,6})', addr_text, re.IGNORECASE)
        if postcode_match:
            pc = postcode_match.group(1)
            address = re.sub(r'Postcode\s*:?\s*' + pc, '', addr_text, flags=re.IGNORECASE).strip()
            if address.endswith(','):
                address = address[:-1].strip()
                
            result["businessAddress"] = {
                "address": "\n".join([line.strip() for line in address.split('\n') if line.strip()]),
                "postcode": pc,
                "country": "Malaysia"
            }
    
    # ===== 3. NATURE OF BUSINESS =====
    nob_match = re.search(r'Nature Of Business\s*:\s*(.+?)(?=\n\s*(?:User Id|Summary of Share Capital|Company Charges|MY DATA|DIRECTORS/OFFICERS))', raw_text, re.IGNORECASE | re.DOTALL)
    if nob_match:
        nob_text = nob_match.group(1)
        # Split by numbers like 1., 2., etc. or newlines
        items = re.split(r'\d\.\s*', nob_text)
        for item in items:
            # Replace newlines with spaces for cleaner items, or keep them if they separate distinct items?
            # Usually Nature of Business items are short phrases.
            item_clean = item.strip().replace('\n', ' ')
            item_clean = re.sub(r'\s+', ' ', item_clean) # Collapse multiple spaces
            if item_clean and not item_clean.lower().startswith('nature of business'):
                result["natureOfBusiness"].append(item_clean)
    
    # ===== 4. SHARE CAPITAL =====
    # Allow whitespace/newlines between words e.g. TOTAL\nISSUED
    capital_match = re.search(r'TOTAL\s+ISSUED\s*\(RM\)\s*([\d,\s]+\.?\d*)', raw_text, re.IGNORECASE)
    if capital_match:
        amount_str = capital_match.group(1).replace(',', '').replace(' ', '').replace('\n', '')
        try:
             result["shareCapital"]["totalIssued"] = float(amount_str)
        except:
             pass
    
    # Ordinary shares
    # Capture number, stopping at double space or newline
    ordinary_match = re.search(r'ORDINARY\s+([\d,\s]+?)(?=\s{2,}|\n|$)', raw_text)
    if ordinary_match:
        try:
            result["shareCapital"]["ordinaryShares"] = int(ordinary_match.group(1).replace(',', '').replace(' ', ''))
        except:
            pass
    
    # ===== 5. DIRECTORS - ROBUST VERSION =====
    # Find directors section
    dir_start_match = re.search(r'(Name/Address|Date Of Name/Address|DIRECTORS/OFFICERS)', raw_text, re.IGNORECASE)
    dir_end_match = re.search(r'#?\s*SHAREHOLDERS', raw_text, re.IGNORECASE)
    
    dir_text = ""
    if dir_start_match and dir_end_match:
         dir_text = raw_text[dir_start_match.end():dir_end_match.start()]
    elif dir_start_match:
         start_idx = dir_start_match.end()
         dir_text = raw_text[start_idx:start_idx+3000]
    
    if dir_text:
        lines = dir_text.split('\n')
        directors_data = []
        current_director = None
        
        # Regex to match a director line: Name (optional) + IC + Designation + Date
        # Note: Name might be missing from this line if it's on the previous line or left column
        # But based on debug output: "CHONG SIW CHIN                 710615-08-5992 DIRECTOR   01-08-2019"
        # It's all on one line.
        director_line_pattern = r'^\s*(.*?)\s+(\d{6}-\d{2}-\d{4})\s+(.*?)\s+(\d{2}-\d{2}-\d{4})\s*$'
        
        for line in lines:
            line = line.strip()
            if not line: continue
            
            # Skip headers / Noise
            if "Registration No." in line or "User Id" in line or "Printing Date" in line:
                continue
            if "This company information is generated" in line or "MENARA SSM@SENTRAL" in line:
                continue
            if "TEL :" in line and "FAX :" in line:
                continue
            if "This information are from the company's document" in line:
                continue
            if "Registrar" == line.strip() or line.strip().startswith("Dated :"):
                continue
            if "This information is computer generated" in line:
                continue
            if re.search(r'^\s*\d+/\d+\s*$', line): # Page number e.g. "4/6"
                continue
            
            if any(x in line.upper() for x in ["NAME", "ADDRESS", "IC/PASSPORT", "DESIGNATION", "DATE OF APPOINTMENT"]):
                continue
                
            match = re.match(director_line_pattern, line)
            if match:
                # Found a new director
                # Save previous one if exists
                if current_director:
                    # Clean up address
                    current_director["address"] = "\n".join(current_director["address_lines"]).strip()
                    del current_director["address_lines"]
                    directors_data.append(current_director)
                
                # Start new director
                name = match.group(1).strip()
                ic = match.group(2).strip()
                desig = match.group(3).strip()
                appt_date = match.group(4).strip()
                
                current_director = {
                    "name": name,
                    "ic": ic,
                    "designation": desig,
                    "appointmentDate": appt_date,
                    "address_lines": []
                }
            elif current_director:
                # Append to address
                current_director["address_lines"].append(line)
        
        # Add the last director
        if current_director:
            current_director["address"] = "\n".join(current_director["address_lines"]).strip()
            del current_director["address_lines"]
            directors_data.append(current_director)
            
        result["directors"] = directors_data


    
    # ===== 6. SHAREHOLDERS - SIMPLE VERSION =====
    # Find shareholders section
    share_section = re.search(r'#?\s*SHAREHOLDERS\s*/\s*MEMBERS(.+?)(?:#?\s*COMPANY CHARGES|MY DATA)', raw_text, re.DOTALL | re.IGNORECASE)
    if not share_section:
        share_section = re.search(r'IC/Passport/(.+?)NO INFORMATION', raw_text, re.DOTALL | re.IGNORECASE)
    
    if share_section:
        share_text = share_section.group(1)
        
        # Simple pattern: IC, NAME, SHARES
        # The pattern in your text: "710615-08-5992CHONG SIW CHIN650,001"
        # So we need to handle no space between IC and NAME
        # And spaces inside the shares count (e.g. "650, 001")
        # Use lookahead to stop shares at next IC or non-share char (like 'a' or end)
        pattern = r'(\d{6}-\d{2}-\d{4})\s*([A-Z\s]+?)\s*(\d[\d,\s]*?)(?=\s*(?:\d{6}-\d{2}-\d{4}|[^0-9,\s]|$))'
        matches = re.findall(pattern, share_text)
        
        for ic, name, shares in matches:
            shares_clean = int(shares.replace(',', '').replace(' ', ''))
            result["shareholders"].append({
                "name": name.strip(),
                "ic": ic.strip(),
                "shares": shares_clean
            })
    
    # ===== 7. FINANCIALS =====
    # Initialize structured financials
    result["financials"] = {
        "balanceSheet": {},
        "incomeStatement": {},
        "financialYearEnd": "",
        "auditorName": "",
        "auditorAddress": ""
    }

    # Find financial section
    # Use greedy match but stop at END OF REPORT
    fin_section = re.search(r'SUMMARY OF FINANCIAL INFORMATION([\s\S]+?)END OF REPORT', raw_text, re.IGNORECASE)
    
    if fin_section:
        fin_text = fin_section.group(1)
        # Auditor Name
        auditor_match = re.search(r'Auditor\s*:\s*([^\n]+)', fin_text)
        if auditor_match:
            result["financials"]["auditorName"] = auditor_match.group(1).strip()
            
        # Auditor Address
        # Look for address until "Exempt Private Company" or "Financial Year End"
        auditor_addr_match = re.search(r'Auditor Address\s*:\s*([\s\S]+?)(?=Exempt Private Company|Financial Year End)', fin_text, re.IGNORECASE)
        if auditor_addr_match:
             # Clean up address - replace newlines with comma space
             addr_clean = auditor_addr_match.group(1).strip().replace('\n', ', ')
             # Remove multiple spaces
             addr_clean = re.sub(r'\s+', ' ', addr_clean)
             # Fix comma spacing (e.g. " , " -> ", ")
             addr_clean = re.sub(r'\s*,\s*', ', ', addr_clean)
             result["financials"]["auditorAddress"] = addr_clean
        
        # Financial Year End
        fye_match = re.search(r'Financial Year End\s*:\s*(\d{2}-\d{2}-\d{4})', fin_text)
        if fye_match:
            result["financials"]["financialYearEnd"] = fye_match.group(1)
        
        # Mapping for Balance Sheet
        bs_patterns = {
            "nonCurrentAssets": r'Non-Current\s+Assets\s*:\s*([-\d\s,\.]+)',
            "currentAssets": r'(?<!Non-)Current\s+Assets\s*:\s*([-\d\s,\.]+)',
            "nonCurrentLiabilities": r'Non-Current\s+Liabilities\s*:\s*([-\d\s,\.]+)',
            "currentLiabilities": r'(?<!Non-)Current\s+Liabilities\s*:\s*([-\d\s,\.]+)',
            "shareCapital": r'Share\s+Capital\s*:\s*([-\d\s,\.]+)',
            "reserves": r'Reserve\s*:\s*([-\d\s,\.]+)',
            "retainedEarnings": r'Retain\s+Earning\s*:\s*([-\d\s,\.]+)',
            "minorityInterests": r'Minority\s+Interest\s*:\s*([-\d\s,\.]+)'  # Note: Minority Interest appears in both sections often
        }

        # Mapping for Income Statement
        is_patterns = {
            "revenue": r'Revenue\s*:\s*([-\d\s,\.]+)',
            "profitBeforeTax": r'before\s+tax\s*:\s*([-\d\s,\.]+)',
            "profitAfterTax": r'after\s+tax\s*:\s*([-\d\s,\.]+)',
            "netDividend": r'Net\s+dividend\s*:\s*([-\d\s,\.]+)',
            "minorityInterest": r'Minority\s+Interest\s*:\s*([-\d\s,\.]+)' # Usually last item in Income Statement
        }
        
        # Helper to extract value
        def extract_val(pattern, text):
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                raw_val = match.group(1).strip()
                value = raw_val.replace(',', '').replace(' ', '')
                if '(' in value and ')' in value:
                    value = '-' + value.replace('(', '').replace(')', '')
                try:
                    return float(value)
                except:
                    return 0.0
            return 0.0

        # Extract Balance Sheet Items
        for key, pattern in bs_patterns.items():
            # For minority interest, we want the first occurrence (Balance Sheet)
            if key == "minorityInterests":
                # Find "BALANCE SHEET ITEMS" section specifically if possible
                bs_section = re.search(r'BALANCE SHEET ITEMS([\s\S]+?)INCOME STATEMENT ITEMS', fin_text, re.IGNORECASE)
                if bs_section:
                    val = extract_val(pattern, bs_section.group(1))
                    result["financials"]["balanceSheet"][key] = val
                else:
                    # Fallback
                    result["financials"]["balanceSheet"][key] = extract_val(pattern, fin_text)
            else:
                result["financials"]["balanceSheet"][key] = extract_val(pattern, fin_text)

        # Extract Income Statement Items
        for key, pattern in is_patterns.items():
            if key == "minorityInterest":
                # Find "INCOME STATEMENT ITEMS" section
                is_section = re.search(r'INCOME STATEMENT ITEMS([\s\S]+)', fin_text, re.IGNORECASE)
                if is_section:
                     val = extract_val(pattern, is_section.group(1))
                     result["financials"]["incomeStatement"][key] = val
            else:
                result["financials"]["incomeStatement"][key] = extract_val(pattern, fin_text)
    
    # ===== 8. KYC ASSESSMENT =====
    # Calculate current ratio
    ca = result["financials"]["balanceSheet"].get("currentAssets", 0)
    cl = result["financials"]["balanceSheet"].get("currentLiabilities", 0)
    
    if cl > 0:
        result["kycAssessment"]["currentRatio"] = round(ca / cl, 4)
        if ca < cl:
            result["kycAssessment"]["financialHealth"] = "HIGH RISK"
        else:
            result["kycAssessment"]["financialHealth"] = "LOW RISK"
    
    # Calculate shareholder percentages
    total_shares = result["shareCapital"]["totalIssued"]
    if total_shares > 0:
        for shareholder in result["shareholders"]:
            shareholder["percentage"] = round((shareholder["shares"] / total_shares) * 100, 2)
    
    return result

extract_corporate_info = extract_corporate_info_simple
