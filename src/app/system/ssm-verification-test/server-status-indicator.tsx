"use client";

import { useEffect, useState } from "react";
import { checkServerStatus } from "./check-server-status";
import { Loader2, Wifi, WifiOff } from "lucide-react";

export default function ServerStatusIndicator() {
    const [status, setStatus] = useState<"loading" | "online" | "offline">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        checkStatus();
        
        // Poll every 30 seconds
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    async function checkStatus() {
        // Don't set loading on subsequent polls to avoid flickering
        // setStatus("loading"); 
        
        try {
            const result = await checkServerStatus();
            if (result.status === "online") {
                setStatus("online");
                setMessage("OCR Server is Operational");
            } else {
                setStatus("offline");
                setMessage(result.message || "Server unreachable");
            }
        } catch (error) {
            setStatus("offline");
            setMessage("Failed to check status");
        }
    }

    if (status === "loading") {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full border">
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Checking Server...</span>
            </div>
        );
    }

    return (
        <div 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors cursor-help ${
                status === "online" 
                    ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400" 
                    : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
            }`}
            title={`${message} (Hugging Face OCR Engine)`}
        >
            {status === "online" ? (
                <Wifi className="h-3.5 w-3.5" />
            ) : (
                <WifiOff className="h-3.5 w-3.5" />
            )}
            <span className="text-xs font-semibold">
                {status === "online" ? "Server Online" : "Server Offline"}
            </span>
            <span className={`flex h-2 w-2 rounded-full ${status === "online" ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
        </div>
    );
}
