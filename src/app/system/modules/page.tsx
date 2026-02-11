import { getInstalledModules } from "./actions";
import ModuleUploader from "./module-uploader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Blocks, Box } from "lucide-react";
import { getSessionContext } from "@/core/services/auth-service";

export default async function ModulesPage() {
    const session = await getSessionContext();
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
                    <Blocks className="w-12 h-12 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Access Restricted</h1>
                    <p className="text-muted-foreground max-w-[500px]">
                        Module management is restricted to Super Administrators only.
                    </p>
                </div>
            </div>
        );
    }

    const installedModules = await getInstalledModules();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Module Management</h2>
                <p className="text-muted-foreground">Install and manage system-wide modules.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <ModuleUploader />

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Blocks className="h-5 w-5" />
                            Installed Modules
                        </CardTitle>
                        <CardDescription>
                            {installedModules.length} module{installedModules.length !== 1 ? 's' : ''} detected in system
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {installedModules.length > 0 ? (
                            <div className="space-y-4">
                                {installedModules.map((mod: any) => (
                                    <div key={mod.id} className="flex items-start justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                                        <div className="flex gap-3">
                                            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                                                <Box className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">{mod.name}</h4>
                                                <p className="text-sm text-muted-foreground line-clamp-1">{mod.description}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <Badge variant="outline" className="text-xs">v{mod.version}</Badge>
                                                    <Badge variant="secondary" className="text-xs font-mono">{mod.id}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Box className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>No modules installed yet.</p>
                                <p className="text-sm">Upload a ZIP file to get started.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
