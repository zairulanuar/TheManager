"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Check, Play } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ThemeEditor } from "./theme-editor";
import { createTheme, updateTheme, deleteTheme, togglePublishTheme } from "./actions";
import { ThemeConfig, DEFAULT_THEME_CONFIG } from "./types";
import { THEME_PRESETS, ThemePreset } from "./presets";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useDynamicTheme } from "@/core/providers/dynamic-theme-provider";

interface ThemeManagerProps {
    themes: any[]; // Temporary fix until prisma client is regenerated
}

export function ThemeManager({ themes }: ThemeManagerProps) {
    const { activeThemeId, setThemeId } = useDynamicTheme();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createConfig, setCreateConfig] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);
    const [editingTheme, setEditingTheme] = useState<any | null>(null);

    const handleCreate = async (name: string, config: ThemeConfig, shouldApply = false) => {
        try {
            const newTheme = await createTheme(name, config);
            toast.success("Theme created successfully");
            
            if (shouldApply && newTheme) {
                if (!newTheme.isPublished) {
                    await togglePublishTheme(newTheme.id, true);
                }
                setThemeId(newTheme.id);
                toast.success("Theme applied");
            }

            setIsCreateOpen(false);
            setCreateConfig(DEFAULT_THEME_CONFIG); // Reset after success
        } catch (error) {
            toast.error("Failed to create theme");
        }
    };

    const handlePresetSelect = (preset: ThemePreset) => {
        setCreateConfig({
            ...DEFAULT_THEME_CONFIG,
            light: preset.config.light,
            dark: preset.config.dark,
            // Keep default radius or other settings not in preset
        });
        setIsCreateOpen(true);
    };

    const handlePresetApply = async (preset: ThemePreset, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening the editor
        try {
            // Check if theme already exists
            const existingTheme = themes.find(t => t.name === preset.label);
            
            if (existingTheme) {
                if (!existingTheme.isPublished) {
                    await togglePublishTheme(existingTheme.id, true);
                }
                setThemeId(existingTheme.id);
                toast.success(`${preset.label} theme applied`);
                return;
            }

            // Create a new theme with the preset name
            const newTheme = await createTheme(preset.label, {
                ...DEFAULT_THEME_CONFIG,
                light: preset.config.light,
                dark: preset.config.dark
            });
            
            if (newTheme) {
                await togglePublishTheme(newTheme.id, true);
                setThemeId(newTheme.id);
                toast.success(`${preset.label} theme applied`);
            }
        } catch (error) {
            toast.error("Failed to apply theme");
        }
    };

    const handleUpdate = async (id: string, name: string, config: ThemeConfig, shouldApply = false) => {
        try {
            const updatedTheme = await updateTheme(id, name, config);
            toast.success("Theme updated successfully");
            
            if (shouldApply && updatedTheme) {
                 if (!updatedTheme.isPublished) {
                    await togglePublishTheme(updatedTheme.id, true);
                }
                setThemeId(updatedTheme.id);
                toast.success("Theme applied");
            }

            setEditingTheme(null);
        } catch (error) {
            toast.error("Failed to update theme");
        }
    };

    const handleApplyExisting = async (theme: any) => {
        try {
            if (!theme.isPublished) {
                await togglePublishTheme(theme.id, true);
            }
            setThemeId(theme.id);
            toast.success("Theme applied");
        } catch (error) {
            toast.error("Failed to apply theme");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteTheme(id);
            toast.success("Theme deleted successfully");
        } catch (error) {
            toast.error("Failed to delete theme");
        }
    };

    const handleTogglePublish = async (id: string, currentStatus: boolean) => {
        try {
            await togglePublishTheme(id, !currentStatus);
            toast.success(`Theme ${!currentStatus ? 'published' : 'unpublished'}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold tracking-tight">Themes</h2>
                    <Button onClick={() => {
                        setCreateConfig(DEFAULT_THEME_CONFIG);
                        setIsCreateOpen(true);
                    }}>
                        <Plus className="mr-2 h-4 w-4" /> New Theme
                    </Button>
                </div>
                
                {/* Premade Themes Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                         <h3 className="text-lg font-medium text-muted-foreground">Premade Themes</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {THEME_PRESETS.map((preset) => (
                            <div 
                                key={preset.name} 
                                className="group relative flex flex-col gap-2 cursor-pointer"
                                onClick={() => handlePresetSelect(preset)}
                            >
                                <div className="overflow-hidden rounded-md border bg-popover hover:border-primary transition-colors">
                                    <div className="flex h-24 flex-col">
                                        {/* Preview visual */}
                                        <div 
                                            className="flex-1 flex p-2 gap-1 bg-[hsl(var(--preset-bg))]" 
                                            style={{ '--preset-bg': preset.activeColor.light } as React.CSSProperties}
                                        >
                                            <div className="w-1/3 h-full bg-background/90 rounded-sm" />
                                            <div className="w-2/3 h-full flex flex-col gap-1">
                                                <div className="h-2 w-full bg-background/50 rounded-sm" />
                                                <div className="h-2 w-2/3 bg-background/50 rounded-sm" />
                                            </div>
                                        </div>
                                        <div className="h-8 flex items-center justify-between px-2 bg-card">
                                            <span className="text-xs font-medium">{preset.label}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Overlay for Quick Apply */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button 
                                            size="sm" 
                                            variant="secondary" 
                                            className="h-8 px-2 text-xs"
                                            onClick={(e) => handlePresetApply(preset, e)}
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {themes.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-muted-foreground">Your Themes</h3>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {themes.map((theme) => (
                            <Card key={theme.id} className="overflow-hidden">
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle>{theme.name}</CardTitle>
                                            <CardDescription>
                                                Created {new Date(theme.createdAt).toLocaleDateString()}
                                            </CardDescription>
                                        </div>
                                        <Badge variant={theme.isPublished ? "default" : "secondary"}>
                                            {theme.isPublished ? "Published" : "Draft"}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                     {/* Mini Preview of Colors */}
                                    <div className="flex gap-2 mb-4">
                                        {/* We need to safely access config as JSON */}
                                        <div 
                                            className="h-6 w-6 rounded-full border bg-[hsl(var(--preview-l-p))]" 
                                            style={{ '--preview-l-p': (theme.config as any)?.light?.primary } as React.CSSProperties} 
                                            title="Primary (Light)" 
                                        />
                                        <div 
                                            className="h-6 w-6 rounded-full border bg-[hsl(var(--preview-l-b))]" 
                                            style={{ '--preview-l-b': (theme.config as any)?.light?.background } as React.CSSProperties} 
                                            title="Background (Light)" 
                                        />
                                        <div 
                                            className="h-6 w-6 rounded-full border bg-[hsl(var(--preview-d-p))]" 
                                            style={{ '--preview-d-p': (theme.config as any)?.dark?.primary } as React.CSSProperties} 
                                            title="Primary (Dark)" 
                                        />
                                        <div 
                                            className="h-6 w-6 rounded-full border bg-[hsl(var(--preview-d-b))]" 
                                            style={{ '--preview-d-b': (theme.config as any)?.dark?.background } as React.CSSProperties} 
                                            title="Background (Dark)" 
                                        />
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        {activeThemeId === theme.id ? (
                                            <Button variant="outline" size="sm" className="w-full gap-2 cursor-default bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700 border-green-200">
                                                <Check className="h-4 w-4" /> Active
                                            </Button>
                                        ) : (
                                            <Button size="sm" className="w-full gap-2" onClick={() => handleApplyExisting(theme)}>
                                                <Play className="h-4 w-4" /> Apply
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between border-t p-4 bg-muted/50">
                                    <div className="flex items-center gap-2">
                                        <Switch 
                                            checked={theme.isPublished}
                                            onCheckedChange={() => handleTogglePublish(theme.id, theme.isPublished)}
                                        />
                                        <span className="text-sm text-muted-foreground">Publish</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => setEditingTheme(theme)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" suppressHydrationWarning>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Theme?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the theme "{theme.name}".
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(theme.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Dialog - Moved outside */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Theme</DialogTitle>
                        <DialogDescription>
                            Customize your brand colors for light and dark modes.
                        </DialogDescription>
                    </DialogHeader>
                    <ThemeEditor 
                        initialConfig={createConfig} 
                        onSave={(name: string, config: ThemeConfig) => handleCreate(name, config)} 
                        onSaveAndApply={(name: string, config: ThemeConfig) => handleCreate(name, config, true)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingTheme} onOpenChange={(open) => !open && setEditingTheme(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Theme</DialogTitle>
                    </DialogHeader>
                    {editingTheme && (
                        <ThemeEditor 
                            initialName={editingTheme.name}
                            initialConfig={editingTheme.config as unknown as ThemeConfig} 
                            onSave={(name: string, config: ThemeConfig) => handleUpdate(editingTheme.id, name, config)} 
                            onSaveAndApply={(name: string, config: ThemeConfig) => handleUpdate(editingTheme.id, name, config, true)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
