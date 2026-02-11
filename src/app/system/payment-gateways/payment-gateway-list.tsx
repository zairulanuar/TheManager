"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, MoreVertical, Trash2, Edit, CheckCircle2, TestTube, Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { PaymentGatewayDialog } from "./payment-gateway-dialog";
import { PaymentGatewayLogo } from "./payment-gateway-logo";
import { deletePaymentGateway, setDefaultGateway } from "./actions";
import { toast } from "sonner";

interface PaymentGateway {
  id: string;
  name: string;
  isEnabled: boolean;
  config: any;
  isDefault: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function PaymentGatewayList({ gateways, organizationId }: { gateways: PaymentGateway[], organizationId?: string }) {
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEdit = (gateway: PaymentGateway) => {
    setEditingGateway(gateway);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingGateway(null);
    setIsDialogOpen(true);
  };

  const handleSetDefault = async (id: string) => {
    const result = await setDefaultGateway(id, organizationId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Default gateway updated successfully");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this gateway?")) {
      const result = await deletePaymentGateway(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Gateway deleted successfully");
      }
    }
  };

  return (
    <>
      <div className="flex justify-end mb-6 gap-2">
        <Button variant="outline" asChild>
          <Link href="/system/payment-gateways/sandbox">
            <TestTube className="mr-2 h-4 w-4" /> Sandbox
          </Link>
        </Button>
        <Button onClick={handleCreate}>
          <CreditCard className="mr-2 h-4 w-4" /> Add Gateway
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {gateways.map((gateway) => (
          <Card key={gateway.id} className="relative overflow-hidden transition-all hover:shadow-md">
            {gateway.isDefault && (
              <div className="absolute top-0 right-0 p-2">
                <Badge variant="default" className="bg-primary/90 hover:bg-primary">Default</Badge>
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PaymentGatewayLogo name={gateway.name} isEnabled={gateway.isEnabled} />
                  <div>
                    <CardTitle className="text-base">{gateway.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {gateway.isEnabled ? (
                        <span className="flex items-center text-green-600 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Inactive</span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(gateway)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    {!gateway.isDefault && (
                      <DropdownMenuItem onClick={() => handleSetDefault(gateway.id)}>
                        <Star className="mr-2 h-4 w-4" /> Set as Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive" 
                      onClick={() => handleDelete(gateway.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded truncate">
                ID: {gateway.id}
              </div>
            </CardContent>
          </Card>
        ))}

        {gateways.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/10 text-muted-foreground">
            <CreditCard className="h-10 w-10 mb-4 opacity-20" />
            <h3 className="font-semibold text-lg">No Payment Gateways</h3>
            <p className="text-sm mb-4">Add a payment gateway to start accepting payments.</p>
            <Button variant="outline" onClick={handleCreate}>Add First Gateway</Button>
          </div>
        )}
      </div>

      <PaymentGatewayDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        gateway={editingGateway} 
        organizationId={organizationId}
      />
    </>
  );
}
