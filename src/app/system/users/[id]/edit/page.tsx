import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EditUserForm from "./edit-user-form";
import { getSessionContext } from "@/core/services/auth-service";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditUserPage(props: PageProps) {
    const params = await props.params;
    const { id } = params;
    
    const session = await getSessionContext();
    if (!session?.accountId) {
        notFound(); // Or redirect to login
    }
    
    // Security check: Ensure user belongs to the same account
    const user = await db.user.findUnique({
        where: { id },
        include: { role: true }
    });

    if (!user || user.accountId !== session.accountId) {
        notFound();
    }

    // Serialize dates for Client Component
    const serializedUser = {
        ...user,
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null,
    };

    const isSuperAdmin = session && (
        session.role?.type === 'SUPER_ADMIN' || 
        // @ts-ignore
        session.roleType === 'SUPER_ADMIN' || 
        // @ts-ignore
        session.role === 'SUPER_ADMIN'
    );

    return <EditUserForm user={serializedUser} isSuperAdmin={!!isSuperAdmin} />;
}
