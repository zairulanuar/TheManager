"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useActionState, useState, useEffect } from "react";
import { updateOrganization, UpdateState } from "./actions";
import { Building2, Globe, Mail, MapPin, Phone, User, FileText, Palette, ExternalLink, Plus, Upload, Loader2, FileUp, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import PaymentGatewayList from "@/app/system/payment-gateways/payment-gateway-list";
import { uploadOrganizationLogo } from "@/app/system/organizations/upload-action";
import { uploadOrganizationDoc } from "@/app/system/organizations/upload-doc-action";
import { verifySSM } from "@/app/system/organizations/verify-ssm-action";
import { toast } from "sonner";

interface Currency {
    code: string;
    name: string;
    symbol: string;
}

interface Organization {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    website: string | null;
    contactPerson: string | null;
    currency: string;
    currencySymbol: string;
    currencies?: { code: string }[];
    paymentGateways?: any[];
    businessRegNumber?: string | null;
    taxIdNumber?: string | null;
    sstRegNumber?: string | null;
    tourismTaxRegNumber?: string | null;
    msicCode?: string | null;
    businessDesc?: string | null;
    ssmCert?: string | null;
    // Extended SSM Fields
    oldRegNumber?: string | null;
    companyType?: string | null;
    incorpDate?: string | null;
    validUntil?: string | null;
    registeredAddress?: string | null;
    branchAddresses?: any;
    issuePlace?: string | null;
    issueDate?: string | null;
}

interface TenantSettingsFormProps {
    organizations: Organization[];
    availableCurrencies?: Currency[];
}

const initialState: UpdateState = {
    message: null,
    error: null,
    success: false
};

export function TenantSettingsForm({ organizations, availableCurrencies = [] }: TenantSettingsFormProps) {
    // Safety check for organizations
    const org = Array.isArray(organizations) && organizations.length > 0 ? organizations[0] : null;
    const [state, formAction] = useActionState(updateOrganization, initialState);
    
    // State for fields that can be auto-filled from OCR
    const [logoUrl, setLogoUrl] = useState<string>(org?.logo || "");
    const [ssmCertUrl, setSsmCertUrl] = useState<string>(org?.ssmCert || "");
    const [brn, setBrn] = useState(org?.businessRegNumber || "");
    const [companyName, setCompanyName] = useState(org?.name || "");
    
    const [oldRegNumber, setOldRegNumber] = useState(org?.oldRegNumber || "");
    const [companyType, setCompanyType] = useState(org?.companyType || "");
    const [incorpDate, setIncorpDate] = useState(org?.incorpDate || "");
    const [validUntil, setValidUntil] = useState(org?.validUntil || "");
    const [registeredAddress, setRegisteredAddress] = useState(org?.registeredAddress || "");
    const [branchAddresses, setBranchAddresses] = useState(Array.isArray(org?.branchAddresses) ? (org?.branchAddresses as string[]).join('\n') : "");
    const [issuePlace, setIssuePlace] = useState(org?.issuePlace || "");
    const [issueDate, setIssueDate] = useState(org?.issueDate || "");
    
    // Track which fields have been auto-filled/verified from SSM
    const [verifiedFields, setVerifiedFields] = useState<Record<string, boolean>>({});
    
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'failed'>('idle');
    const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(
        org?.currencies?.map(c => c.code) || (org?.currency ? [org.currency] : [])
    );
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);

    useEffect(() => {
        if (state.success) {
            toast.success(state.message);
        } else if (state.error) {
            toast.error(state.error);
        }
    }, [state]);

    async function performVerification(url: string, regNum: string) {
        if (!url) return;
        
        setVerificationStatus('verifying');
        
        try {
          const result = await verifySSM(url, regNum);
          
          if (regNum) {
              if (result.verified) {
                setVerificationStatus('verified');
                toast.success("SSM Certificate Verified: BRN matches document.");
              } else {
                setVerificationStatus('failed');
                toast.warning("Verification Warning: BRN not found in document. Please check manually.");
              }
          } else {
               if (result.extractedData && result.extractedData.registrationNumber) {
                    setBrn(result.extractedData.registrationNumber);
                    setVerificationStatus('verified'); // Extracted successfully
                    toast.success("SSM Data Extracted Successfully");
               } else {
                    setVerificationStatus('idle'); // Stop spinner if no BRN found
               }
          }

          // Auto-fill fields if data is present
          if (result.extractedData) {
             const data = result.extractedData;
             const newVerifiedFields: Record<string, boolean> = {};

             if (data.companyName && data.companyName.trim()) {
                 setCompanyName(data.companyName);
                 newVerifiedFields['name'] = true;
                 toast.info("Updated Company Name from certificate");
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
             
             setVerifiedFields(prev => ({...prev, ...newVerifiedFields}));
          }

        } catch (e) {
          console.error(e);
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

    if (!org) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 border rounded-lg border-dashed">
                <div className="bg-muted p-4 rounded-full">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">No Organization Found</h3>
                    <p className="text-muted-foreground max-w-sm mt-1">
                        You haven't created an organization yet. Create one to manage its settings.
                    </p>
                </div>
                <Link href="/system/organizations/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Organization
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-5 max-w-[800px]">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="business">Business</TabsTrigger>
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="theme">Theme</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>
            
            <form action={formAction}>
                <input type="hidden" name="id" value={org.id} />
                <input type="hidden" name="logo" value={logoUrl} />
                <input type="hidden" name="ssmCert" value={ssmCertUrl} />
                <input type="hidden" name="currencies" value={JSON.stringify(selectedCurrencies)} />
                
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Company Information</CardTitle>
                            <CardDescription>
                                Update your company details visible on invoices and reports.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="name">Company Name</Label>
                                    {verifiedFields['name'] && (
                                        <span className="flex items-center text-xs text-green-600 font-medium">
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        id="name" 
                                        name="name" 
                                        value={companyName} 
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="pl-9" 
                                        required 
                                    />
                                </div>
                            </div>
                            
                            <div className="grid gap-2">
                                <Label htmlFor="contactPerson">Contact Person</Label>
                                <div className="relative">
                                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="contactPerson" name="contactPerson" defaultValue={org.contactPerson || ''} className="pl-9" placeholder="John Doe" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="email" name="email" type="email" defaultValue={org.email || ''} className="pl-9" placeholder="contact@company.com" />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="phone" name="phone" type="tel" defaultValue={org.phone || ''} className="pl-9" placeholder="+1 (555) 000-0000" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="website">Website</Label>
                                <div className="relative">
                                    <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="website" name="website" type="url" defaultValue={org.website || ''} className="pl-9" placeholder="https://company.com" />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="address" name="address" defaultValue={org.address || ''} className="pl-9" placeholder="123 Business St, City, Country" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="business">
                    <Card>
                        <CardHeader>
                            <CardTitle>Malaysian Business Registration Details</CardTitle>
                            <CardDescription>
                                Required for e-Invoicing and tax compliance in Malaysia.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* SSM Certificate Upload */}
                             <div className="grid gap-2 mb-4">
                                <Label>SSM Certificate</Label>
                                <div className="flex items-center gap-4 border border-dashed rounded-lg p-4">
                                    <div className="flex-1 flex flex-col items-center justify-center space-y-2">
                                        {ssmCertUrl ? (
                                            <div className="flex items-center space-x-2 text-green-600">
                                                <FileText className="h-8 w-8" />
                                                <span className="font-medium">Certificate Uploaded</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-muted-foreground">
                                                <Upload className="h-8 w-8 mb-2" />
                                                <span>Upload Document</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="ssm-upload" className="cursor-pointer">
                                                <div className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                                    {isUploadingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                                                    Choose File
                                                </div>
                                                <input 
                                                    id="ssm-upload" 
                                                    type="file" 
                                                    accept=".pdf,.jpg,.jpeg,.png" 
                                                    className="hidden" 
                                                    onChange={handleSsmUpload}
                                                    disabled={isUploadingDoc}
                                                    aria-label="Upload SSM Certificate"
                                                    title="Upload SSM Certificate"
                                                />
                                            </Label>
                                            <span className="text-sm text-muted-foreground">
                                                {ssmCertUrl ? "Change file" : "No file chosen"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Upload your SSM Certificate for verification. <br/>
                                            Supported formats: JPG, PNG, PDF.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="businessRegNumber">Business Registration Number (BRN)</Label>
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
                                    <div className="relative">
                                        <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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
                                            className={`pl-9 ${verificationStatus === 'verified' ? "border-green-500 focus-visible:ring-green-500" : verificationStatus === 'failed' ? "border-amber-500 focus-visible:ring-amber-500" : ""}`}
                                            placeholder="e.g., 202201234565" 
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">New 12-digit format required.</p>
                                </div>
                                <div className="grid gap-2">
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
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
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
                                    />
                                </div>
                                <div className="grid gap-2">
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
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
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
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
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
                                />
                            </div>
                            <div className="grid gap-2">
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
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
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
                                     />
                                </div>
                                <div className="grid gap-2">
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
                                     />
                                </div>
                            </div>
                            
                            <div className="border-t pt-4 mt-2">
                                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Tax & Classification</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="taxIdNumber">Tax Identification Number (TIN)</Label>
                                        <div className="relative">
                                            <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="taxIdNumber" name="taxIdNumber" defaultValue={org.taxIdNumber || ''} className="pl-9" placeholder="TIN Number" />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                         <Label htmlFor="msicCode">MSIC Code</Label>
                                         <Input id="msicCode" name="msicCode" defaultValue={org.msicCode || ''} placeholder="5-digit numeric code" maxLength={5} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="sstRegNumber">SST Registration Number</Label>
                                        <Input id="sstRegNumber" name="sstRegNumber" defaultValue={org.sstRegNumber || ''} placeholder="SST Number" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="tourismTaxRegNumber">Tourism Tax Reg. No.</Label>
                                        <Input id="tourismTaxRegNumber" name="tourismTaxRegNumber" defaultValue={org.tourismTaxRegNumber || ''} placeholder="Optional" />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="businessDesc">Business Activity Description</Label>
                                    <Textarea id="businessDesc" name="businessDesc" defaultValue={org.businessDesc || ''} placeholder="Brief description of business activities..." />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="branding">
                    <Card>
                        <CardHeader>
                            <CardTitle>Branding & Logo</CardTitle>
                            <CardDescription>
                                Customize how your brand appears to customers.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Company Logo</Label>
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-lg border border-dashed flex items-center justify-center overflow-hidden bg-muted/50">
                                        {logoUrl ? (
                                            <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                                        ) : (
                                            <Building2 className="h-8 w-8 text-muted-foreground/50" />
                                        )}
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="logo-upload" className="cursor-pointer">
                                            <div className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                                Upload Logo
                                            </div>
                                            <input 
                                                id="logo-upload" 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={handleLogoUpload}
                                                disabled={isUploading}
                                                aria-label="Upload Company Logo"
                                                title="Upload Company Logo"
                                            />
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Recommended size: 512x512px. Max 2MB.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="theme">
                    <Card>
                         <CardHeader>
                            <CardTitle>Appearance</CardTitle>
                            <CardDescription>
                                Customize the look and feel of your workspace.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                <Palette className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>Theme customization coming soon.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payments">
                     <Card>
                        <CardHeader>
                            <CardTitle>Currencies</CardTitle>
                            <CardDescription>
                                Manage supported currencies for your transactions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="grid gap-4">
                                <Label>Supported Currencies</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {availableCurrencies.map(c => (
                                        <div key={c.code} className="flex items-center space-x-2 border rounded-md p-3">
                                            <Checkbox 
                                                id={`currency-${c.code}`} 
                                                checked={selectedCurrencies.includes(c.code)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedCurrencies([...selectedCurrencies, c.code]);
                                                    } else {
                                                        setSelectedCurrencies(selectedCurrencies.filter(code => code !== c.code));
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`currency-${c.code}`} className="flex-1 cursor-pointer font-normal">
                                                {c.code} ({c.symbol})
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </CardContent>
                     </Card>

                     <div className="mt-6">
                        <PaymentGatewayList 
                            organizationId={org.id} 
                            gateways={org.paymentGateways || []} 
                        />
                     </div>
                </TabsContent>

                <div className="mt-6 flex justify-end">
                    <Button type="submit">Save Changes</Button>
                </div>
            </form>
        </Tabs>
    );
}
