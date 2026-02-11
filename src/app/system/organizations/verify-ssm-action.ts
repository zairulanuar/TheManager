"use server";

import { join } from 'path';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';

export async function verifySSM(fileUrl: string, businessRegNumber?: string) {
  if (!fileUrl) {
    return { error: "Missing file" };
  }

  // fileUrl is like "/uploads/organizations/documents/..." OR "/api/secure-files?file=..."
  // Convert to absolute path.
  let absolutePath: string;
  
  if (fileUrl.startsWith('/api/secure-files')) {
      const url = new URL(fileUrl, "http://dummy-base"); // Base is needed for relative URLs
      const filePath = url.searchParams.get("file");
      if (!filePath) return { error: "Invalid secure file URL" };
      
      // Prevent directory traversal just in case
      if (filePath.includes("..")) return { error: "Invalid file path" };
      
      absolutePath = join(process.cwd(), "storage/private", filePath);
  } else {
      // Legacy public path
      const relativePath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
      absolutePath = join(process.cwd(), "public", relativePath);
  }

  try {
    // Check if file exists
    await fs.access(absolutePath);

    // Call Python script
    const scriptPath = join(process.cwd(), "scripts", "ocr_service.py");
    
    const output = await new Promise<string>((resolve, reject) => {
        // Use 'python' command. Ensure python is in system PATH.
        const pythonProcess = spawn('python', [scriptPath, absolutePath]);
        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
            // PaddleOCR might output info/warnings to stderr, we collect but don't fail immediately unless exit code != 0
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                // If code is not 0, it's an error. 
                // However, sometimes stderr has non-critical warnings.
                console.error("Python Script Error Output:", errorString);
                reject(new Error(`Python script exited with code ${code}`));
            } else {
                resolve(dataString);
            }
        });
    });

    // Parse JSON output
    // We try to find the last valid JSON line, as there might be some print outputs from libs
    let result: any = {};
    const lines = output.trim().split('\n');
    let parsed = false;
    
    // Iterate backwards to find the JSON result
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
        // If simple parse fails, try parsing the whole output if it was single line
        try {
            result = JSON.parse(output);
        } catch(e) {
            console.error("Raw OCR Output:", output);
            throw new Error("Failed to parse OCR response");
        }
    }

    if (result.error) {
        throw new Error(result.error);
    }

    const text = result.text || "";
    
    // Normalize text and BRN for comparison
    // Remove spaces, dashes, special chars to make comparison robust
    // Malaysian BRN often has format like 201901000005 or 123456-A
    // We strip everything except alphanumeric
    const cleanText = text.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    
    let isVerified = false;
    if (businessRegNumber) {
        const cleanBRN = businessRegNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        // Check if the cleaned BRN exists in the cleaned extracted text
        isVerified = cleanText.includes(cleanBRN);
    } else {
        // If no BRN provided, we can't verify, but we can return data.
        // Or if we successfully extracted a BRN from the doc, we could consider that "verified" in a sense?
        // But strictly speaking, "verification" implies matching against a known value.
        // So we'll leave verified as false or maybe undefined? 
        // Let's keep it false for now, as we haven't verified against user input.
    }
    
    // Normalize keys for frontend consistency (Matching extract-ssm-data.ts logic)
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

    const rawData = result.extracted_data || {};
    const entity = rawData.entity || {};
    const addresses = rawData.addresses || {};
    const source = rawData.source || {};
    const officers = rawData.officers || {};

    // Handle Business Address from Python (mapped to branchAddresses array)
    const rawBusinessAddr = rawData.businessAddress || addresses.business;
    const businessAddressList = rawBusinessAddr ? [formatAddress(rawBusinessAddr)] : [];

    const extractedData = {
        // Handle nested entity structure (Corporate Profile) or flat structure (others)
        companyName: entity.name || rawData.companyName || rawData.entity_name || "",
        registrationNumber: entity.companyNumber || rawData.registrationNumber || rawData.registration_number_new || "",
        oldRegistrationNumber: entity.oldNumber || rawData.oldRegistrationNumber || rawData.registration_number_old || "",
        registrationDate: entity.incorporationDate || rawData.registrationDate || rawData.incorporation_or_registration_date || "",
        companyType: entity.legalForm || rawData.type || rawData.business_type || rawData.company_type || rawData.doc_type || "Unknown",
        status: entity.status || "",
        
        validUntil: rawData.validUntil || rawData.valid_until || "",
        
        // Address mapping
        registeredAddress: formatAddress(addresses.registered || rawData.registeredAddress || rawData.registered_address),
        branchAddresses: businessAddressList.length > 0 ? businessAddressList : (rawData.branchAddresses || rawData.branch_addresses || []),
        
        issuePlace: rawData.issuePlace || rawData.issue_place || "",
        issueDate: source.printedAt || rawData.issueDate || rawData.issue_date || "",
        
        // Advanced Fields
        natureOfBusiness: Array.isArray(rawData.natureOfBusiness) 
            ? rawData.natureOfBusiness.join("\n") 
            : (rawData.nature_of_business || rawData.natureOfBusiness || ""),
            
        charges: rawData.charges || [],
        
        shareCapital: (() => {
            const sc = rawData.capital || rawData.shareCapital || rawData.share_capital || null;
            if (!sc) return null;
            return {
                ...sc,
                issued_myr: sc.totalIssued || sc.issued_myr || 0,
                ordinary_shares: sc.ordinaryShares || sc.ordinary_shares || 0
            };
        })(),
        
        financials: rawData.financials || null,
        
        directors: (officers.directors || rawData.directors || []).map((d: any) => ({
            ...d,
            idNo: d.ic || d.idNo || "",
            position: d.designation || d.position || ""
        })),
        
        shareholders: (rawData.shareholders || []).map((s: any) => ({
            ...s,
            idNo: s.ic || s.idNo || ""
        })),
        
        kycRiskAssessment: rawData.kycRiskAssessment || rawData.kyc_risk_assessment || rawData.kycAssessment || null
    };

    return { 
      success: true, 
      verified: isVerified,
      extractedTextSnippet: text.substring(0, 100) + "...",
      extractedData: extractedData,
      trace: result.trace || [],
      processingTimeMs: result.processing_time_ms || 0
    };
  } catch (error) {
    console.error("OCR Verification Error:", error);
    return { error: error instanceof Error ? error.message : "Failed to process document for verification" };
  }
}
