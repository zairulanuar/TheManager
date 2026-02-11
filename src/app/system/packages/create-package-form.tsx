"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { createPackage, State } from "./actions";
import { useActionState, useEffect, useState } from "react";

const initialState: State = {
    message: null,
    error: null,
    success: false
};

export function CreatePackageForm() {
    const [state, formAction] = useActionState(createPackage, initialState);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (state.success) {
            setOpen(false);
            // Optionally reset form or show toast here
        }
    }, [state.success]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Create Package
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Package</DialogTitle>
                    <DialogDescription>
                        Define limits and pricing for a new subscription tier.
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" name="name" placeholder="Pro Plan" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">Price ($)</Label>
                            <Input id="price" name="monthlyPrice" type="number" step="0.01" placeholder="29.99" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="users" className="text-right">Users</Label>
                            <Input id="users" name="userLimit" type="number" defaultValue="5" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="companies" className="text-right">Tenants</Label>
                            <Input id="companies" name="companyLimit" type="number" defaultValue="1" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="modules" className="text-right">Modules</Label>
                            <Input id="modules" name="allowedModules" placeholder="crm, hr, finance" className="col-span-3" />
                        </div>
                        {state.error && (
                            <div className="col-span-4 text-center text-sm text-red-500 font-medium">
                                {state.error}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save Package</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
