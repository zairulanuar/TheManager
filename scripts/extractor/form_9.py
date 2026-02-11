from __future__ import annotations
import re
from .rules_base import pick_new_no, pick_old_no, parse_date, normalize_text

# Clean, compiled patterns
NEW_SSM_RE      = re.compile(r"\b(19|20)\d{2}\d{8}\b", re.I)  # 12-digit SSM: YYYY + 8 digits
ISSUE_PLACE_RE  = re.compile(r"^dated at\s+([A-Za-z\.\s]+?)\s+this\b", re.I)

def _next_nonempty(blocks: list[str], start: int) -> str | None:
    j = start + 1
    while j < len(blocks) and not blocks[j].strip():
        j += 1
    return blocks[j].strip() if j < len(blocks) else None

def _clean_entity(candidate: str, new_no: str | None, old_no: str | None) -> str:
    s = candidate or ""
    # Remove any registration numbers embedded in the name line
    for token in filter(None, [new_no, old_no]):
        s = s.replace(token, "")
    # Remove leftover parentheses artifacts
    s = s.replace("()", "").replace("(-)", "")
    # Collapse spaces and trim punctuation
    s = re.sub(r"\s{2,}", " ", s)
    return s.strip(" ,.-")

def extract_form_9(input_data: str | list[str]) -> dict:
    """
    Extracts key fields from an SSM Form 9 (Certificate of Incorporation of Private Company).
    Returns a dict ready for serialization.
    """
    # Normalize input lines
    if isinstance(input_data, str):
        blocks = [ln.strip() for ln in input_data.split('\n') if ln.strip()]
    else:
        blocks = [ln for ln in input_data if ln and ln.strip()]
        
    text   = normalize_text("\n".join(blocks))

    # --- Pre-processing Fixes (Ported from HF Space app.py) ---
    # Fix "JATUK" -> "DATUK"
    text = re.sub(r'\bJ\s*A\s*T\s*U\s*K\b', 'DATUK', text)
    
    # Fix "tof 7 REGISTRAR" -> "REGISTRAR"
    text = re.sub(r'tof\s*[\d7]+\s*REGISTRAR', 'REGISTRAR', text, flags=re.IGNORECASE)

    # Fix "7*" / "7®" -> "7th" in date contexts
    text = re.sub(r'(\d+)\s*[®°"*]+\s*day', r'\1th day', text)
    text = re.sub(r'(\d+)\s*/\s*(\d+)[®°"*]+\s*day', r'\1th day', text)

    # Fix "Dated at KL" location artifacts
    text = re.sub(r'Dated at\s+(?:KE|K1|K\|)', 'Dated at KL', text, flags=re.IGNORECASE)

    # Fix Officer Name "NOR ABDUL AZIZ" -> "NOR AZIMAH ABDUL AZIZ"
    text = re.sub(r'NOR\s*ABDUL\s*AZIZ', 'NOR AZIMAH ABDUL AZIZ', text)

    # Fix "is 2 private company" -> "is a private company"
    text = re.sub(r'is\s*2\s*private\s*company', 'is a private company', text)
    
    # Re-split into blocks after normalization
    blocks = [ln.strip() for ln in text.split('\n') if ln.strip()]

    fields: dict = {
        "docType": "FORM_9",
        "documentTitle": "Certificate of Incorporation of Private Company",
        "legalBasis": {
            "primaryAct": "Companies Act 2016 (Act 777)",
            "incorporationReference": "Companies Act 1965"
        },
        "companyName": None,
        "type": "Sdn. Bhd. (Private Limited)",
        "registrationNumber": None,
        "oldRegistrationNumber": None,
        "registrationDate": None,
        "validUntil": None,
        "registeredAddress": None,
        "branchAddresses": [],
        "issuePlace": None,
        "issueDate": None,
        "signingOfficer": None,
        "qrPayload": "",
        "notes": []
    }

    # --- Registration numbers ---
    fields["registrationNumber"] = pick_new_no(text)
    if not fields["registrationNumber"]:
        m = NEW_SSM_RE.search(text)
        if m:
            fields["registrationNumber"] = m.group(0)

    fields["oldRegistrationNumber"] = pick_old_no(text)

    # --- Entity name ---
    # 1) Prefer the line *after* the "This is to certify that" line.
    for i, ln in enumerate(blocks):
        if "certify that" in ln.lower():
            name = _next_nonempty(blocks, i) or ln.split("certify that", 1)[-1].strip()
            name = _clean_entity(name, fields["registrationNumber"], fields["oldRegistrationNumber"])
            if len(name) > 3:
                fields["companyName"] = name
                break

    # 2) Fallbacks: lines ending with SDN. BHD. / BHD. / BERHAD / SDNBHD
    if not fields["companyName"]:
        priority_caps = [
            ln.strip() for ln in blocks
            if ln.strip().upper().endswith(("SDN. BHD.", "BHD.", "BERHAD", "SDNBHD"))
            and len(ln.strip()) > 5
        ]
        if priority_caps:
            fields["companyName"] = _clean_entity(priority_caps[0],
                                                  fields["registrationNumber"],
                                                  fields["oldRegistrationNumber"])
        else:
            # 3) Longest ALL‑CAPS line minus obvious headers
            exclusions = {
                "COMPANIES ACT", "CERTIFICATE OF INCORPORATION", "MALAYSIA",
                "SECTION 17", "FORM 9", "PRIVATE COMPANY", "LIMITED BY SHARES"
            }
            caps = [
                ln.strip() for ln in blocks
                if ln.strip().isupper() and len(ln.strip()) > 5
                and not any(ex in ln.upper() for ex in exclusions)
            ]
            if caps:
                fields["companyName"] = _clean_entity(sorted(caps, key=len, reverse=True)[0],
                                                      fields["registrationNumber"],
                                                      fields["oldRegistrationNumber"])

    # --- Dates & Issue place ---
    for ln in blocks:
        low = ln.lower()

        # Incorporation date: "is, on and from the 7th day of June 2007, ..."
        if "on and from the" in low or "incorporated under" in low:
            # Try specific regex first
            m_date = re.search(r"on and from the\s+(\d{1,2})(?:st|nd|rd|th)?\s+day of\s+([A-Za-z]+)\s+(\d{4})", ln, re.IGNORECASE)
            if m_date:
                try:
                    from datetime import datetime
                    d_str = f"{m_date.group(1)} {m_date.group(2)} {m_date.group(3)}"
                    dt = datetime.strptime(d_str, "%d %B %Y")
                    fields["registrationDate"] = dt.strftime("%Y-%m-%d")
                except:
                    fields["registrationDate"] = parse_date(ln)
            else:
                fields["registrationDate"] = parse_date(ln)

        # Issue date & place: "Dated at KL this 7th day of June 2007."
        if low.startswith("dated at"):
            fields["issueDate"] = parse_date(ln)
            place_m = ISSUE_PLACE_RE.search(ln)
            if place_m:
                fields["issuePlace"] = place_m.group(1).strip(" ,.")

        # Signing officer: find the name above "Registrar of Companies"
        if "registrar of companies" in low or "pendaftar syarikat" in low:
            idx = blocks.index(ln)
            for k in range(idx - 1, -1, -1):
                prev = blocks[k].strip()
                prev_low = prev.lower()
                # stop scanning upward at major separators
                if "dated at" in prev_low or "certify that" in prev_low:
                    break
                # ignore serials and QR codes
                if sum(c.isdigit() for c in prev) > 6:
                    continue
                if len(prev) >= 3:
                    fields["signingOfficer"] = prev
                    break
            if not fields["signingOfficer"]:
                fields["signingOfficer"] = ln.strip()
                
    # --- Clean Signing Officer Name ---
    if fields["signingOfficer"]:
        s = fields["signingOfficer"]
        
        # Specific fix for common officer (DATUK NOR AZIMAH ABDUL AZIZ)
        m_officer = re.search(r"(DATUK\s+NOR\s+AZIMAH\s+ABDUL\s+AZIZ)", s, re.IGNORECASE)
        if m_officer:
            fields["signingOfficer"] = m_officer.group(1).upper()
        else:
            # Remove leading non-alpha characters (like ) or ( or digits)
            # e.g. ")ATUK" -> "DATUK" if we assume it's a D, but safer to just strip punctuation
            # If it starts with ) or (, it's likely a typo for D or just noise.
            
            # Replace common OCR typos for DATUK at start
            if s.startswith(")ATUK") or s.startswith("(ATUK"):
                s = "DATUK" + s[5:]
            elif s.startswith(")ATO"):
                s = "DATO" + s[4:]
                
            # Strip leading punctuation/digits
            s = re.sub(r"^[^A-Za-z]+", "", s)
            fields["signingOfficer"] = s.strip()

    # --- Fallback: Registration Date ---
    # In Form 9, the issue date (at the bottom) is typically the same as the registration date.
    # If explicit registration date extraction failed, use issue date.
    if not fields["registrationDate"] and fields["issueDate"]:
        fields["registrationDate"] = fields["issueDate"]
        fields["notes"].append("Registration date inferred from issue date.")

    # --- Optional: Registered address (rare on Form 9) ---
    # User feedback: Form 9 does not contain this.
    # Removed logic to prevent false positives.
    
    # Add notes
    if fields["signingOfficer"] == "DATUK NOR AZIMAH ABDUL AZIZ":
        fields["notes"].append("Officer name normalized via domain heuristic.")
    if "7th day" in text:
        fields["notes"].append("Ordinals normalized (7th).")

    return fields
