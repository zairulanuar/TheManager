"use client";

import { useState, useEffect } from "react";
import { updateRolePermission, createRole, deleteRole } from "./actions";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Blocks, Shield, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface RoleManagerProps {
    roles: any[]; 
    modules: any[];
    initialPermissions: any[];
    isSuperAdmin?: boolean;
}

export default function RoleManager({ roles, modules, initialPermissions, isSuperAdmin = false }: RoleManagerProps) {
    const [permissions, setPermissions] = useState(initialPermissions);
    const [loading, setLoading] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleDesc, setNewRoleDesc] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Filter roles: Hide Super Admin role if current user is not Super Admin
    const visibleRoles = isSuperAdmin ? roles : roles.filter(role => role.type !== 'SUPER_ADMIN');

    const getPermission = (roleId: string, moduleKey: string) => {
        return permissions.find((p: any) => p.roleId === roleId && p.moduleKey === moduleKey) || { canView: false, canEdit: false };
    };

    // Safely handle empty roles
    if (!visibleRoles || visibleRoles.length === 0) {
        return <div>Loading roles...</div>;
    }

    if (!mounted) {
        return null;
    }

    const handlePermissionChange = async (roleId: string, moduleKey: string, type: 'canView' | 'canEdit', checked: boolean) => {
        // Optimistic update
        const currentPerm = getPermission(roleId, moduleKey);
        const newPerm = { ...currentPerm, roleId, moduleKey, [type]: checked };
        
        if (type === 'canEdit' && checked) {
            newPerm.canView = true;
        }
        if (type === 'canView' && !checked) {
            newPerm.canEdit = false;
        }

        setPermissions((prev: any[]) => {
            const filtered = prev.filter(p => !(p.roleId === roleId && p.moduleKey === moduleKey));
            return [...filtered, newPerm];
        });

        const id = `${roleId}-${moduleKey}-${type}`;
        setLoading(id);

        const result = await updateRolePermission(roleId, moduleKey, newPerm.canView, newPerm.canEdit);
        
        setLoading(null);
        if (result.error) {
            toast.error(result.error);
        }
    };

    const handleCreateRole = async () => {
        if (!newRoleName) return;
        const result = await createRole(newRoleName, newRoleDesc);
        if (result.success) {
            toast.success("Role created");
            setIsCreateOpen(false);
            setNewRoleName("");
            setNewRoleDesc("");
        } else {
            toast.error(result.error);
        }
    };

    const handleDeleteRole = async (roleId: string) => {
        if (confirm("Are you sure you want to delete this role?")) {
            const result = await deleteRole(roleId);
            if (result.success) {
                toast.success("Role deleted");
            } else {
                toast.error(result.error);
            }
        }
    };

    // Safely handle empty roles
    if (!visibleRoles || visibleRoles.length === 0) {
        return <div>Loading roles...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Role Based Access Control</h2>
                    <p className="text-muted-foreground">
                        Manage roles and permissions.
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Role
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Role</DialogTitle>
                            <DialogDescription>
                                Add a new custom role to the system.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Role Name</Label>
                                <Input id="name" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="e.g. HR Manager" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="desc">Description</Label>
                                <Textarea id="desc" value={newRoleDesc} onChange={(e) => setNewRoleDesc(e.target.value)} placeholder="Description of the role..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateRole}>Create Role</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue={visibleRoles[0]?.id} className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto">
                    {visibleRoles.map(role => (
                        <TabsTrigger key={role.id} value={role.id}>
                            {role.name}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {visibleRoles.map(role => (
                    <TabsContent key={role.id} value={role.id}>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        {role.name} Permissions
                                        {role.isSystem && <Badge variant="secondary" className="ml-2">System</Badge>}
                                    </CardTitle>
                                    <CardDescription>
                                        {role.description || `Manage permissions for ${role.name}.`}
                                    </CardDescription>
                                </div>
                                {!role.isSystem && (
                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteRole(role.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Role
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Module</TableHead>
                                            <TableHead className="w-[100px] text-center">View</TableHead>
                                            <TableHead className="w-[100px] text-center">Edit</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {modules.map(mod => {
                                            const perm = getPermission(role.id, mod.id);
                                            const isSuperAdmin = role.type === 'SUPER_ADMIN';
                                            
                                            return (
                                                <TableRow key={mod.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <Blocks className="h-4 w-4 text-muted-foreground" />
                                                            <div>
                                                                <div>{mod.name}</div>
                                                                <div className="text-xs text-muted-foreground">{mod.description}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Checkbox 
                                                            checked={isSuperAdmin ? true : perm.canView}
                                                            disabled={isSuperAdmin || loading !== null}
                                                            onCheckedChange={(checked) => handlePermissionChange(role.id, mod.id, 'canView', checked as boolean)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Checkbox 
                                                            checked={isSuperAdmin ? true : perm.canEdit}
                                                            disabled={isSuperAdmin || loading !== null}
                                                            onCheckedChange={(checked) => handlePermissionChange(role.id, mod.id, 'canEdit', checked as boolean)}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {modules.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                                                    No modules found in the system.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
