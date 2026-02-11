import { db } from "@/lib/db";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, FileText, Calendar, Building2, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function CompanyKycPage() {
  const kycRecords = await db.kycRecord.findMany({
    where: { type: "COMPANY" },
    include: {
      organization: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Company KYC</h2>
          <p className="text-muted-foreground">
            Review and manage company KYC submissions and SSM verifications.
          </p>
        </div>
      </div>

      {kycRecords.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No KYC records found</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
                KYC records are automatically created when organizations upload their SSM certificates during registration.
            </p>
        </Card>
      ) : (
        <Card>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Extracted Info</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {kycRecords.map((record: any) => {
                    const extracted = record.extractedData as any;
                    return (
                    <TableRow key={record.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={record.organization.logo || ""} alt={record.organization.name} />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {record.organization.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-semibold">{record.organization.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {record.organization.businessRegNumber || "No BRN"}
                                    </div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                {record.documentUrl ? (
                                    <a href={record.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                                        <FileText className="h-4 w-4" />
                                        View Cert
                                    </a>
                                ) : (
                                    <span className="text-muted-foreground text-sm">No Document</span>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant={
                                record.status === 'VERIFIED' ? 'default' : 
                                record.status === 'REJECTED' ? 'destructive' : 
                                'secondary'
                            }>
                                {record.status}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="text-sm space-y-1">
                                <div className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3 text-muted-foreground" />
                                    <span>Type: {extracted?.docType || "N/A"}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <span>Incorp: {extracted?.incorporationDate || "N/A"}</span>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(record.createdAt), "MMM d, yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="text-right">
                            <Link href={`/system/kyc/company/${record.id}`}>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Eye className="h-4 w-4" />
                                    Review
                                </Button>
                            </Link>
                        </TableCell>
                    </TableRow>
                    );
                })}
            </TableBody>
            </Table>
        </Card>
      )}
    </div>
  );
}
