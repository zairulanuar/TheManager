import { getSessionContext } from "@/core/services/auth-service";
import UserForm from "../user-form";

export default async function UserCreatePage() {
    const session = await getSessionContext();
    const isSuperAdmin = session && (
        session.role?.type === 'SUPER_ADMIN' || 
        // @ts-ignore
        session.roleType === 'SUPER_ADMIN' || 
        // @ts-ignore
        session.role === 'SUPER_ADMIN'
    );

    return (
        <div className="w-full space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Create User</h1>
            </div>
            <UserForm isSuperAdmin={!!isSuperAdmin} />
        </div>
    );
}
