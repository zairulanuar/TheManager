"use client";

import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import SidebarContent from './SidebarContent';

interface SidebarProps {
    user: any;
    className?: string;
}

export default function Sidebar({ user, className }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside 
            className={cn(
                "h-screen border-r border-border transition-all duration-300 ease-in-out flex-col relative z-20 hidden md:flex",
                collapsed ? 'w-20' : 'w-72',
                className
            )}
        >
            <SidebarContent 
                collapsed={collapsed} 
                onCollapse={() => setCollapsed(!collapsed)}
                user={user}
            />
        </aside>
    );
}
