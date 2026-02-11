"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeConfig } from "@/app/system/tenant-settings/appearance/types";

interface TenantTheme {
    id: string;
    name: string;
    config: any; // Prisma Json
    isPublished: boolean;
}

interface DynamicThemeContextType {
    themes: TenantTheme[];
    activeThemeId: string | null;
    setThemeId: (id: string) => void;
}

const DynamicThemeContext = createContext<DynamicThemeContextType>({
    themes: [],
    activeThemeId: null,
    setThemeId: () => {},
});

export const useDynamicTheme = () => useContext(DynamicThemeContext);

export function DynamicThemeProvider({ 
    children, 
    themes 
}: { 
    children: React.ReactNode; 
    themes: TenantTheme[] 
}) {
    const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    // Load preference from localStorage on mount
    useEffect(() => {
        setMounted(true);
        const storedId = localStorage.getItem("tenant-theme-id");
        if (storedId && themes.find(t => t.id === storedId)) {
            setActiveThemeId(storedId);
        } else if (themes.length > 0) {
            // Default to the first published theme if no preference
             setActiveThemeId(themes[0].id);
        }
    }, [themes]);

    const handleSetTheme = (id: string) => {
        setActiveThemeId(id);
        localStorage.setItem("tenant-theme-id", id);
    };

    const activeTheme = themes.find(t => t.id === activeThemeId);
    const config = activeTheme ? (activeTheme.config as unknown as ThemeConfig) : null;

    return (
        <DynamicThemeContext.Provider value={{ themes, activeThemeId, setThemeId: handleSetTheme }}>
            {mounted && config && (
                <style dangerouslySetInnerHTML={{
                    __html: `
                        :root {
                            ${Object.entries(config.light).map(([key, value]) => `--${key}: ${value};`).join("")}
                            --radius: ${config.radius}rem;
                        }
                        .dark {
                            ${Object.entries(config.dark).map(([key, value]) => `--${key}: ${value};`).join("")}
                        }
                    `
                }} />
            )}
            {children}
        </DynamicThemeContext.Provider>
    );
}
