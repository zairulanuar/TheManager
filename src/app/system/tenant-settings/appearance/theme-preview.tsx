"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeConfig } from "./types";
import { cn } from "@/lib/utils";
import React from "react";

interface ThemePreviewProps {
    config: ThemeConfig;
    mode: "light" | "dark";
}

export function ThemePreview({ config, mode }: ThemePreviewProps) {
    const colors = config[mode];
    
    // Convert config colors to CSS variables style object
    const style = {
        "--background": colors.background,
        "--foreground": colors.foreground,
        "--card": colors.card,
        "--card-foreground": colors["card-foreground"],
        "--popover": colors.popover,
        "--popover-foreground": colors["popover-foreground"],
        "--primary": colors.primary,
        "--primary-foreground": colors["primary-foreground"],
        "--secondary": colors.secondary,
        "--secondary-foreground": colors["secondary-foreground"],
        "--muted": colors.muted,
        "--muted-foreground": colors["muted-foreground"],
        "--accent": colors.accent,
        "--accent-foreground": colors["accent-foreground"],
        "--destructive": colors.destructive,
        "--destructive-foreground": colors["destructive-foreground"],
        "--border": colors.border,
        "--input": colors.input,
        "--ring": colors.ring,
        "--radius": `${config.radius}rem`,
    } as React.CSSProperties;

    return (
        <div 
            className={cn(
                "w-full rounded-lg border bg-background text-foreground p-4",
                mode === "dark" ? "dark" : ""
            )}
            style={style}
        >
            <div className="flex flex-col gap-4">
                {/* Card 1: Account / Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Account</CardTitle>
                        <CardDescription>Make changes to your account here.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" defaultValue="Pedro Duarte" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" defaultValue="@peduarte" />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline">Cancel</Button>
                        <Button>Save changes</Button>
                    </CardFooter>
                </Card>

                <div className="grid gap-4 sm:grid-cols-1 xl:grid-cols-2">
                    {/* Card 2: Payment Method (Mini) */}
                    <Card className="flex flex-col justify-between">
                        <CardHeader>
                            <CardTitle>Payment Method</CardTitle>
                            <CardDescription>Add a new payment method.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                             <div className="flex items-center space-x-4 rounded-md border p-4">
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        Stripe
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        •••• 4242
                                    </p>
                                </div>
                                <Button variant="secondary" size="sm">Edit</Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 3: Notifications (Switch) */}
                    <Card className="flex flex-col justify-between">
                        <CardHeader className="pb-3">
                            <CardTitle>Notifications</CardTitle>
                            <CardDescription>Choose what you want to be notified about.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-1">
                            <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">Everything</p>
                                    <p className="text-sm text-muted-foreground">
                                        Email digest, mentions & all activity.
                                    </p>
                                </div>
                                <Switch id="n-1" defaultChecked />
                            </div>
                            <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">Available</p>
                                    <p className="text-sm text-muted-foreground">
                                        Only mentions and comments.
                                    </p>
                                </div>
                                <Switch id="n-2" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
