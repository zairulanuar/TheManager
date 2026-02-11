"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    LayoutDashboard, 
    Settings, 
    Users, 
    Building2, 
    BarChart3, 
    ChevronLeft,
    Package,
    CreditCard,
    Blocks,
    Palette,
    Shield,
    Bot
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SidebarContentProps {
    collapsed?: boolean;
    onCollapse?: () => void;
    className?: string;
    user?: any;
}

export default function SidebarContent({ collapsed = false, onCollapse, className, user }: SidebarContentProps) {
    const pathname = usePathname();

    const isSuperAdmin = user?.roleType === 'SUPER_ADMIN' || user?.role?.type === 'SUPER_ADMIN';

    const navGroups = [
        {
            label: "Overview",
            items: [
                { name: 'Dashboard', href: '/system/dashboard', icon: LayoutDashboard },
                { name: 'Analytics', href: '/system/analytics', icon: BarChart3 },
            ]
        },
        {
            label: "Management",
            items: [
                { name: 'Organizations', href: '/system/organizations', icon: Building2 },
            ]
        },
        {
            label: "User Management",
            items: [
                { name: 'Users', href: '/system/users', icon: Users },
                { name: 'Roles & Permissions', href: '/system/roles', icon: Shield },
            ]
        },
        {
            label: "Settings",
            items: [
                { name: 'Settings', href: '/system/tenant-settings', icon: Settings },
            ]
        },
        {
            label: "KYC",
            items: [
                { name: 'Company KYC', href: '/system/kyc/company', icon: Shield },
            ]
        },
        {
            label: "BestLa Assistant",
            items: [
                { name: 'BestLa Chat', href: '/system/ai-chat', icon: Bot },
            ]
        },
        ...(isSuperAdmin ? [{
            label: "System Settings",
            items: [
                { name: 'Applications Settings', href: '/system/settings', icon: Settings },
                { name: 'Packages', href: '/system/packages', icon: Package },
                { name: 'Billings', href: '/system/billings', icon: CreditCard },
                { name: 'Payment Gateways', href: '/system/payment-gateways', icon: CreditCard },
                { name: 'Modules', href: '/system/modules', icon: Blocks },
                { name: 'SSM Verification Test', href: '/system/ssm-verification-test', icon: Shield },
            ]
        }] : [])
    ];

    // Use mounted state to avoid hydration mismatch
    const [mounted, setMounted] = React.useState(false);
    
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className={cn("flex flex-col h-full bg-card", className)} />;
    }

    return (
        <div className={cn("flex flex-col h-full bg-card", className)}>
            {/* Logo Section */}
            <div className="h-16 flex items-center px-6 border-b border-border">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                        <Package className="text-primary-foreground h-5 w-5" />
                    </div>
                    {!collapsed && (
                        <span className="font-bold text-xl tracking-tight whitespace-nowrap">
                            The Manager
                        </span>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 py-6 px-4">
                <nav className="space-y-6">
                    {collapsed ? (
                        navGroups.map((group, groupIndex) => (
                            <div key={group.label} className="space-y-2">
                                {groupIndex > 0 && <Separator className="my-2" />}
                                <div className="space-y-1">
                                    {group.items.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link key={item.href} href={item.href} passHref>
                                                <Button
                                                    variant={isActive ? "secondary" : "ghost"}
                                                    className={cn(
                                                        "w-full justify-center px-0 h-10 transition-all",
                                                        isActive && "shadow-sm bg-secondary/80",
                                                        !isActive && "text-muted-foreground hover:text-foreground"
                                                    )}
                                                    title={item.name}
                                                >
                                                    <Icon size={18} className={cn(isActive ? "text-primary" : "text-muted-foreground")} />
                                                </Button>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <Accordion type="multiple" defaultValue={["Overview", "Management", "User Management", "System Settings", "Settings", "KYC", "AI Assistant"]} className="w-full">
                            {navGroups.map((group) => (
                                <AccordionItem value={group.label} key={group.label} className="border-none">
                                    <AccordionTrigger className="py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:no-underline hover:text-foreground">
                                        {group.label}
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-0 pt-1">
                                        <div className="space-y-1">
                                            {group.items.map((item) => {
                                                const Icon = item.icon;
                                                const isActive = pathname === item.href;
                                                return (
                                                    <Link key={item.href} href={item.href} passHref>
                                                        <Button
                                                            variant={isActive ? "secondary" : "ghost"}
                                                            className={cn(
                                                                "w-full justify-start gap-3 h-10 transition-all",
                                                                isActive && "font-semibold shadow-sm bg-secondary/80",
                                                                !isActive && "text-muted-foreground hover:text-foreground"
                                                            )}
                                                        >
                                                            <Icon size={18} className={cn(isActive ? "text-primary" : "text-muted-foreground")} />
                                                            <span>{item.name}</span>
                                                        </Button>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </nav>
            </ScrollArea>

            {/* Footer - Only show if onCollapse is provided (Desktop) */}
            {onCollapse && (
                <div className="p-4 border-t border-border">
                    <Button 
                        variant="outline" 
                        size="sm"
                        className={cn(
                            "w-full gap-2 border-dashed",
                            collapsed && "px-0 justify-center"
                        )}
                        onClick={onCollapse}
                    >
                        <ChevronLeft className={cn("transition-transform duration-300", collapsed && "rotate-180")} size={16} />
                        {!collapsed && <span>Collapse</span>}
                    </Button>
                </div>
            )}
        </div>
    );
}
