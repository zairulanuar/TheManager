import { db } from "@/lib/db";
import { getRoles, getAllModules } from "./actions";
import RoleManager from "./role-manager";

export const metadata = {
    title: "RBAC - The Manager",
    description: "Manage Role Based Access Control",
};

import { getSessionContext } from "@/core/services/auth-service";

export default async function RBACPage() {
    const roles = await getRoles();
    const modules = await getAllModules();
    
    // Fetch all role permissions
    const permissions = await db.rolePermission.findMany();

    const session = await getSessionContext();
    const isSuperAdmin = session && (
        session.role?.type === 'SUPER_ADMIN' || 
        // @ts-ignore
        session.roleType === 'SUPER_ADMIN' || 
        // @ts-ignore
        session.role === 'SUPER_ADMIN'
    );

    return (
        <div className="container py-6">
            <RoleManager 
                roles={roles} 
                modules={modules} 
                initialPermissions={permissions} 
                isSuperAdmin={!!isSuperAdmin}
            />
        </div>
    );
}
