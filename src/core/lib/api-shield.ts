import { NextResponse } from "next/server";
import { getSessionContext } from "../services/auth-service";

export async function withGlobalShield(handler: (context: any) => Promise<any>) {
    const context = await getSessionContext();
    if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isGlobal = context.roleType === 'SUPER_ADMIN';
    return await handler({
        ...context,
        tenantId: isGlobal ? undefined : context.organizationId,
        isGlobal
    });
}