from __future__ import annotations
import re
from .rules_base import pick_llp_new_no, pick_old_no, parse_date, normalize_text

def extract_llp(input_data: str | list[str]) -> dict:
    """
    Extracts key fields from an SSM LLP Certificate (Certificate of Registration of Limited Liability Partnership).
    """
    if isinstance(input_data, str):
        blocks = [ln.strip() for ln in input_data.split('\n') if ln.strip()]
    else:
        blocks = [ln for ln in input_data if ln.strip()]
        
    text = normalize_text("\n".join(blocks))

    fields: dict = {
        "docType": "LLP_CERT",
        "documentTitle": None,
        "legalBasis": {},
        "companyName": None,
        "registrationNumber": pick_llp_new_no(text),
        "oldRegistrationNumber": pick_old_no(text),
        "registrationDate": None,
        "type": "LLP (PLT)",
        "validUntil": None,  # No expiry for LLP
        "registeredAddress": None, # Not in certificate
        "branchAddresses": [],     # Not in certificate
        "issuePlace": None,
        "issueDate": None,
        "signingOfficer": None,
        "qrPayload": "",
        "notes": []
    }

    # --- Document Title ---
    # Extract "CERTIFICATE OF REGISTRATION OF LIMITED LIABILITY PARTNERSHIP"
    # Usually split across lines
    title_parts = []
    for ln in blocks[:6]: # Check first 6 lines only to avoid catching footer info
        clean_ln = ln.strip().upper()
        
        # Exclude Act lines or Registrar lines that might match keywords
        if "ACT 2012" in clean_ln or "ACT 743" in clean_ln or "REGISTRAR" in clean_ln:
            continue
            
        if "CERTIFICATE OF REGISTRATION" in clean_ln or "LIMITED LIABILITY PARTNERSHIP" in clean_ln:
             title_parts.append(ln.strip())
    
    if title_parts:
         # Deduplicate and join
         seen = set()
         deduped = []
         for x in title_parts:
             if x not in seen:
                 deduped.append(x)
                 seen.add(x)
         fields["documentTitle"] = " ".join(deduped)

    # --- Legal Basis ---
    # Look for "LIMITED LIABILITY PARTNERSHIPS ACT 2012 (ACT 743)"
    act_re = re.search(r"(LIMITED LIABILITY PARTNERSHIPS ACT 2012\s*\(ACT 743\))", text, re.IGNORECASE)
    if act_re:
        fields["legalBasis"] = {
            "primaryAct": "Limited Liability Partnerships Act 2012 (Act 743)"
        }

    # --- Entity Name ---
    # Usually after "This is to certify that"
    for i, ln in enumerate(blocks):
        if "certify that" in ln.lower():
            # Try to get name from this line or next
            parts = ln.split("certify that", 1)
            candidate = parts[1].strip() if len(parts) > 1 else ""
            
            if not candidate and i + 1 < len(blocks):
                candidate = blocks[i+1].strip()
            
            if candidate:
                # Cleanup name
                candidate = candidate.replace(fields["registrationNumber"] or "", "")
                candidate = candidate.replace(fields["oldRegistrationNumber"] or "", "")
                candidate = re.sub(r'\(\s*-\s*\)', '', candidate)
                fields["companyName"] = candidate.strip(" ,.-")
            break
            
    # Fallback for Name: Look for PLT/LLP
    if not fields["companyName"]:
        for ln in blocks:
            if "PLT" in ln.upper() and len(ln) > 5 and "LLP" not in ln.upper(): # simplistic fallback
                 fields["companyName"] = ln.strip()
                 break

    # --- Dates & Issue Place ---
    for ln in blocks:
        low = ln.lower()
        
        # Registration Date: "was registered on the 11th day of January 2022"
        if "was registered" in low and "on the" in low:
            fields["registrationDate"] = parse_date(ln)
            
        # Issue Date & Place: "Dated at KUALA LUMPUR this 19th day of September 2022"
        if low.startswith("dated at"):
            fields["issueDate"] = parse_date(ln)
            
            # Extract place between "Dated at" and "this"
            place_match = re.search(r"Dated at\s+(.+?)\s+this", ln, re.IGNORECASE)
            if place_match:
                fields["issuePlace"] = place_match.group(1).strip(" ,.")
            else:
                # Fallback simple split if regex fails
                parts = ln.split(" ", 3)
                if len(parts) >= 3:
                     # Attempt to grab everything before "this"
                     rest = ln[len("Dated at"):].strip()
                     if "this" in rest.lower():
                         fields["issuePlace"] = rest.lower().split("this")[0].strip().upper()

    # --- Fallback: Registration Date ---
    # User feedback: Registration date is often the same as issuance date (or should fallback to it).
    if not fields["registrationDate"] and fields["issueDate"]:
        fields["registrationDate"] = fields["issueDate"]
        fields["notes"].append("Registration date inferred from issue date.")

    # --- Signing Officer ---
    # Find "Registrar of Limited Liability Partnerships"
    for i, ln in enumerate(blocks):
        if "registrar of limited liability partnerships" in ln.lower():
            # Look at line above
            if i > 0:
                prev = blocks[i-1].strip()
                # Simple check if it's a name
                if len(prev) > 3 and "dated at" not in prev.lower():
                    fields["signingOfficer"] = prev
            break
            
    # Fix Signing Officer Name (Normalization)
    if fields["signingOfficer"]:
        s = fields["signingOfficer"]
        # Fix OCR noise like "Mae" -> "NOR AZIMAH"
        # Heuristic: If it contains "DATUK" and "AZIZ", assume it's "DATUK NOR AZIMAH ABDUL AZIZ"
        if "DATUK" in s.upper() and "AZIZ" in s.upper():
             fields["signingOfficer"] = "DATUK NOR AZIMAH ABDUL AZIZ"
             fields["notes"].append("Officer name normalized via domain heuristic.")
        elif "NOR AZIMAH" in s.upper():
             fields["signingOfficer"] = "DATUK NOR AZIMAH ABDUL AZIZ"

    return fields
