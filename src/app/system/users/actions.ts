"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/core/services/auth-service";
import bcrypt from "bcryptjs";
import { RoleType } from "@prisma/client";

export async function getUsers() {
    const session = await getSessionContext();
    if (!session?.accountId) return [];

    // Check if current user is Super Admin
    const isSuperAdmin = session.role?.type === 'SUPER_ADMIN' || 
        // @ts-ignore
        session.roleType === 'SUPER_ADMIN' || 
        // @ts-ignore
        session.role === 'SUPER_ADMIN';

    const where: any = {};
    
    // Restrict non-Super Admins to their own account
    if (!isSuperAdmin) {
        where.accountId = session.accountId;
        // Hide Super Admins from non-Super Admins
        where.roleType = { not: 'SUPER_ADMIN' };
    }

    return db.user.findMany({
        where,
        orderBy: { email: "asc" },
        include: { role: true }
    });
}

export async function getUser(id: string) {
    const session = await getSessionContext();
    if (!session?.accountId) return null;

    const isSuperAdmin = session.role?.type === 'SUPER_ADMIN' || 
        // @ts-ignore
        session.roleType === 'SUPER_ADMIN' || 
        // @ts-ignore
        session.role === 'SUPER_ADMIN';

    const where: any = { id };
    
    if (!isSuperAdmin) {
        where.accountId = session.accountId;
    }

    return db.user.findUnique({
        where,
        include: { role: true }
    });
}

export async function createUser(data: { 
    name: string; 
    email: string; 
    password?: string; 
    role: RoleType;
    phone?: string;
    bio?: string;
    image?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date | string;
    gender?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    website?: string;
    isActive?: boolean;
    socialLinks?: any;
    preferences?: any;
    privacySettings?: any;
}) {
    const session = await getSessionContext();
    if (!session?.accountId) return { error: "Unauthorized" };

    // Check limit
    const currentCount = await db.user.count({ where: { accountId: session.accountId } });
    const account = await db.account.findUnique({ where: { id: session.accountId } });
    
    if (account && currentCount >= account.userLimit) {
        return { error: `User limit reached (${account.userLimit} max). Upgrade your plan.` };
    }

    // Check email uniqueness
    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) return { error: "Email already in use." };

    // Security: Only SUPER_ADMIN can assign SUPER_ADMIN role
    if (data.role === "SUPER_ADMIN") {
         const currentUser = await db.user.findUnique({ 
             where: { id: session.userId },
             select: { roleType: true }
         });
         
         if (currentUser?.roleType !== "SUPER_ADMIN") {
             return { error: "Only Super Admins can assign the Super Admin role" };
         }
    }

    const hashedPassword = await bcrypt.hash(data.password || "password123", 10);

    // Find Role ID
    const roleModel = await db.role.findFirst({ where: { type: data.role, isSystem: true } });

    await db.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            roleType: data.role,
            roleId: roleModel?.id,
            phone: data.phone,
            bio: data.bio,
            image: data.image,
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            gender: data.gender,
            address: data.address,
            city: data.city,
            state: data.state,
            country: data.country,
            postalCode: data.postalCode,
            website: data.website,
            isActive: data.isActive !== undefined ? data.isActive : true,
            socialLinks: data.socialLinks,
            preferences: data.preferences,
            privacySettings: data.privacySettings,
            accountId: session.accountId,
        },
    });

    revalidatePath("/system/users");
    return { success: true };
}

export async function updateUser(id: string, data: { 
    name: string; 
    email: string; 
    role: RoleType; 
    password?: string;
    phone?: string;
    bio?: string;
    image?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date | string;
    gender?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    website?: string;
    isActive?: boolean;
    socialLinks?: any;
    preferences?: any;
    privacySettings?: any;
}) {
    const session = await getSessionContext();
    if (!session?.accountId) return { error: "Unauthorized" };

    // Security: Prevent non-Super Admins from modifying Super Admin accounts
    const targetUser = await db.user.findUnique({ where: { id }, select: { roleType: true } });
    if (targetUser?.roleType === "SUPER_ADMIN") {
        const currentUser = await db.user.findUnique({ 
            where: { id: session.userId },
            select: { roleType: true }
        });
        
        if (currentUser?.roleType !== "SUPER_ADMIN") {
            return { error: "Only Super Admins can modify Super Admin accounts" };
        }
    }

    // Security: Only SUPER_ADMIN can assign SUPER_ADMIN role
    if (data.role === "SUPER_ADMIN") {
         const currentUser = await db.user.findUnique({ 
             where: { id: session.userId },
             select: { roleType: true }
         });
         
         if (currentUser?.roleType !== "SUPER_ADMIN") {
             return { error: "Only Super Admins can assign the Super Admin role" };
         }
    }

    // Find Role ID
    const roleModel = await db.role.findFirst({ where: { type: data.role, isSystem: true } });

    const updateData: any = {
        name: data.name,
        email: data.email,
        roleType: data.role,
        roleId: roleModel?.id,
        phone: data.phone,
        bio: data.bio,
        image: data.image,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        website: data.website,
        isActive: data.isActive,
        socialLinks: data.socialLinks,
        preferences: data.preferences,
        privacySettings: data.privacySettings,
    };

    if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
    }

    await db.user.update({
        where: { id, accountId: session.accountId },
        data: updateData,
    });

    revalidatePath("/system/users");
    revalidatePath(`/system/users/${id}`);
    return { success: true };
}

export async function deleteUser(id: string) {
    const session = await getSessionContext();
    if (!session?.accountId) return { error: "Unauthorized" };

    // Prevent deleting yourself
    if (id === session.userId) return { error: "You cannot delete your own account." };

    const isSuperAdmin = session.role?.type === 'SUPER_ADMIN' || 
        // @ts-ignore
        session.roleType === 'SUPER_ADMIN' || 
        // @ts-ignore
        session.role === 'SUPER_ADMIN';

    // Security: Fetch target user to check permissions
    const targetUser = await db.user.findUnique({ 
        where: { id }, 
        select: { roleType: true, accountId: true } 
    });

    if (!targetUser) return { error: "User not found" };

    // Non-Super Admins can only delete users in their own account
    if (!isSuperAdmin && targetUser.accountId !== session.accountId) {
        return { error: "Unauthorized" };
    }

    // Security: Prevent non-Super Admins from deleting Super Admin accounts
    if (targetUser.roleType === "SUPER_ADMIN") {
        if (!isSuperAdmin) {
            return { error: "Only Super Admins can delete Super Admin accounts" };
        }
    }

    await db.user.delete({ where: { id } });
    revalidatePath("/system/users");
    return { success: true };
}
