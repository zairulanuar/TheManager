"use server";

import { join } from 'path';
import { spawn } from 'child_process';
import { writeFile, mkdir, access } from "fs/promises";
import { randomUUID } from "crypto";

export async function extractSSMData(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) {
    return { error: "No file provided" };
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Validate file type (Images + PDF)
  const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!validTypes.includes(file.type)) {
    return { error: "Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed." };
  }

  // Ensure temp directory exists
  const uploadDir = join(process.cwd(), "public/uploads/temp/ssm");
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error) {
    // Ignore
  }

  // Generate unique filename
  const ext = file.name.split(".").pop();
  const filename = `${randomUUID()}.${ext}`;
  const filepath = join(uploadDir, filename);

  try {
    await writeFile(filepath, buffer);
  } catch (error) {
    console.error("Error saving file:", error);
    return { error: "Failed to save file for processing" };
  }

  try {
    // Check if file exists
    await access(filepath);

    // Call Python script
    const scriptPath = join(process.cwd(), "scripts", "ocr_service.py");
    
    const output = await new Promise<string>((resolve, reject) => {
        // Use 'python' command. Ensure python is in system PATH.
        const pythonProcess = spawn('python', [scriptPath, filepath]);
        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error("Python Script Error Output:", errorString);
                reject(new Error(`Python script exited with code ${code}`));
            } else {
                resolve(dataString);
            }
        });
    });

    // Parse JSON output
    console.log("Raw Python Output:", output);
    let result: any = {};
    const lines = output.trim().split('\n');
    let parsed = false;
    
    for (let i = lines.length - 1; i >= 0; i--) {
        try {
            result = JSON.parse(lines[i]);
            if (result.success !== undefined || result.error !== undefined) {
                parsed = true;
                break;
            }
        } catch (e) {
            continue;
        }
    }

    if (!parsed) {
        try {
            result = JSON.parse(output);
        } catch(e) {
            throw new Error("Failed to parse OCR response");
        }
    }

    if (result.error) {
        throw new Error(result.error);
    }

    console.log("Server Action Result:", JSON.stringify(result, null, 2));

    const text = result.text || "";
    const structureText = result.structure_text || "";
    const rawResult = result.raw_result || [];
    const extractedData = result.extracted_data || {};
    
    // Cleanup temp file
    // await fs.unlink(filepath); 
    // Maybe keep it for display? Let's return the URL.
    const fileUrl = `/uploads/temp/ssm/${filename}`;

    // Map Python Result to Frontend Format
    // Helper to format address object to string
    const formatAddress = (addr: any) => {
        if (!addr) return "";
        if (typeof addr === 'string') return addr;
        
        // Handle Python output format { address: "...", postcode: "...", country: "..." }
        if (addr.address) {
             let fullAddr = addr.address;
             // Append postcode/country if not already in address (heuristic)
             if (addr.postcode && !fullAddr.includes(addr.postcode)) fullAddr += `, ${addr.postcode}`;
             if (addr.country && !fullAddr.includes(addr.country)) fullAddr += `, ${addr.country}`;
             return fullAddr.replace(/\n/g, ", ");
        }

        const parts = [addr.line1, addr.line2, addr.line3, addr.postcode, addr.city, addr.state, addr.country].filter(Boolean);
        return parts.join(", ");
    };

    const entity = extractedData.entity || {};
    const addresses = extractedData.addresses || {};
    const source = extractedData.source || {};
    const officers = extractedData.officers || {};

    // Handle Business Address from Python (mapped to branchAddresses array)
    const rawBusinessAddr = extractedData.businessAddress || addresses.business;
    const businessAddressList = rawBusinessAddr ? [formatAddress(rawBusinessAddr)] : [];

    const data = {
        docType: extractedData.docType || extractedData.doc_type || "Unknown",
        documentTitle: extractedData.documentTitle || source.document || "",
        legalBasis: extractedData.legalBasis || {},
        
        // Handle nested entity structure (Corporate Profile) or flat structure (others)
        companyName: entity.name || extractedData.companyName || extractedData.entity_name || "",
        registrationNumber: entity.companyNumber || extractedData.registrationNumber || extractedData.registration_number_new || "",
        oldRegistrationNumber: entity.oldNumber || extractedData.oldRegistrationNumber || extractedData.registration_number_old || "",
        registrationDate: entity.incorporationDate || extractedData.registrationDate || extractedData.incorporation_or_registration_date || "",
        type: entity.legalForm || extractedData.type || extractedData.business_type || extractedData.doc_type || "Unknown",
        status: entity.status || "",
        
        validUntil: extractedData.validUntil || extractedData.valid_until || "",
        
        // Address mapping
        registeredAddress: formatAddress(addresses.registered || extractedData.registeredAddress || extractedData.registered_address),
        branchAddresses: businessAddressList.length > 0 ? businessAddressList : (extractedData.branchAddresses || extractedData.branch_addresses || []),
        
        issuePlace: extractedData.issuePlace || extractedData.issue_place || "",
        issueDate: source.printedAt || extractedData.issueDate || extractedData.issue_date || "",
        signingOfficer: extractedData.signingOfficer || extractedData.signing_officer || "",
        qrPayload: extractedData.qrPayload || extractedData.qr_payload || "",
        confidence: extractedData.confidence || 0,
        notes: extractedData.notes || [],
        
        // Advanced Fields
        natureOfBusiness: Array.isArray(extractedData.natureOfBusiness) 
            ? extractedData.natureOfBusiness.join("\n") 
            : (extractedData.natureOfBusiness || ""),
        charges: extractedData.charges || [],
        shareCapital: (() => {
            const sc = extractedData.capital || extractedData.shareCapital || null;
            if (!sc) return null;
            return {
                ...sc,
                issued_myr: sc.totalIssued || sc.issued_myr || 0,
                ordinary_shares: sc.ordinaryShares || sc.ordinary_shares || 0
            };
        })(),
        financials: extractedData.financials || null,
        directors: (officers.directors || extractedData.directors || []).map((d: any) => ({
            ...d,
            idNo: d.ic || d.idNo || "",
            position: d.designation || d.position || ""
        })),
        shareholders: (extractedData.shareholders || []).map((s: any) => ({
            ...s,
            idNo: s.ic || s.idNo || ""
        })),
        kycRiskAssessment: extractedData.kycRiskAssessment || extractedData.kycAssessment || null,

        sourceFile: file.name
    };

    return { 
      success: true, 
      data: data,
      rawText: text,
      structureText: structureText,
      fileUrl: fileUrl,
      rawResult: rawResult, // Pass full structure to UI
      processingTimeMs: result.processing_time_ms || 0,
      trace: result.trace || []
    };

  } catch (error) {
    console.error("OCR Extraction Error:", error);
    return { error: error instanceof Error ? error.message : "Failed to extract data from document" };
  }
}
