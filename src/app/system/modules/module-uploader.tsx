"use client";

import { useState } from "react";
import { uploadModuleAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileBox, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ModuleUploader() {
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    async function handleUpload(formData: FormData) {
        setIsUploading(true);
        setMessage(null);
        
        try {
            const result = await uploadModuleAction(formData);
            if (result.success) {
                setMessage({ type: 'success', text: result.message || "Module installed" });
                // Reset form
                const form = document.getElementById("module-upload-form") as HTMLFormElement;
                form?.reset();
            } else {
                setMessage({ type: 'error', text: result.error || "Failed to install" });
            }
        } catch (error) {
            setMessage({ type: 'error', text: "An unexpected error occurred" });
        } finally {
            setIsUploading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Install New Module
                </CardTitle>
                <CardDescription>Upload a .zip file containing the module structure and manifest.json</CardDescription>
            </CardHeader>
            <CardContent>
                <form id="module-upload-form" action={handleUpload} className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="moduleZip">Module Archive (.zip)</Label>
                        <Input id="moduleZip" name="moduleZip" type="file" accept=".zip" required disabled={isUploading} />
                    </div>
                    
                    {message && (
                        <Alert variant={message.type === 'error' ? "destructive" : "default"} className={message.type === 'success' ? "border-green-500 text-green-700 bg-green-50" : ""}>
                            {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            <AlertTitle>{message.type === 'success' ? "Success" : "Error"}</AlertTitle>
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" disabled={isUploading}>
                        {isUploading ? "Installing..." : "Install Module"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
