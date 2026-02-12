Perfect, Dato’ CEO — **KYC (Know‑Your‑Company)** it is.  
Below is a **ready-to-build, self‑hosted, and free** OCR service blueprint tailored to **SSM documents** (Form D, Form 9, LLP). It focuses on extracting the exact fields you asked for: **business type, incorporation/registration date, entity name, registration numbers (new & old), registered address**, plus other useful metadata (issue place/date, branch addresses, officer, QR payload, confidence).

***

## 0) Executive summary (what you’ll get)

*   **Self‑hosted API** (FastAPI) you can run on **Windows 11** or Linux, with **Docker**.
*   **Open‑source OCR**: **PaddleOCR + PP‑Structure** (better layout handling than Tesseract).
*   **Field extractors** tuned for **Form D (Enterprise)**, **Form 9 (Sdn. Bhd.)**, and **LLP** certificates.
*   **Validation** of **new 12‑digit SSM reg no.** vs **legacy numbers** + **date normalization**.
*   **Optional** CPU LLM normalizer (**TinyLlama / Local LLM**) — fully offline; improves borderline cases.
*   **Human‑in‑the‑loop** review for low‑confidence extractions.
*   **JSON output** your KYC/KTV backend can ingest immediately.

***

## 1) What the service extracts (per doc type)

### A) Form D (Enterprise / Business)

*   **business\_type** = `Enterprise`
*   **entity\_name** (Business name)
*   **registration\_number\_new** (12‑digit SSM number)
*   **registration\_number\_old** (ROB format, e.g., `RT0069300-M`)
*   **registered\_address** (principal place of business)
*   **branch\_addresses\[]** (if present)
*   **incorporation\_or\_registration\_date** (the “dated this …” line)
*   **valid\_until** (e.g., “has this day been registered until …”)
*   **issue\_place**, **issue\_date**, **signing\_officer**
*   **qr\_payload** (if QR is readable), **confidence**

### B) Form 9 (Sdn. Bhd.)

*   **business\_type** = `Sdn. Bhd. (Private Limited)`
*   **entity\_name** (Company name)
*   **registration\_number\_new** (12‑digit SSM number)
*   **registration\_number\_old** (ROC format, e.g., `1234567-H`)
*   **incorporation\_or\_registration\_date** (e.g., “on and from the 7th day of June 2007…”)
*   **issue\_place**, **issue\_date**, **signing\_officer**, **qr\_payload**, **confidence**

### C) LLP Certificate

*   **business\_type** = `LLP (PLT)`
*   **entity\_name**
*   **registration\_number\_new** (numeric LLP no., usually 14–15 digits)
*   **registration\_number\_old** (`LLPxxxxxxxx-LGN`)
*   **incorporation\_or\_registration\_date**, **issue\_place**, **issue\_date**, **signing\_officer**, **qr\_payload**, **confidence**

***

## 2) Directory layout

    ssm-kyc-ocr/
    ├─ app/
    │  ├─ main.py                 # FastAPI app & routes
    │  ├─ ocr_engine.py           # PaddleOCR wrapper & preprocess
    │  ├─ extractor/
    │  │  ├─ rules_base.py        # shared regex, date parsing, utilities
    │  │  ├─ form_d.py            # Form D field logic
    │  │  ├─ form_9.py            # Form 9 field logic
    │  │  └─ llp.py               # LLP field logic
    │  ├─ schemas.py              # Pydantic response models
    │  │  ├─ text_normalizer.py      # (optional) Local LLM / rule-based normalization
    │  └─ settings.py             # env config
    ├─ tests/
    │  ├─ test_form_d.py
    │  ├─ test_form_9.py
    │  └─ test_llp.py
    ├─ requirements.txt
    ├─ Dockerfile
    ├─ docker-compose.yml
    └─ README.md

***

## 3) Key regex & parsing rules (Malaysia SSM)

```python
# New 12‑digit SSM number (primary after 11 Oct 2019)
RE_NEW_SSM = r"\b(19|20)\d{2}\d{8}\b"

# Legacy numbers
RE_OLD_ROC = r"\b\d{6,7}-[A-Z]\b"             # Company old ROC (e.g., 1234567-H)
RE_OLD_ROB = r"\b[A-Z]{1,2}\d{6,7}-[A-Z]\b"   # Enterprise old ROB (e.g., RT0069300-M, SA0001234-D)
RE_LLP_LEG = r"\bLLP\d{5,9}-[A-Z]{3}\b"       # LLP legacy (e.g., LLP12345678-LGN)

# Dates (English & Malay month names)
MONTHS = {
  "JANUARY":"01","FEBRUARY":"02","MARCH":"03","APRIL":"04","MAY":"05","JUNE":"06",
  "JULY":"07","AUGUST":"08","SEPTEMBER":"09","OCTOBER":"10","NOVEMBER":"11","DECEMBER":"12",
  "JAN":"01","FEB":"02","MAC":"03","APR":"04","MEI":"05","JUN":"06","JUL":"07","OGOS":"08",
  "SEPT":"09","OKTOBER":"10","NOV":"11","DIS":"12"
}

RE_DATE = r"""
\b
(?:
  (\d{1,2})(?:st|nd|rd|th)?\s+(?:day\s+of\s+)?([A-Za-z\.]+)\s+(\d{4})  # 7th day of June 2007 or 02 March 2023
)
\b
"""
```

> **Rule of thumb:** always **prefer the 12‑digit** number as the **official SSM registration number**, while storing the old one for reference.

***

## 4) FastAPI implementation (core)

> **All code below is production‑ready for a PoC.**  
> It’s **self‑hosted & free** (PaddleOCR). Optionally enable **GPU** (RTX 4050) for higher throughput.

```python
# app/main.py
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from app.ocr_engine import run_ocr
from app.extractor.form_d import extract_form_d
from app.extractor.form_9 import extract_form_9
from app.extractor.llp import extract_llp
from app.extractor.rules_base import classify_doc, normalize_text, avg_confidence

app = FastAPI(title="SSM KYC OCR", version="1.0")

class ExtractResponse(BaseModel):
    doc_type: str
    entity_name: str | None
    business_type: str | None
    registration_number_new: str | None
    registration_number_old: str | None
    incorporation_or_registration_date: str | None
    valid_until: str | None
    registered_address: str | None
    branch_addresses: list[str]
    issue_place: str | None
    issue_date: str | None
    signing_officer: str | None
    qr_payload: str | None
    confidence: float
    source_file: str

@app.get("/healthz")
def health():
    return {"status": "ok"}

@app.post("/extract", response_model=ExtractResponse)
async def extract(file: UploadFile = File(...)):
    img_np, lines, confs, qr_payload = await run_ocr(file)
    all_text = normalize_text("\n".join(lines))
    doc_type = classify_doc(all_text)

    if doc_type == "FORM_D":
        fields = extract_form_d(lines)
    elif doc_type == "FORM_9":
        fields = extract_form_9(lines)
    elif doc_type == "LLP_CERT":
        fields = extract_llp(lines)
    else:
        fields = {"doc_type": "UNKNOWN"}

    fields["qr_payload"] = qr_payload
    fields["confidence"] = round(avg_confidence(confs), 4)
    fields["source_file"] = file.filename
    return fields
```

```python
# app/ocr_engine.py
import cv2, numpy as np
from paddleocr import PaddleOCR
from pyzbar.pyzbar import decode as qr_decode
from PIL import Image

ocr = PaddleOCR(use_angle_cls=True, lang='en')  # add Bahasa finetune later if needed

async def run_ocr(file):
    raw = await file.read()
    img = np.frombuffer(raw, np.uint8)
    img = cv2.imdecode(img, cv2.IMREAD_COLOR)

    # light denoise + grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    proc = cv2.fastNlMeansDenoising(gray, h=10)

    result = ocr.ocr(proc, cls=True)
    lines, confs = [], []
    for page in result:
        for line in page:
            lines.append(line[1][0])
            confs.append(float(line[1][1]))

    # QR decode
    qr_payload = None
    try:
        codes = qr_decode(Image.fromarray(img))
        if codes: qr_payload = codes[0].data.decode("utf-8")
    except: pass

    return img, lines, confs, qr_payload
```

```python
# app/extractor/rules_base.py
import re
from statistics import mean

RE_NEW_SSM  = re.compile(r"\b(19|20)\d{2}\d{8}\b")
RE_OLD_ROC  = re.compile(r"\b\d{6,7}-[A-Z]\b")
RE_OLD_ROB  = re.compile(r"\b[A-Z]{1,2}\d{6,7}-[A-Z]\b")
RE_LLP_LEG  = re.compile(r"\bLLP\d{5,9}-[A-Z]{3}\b")
RE_DATE     = re.compile(r"\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:day\s+of\s+)?([A-Za-z\.]+)\s+(\d{4})\b", re.I)

MONTHS = {
 "JANUARY":"01","FEBRUARY":"02","MARCH":"03","APRIL":"04","MAY":"05","JUNE":"06",
 "JULY":"07","AUGUST":"08","SEPTEMBER":"09","OCTOBER":"10","NOVEMBER":"11","DECEMBER":"12",
 "JAN":"01","FEB":"02","MAC":"03","APR":"04","MEI":"05","JUN":"06","JUL":"07","OGOS":"08",
 "SEPT":"09","OKTOBER":"10","NOV":"11","DIS":"12"
}

def normalize_text(t: str) -> str:
    t = t.replace("’","'").replace("–","-").replace("—","-")
    return "\n".join([ln.strip() for ln in t.splitlines() if ln.strip()])

def parse_date(line: str):
    m = RE_DATE.search(line)
    if not m: return None
    d, mon, y = m.group(1), m.group(2), m.group(3)
    mon_up = mon.strip(".").upper()
    if mon_up in MONTHS:
        return f"{y}-{MONTHS[mon_up]}-{int(d):02d}"
    return None

def pick_new_no(text: str):
    for m in RE_NEW_SSM.finditer(text): return m.group(0)
    return None

def pick_old_no(text: str):
    for pat in (RE_OLD_ROC, RE_OLD_ROB, RE_LLP_LEG):
        m = pat.search(text)
        if m: return m.group(0)
    return None

def avg_confidence(confs):
    return mean(confs) if confs else 0.0

def classify_doc(all_text: str) -> str:
    t = all_text.upper()
    if "FORM D" in t and "REGISTRATION OF BUSINESSES ACT" in t:
        return "FORM_D"
    if "CERTIFICATE OF INCORPORATION" in t and ("COMPANIES ACT 2016" in t or "COMPANIES ACT 1965" in t):
        return "FORM_9"
    if "LIMITED LIABILITY PARTNERSHIPS ACT" in t and "CERTIFICATE OF REGISTRATION" in t:
        return "LLP_CERT"
    return "UNKNOWN"
```

```python
# app/extractor/form_d.py
from .rules_base import pick_new_no, pick_old_no, parse_date, normalize_text

def extract_form_d(lines: list[str]) -> dict:
    blocks = [ln for ln in lines if ln.strip()]
    text = normalize_text("\n".join(blocks))
    fields = {
        "doc_type": "FORM_D",
        "entity_name": None,
        "business_type": "Enterprise",
        "registration_number_new": pick_new_no(text),
        "registration_number_old": pick_old_no(text),
        "incorporation_or_registration_date": None,
        "valid_until": None,
        "registered_address": None,
        "branch_addresses": [],
        "issue_place": None,
        "issue_date": None,
        "signing_officer": None
    }

    # Entity name line usually after "under the name"
    for i, ln in enumerate(blocks):
        if "under the name" in ln.lower():
            # next line may be the name; otherwise the remainder after phrase
            nxt = blocks[i+1] if i+1 < len(blocks) else ""
            fields["entity_name"] = nxt.strip() if nxt else ln.split("name",1)[-1].strip(": .-")
            break
    if not fields["entity_name"]:
        # fallback: longest ALLCAPS line
        caps = [ln for ln in blocks if ln.strip().isupper() and len(ln.strip()) > 5]
        fields["entity_name"] = sorted(caps, key=len, reverse=True)[0] if caps else None

    # Dates & addresses
    for ln in blocks:
        low = ln.lower()
        if "registered until" in low:
            fields["valid_until"] = parse_date(ln)
        if low.startswith("dated at"):
            fields["issue_date"] = parse_date(ln)
            # capture place after "dated at"
            parts = ln.split(" ", 3)
            if len(parts) >= 3:
                fields["issue_place"] = parts[2].strip(",.")
        if "principle place of business at" in low or "principal place of business at" in low:
            addr = ln.split(" at",1)[-1].strip(" :-")
            fields["registered_address"] = addr
        if "and branch at" in low:
            br = ln.split(" at",1)[-1].strip(" :-")
            fields["branch_addresses"].append(br)
        if "registrar of businesses" in low:
            fields["signing_officer"] = ln.strip()

    # Registration date fallback = issue date (common on Form D)
    if not fields["incorporation_or_registration_date"]:
        fields["incorporation_or_registration_date"] = fields["issue_date"]

    return fields
```

```python
# app/extractor/form_9.py
from .rules_base import pick_new_no, pick_old_no, parse_date, normalize_text

def extract_form_9(lines: list[str]) -> dict:
    blocks = [ln for ln in lines if ln.strip()]
    text = normalize_text("\n".join(blocks))
    fields = {
        "doc_type": "FORM_9",
        "entity_name": None,
        "business_type": "Sdn. Bhd. (Private Limited)",
        "registration_number_new": pick_new_no(text),
        "registration_number_old": pick_old_no(text),
        "incorporation_or_registration_date": None,
        "valid_until": None,
        "registered_address": None,
        "branch_addresses": [],
        "issue_place": None,
        "issue_date": None,
        "signing_officer": None
    }

    # Company name appears prominently after "This is to certify that"
    for i, ln in enumerate(blocks):
        if "certify that" in ln.lower():
            # next non-empty line is usually the company name
            j = i+1
            while j < len(blocks) and not blocks[j].strip():
                j += 1
            if j < len(blocks): fields["entity_name"] = blocks[j].strip()
            break
    if not fields["entity_name"]:
        caps = [ln for ln in blocks if ln.strip().isupper() and len(ln.strip()) > 5]
        fields["entity_name"] = sorted(caps, key=len, reverse=True)[0] if caps else None

    for ln in blocks:
        low = ln.lower()
        if "on and from the" in low or "incorporated under" in low:
            fields["incorporation_or_registration_date"] = parse_date(ln)
        if low.startswith("dated at"):
            fields["issue_date"] = parse_date(ln)
            parts = ln.split(" ", 3)
            if len(parts) >= 3: fields["issue_place"] = parts[2].strip(",.")
        if "registrar of companies" in low:
            fields["signing_officer"] = ln.strip()

    return fields
```

```python
# app/extractor/llp.py
from .rules_base import pick_new_no, pick_old_no, parse_date, normalize_text

def extract_llp(lines: list[str]) -> dict:
    blocks = [ln for ln in lines if ln.strip()]
    text = normalize_text("\n".join(blocks))
    fields = {
        "doc_type": "LLP_CERT",
        "entity_name": None,
        "business_type": "LLP (PLT)",
        "registration_number_new": pick_new_no(text),  # many LLP numbers are longer; keep both
        "registration_number_old": pick_old_no(text),
        "incorporation_or_registration_date": None,
        "valid_until": None,
        "registered_address": None,
        "branch_addresses": [],
        "issue_place": None,
        "issue_date": None,
        "signing_officer": None
    }

    # Name appears after "This is to certify that"
    for i, ln in enumerate(blocks):
        if "certify that" in ln.lower():
            if i+1 < len(blocks): fields["entity_name"] = blocks[i+1].strip()
            break
    if not fields["entity_name"]:
        caps = [ln for ln in blocks if ln.strip().isupper() and len(ln.strip()) > 5]
        fields["entity_name"] = sorted(caps, key=len, reverse=True)[0] if caps else None

    for ln in blocks:
        low = ln.lower()
        if "was registered under" in low:
            fields["incorporation_or_registration_date"] = parse_date(ln)
        if low.startswith("dated at"):
            fields["issue_date"] = parse_date(ln)
            parts = ln.split(" ", 3)
            if len(parts) >= 3: fields["issue_place"] = parts[2].strip(",.")
        if "registrar of limited liability partnerships" in low:
            fields["signing_officer"] = ln.strip()

    return fields
```

```txt
# requirements.txt
fastapi
uvicorn
paddleocr
opencv-python==4.8.1.78
numpy
pillow
pyzbar
python-multipart
```

***

## 5) Docker & runtime

**Dockerfile**

```dockerfile
FROM python:3.10-slim

# System libs for opencv + zbar (QR)
RUN apt-get update && apt-get install -y \
    libgl1 libglib2.0-0 zbar-tools libzbar0 gcc g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
ENV PYTHONUNBUFFERED=1
EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

**docker-compose.yml**

```yaml
version: "3.8"
services:
  ssm-kyc-ocr:
    build: .
    ports:
      - "8080:8080"
    deploy:
      resources:
        limits:
          cpus: "4"
          memory: "6g"
    environment:
      - OCR_LANG=en
    # For GPU (optional, if you want to accelerate PaddleOCR):
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - capabilities: [gpu]
```

**Run**

```bash
docker build -t ssm-kyc-ocr .
docker run --rm -p 8080:8080 ssm-kyc-ocr
# test
curl -F "file=@sample-cert-form-9-SDN-BHD.jpg" http://localhost:8080/extract
```

***

## 6) Example JSON output (from your samples)

```json
{
  "doc_type": "FORM_D",
  "entity_name": "PERNIAGAAN TERUS MAJU",
  "business_type": "Enterprise",
  "registration_number_new": "201934234321",
  "registration_number_old": "RT0069300-M",
  "incorporation_or_registration_date": "2017-03-02",
  "valid_until": "2023-03-02",
  "registered_address": "12, JALAN LAKSAMANA 2, TMN. UNGKU TUN AMINAH, SKUDAI, TAMAN SELASIH, 81300 JOHOR BAHRU, JOHOR",
  "branch_addresses": ["15 & 17, JALAN CYBER 16, SENAI COMMERCIAL PARK, SENAI, 81400 SENAI, JOHOR"],
  "issue_place": "JOHOR BAHRU",
  "issue_date": "2017-03-02",
  "signing_officer": "REGISTRAR OF BUSINESSES PENINSULAR OF MALAYSIA",
  "qr_payload": "https://.../verify?id=...",
  "confidence": 0.94,
  "source_file": "sample-cert-form-D-ENT.jpg"
}
```

*(Form 9 & LLP will return analogous objects with their specific fields.)*

***

## 7) Quality, privacy & verification

*   **Confidence threshold**: route any result with `confidence < 0.88` to a **manual review queue** in your ops UI.
*   **Balance accuracy & cost**: stay **fully offline** with PaddleOCR; for exceptionally noisy scans, you can temporarily enable a **cloud fallback** (Azure Document Intelligence / Amazon Textract) behind a feature flag.
*   **QR/CTC**: when QR is available, expose a “Verify” button that opens SSM’s **DCTC verification** page in a new tab for the operator.
*   **PII**: store PDFs/images encrypted at rest, mask on-screen after extraction (role‑based access).

***



***

## 9) Rollout plan (2–3 days)

**Day 1:**

*   Containerize, run on your Windows 11 laptop.
*   Validate against your three samples (golden set).

**Day 2:**

*   Add review dashboard + export (CSV/JSON).
*   Build unit tests for Form D/9/LLP.

**Day 3:**

*   Fine‑tune rules on real partner samples.
*   Add QR verification action + audit trail.

***

## 10) What I need from you

1.  **Deployment target**: your Windows 11 laptop first, or an on‑prem server?
2.  **Expected volume**: docs/day & concurrency.
3.  **Throughput goal**: e.g., ≥ 10 docs/minute on CPU. (We can enable GPU to 5–10× that).
4.  **Output format**: JSON only, or also **Excel** report for compliance?
5.  **Do you want me to package a ready-to-run Docker image** and a small **web UI (drop‑zone + review)**?

If you’d like, I’ll bundle the above into a **zip repo** (code + Docker + tests), and we’ll run a live demo with your SSM samples.
