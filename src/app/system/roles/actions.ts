"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getInstalledModules } from "../modules/actions";

// Helper to seed roles if they don't exist
async function ensureRolesExist() {
    try {
        const count = await db.role.count();
        if (count === 0) {
            console.log("Seeding default roles...");
            const roles = [
                { name: "Super Admin", key: "super_admin", type: "SUPER_ADMIN", description: "Full system access", isSystem: true },
                { name: "Owner", key: "owner", type: "OWNER", description: "Tenant owner", isSystem: true },
                { name: "Admin", key: "admin", type: "ADMIN", description: "Tenant administrator", isSystem: true },
                { name: "User", key: "user", type: "USER", description: "Standard user", isSystem: true },
            ];

            for (const role of roles) {
                await db.role.create({
                    data: {
                        name: role.name,
                        key: role.key,
                        type: role.type as any,
                        description: role.description,
                        isSystem: role.isSystem
                    }
                });
            }
        }

        // Migration: Link users to roles if missing
        const usersWithoutRole = await db.user.findMany({ where: { roleId: null } });
        if (usersWithoutRole.length > 0) {
            console.log(`Migrating ${usersWithoutRole.length} users to new Role system...`);
            const roles = await db.role.findMany();
            for (const user of usersWithoutRole) {
                // @ts-ignore
                const userRoleType = user.roleType || user.role; // Handle both client versions
                const matchingRole = roles.find(r => r.type === userRoleType);
                if (matchingRole) {
                    await db.user.update({
                        where: { id: user.id },
                        data: { roleId: matchingRole.id }
                    });
                }
            }
        }

    } catch (error) {
        console.error("Failed to seed roles:", error);
    }
}

export async function getRoles() {
    await ensureRolesExist();
    return await db.role.findMany({
        orderBy: { createdAt: 'asc' }
    });
}

export async function getRolePermissions(roleId: string) {
    return await db.rolePermission.findMany({
        where: { roleId },
    });
}

export async function updateRolePermission(roleId: string, moduleKey: string, canView: boolean, canEdit: boolean) {
    try {
        await db.rolePermission.upsert({
            where: {
                roleId_moduleKey: {
                    roleId,
                    moduleKey
                }
            },
            update: {
                canView,
                canEdit
            },
            create: {
                roleId,
                moduleKey,
                canView,
                canEdit
            }
        });
        revalidatePath("/system/roles");
        return { success: true };
    } catch (error) {
        console.error("Failed to update role permission:", error);
        return { error: "Failed to update permission" };
    }
}

export async function createRole(name: string, description: string) {
    try {
        const key = name.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now().toString().slice(-4);
        await db.role.create({
            data: {
                name,
                key,
                type: 'USER' as any, // Custom roles default to USER permissions level base
                description,
                isSystem: false
            }
        });
        revalidatePath("/system/roles");
        return { success: true };
    } catch (error) {
        return { error: "Failed to create role" };
    }
}

export async function deleteRole(id: string) {
    try {
        const role = await db.role.findUnique({ where: { id } });
        if (role?.isSystem) return { error: "Cannot delete system role" };
        
        await db.role.delete({ where: { id } });
        revalidatePath("/system/roles");
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete role" };
    }
}

export async function getAllModules() {
    return await getInstalledModules();
}
