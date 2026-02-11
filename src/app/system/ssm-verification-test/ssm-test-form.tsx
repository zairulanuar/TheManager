"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { extractSSMData } from "./extract-ssm-data";
import { toast } from "sonner";

export default function SSMTestForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [fileUrl, setFileUrl] = useState<string>("");
    const [extractedData, setExtractedData] = useState<any>(null);
    const [rawText, setRawText] = useState<string>("");
    const [structureText, setStructureText] = useState<string>("");

    // Form States
    const [companyName, setCompanyName] = useState("");
    const [regNumber, setRegNumber] = useState("");
    const [oldRegNumber, setOldRegNumber] = useState("");
    const [companyType, setCompanyType] = useState("");
    const [regDate, setRegDate] = useState("");
    const [validUntil, setValidUntil] = useState("");
    const [registeredAddress, setRegisteredAddress] = useState("");
    const [branchAddresses, setBranchAddresses] = useState<string[]>([]);
    const [issuePlace, setIssuePlace] = useState("");
    const [issueDate, setIssueDate] = useState("");
    const [signingOfficer, setSigningOfficer] = useState("");
    const [qrPayload, setQrPayload] = useState("");
    const [confidence, setConfidence] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [backendTime, setBackendTime] = useState(0);
    const [traceLogs, setTraceLogs] = useState<string[]>([]);

    // Advanced Corporate Info States
    const [natureOfBusiness, setNatureOfBusiness] = useState("");
    const [shareCapital, setShareCapital] = useState<any>(null);
    const [financials, setFinancials] = useState<any>(null);
    const [charges, setCharges] = useState<any[]>([]);
    const [directors, setDirectors] = useState<any[]>([]);
    const [shareholders, setShareholders] = useState<any[]>([]);
    const [kycRiskAssessment, setKycRiskAssessment] = useState<any>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isLoading) {
            const startTime = Date.now();
            setElapsedTime(0);
            interval = setInterval(() => {
                setElapsedTime((Date.now() - startTime) / 1000);
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setExtractedData(null);
        setRawText("");
        
        // Reset form
        setCompanyName("");
        setRegNumber("");
        setOldRegNumber("");
        setCompanyType("");
        setRegDate("");
        setValidUntil("");
        setRegisteredAddress("");
        setBranchAddresses([]);
        setIssuePlace("");
        setIssueDate("");
        setSigningOfficer("");
        setQrPayload("");
        setConfidence(0);
        setBackendTime(0);
        setTraceLogs([]);
        setNatureOfBusiness("");
        setKycRiskAssessment(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const result = await extractSSMData(formData);
            console.log("OCR Result:", result);
            
            if (result.success) {
                toast.success("Document processed successfully");
                setFileUrl(result.fileUrl || "");
                setExtractedData(result.data);
                setRawText(result.rawText || "");
                setStructureText(result.structureText || "");
                
                // Auto-fill form
                if (result.data) {
                    setCompanyName(result.data.companyName || "");
                    setRegNumber(result.data.registrationNumber || "");
                    setOldRegNumber(result.data.oldRegistrationNumber || "");
                    setCompanyType(result.data.type || "");
                    setRegDate(result.data.registrationDate || "");
                    setValidUntil(result.data.validUntil || "");
                    setRegisteredAddress(result.data.registeredAddress || "");
                    setBranchAddresses(result.data.branchAddresses || []);
                    setIssuePlace(result.data.issuePlace || "");
                    setIssueDate(result.data.issueDate || "");
                    setSigningOfficer(result.data.signingOfficer || "");
                    setQrPayload(result.data.qrPayload || "");
                    setConfidence(result.data.confidence || 0);
                    setBackendTime((result.processingTimeMs || 0) / 1000);
                    setTraceLogs(result.trace || []);

                    // Set Advanced Fields
                    setNatureOfBusiness(result.data.natureOfBusiness || "");
                    setShareCapital(result.data.shareCapital || null);
                    setFinancials(result.data.financials || null);
                    setCharges(result.data.charges || []);
                    setDirectors(result.data.directors || []);
                    setShareholders(result.data.shareholders || []);
                    setKycRiskAssessment(result.data.kycRiskAssessment || null);
                }
            } else {
                toast.error(result.error || "Failed to process document");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred during processing");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Upload & Form */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Upload SSM Certificate</CardTitle>
                        <CardDescription>
                            Upload a Form 9, Form D, or LLP certificate to auto-fill the details below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 flex flex-col items-center justify-center w-full h-32 bg-muted/10 relative overflow-hidden">
                                {fileUrl ? (
                                    <div className="flex flex-col items-center justify-center text-center p-2">
                                        {fileUrl.endsWith('.pdf') ? (
                                            <FileText className="h-8 w-8 text-primary mb-2" />
                                        ) : (
                                            <img src={fileUrl} alt="Preview" className="h-20 object-contain mb-2" />
                                        )}
                                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                            Document Uploaded
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                        <span className="text-xs text-muted-foreground">Click to Upload</span>
                                    </div>
                                )}
                                {isLoading && (
                                    <div className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center z-10">
                                        <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                        <span className="text-sm font-medium">{elapsedTime.toFixed(1)}s</span>
                                    </div>
                                )}
                                <Input 
                                    type="file" 
                                    accept="image/*,.pdf"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileUpload}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Business Details</CardTitle>
                        <CardDescription>
                            Review and edit the extracted information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input 
                                id="companyName" 
                                value={companyName} 
                                onChange={(e) => setCompanyName(e.target.value)} 
                                placeholder="Auto-filled from document..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="regNumber">Registration Number (New Format)</Label>
                            <Input 
                                id="regNumber" 
                                value={regNumber} 
                                onChange={(e) => setRegNumber(e.target.value)} 
                                placeholder="e.g. 201934234321"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="oldRegNumber">Old Registration Number</Label>
                            <Input 
                                id="oldRegNumber" 
                                value={oldRegNumber} 
                                onChange={(e) => setOldRegNumber(e.target.value)} 
                                placeholder="e.g. RT0069300-M"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="regDate">Registration Date</Label>
                            <Input 
                                id="regDate" 
                                value={regDate} 
                                onChange={(e) => setRegDate(e.target.value)} 
                                placeholder="Auto-filled from document..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyType">Company Type</Label>
                            <Input 
                                id="companyType" 
                                value={companyType} 
                                onChange={(e) => setCompanyType(e.target.value)} 
                                placeholder="Auto-detected..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="validUntil">Valid Until</Label>
                            <Input 
                                id="validUntil" 
                                value={validUntil} 
                                onChange={(e) => setValidUntil(e.target.value)} 
                                placeholder="e.g. 19 MARCH 2026"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="registeredAddress">Registered Address</Label>
                            <textarea 
                                id="registeredAddress" 
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={registeredAddress} 
                                onChange={(e) => setRegisteredAddress(e.target.value)} 
                                placeholder="Extracted address..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="branchAddresses">Branch Addresses (One per line)</Label>
                            <textarea 
                                id="branchAddresses" 
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={branchAddresses.join("\n")} 
                                onChange={(e) => setBranchAddresses(e.target.value.split("\n"))} 
                                placeholder="Extracted branch addresses..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="issuePlace">Issue Place</Label>
                                <Input 
                                    id="issuePlace" 
                                    value={issuePlace} 
                                    onChange={(e) => setIssuePlace(e.target.value)} 
                                    placeholder="e.g. KUALA LUMPUR"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="issueDate">Issue Date</Label>
                                <Input 
                                    id="issueDate" 
                                    value={issueDate} 
                                    onChange={(e) => setIssueDate(e.target.value)} 
                                    placeholder="e.g. 19 MARCH 2025"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signingOfficer">Signing Officer</Label>
                            <Input 
                                id="signingOfficer" 
                                value={signingOfficer} 
                                onChange={(e) => setSigningOfficer(e.target.value)} 
                                placeholder="e.g. ZAHRAH BT ABDUL JALIL"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="natureOfBusiness">Nature of Business</Label>
                            <textarea 
                                id="natureOfBusiness" 
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={natureOfBusiness} 
                                onChange={(e) => setNatureOfBusiness(e.target.value)} 
                                placeholder="Extracted nature of business..."
                            />
                        </div>

                        {/* Advanced Corporate Info Sections */}
                        {shareCapital && (
                            <div className="space-y-2 pt-4 border-t">
                                <h3 className="font-semibold text-sm">Share Capital</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Issued Capital (MYR)</Label>
                                        <Input value={shareCapital.issued_myr?.toLocaleString() || "0"} readOnly />
                                    </div>
                                </div>
                            </div>
                        )}

                        {financials && (
                            <div className="space-y-2 pt-4 border-t">
                                <h3 className="font-semibold text-sm">Financial Summary</h3>
                                
                                {/* Auditor Info */}
                                {(financials.auditorName || financials.auditorAddress) && (
                                    <div className="mb-4 bg-muted/30 p-2 rounded-md border text-xs">
                                        <div className="font-semibold mb-1">Auditor Details</div>
                                        {financials.auditorName && <div>Name: {financials.auditorName}</div>}
                                        {financials.auditorAddress && <div>Address: {financials.auditorAddress}</div>}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Balance Sheet */}
                                    {financials.balanceSheet && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-semibold underline">Balance Sheet</h4>
                                            <div className="grid gap-1 text-xs">
                                                {Object.entries(financials.balanceSheet).map(([key, val]: [string, any]) => (
                                                    <div key={key} className="flex justify-between border-b border-border/50 pb-1">
                                                        <span className="text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                        <span className="font-mono">{typeof val === 'number' ? val.toLocaleString() : val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Income Statement */}
                                    {financials.incomeStatement && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-semibold underline">Income Statement</h4>
                                            <div className="grid gap-1 text-xs">
                                                {Object.entries(financials.incomeStatement).map(([key, val]: [string, any]) => (
                                                    <div key={key} className="flex justify-between border-b border-border/50 pb-1">
                                                        <span className="text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                        <span className="font-mono">{typeof val === 'number' ? val.toLocaleString() : val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Fallback for flat financials (backward compatibility) */}
                                {!financials.balanceSheet && !financials.incomeStatement && Object.keys(financials).length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {Object.entries(financials).map(([key, val]: [string, any]) => {
                                            if (typeof val === 'object') return null; // Skip objects to avoid crash
                                            return (
                                                <div key={key} className="flex justify-between border-b pb-1">
                                                    <span className="text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                    <span className="font-mono">{typeof val === 'number' ? val.toLocaleString() : val}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                 )}
                             </div>
                         )}

                        {charges.length > 0 && (
                            <div className="space-y-2 pt-4 border-t">
                                <h3 className="font-semibold text-sm">Company Charges ({charges.length})</h3>
                                <div className="bg-muted/30 rounded-md border text-xs">
                                    {charges.map((c, i) => (
                                        <div key={i} className="p-2 border-b last:border-0 flex justify-between">
                                            <div>
                                                <div className="font-medium">
                                                    {c.chargeNo && <span className="text-xs text-muted-foreground mr-2">#{c.chargeNo}</span>}
                                                    {c.createDate || "Unknown Date"}
                                                </div>
                                                <div className="text-muted-foreground">{c.status}</div>
                                            </div>
                                            <div className="font-mono">{c.amount?.toLocaleString()} MYR</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Risk Analysis (Derived) */}
                        {(financials || kycRiskAssessment) && (
                            <div className="space-y-2 pt-4 border-t">
                                <h3 className="font-semibold text-sm text-red-600 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Risk Indicators
                                </h3>
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-md p-3 text-xs">
                                    <ul className="list-disc pl-4 space-y-1">
                                        {kycRiskAssessment && (
                                            <>
                                                <li className={`${kycRiskAssessment.financialHealth === 'HIGH RISK' ? 'text-red-700 font-bold' : 'text-amber-700'}`}>
                                                    <strong>Financial Health:</strong> {kycRiskAssessment.financialHealth}
                                                </li>
                                                <li>
                                                    <strong>Current Ratio:</strong> {kycRiskAssessment.currentRatio}
                                                </li>
                                                {kycRiskAssessment.uboConcentration !== undefined && (
                                                    <li>
                                                        <strong>UBO Concentration:</strong> {kycRiskAssessment.uboConcentration}% ({kycRiskAssessment.uboRisk || 'Unknown'})
                                                    </li>
                                                )}
                                                {kycRiskAssessment.operationalMaturity && (
                                                    <li>
                                                        <strong>Operational Maturity:</strong> {kycRiskAssessment.operationalMaturity} ({kycRiskAssessment.yearsInOperation} years)
                                                    </li>
                                                )}
                                            </>
                                        )}

                                        {financials?.balanceSheet?.retainedEarnings < 0 && (
                                            <li className="text-red-700 dark:text-red-400">
                                                <strong>Retained Earnings:</strong> Negative ({financials.balanceSheet.retainedEarnings.toLocaleString()} MYR)
                                            </li>
                                        )}
                                        {financials?.balanceSheet?.totalAssets < 1000 && financials?.incomeStatement?.revenue === 0 && (
                                            <li className="text-red-700 dark:text-red-400">
                                                <strong>Low Activity:</strong> Minimal assets and no revenue
                                            </li>
                                        )}
                                        {directors.some((d: any) => {
                                            if (!d.appointmentDate) return false;
                                            // Simple check for recent year (e.g. 2025/2026)
                                            return d.appointmentDate.includes("2025") || d.appointmentDate.includes("2026");
                                        }) && (
                                            <li className="text-amber-700 dark:text-amber-400">
                                                <strong>Recent Changes:</strong> New director appointments detected in 2025/2026
                                            </li>
                                        )}
                                        {(!financials?.balanceSheet?.retainedEarnings && !financials?.balanceSheet?.totalAssets && !kycRiskAssessment) && (
                                            <li className="text-muted-foreground italic">No sufficient financial data for risk analysis</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {directors.length > 0 && (
                            <div className="space-y-2 pt-4 border-t">
                                <h3 className="font-semibold text-sm">Directors ({directors.length})</h3>
                                <div className="bg-muted/30 rounded-md border text-xs">
                                    {directors.map((d, i) => (
                                        <div key={i} className="p-2 border-b last:border-0 flex flex-col gap-1">
                                            <div className="font-medium flex justify-between">
                                                <span>{d.name}</span>
                                                {d.appointmentDate && <span className="text-muted-foreground font-normal text-[10px]">{d.appointmentDate}</span>}
                                            </div>
                                            <div className="text-muted-foreground flex flex-col gap-1">
                                                <div className="flex justify-between">
                                                    <span>{d.idNo}</span>
                                                    <span className="bg-background px-1 rounded border">{d.position}</span>
                                                </div>
                                                {d.address && (
                                                    <div className="text-[10px] opacity-80 pl-2 border-l-2 border-muted-foreground/20">
                                                        {d.address}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {shareholders.length > 0 && (
                            <div className="space-y-2 pt-4 border-t">
                                <h3 className="font-semibold text-sm">Shareholders ({shareholders.length})</h3>
                                <div className="bg-muted/30 rounded-md border text-xs">
                                    {shareholders.map((s, i) => (
                                        <div key={i} className="p-2 border-b last:border-0 flex flex-col gap-1">
                                            <div className="font-medium">{s.name}</div>
                                            <div className="text-muted-foreground flex justify-between">
                                                <span>{s.idNo}</span>
                                                <span>{s.shares?.toLocaleString()} units</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="pt-4 border-t">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Confidence Score</Label>
                                    <div className={`text-sm font-bold ${confidence > 0.8 ? 'text-green-600' : confidence > 0.6 ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {(confidence * 100).toFixed(1)}%
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Time Taken</Label>
                                    <div className="text-sm font-bold flex flex-col">
                                        <span>{elapsedTime.toFixed(2)}s <span className="text-xs font-normal text-muted-foreground">(Total)</span></span>
                                        {backendTime > 0 && (
                                            <span className="text-xs font-normal text-muted-foreground">
                                                Core: {backendTime.toFixed(2)}s
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">QR Code</Label>
                                    <div className="text-sm truncate" title={qrPayload || "No QR code detected"}>
                                        {qrPayload ? (
                                            <span className="text-green-600 flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Detected
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" /> Not Found
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {qrPayload && (
                                <div className="mt-2 text-xs text-muted-foreground break-all bg-muted p-2 rounded">
                                    {qrPayload}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Raw Data & Debug */}
            <div className="space-y-6">
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Extraction Analysis</CardTitle>
                        <CardDescription>
                            Raw text and data extracted by Tesseract.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        {rawText ? (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Raw Text Extraction:</h4>
                                    <div className="bg-muted p-4 rounded-md text-xs font-mono whitespace-pre-wrap h-[200px] overflow-y-auto border">
                                        {rawText}
                                    </div>
                                </div>
                                {structureText && (
                                    <div>
                                        <h4 className="text-sm font-semibold mb-2">Structure Text:</h4>
                                        <div className="bg-muted p-4 rounded-md text-xs font-mono whitespace-pre-wrap h-[200px] overflow-y-auto border">
                                            {structureText}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Parsed Data Object:</h4>
                                    <pre className="bg-muted p-4 rounded-md text-xs font-mono overflow-x-auto border">
                                        {JSON.stringify(extractedData, null, 2)}
                                    </pre>
                                </div>
                                {traceLogs.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold mb-2">Performance Trace:</h4>
                                        <div className="bg-muted p-4 rounded-md text-xs font-mono whitespace-pre-wrap h-[200px] overflow-y-auto border">
                                            {traceLogs.map((log, i) => (
                                                <div key={i} className="mb-1 border-b border-border/50 pb-1 last:border-0">{log}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg p-12">
                                Upload a document to see extraction results
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
