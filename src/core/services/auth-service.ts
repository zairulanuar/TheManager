import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function getSessionContext() {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;

    if (!userId) return null;

    const user = await db.user.findUnique({
        where: { id: userId },
        include: { 
            account: {
                include: {
                    organizations: true
                }
            },
            role: true
        }
    });

    if (!user) return null;

    return {
        ...user,
        userId: user.id,
        organizationId: user.account?.organizations?.[0]?.id,
    };
}

export async function canUserAccessModule(userId: string, moduleKey: string) {
    const user = await db.user.findUnique({
        where: { id: userId },
        include: { 
            permissions: { where: { moduleKey } },
            role: true
        }
    });

    if (!user) return false;
    
    // Check Super Admin via Role Type (Support both old Enum and new Model)
    // @ts-ignore
    if (user.role?.type === 'SUPER_ADMIN' || user.roleType === 'SUPER_ADMIN' || user.role === 'SUPER_ADMIN') return true;

    // 1. Check User Permission Override
    if (user.permissions.length > 0) {
        return user.permissions[0].canView;
    }

    // 2. Check Role Permission Default
    if (user.roleId) {
        const rolePerm = await db.rolePermission.findUnique({
            where: {
                roleId_moduleKey: {
                    roleId: user.roleId,
                    moduleKey
                }
            }
        });
        if (rolePerm) return rolePerm.canView;
    }

    // 3. Fallback
    return true; 
}