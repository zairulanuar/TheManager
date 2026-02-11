---
created: 2026-02-10
updated: 2026-02-10
---

# Project Memory

## Architecture
- **OCR Strategy**: Remote-First (Hugging Face Spaces).
  - Local fallback is **DISABLED** when `HF_API_URL` is set to ensure minimal server specs.
  - `scripts/ocr_service.py` acts as a lightweight client and parser.
  - Heavy libraries (`paddleocr`) are lazy-loaded only if remote is not configured.
- **Backend**: Next.js (App Router) + Python (Data Extraction Scripts).
- **Database**: PostgreSQL (Prisma ORM).

## Configuration
- `HF_API_URL`: URL for the Hugging Face OCR API.
- `HF_TOKEN`: Authentication token for the API.

## Hugging Face Space Details
- **Space Name**: `zairulanuar/OCR`
- **Container Logs**: `https://huggingface.co/api/spaces/zairulanuar/OCR/logs/run`
- **Build Logs**: `https://huggingface.co/api/spaces/zairulanuar/OCR/logs/build`

## Recent Changes
- Switched to Hugging Face-only OCR to reduce local resource usage (RAM/CPU).
- Patched `scripts/extractor/form_9.py` to fix regex and entity name extraction issues.
