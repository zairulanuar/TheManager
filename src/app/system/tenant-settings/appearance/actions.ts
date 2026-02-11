"use server";

import { db } from "@/lib/db";
import { getSessionContext } from "@/core/services/auth-service";
import { revalidatePath } from "next/cache";
import { ThemeConfig, DEFAULT_THEME_CONFIG } from "./types";

export async function getTenantThemes() {
    const session = await getSessionContext();
    if (!session?.accountId) return [];

    const themes = await (db as any).tenantTheme.findMany({
        where: { accountId: session.accountId },
        select: {
            id: true,
            name: true,
            colors: true,
            radius: true,
            isPublished: true,
            accountId: true,
            createdAt: true
        },
        orderBy: { createdAt: 'desc' }
    });

    return themes.map((t: any) => ({
        ...t,
        config: {
            light: t.colors?.light || DEFAULT_THEME_CONFIG.light,
            dark: t.colors?.dark || DEFAULT_THEME_CONFIG.dark,
            radius: t.radius
        }
    }));
}

export async function getPublishedThemes() {
    const session = await getSessionContext();
    if (!session?.accountId) return [];

    const themes = await (db as any).tenantTheme.findMany({
        where: { accountId: session.accountId, isPublished: true },
        select: {
            id: true,
            name: true,
            colors: true,
            radius: true,
            isPublished: true,
            accountId: true,
            createdAt: true
        },
        orderBy: { name: 'asc' }
    });

    return themes.map((t: any) => ({
        ...t,
        config: {
            light: t.colors?.light || DEFAULT_THEME_CONFIG.light,
            dark: t.colors?.dark || DEFAULT_THEME_CONFIG.dark,
            radius: t.radius
        }
    }));
}

export async function createTheme(name: string, config: ThemeConfig) {
    const session = await getSessionContext();
    if (!session?.accountId) throw new Error("Unauthorized");

    const theme = await (db as any).tenantTheme.create({
        data: {
            name,
            colors: { light: config.light, dark: config.dark },
            radius: config.radius,
            accountId: session.accountId,
            isPublished: false
        }
    });
    revalidatePath("/system/tenant-settings/appearance");
    return {
        ...theme,
        config: {
            light: theme.colors?.light || DEFAULT_THEME_CONFIG.light,
            dark: theme.colors?.dark || DEFAULT_THEME_CONFIG.dark,
            radius: theme.radius
        }
    };
}

export async function updateTheme(id: string, name: string, config: ThemeConfig) {
     const session = await getSessionContext();
    if (!session?.accountId) throw new Error("Unauthorized");

    const theme = await (db as any).tenantTheme.update({
        where: { id, accountId: session.accountId },
        data: { 
            name, 
            colors: { light: config.light, dark: config.dark },
            radius: config.radius
        }
    });
    revalidatePath("/system/tenant-settings/appearance");
    return {
        ...theme,
        config: {
            light: theme.colors?.light || DEFAULT_THEME_CONFIG.light,
            dark: theme.colors?.dark || DEFAULT_THEME_CONFIG.dark,
            radius: theme.radius
        }
    };
}

export async function deleteTheme(id: string) {
    const session = await getSessionContext();
    if (!session?.accountId) throw new Error("Unauthorized");

    await (db as any).tenantTheme.delete({
        where: { id, accountId: session.accountId }
    });
    revalidatePath("/system/tenant-settings/appearance");
}

export async function togglePublishTheme(id: string, isPublished: boolean) {
    const session = await getSessionContext();
    if (!session?.accountId) throw new Error("Unauthorized");

    await (db as any).tenantTheme.update({
        where: { id, accountId: session.accountId },
        data: { isPublished }
    });
    revalidatePath("/system/tenant-settings/appearance");
}
