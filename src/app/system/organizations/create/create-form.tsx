"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { createOrganization } from "@/app/system/organizations/actions";
import { uploadOrganizationLogo } from "@/app/system/organizations/upload-action";
import { uploadOrganizationDoc } from "@/app/system/organizations/upload-doc-action";
import { verifySSM } from "@/app/system/organizations/verify-ssm-action";
import { Loader2, Building2, FileText, Palette, Upload, FileUp, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

interface CreateOrganizationFormProps {
  currencies: Currency[];
}

export function CreateOrganizationForm({ currencies }: CreateOrganizationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [ssmCertUrl, setSsmCertUrl] = useState<string>("");
  const [name, setName] = useState("");
  const [brn, setBrn] = useState("");
  const [oldRegNumber, setOldRegNumber] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [incorpDate, setIncorpDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [branchAddresses, setBranchAddresses] = useState("");
  const [issuePlace, setIssuePlace] = useState("");
  const [issueDate, setIssueDate] = useState("");
  
  // Advanced Corporate Info States
  const [natureOfBusiness, setNatureOfBusiness] = useState("");
  const [shareCapital, setShareCapital] = useState<any>(null);
  const [financials, setFinancials] = useState<any>(null);
  const [charges, setCharges] = useState<any[]>([]);
  const [directors, setDirectors] = useState<any[]>([]);
  const [shareholders, setShareholders] = useState<any[]>([]);
  const [kycRiskAssessment, setKycRiskAssessment] = useState<any>(null);

  // Track which fields have been auto-filled/verified from SSM
  const [verifiedFields, setVerifiedFields] = useState<Record<string, boolean>>({});
  
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'failed'>('idle');
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  async function performVerification(url: string, regNum: string) {
    if (!url) return;
    
    setVerificationStatus('verifying');
    
    try {
      const result = await verifySSM(url, regNum);
      
      if (result.processingTimeMs) {
          console.log(`SSM Verification took ${result.processingTimeMs}ms`);
          if (result.trace) {
              console.log("SSM Trace:", result.trace);
          }
      }

      if (regNum) {
          if (result.verified) {
            setVerificationStatus('verified');
            toast.success("SSM Certificate Verified: BRN matches document.");
          } else {
            setVerificationStatus('failed');
            toast.warning("Verification Warning: BRN not found in document. Please check manually.");
          }
      } else {
          // If no BRN provided, we just extracted data.
          // We can set status to idle or maybe 'verified' if we found a BRN in the doc?
          // Let's keep it idle or specific state? 
          // Actually, if we auto-fill the BRN, we can then consider it verified?
          if (result.extractedData && result.extractedData.registrationNumber) {
               setBrn(result.extractedData.registrationNumber);
               setVerificationStatus('verified');
               // We could auto-set verified, but let's be safe.
               toast.success("SSM Data Extracted Successfully");
          } else {
               setVerificationStatus('idle');
          }
      }

      // Auto-fill fields if data is present
      if (result.extractedData) {
         const data = result.extractedData;
         const newVerifiedFields: Record<string, boolean> = {};
         
         if (data.companyName && data.companyName.trim()) {
             setName(data.companyName);
             newVerifiedFields['name'] = true;
             toast.info("Updated Organization Name from certificate");
         }
         
         if (data.oldRegistrationNumber && data.oldRegistrationNumber.trim()) {
             setOldRegNumber(data.oldRegistrationNumber);
             newVerifiedFields['oldRegNumber'] = true;
         }
         if (data.companyType && data.companyType.trim()) {
             setCompanyType(data.companyType);
             newVerifiedFields['companyType'] = true;
         }
         if (data.registrationDate && data.registrationDate.trim()) {
             setIncorpDate(data.registrationDate);
             newVerifiedFields['incorpDate'] = true;
         }
         if (data.registeredAddress && data.registeredAddress.trim()) {
             setRegisteredAddress(data.registeredAddress);
             newVerifiedFields['registeredAddress'] = true;
         }
         
         if (data.validUntil && data.validUntil.trim()) {
             setValidUntil(data.validUntil);
             newVerifiedFields['validUntil'] = true;
         }
         if (data.issuePlace && data.issuePlace.trim()) {
             setIssuePlace(data.issuePlace);
             newVerifiedFields['issuePlace'] = true;
         }
         if (data.issueDate && data.issueDate.trim()) {
             setIssueDate(data.issueDate);
             newVerifiedFields['issueDate'] = true;
         }
         
         if (data.branchAddresses && Array.isArray(data.branchAddresses) && data.branchAddresses.length > 0) {
             setBranchAddresses(data.branchAddresses.join('\n'));
             newVerifiedFields['branchAddresses'] = true;
         }

         // Advanced Fields
         if (data.natureOfBusiness && data.natureOfBusiness.trim()) {
             setNatureOfBusiness(data.natureOfBusiness);
             newVerifiedFields['natureOfBusiness'] = true;
         }
         
         if (data.shareCapital) {
             setShareCapital(data.shareCapital);
         }
         
         if (data.financials) {
             setFinancials(data.financials);
         }
         
         if (data.charges && Array.isArray(data.charges)) {
             setCharges(data.charges);
         }
         
         if (data.directors && Array.isArray(data.directors)) {
             setDirectors(data.directors);
         }
         
         if (data.shareholders && Array.isArray(data.shareholders)) {
             setShareholders(data.shareholders);
         }
         
         if (data.kycRiskAssessment) {
             setKycRiskAssessment(data.kycRiskAssessment);
         }
         
         setVerifiedFields(prev => ({...prev, ...newVerifiedFields}));
      }

    } catch (e) {
      setVerificationStatus('failed');
      toast.error("Verification failed due to processing error.");
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadOrganizationLogo(formData);
      if (result.success && result.url) {
        setLogoUrl(result.url);
        toast.success("Logo uploaded successfully");
      } else {
        toast.error(result.error || "Failed to upload logo");
      }
    } catch (err) {
      toast.error("An error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSsmUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadOrganizationDoc(formData);
      if (result.success && result.url) {
        setSsmCertUrl(result.url);
        toast.success("SSM Certificate uploaded successfully");
        
        // Trigger verification/extraction regardless of whether BRN is present
        performVerification(result.url, brn);
      } else {
        toast.error(result.error || "Failed to upload certificate");
      }
    } catch (err) {
      toast.error("An error occurred during upload");
    } finally {
      setIsUploadingDoc(false);
    }
  }

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    // Append custom fields
    if (logoUrl) {
        formData.set("logo", logoUrl);
    }
    if (ssmCertUrl) {
        formData.set("ssmCert", ssmCertUrl);
    }
    
    // Append extended fields
    formData.set("oldRegNumber", oldRegNumber);
    formData.set("companyType", companyType);
    formData.set("incorpDate", incorpDate);
    formData.set("validUntil", validUntil);
    formData.set("registeredAddress", registeredAddress);
    formData.set("branchAddresses", branchAddresses);
    formData.set("issuePlace", issuePlace);
    formData.set("issueDate", issueDate);

    // Append Advanced Fields
    formData.set("natureOfBusiness", natureOfBusiness);
    if (shareCapital) formData.set("shareCapital", JSON.stringify(shareCapital));
    if (financials) formData.set("financials", JSON.stringify(financials));
    if (charges.length > 0) formData.set("charges", JSON.stringify(charges));
    if (directors.length > 0) formData.set("directors", JSON.stringify(directors));
    if (shareholders.length > 0) formData.set("shareholders", JSON.stringify(shareholders));
    if (kycRiskAssessment) formData.set("kycRiskAssessment", JSON.stringify(kycRiskAssessment));

    formData.set("currencies", JSON.stringify(selectedCurrencies));

    try {
      const result = await createOrganization(formData);
      
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success("Organization created successfully");
        router.push("/system/organizations");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={onSubmit} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                General Details
              </TabsTrigger>
              <TabsTrigger value="business" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Business Info
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Branding
              </TabsTrigger>
            </TabsList>

            {/* General Details Tab */}
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                      <Label htmlFor="name">Organization Name *</Label>
                      {verifiedFields['name'] && (
                          <span className="flex items-center text-xs text-green-600 font-medium">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                          </span>
                      )}
                  </div>
                  <Input
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Acme Corp"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL Identifier) *</Label>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder="acme-corp"
                    required
                    disabled={isLoading}
                  />
                  <p className="text-[0.8rem] text-muted-foreground">
                    Must be unique. Used in URLs.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    name="contactPerson"
                    placeholder="John Doe"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="contact@acme.com"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://acme.com"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Billing Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="123 Business St, City, Country"
                  disabled={isLoading}
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="natureOfBusiness">Nature of Business</Label>
                  <Textarea 
                      id="natureOfBusiness" 
                      name="natureOfBusiness"
                      value={natureOfBusiness} 
                      onChange={(e) => setNatureOfBusiness(e.target.value)} 
                      placeholder="Extracted nature of business..."
                      className="min-h-[80px]"
                      disabled={isLoading}
                  />
              </div>

              {/* Advanced Corporate Info Sections */}
              {shareCapital && (
                  <div className="space-y-2 pt-4 border-t">
                      <h3 className="font-semibold text-sm">Share Capital</h3>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label>Issued Capital (MYR)</Label>
                              <Input value={shareCapital.issued_myr?.toLocaleString() || "0"} readOnly disabled />
                          </div>
                          <div className="space-y-2">
                              <Label>Ordinary Shares</Label>
                              <Input value={shareCapital.ordinary_shares?.toLocaleString() || "0"} readOnly disabled />
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </TabsContent>

            {/* Business Info Tab */}
            <TabsContent value="business" className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg mb-4">
                <h3 className="text-sm font-medium mb-1">Malaysian Business Compliance</h3>
                <p className="text-xs text-muted-foreground">
                  Enter registration details for official invoicing and tax purposes.
                </p>
              </div>

              {/* SSM Certificate Upload - MOVED TO TOP */}
              <div className="space-y-2 mb-6">
                <Label>SSM Certificate</Label>
                <div className="flex items-start gap-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 flex flex-col items-center justify-center w-full max-w-sm h-32 bg-muted/10 relative overflow-hidden">
                    {ssmCertUrl ? (
                      <div className="flex flex-col items-center justify-center text-center p-2">
                        {ssmCertUrl.endsWith('.pdf') ? (
                            <FileText className="h-8 w-8 text-primary mb-2" />
                        ) : (
                            <img src={ssmCertUrl} alt="SSM Cert Preview" className="h-16 object-contain mb-2" />
                        )}
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {ssmCertUrl.split('/').pop()}
                        </span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <FileUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <span className="text-xs text-muted-foreground">Upload Document</span>
                      </div>
                    )}
                    {isUploadingDoc && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      id="ssm-upload"
                      type="file"
                      accept="image/*,.pdf"
                      className="max-w-xs"
                      onChange={handleSsmUpload}
                      disabled={isUploadingDoc || isLoading}
                      aria-label="Upload SSM Certificate"
                      title="Upload SSM Certificate"
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload your SSM Certificate for verification.
                      <br />
                      Supported formats: JPG, PNG, PDF.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="businessRegNumber">Business Reg. Number (BRN)</Label>
                    {verificationStatus === 'verified' && (
                        <span className="flex items-center text-xs text-green-600 font-medium">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                        </span>
                    )}
                    {verificationStatus === 'failed' && (
                        <span className="flex items-center text-xs text-amber-600 font-medium">
                            <AlertCircle className="w-3 h-3 mr-1" /> Mismatch
                        </span>
                    )}
                    {verificationStatus === 'verifying' && (
                        <span className="flex items-center text-xs text-muted-foreground">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Verifying...
                        </span>
                    )}
                  </div>
                  <Input
                    id="businessRegNumber"
                    name="businessRegNumber"
                    value={brn}
                    onChange={(e) => setBrn(e.target.value)}
                    onBlur={() => {
                        if (brn && ssmCertUrl) {
                            performVerification(ssmCertUrl, brn);
                        }
                    }}
                    placeholder="e.g. 202401000001 (123456-A)"
                    disabled={isLoading}
                    className={verificationStatus === 'verified' ? "border-green-500 focus-visible:ring-green-500" : verificationStatus === 'failed' ? "border-amber-500 focus-visible:ring-amber-500" : ""}
                  />
                  {verificationStatus === 'failed' && (
                      <p className="text-xs text-amber-600">
                          The entered BRN could not be automatically found in the uploaded SSM certificate. Please verify visually.
                      </p>
                  )}
                  <p className="text-xs text-muted-foreground">New 12-digit format required.</p>
                </div>
                
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="oldRegNumber">Old Registration Number</Label>
                        {verifiedFields['oldRegNumber'] && (
                            <span className="flex items-center text-xs text-green-600 font-medium">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                            </span>
                        )}
                    </div>
                    <Input 
                        id="oldRegNumber" 
                        name="oldRegNumber" 
                        value={oldRegNumber}
                        onChange={(e) => setOldRegNumber(e.target.value)}
                        placeholder="e.g. 123456-A"
                        disabled={isLoading}
                    />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="companyType">Company Type</Label>
                        {verifiedFields['companyType'] && (
                            <span className="flex items-center text-xs text-green-600 font-medium">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                            </span>
                        )}
                    </div>
                    <Input 
                        id="companyType" 
                        name="companyType" 
                        value={companyType}
                        onChange={(e) => setCompanyType(e.target.value)}
                        placeholder="e.g. Sdn. Bhd."
                        disabled={isLoading}
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="incorpDate">Incorporation Date</Label>
                        {verifiedFields['incorpDate'] && (
                            <span className="flex items-center text-xs text-green-600 font-medium">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                            </span>
                        )}
                    </div>
                    <Input 
                        id="incorpDate" 
                        name="incorpDate" 
                        value={incorpDate}
                        onChange={(e) => setIncorpDate(e.target.value)}
                        placeholder="YYYY-MM-DD"
                        disabled={isLoading}
                    />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="validUntil">Valid Until</Label>
                        {verifiedFields['validUntil'] && (
                            <span className="flex items-center text-xs text-green-600 font-medium">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                            </span>
                        )}
                    </div>
                    <Input 
                        id="validUntil" 
                        name="validUntil" 
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                        placeholder="YYYY-MM-DD"
                        disabled={isLoading}
                    />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="registeredAddress">Registered Address</Label>
                    {verifiedFields['registeredAddress'] && (
                        <span className="flex items-center text-xs text-green-600 font-medium">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                        </span>
                    )}
                </div>
                <Textarea 
                    id="registeredAddress" 
                    name="registeredAddress" 
                    value={registeredAddress}
                    onChange={(e) => setRegisteredAddress(e.target.value)}
                    className="min-h-[80px]"
                    disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="branchAddresses">Branch Addresses (One per line)</Label>
                    {verifiedFields['branchAddresses'] && (
                        <span className="flex items-center text-xs text-green-600 font-medium">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                        </span>
                    )}
                </div>
                <Textarea 
                   id="branchAddresses" 
                   name="branchAddresses" 
                   value={branchAddresses}
                   onChange={(e) => setBranchAddresses(e.target.value)}
                   className="min-h-[80px]"
                   disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                     <div className="flex items-center justify-between">
                        <Label htmlFor="issuePlace">Issue Place</Label>
                        {verifiedFields['issuePlace'] && (
                            <span className="flex items-center text-xs text-green-600 font-medium">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                            </span>
                        )}
                     </div>
                     <Input 
                        id="issuePlace" 
                        name="issuePlace" 
                        value={issuePlace}
                        onChange={(e) => setIssuePlace(e.target.value)}
                        disabled={isLoading}
                     />
                </div>
                <div className="space-y-2">
                     <div className="flex items-center justify-between">
                        <Label htmlFor="issueDate">Issue Date</Label>
                        {verifiedFields['issueDate'] && (
                            <span className="flex items-center text-xs text-green-600 font-medium">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                            </span>
                        )}
                     </div>
                     <Input 
                        id="issueDate" 
                        name="issueDate" 
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                        disabled={isLoading}
                     />
                </div>
              </div>

              <div className="border-t pt-4 mt-2">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Tax & Classification</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="taxIdNumber">Tax ID Number (TIN)</Label>
                      <Input
                        id="taxIdNumber"
                        name="taxIdNumber"
                        placeholder="e.g. C1234567890"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="msicCode">MSIC Code</Label>
                        <Input
                          id="msicCode"
                          name="msicCode"
                          placeholder="e.g. 62010"
                          disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="sstRegNumber">SST Registration No.</Label>
                      <Input
                        id="sstRegNumber"
                        name="sstRegNumber"
                        placeholder="e.g. B12-1234-12345678"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tourismTaxRegNumber">Tourism Tax Reg. No.</Label>
                      <Input
                        id="tourismTaxRegNumber"
                        name="tourismTaxRegNumber"
                        placeholder="Optional"
                        disabled={isLoading}
                      />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="businessDesc">Business Activity Description</Label>
                        {verifiedFields['natureOfBusiness'] && (
                            <span className="flex items-center text-xs text-green-600 font-medium">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                            </span>
                        )}
                    </div>
                    <Textarea
                      id="businessDesc"
                      name="businessDesc"
                      value={natureOfBusiness}
                      onChange={(e) => setNatureOfBusiness(e.target.value)}
                      placeholder="Brief description of business activities..."
                      className="min-h-[100px]"
                      disabled={isLoading}
                    />
                </div>
              </div>
            </TabsContent>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-6">
              <div className="space-y-2">
                <Label>Organization Logo</Label>
                <div className="flex items-start gap-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 flex flex-col items-center justify-center w-32 h-32 bg-muted/10 relative overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground">No Logo</span>
                      </div>
                    )}
                    {isUploading && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isLoading || isUploading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload your organization logo. Supports JPG, PNG, GIF.
                    </p>
                  </div>
                </div>
                <input type="hidden" name="logo" value={logoUrl} />
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                    <Label>Supported Currencies</Label>
                    <p className="text-xs text-muted-foreground">Select one or more currencies for this organization.</p>
                </div>
                <div className="border rounded-md p-4 h-60 overflow-y-auto space-y-2 bg-background">
                   {currencies.map(c => (
                     <div key={c.code} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                        <Checkbox
                            id={`curr-${c.code}`}
                            checked={selectedCurrencies.includes(c.code)}
                            onCheckedChange={(checked) => {
                                if (checked) setSelectedCurrencies([...selectedCurrencies, c.code]);
                                else setSelectedCurrencies(selectedCurrencies.filter(code => code !== c.code));
                            }}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor={`curr-${c.code}`} className="font-medium cursor-pointer">
                                {c.code} - {c.name}
                            </Label>
                            <p className="text-xs text-muted-foreground">Symbol: {c.symbol}</p>
                        </div>
                     </div>
                   ))}
                </div>
                {selectedCurrencies.length === 0 && (
                    <p className="text-xs text-amber-600">Please select at least one currency.</p>
                )}
                <input type="hidden" name="currencies" value={JSON.stringify(selectedCurrencies)} />
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isUploading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Organization
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
