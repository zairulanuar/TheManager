import { ApplicationSettingsPage } from "./application-settings-page";
import { getSessionContext } from "@/core/services/auth-service";

export default async function SettingsPage() {
    const session = await getSessionContext();
    
    // Check Super Admin via Role Type (Support both old Enum and new Model)
    const isSuperAdmin = session && (
        session.role?.type === 'SUPER_ADMIN' || 
        // @ts-ignore
        session.roleType === 'SUPER_ADMIN' || 
        // @ts-ignore
        session.role === 'SUPER_ADMIN'
    );

    if (!isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="p-4 bg-destructive/10 rounded-full">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-12 h-12 text-destructive"
                    >
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Access Restricted</h1>
                    <p className="text-muted-foreground max-w-[500px]">
                        The System Settings area is restricted to Super Administrators only. 
                        Please contact your administrator if you believe this is an error.
                    </p>
                </div>
            </div>
        );
    }

    return <ApplicationSettingsPage />;
}
