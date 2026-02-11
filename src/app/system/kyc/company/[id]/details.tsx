"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
    FileText, 
    CheckCircle2, 
    XCircle, 
    Building2, 
    MapPin, 
    Calendar, 
    Users, 
    DollarSign,
    AlertTriangle,
    ExternalLink,
    Clock,
    User
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { updateKycStatus } from "../actions";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KycDetailsViewProps {
    record: any; // Using any for simplicity with the Prisma types for now, but should be typed
}

export default function KycDetailsView({ record }: KycDetailsViewProps) {
    const extracted = record.extractedData || {};
    const [remarks, setRemarks] = useState(record.remarks || "");
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusUpdate = async (status: string) => {
        try {
            setIsUpdating(true);
            await updateKycStatus(record.id, status, remarks);
            toast.success(`KYC status updated to ${status}`);
        } catch (error) {
            toast.error("Failed to update status");
            console.error(error);
        } finally {
            setIsUpdating(false);
        }
    };

    // Helper to format currency
    const formatCurrency = (amount: any) => {
        if (!amount) return "-";
        return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Document & Actions */}
            <div className="space-y-6 lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Document Source</CardTitle>
                        <CardDescription>The uploaded SSM certificate</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center border border-dashed relative overflow-hidden group">
                            {record.documentUrl ? (
                                <>
                                    <iframe 
                                        src={record.documentUrl} 
                                        className="w-full h-full object-cover" 
                                        title="SSM Cert"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <a href={record.documentUrl} target="_blank" rel="noopener noreferrer">
                                            <Button variant="secondary">
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Open Full Document
                                            </Button>
                                        </a>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">No document preview available</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Document Type</span>
                                <span className="font-medium">{record.documentType || "Unknown"}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Uploaded At</span>
                                <span className="font-medium">{format(new Date(record.createdAt), "MMM d, yyyy HH:mm")}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Verification Decision</CardTitle>
                        <CardDescription>Review status and remarks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                            <span className="text-sm font-medium">Current Status</span>
                            <Badge variant={
                                record.status === 'VERIFIED' ? 'default' : 
                                record.status === 'REJECTED' ? 'destructive' : 
                                'secondary'
                            } className="text-base">
                                {record.status}
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="remarks">Internal Remarks</Label>
                            <Textarea 
                                id="remarks" 
                                placeholder="Add notes about this KYC submission..." 
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button 
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => handleStatusUpdate('VERIFIED')}
                                disabled={isUpdating}
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Approve
                            </Button>
                            <Button 
                                variant="destructive" 
                                className="flex-1"
                                onClick={() => handleStatusUpdate('REJECTED')}
                                disabled={isUpdating}
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Audit Trail</CardTitle>
                        <CardDescription>History of changes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-4">
                                {record.auditLogs?.map((log: any) => (
                                    <div key={log.id} className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{log.action.replace('_', ' ')}</span>
                                            <span className="text-xs text-muted-foreground">{format(new Date(log.createdAt), "MMM d, HH:mm")}</span>
                                        </div>
                                        {log.previousStatus !== log.newStatus && (
                                            <div className="text-xs flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] px-1 py-0">{log.previousStatus}</Badge>
                                                <span>→</span>
                                                <Badge variant="outline" className="text-[10px] px-1 py-0">{log.newStatus}</Badge>
                                            </div>
                                        )}
                                        {log.details && (
                                            <p className="text-xs text-muted-foreground mt-1 bg-muted p-2 rounded">{log.details}</p>
                                        )}
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                                            <User className="h-3 w-3" />
                                            <span>{log.performedBy || "System"}</span>
                                        </div>
                                    </div>
                                ))}
                                {(!record.auditLogs || record.auditLogs.length === 0) && (
                                    <div className="text-center text-sm text-muted-foreground py-4">No audit history</div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Extracted Data */}
            <div className="lg:col-span-2 space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="corporate">Corporate</TabsTrigger>
                        <TabsTrigger value="people">People</TabsTrigger>
                        <TabsTrigger value="financial">Financial</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Company Information</CardTitle>
                                <CardDescription>Basic registration details extracted from SSM</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Company Name</Label>
                                    <div className="font-medium text-lg">{extracted.companyName || "-"}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Registration No.</Label>
                                    <div className="font-medium">{extracted.registrationNumber || "-"}</div>
                                    {extracted.oldRegistrationNumber && (
                                        <div className="text-xs text-muted-foreground">Old: {extracted.oldRegistrationNumber}</div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Incorporation Date</Label>
                                    <div className="font-medium flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        {extracted.incorporationDate || "-"}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Company Type</Label>
                                    <div className="font-medium flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        {extracted.companyType || "-"}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Addresses</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-3 border rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-primary mt-0.5" />
                                        <div>
                                            <div className="font-semibold text-sm mb-1">Registered Address</div>
                                            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {extracted.registeredAddress?.address || "-"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 border rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <div className="font-semibold text-sm mb-1">Business Address</div>
                                            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {extracted.businessAddress?.address || "-"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="corporate" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Nature of Business</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm leading-relaxed">
                                    {extracted.natureOfBusiness || "No information available."}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Charges & Liens</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {extracted.charges && extracted.charges.length > 0 ? (
                                    <div className="space-y-4">
                                        {extracted.charges.map((charge: any, i: number) => (
                                            <div key={i} className="flex items-start justify-between p-3 border rounded-lg">
                                                <div>
                                                    <div className="font-medium">{charge.chargeeName}</div>
                                                    <div className="text-sm text-muted-foreground">Created: {charge.createDate}</div>
                                                </div>
                                                <Badge variant={charge.status === 'UNSATISFIED' ? 'destructive' : 'outline'}>
                                                    {charge.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500/50" />
                                        No registered charges found
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="people" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Directors</CardTitle>
                                <CardDescription>Company officers and directors</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {extracted.directors && extracted.directors.length > 0 ? (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {extracted.directors.map((director: any, i: number) => (
                                            <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <Users className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{director.name}</div>
                                                    <div className="text-xs text-muted-foreground">{director.idType}: {director.idNo}</div>
                                                    <div className="text-xs text-muted-foreground mt-1">Appointed: {director.appointmentDate}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">No directors information available</div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Shareholders</CardTitle>
                                <CardDescription>Equity holders</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {extracted.shareholders && extracted.shareholders.length > 0 ? (
                                    <div className="space-y-3">
                                        {extracted.shareholders.map((holder: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="font-medium">{holder.name}</div>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div className="text-muted-foreground">{holder.idNo}</div>
                                                    <Badge variant="secondary">{holder.total} shares</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">No shareholders information available</div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="financial" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Share Capital</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {extracted.shareCapital ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-secondary/50 rounded-lg">
                                            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Issued Capital</div>
                                            <div className="text-xl font-bold">{formatCurrency(extracted.shareCapital.issued)}</div>
                                        </div>
                                        <div className="p-3 bg-secondary/50 rounded-lg">
                                            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Paid Up Capital</div>
                                            <div className="text-xl font-bold">{formatCurrency(extracted.shareCapital.paidUp)}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-muted-foreground">No share capital info</div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Financial Summary</CardTitle>
                                <CardDescription>Last filed financial statements</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {extracted.financials ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center pb-2 border-b">
                                            <span className="text-sm font-medium">Financial Year End</span>
                                            <span className="font-mono">{extracted.financials.yearEnd || "-"}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                            <div>
                                                <div className="text-sm text-muted-foreground">Revenue</div>
                                                <div className="font-medium">{formatCurrency(extracted.financials.revenue)}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-muted-foreground">Profit/Loss (Before Tax)</div>
                                                <div className={`font-medium ${extracted.financials.profitBeforeTax < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                    {formatCurrency(extracted.financials.profitBeforeTax)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-muted-foreground">Total Assets</div>
                                                <div className="font-medium">{formatCurrency(extracted.financials.totalAssets)}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-muted-foreground">Total Liabilities</div>
                                                <div className="font-medium">{formatCurrency(extracted.financials.totalLiabilities)}</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500/50" />
                                        No financial records extracted
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
