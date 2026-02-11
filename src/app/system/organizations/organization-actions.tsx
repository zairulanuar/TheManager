"use client";

import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, CreditCard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteOrganization } from "./actions";
import { toast } from "sonner";
import Link from "next/link";

interface OrganizationActionsProps {
  orgId: string;
}

export function OrganizationActions({ orgId }: OrganizationActionsProps) {
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this organization? This cannot be undone.")) {
      const result = await deleteOrganization(orgId);
      if (result.success) {
        toast.success("Organization deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete organization");
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        
        {/* Placeholder for Edit - Ideally leads to an edit page */}
        <Link href={`/system/organizations/${orgId}`}>
            <DropdownMenuItem className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit Details
            </DropdownMenuItem>
        </Link>

        {/* Placeholder for Subscription */}
        <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
            <CreditCard className="mr-2 h-4 w-4" />
            Manage Subscription
        </DropdownMenuItem>
        
        <DropdownMenuItem 
            className="text-destructive focus:text-destructive cursor-pointer" 
            onClick={handleDelete}
        >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
