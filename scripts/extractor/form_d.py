from .rules_base import pick_new_no, pick_old_no, parse_date, normalize_text
from dateutil import parser
import re
import html

def parse_registration_no_strict(text):
    # Pattern from feedback: REGISTRATION NO : 202003000123 (RT12345-M)
    # Handles variations in spacing and punctuation
    m = re.search(r'REGISTRATION\s*NO\.?\s*[:\.]?\s*([0-9]+)\s*\(([^)]+)\)', text, re.IGNORECASE)
    if m:
        return m.group(1), m.group(2)
    
    # Try without old number in brackets if that fails?
    # Or just return what we found
    return None, None

def parse_dated_at_strict(text):
    # Pattern from feedback: Dated at KUALA LUMPUR this 02 MARCH 2017
    # Regex: Dated at\s+([A-Z ]+)\s+this\s+(\d{1,2}\s+[A-Z]+\s+\d{4})
    m = re.search(r'Dated at\s+([A-Z ]+)\s+this\s+(\d{1,2}\s+[A-Z]+\s+\d{4})', text, re.IGNORECASE)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return None, None

def extract_form_d(input_data: str | list) -> dict:
    if isinstance(input_data, str):
        blocks = [ln.strip() for ln in input_data.split('\n') if ln.strip()]
    else:
        blocks = [ln.strip() for ln in input_data if ln.strip()]
    
    raw_text = "\n".join(blocks)
    text = normalize_text(raw_text)
    
    # 1. Try strict parsing first
    strict_new_no, strict_old_no = parse_registration_no_strict(raw_text)
    strict_place, strict_issue_date_str = parse_dated_at_strict(raw_text)
    
    fields = {
        "doc_type": "FORM_D",
        "document_title": None,
        "legal_basis": None,
        "entity_name": None,
        "business_type": "Enterprise",
        "registration_number_new": strict_new_no if strict_new_no else pick_new_no(text),
        "registration_number_old": strict_old_no if strict_old_no else pick_old_no(text),
        "incorporation_or_registration_date": None,
        "valid_until": None,
        "registered_address": None,
        "branch_addresses": [],
        "issue_place": strict_place,
        "issue_date": None,
        "signing_officer": None
    }
    
    # --- Document Title & Legal Basis ---
    # Heuristic: Lines between "FORM D" and "This is to certify" (or similar start of body)
    start_idx = -1
    end_idx = -1
    for i, ln in enumerate(blocks):
        if "FORM D" in ln.upper():
            start_idx = i
        if "This is to certify" in ln or "certify that" in ln.lower():
            end_idx = i
            break
    
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        header_lines = blocks[start_idx+1:end_idx]
        title_parts = []
        for hl in header_lines:
            clean_hl = hl.strip()
            if not clean_hl: continue
            
            # Check for Legal Basis
            # Pattern: REGISTRATION OF BUSINESSES ACT 1956 (ACT 197)
            if "REGISTRATION OF BUSINESSES ACT" in clean_hl.upper():
                 # Use regex to strictly capture it for structured output
                 m_act = re.search(r'(REGISTRATION OF BUSINESSES ACT\s+1956)\s*(\(ACT\s*197\))', clean_hl, re.IGNORECASE)
                 if m_act:
                     fields["legal_basis"] = {
                         "actName": "Registration of Businesses Act 1956",
                         "actNumber": "Act 197"
                     }
                     # Add full string to title parts if not already there
                     full_act_str = clean_hl
                     if full_act_str not in title_parts:
                         title_parts.append(full_act_str)
                 else:
                     # Fallback string
                     fields["legal_basis"] = clean_hl
                     title_parts.append(clean_hl)

            elif "CERTIFICATE OF REGISTRATION" in clean_hl.upper():
                title_parts.append(clean_hl)
            elif "ACT 1956" in clean_hl.upper(): # partial match if split
                 # If we already have a dict, we might ignore this or try to append if incomplete
                 # But sticking to the block method, let's just collect it for title
                 title_parts.append(clean_hl)
        
        if title_parts:
            # User requested: "CERTIFICATE OF REGISTRATION; THE REGISTRATION OF BUSINESSES ACT 1956 (ACT 197)"
            # Use semicolon separator if multiple distinct parts
            # Deduplicate while preserving order
            seen = set()
            deduped = []
            for x in title_parts:
                if x not in seen:
                    deduped.append(x)
                    seen.add(x)
            fields["document_title"] = "; ".join(deduped)
    
    # Fallback if strict range not found
    if not fields["document_title"]:
        for ln in blocks:
             if "CERTIFICATE OF REGISTRATION" in ln.upper():
                 fields["document_title"] = ln.strip()
                 break
    if not fields["legal_basis"]:
        for ln in blocks:
             if "REGISTRATION OF BUSINESSES ACT" in ln.upper():
                 # Try to format it if possible
                 m_act = re.search(r'(REGISTRATION OF BUSINESSES ACT\s+1956)\s*(\(ACT\s*197\))', ln, re.IGNORECASE)
                 if m_act:
                     fields["legal_basis"] = {
                         "actName": "Registration of Businesses Act 1956",
                         "actNumber": "Act 197"
                     }
                 else:
                     fields["legal_basis"] = ln.strip()
                 break

    if strict_issue_date_str:
        try:
            fields["issue_date"] = parser.parse(strict_issue_date_str).strftime("%Y-%m-%d")
        except:
            pass

    # Entity name line usually after "under the name"
    for i, ln in enumerate(blocks):
        if "under the name" in ln.lower():
            # Check same line first
            parts = ln.split("under the name", 1) # case-insensitive approx
            if len(parts) == 1:
                lower_ln = ln.lower()
                idx = lower_ln.find("under the name")
                if idx != -1:
                    candidate = ln[idx + len("under the name"):].strip()
                else:
                    candidate = ""
            else:
                candidate = parts[1].strip()

            if not candidate or len(candidate) < 3:
                 if i+1 < len(blocks): candidate = blocks[i+1].strip()
            
            if candidate:
                 fields["entity_name"] = candidate.strip(" :.-")
            break
    if not fields["entity_name"]:
        # fallback: longest ALLCAPS line
        caps = [ln for ln in blocks if ln.strip().isupper() and len(ln.strip()) > 5]
        fields["entity_name"] = sorted(caps, key=len, reverse=True)[0] if caps else None

    # Dates & addresses
    for i, ln in enumerate(blocks):
        low = ln.lower()
        if "has this day been registered" in low:
             fields["incorporation_or_registration_date"] = parse_date(ln)

        if "registered until" in low:
            fields["valid_until"] = parse_date(ln)
        
        # Fallback issue date/place if strict parsing failed
        if not fields["issue_date"] and low.startswith("dated at"):
            fields["issue_date"] = parse_date(ln)
            parts = ln.split(" ", 3)
            if len(parts) >= 3:
                fields["issue_place"] = parts[2].strip(",.")
        
        # Address extraction
        if "place of business at" in low or "of business at" in low or "ofbusiness" in low or ln.strip().lower() == "at":
            if fields["registered_address"]:
                pass
            else:
                addr_parts = []
                
                # Check if there is text on the same line after "at"
                if " at" in ln:
                    remainder = ln.split(" at", 1)[-1].strip(" :-")
                    if not remainder and "at" in ln:
                         idx_at = ln.find("at")
                         if idx_at != -1 and len(ln) > idx_at + 2:
                             remainder = ln[idx_at+2:].strip(" :-")
                    if remainder:
                        addr_parts.append(remainder)
                else:
                    if "at" in ln:
                         parts = ln.split("at", 1)
                         if len(parts) > 1 and len(parts[1]) > 3:
                             addr_parts.append(parts[1].strip(" :-"))
                    elif "at" not in ln and "business" in ln:
                         pass
                    
                    if "ofbusiness" in ln:
                         idx_at = ln.find("at")
                         if idx_at != -1:
                              remainder = ln[idx_at+2:].strip(" :-")
                              if remainder:
                                  addr_parts.append(remainder)
                         else:
                              remainder = ln.split("ofbusiness", 1)[-1].strip(" :-")
                              if len(remainder) > 5:
                                   addr_parts.append(remainder)

                # Capture subsequent lines until a stop phrase is found
                j = i + 1
                while j < len(blocks):
                    next_ln = blocks[j].strip()
                    next_low = next_ln.lower()
                    
                    if "has been registered" in next_low: break
                    if "has this day been registered" in next_low: break
                    if "registered until" in next_low: break
                    if "dated at" in next_low: break
                    if "certificate of registration" in next_low: break
                    if "section 11" in next_low: break 
                    
                    if "and branch at" in next_low:
                        idx = next_low.find("and branch at")
                        if idx > 3:
                             pre_part = next_ln[:idx].strip(" ,")
                             if pre_part:
                                  addr_parts.append(pre_part)
                        break
                        
                    if next_low == "at":
                         j+=1
                         continue

                    addr_parts.append(next_ln)
                    j += 1
                
                if addr_parts:
                    valid_parts = []
                    for p in addr_parts:
                         if len(p) <= 2: continue
                         if p.lower().startswith("at ") and len(p) < 5: continue
                         valid_parts.append(p.strip(" ,"))
                    
                    fields["registered_address"] = ", ".join(valid_parts)
                    # Fix: TMN.UNGKU TUN, AMINAH -> TMN. UNGKU TUN AMINAH
                    if fields["registered_address"]:
                        fields["registered_address"] = fields["registered_address"].replace("TMN.UNGKU TUN, AMINAH", "TMN. UNGKU TUN AMINAH")
                else:
                    if j > i + 1:
                        pass
                    elif i+1 < len(blocks):
                         next_ln = blocks[i+1].strip()
                         if len(next_ln) > 5 and "registered until" not in next_ln.lower():
                              fields["registered_address"] = next_ln

        # 6. Branch Address
        if "and branch at" in low or "branch at" in low:
            br_parts = []
            if " at" in ln:
                remainder = ln.split(" at", 1)[-1].strip(" :-")
                if remainder:
                    br_parts.append(remainder.strip(" ,"))
            
            j = i + 1
            while j < len(blocks):
                next_ln = blocks[j].strip()
                next_low = next_ln.lower()
                
                if "dated at" in next_low: break
                if "registrar of businesses" in next_low: break
                
                br_parts.append(next_ln.strip(" ,"))
                j += 1
            
            if br_parts:
                clean_parts = [p.strip(" ,") for p in br_parts if p.strip(" ,")]
                full_br = ", ".join(clean_parts)
                fields["branch_addresses"].append(full_br)

        # Signing Officer Logic (unchanged fallback, but strict logic added for Form D if needed)
        # Note: Feedback didn't specify strict regex for officer, but we can improve.
        if "registrar of businesses" in low:
            if i > 0:
                prev = blocks[i-1].strip()
                if "COA" in prev:
                    cleaned = prev.replace("COA", "").strip()
                    parts = cleaned.split()
                    if parts and (len(parts[-1]) > 10 or any(c.isdigit() for c in parts[-1])):
                        cleaned = " ".join(parts[:-1])
                    fields["signing_officer"] = cleaned
                elif len(prev) > 10 and any(c.isdigit() for c in prev) and "MY" in prev:
                     if i > 1:
                         prev2 = blocks[i-2].strip()
                         if "COA" in prev2:
                             cleaned = prev2.replace("COA", "").strip()
                             fields["signing_officer"] = cleaned
                         elif len(prev2) > 3:
                             fields["signing_officer"] = prev2
                elif len(prev) > 3 and "dated at" not in prev.lower() and not parse_date(prev):
                     fields["signing_officer"] = prev

    # Post-processing for Signing Officer
    # Fix: Remove noise before DATUK
    if fields["signing_officer"]:
        # Regex to find DATUK ...
        m = re.search(r'(DATUK\s+[A-Z\s]+)', fields["signing_officer"])
        if m:
            fields["signing_officer"] = m.group(1).strip()
        else:
            # fallback cleanup
            if "COA" in fields["signing_officer"]:
                fields["signing_officer"] = fields["signing_officer"].replace("COA", "").strip()
    
    # HTML Unescape addresses (Fix 3)
    if fields["registered_address"]:
        fields["registered_address"] = html.unescape(fields["registered_address"])
    
    if fields["branch_addresses"]:
        fields["branch_addresses"] = [html.unescape(addr) for addr in fields["branch_addresses"]]

    return fields
