"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ThemeConfig, ThemeColors } from "./types";
import { THEME_PRESETS, ThemePreset } from "./presets";
import { ThemePreview } from "./theme-preview";
import { ChevronDown, ChevronUp, Moon, Sun } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// --- Helper Functions ---

function hexToHsl(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  const cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin;
  let h = 0,
    s = 0,
    l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `${h} ${s}% ${l}%`;
}

function hslToHex(hsl: string): string {
  // hsl string format: "222.2 47.4% 11.2%"
  // remove % and split
  const [hStr, sStr, lStr] = hsl.replace(/%/g, "").split(" ");
  const h = parseFloat(hStr);
  const s = parseFloat(sStr) / 100;
  const l = parseFloat(lStr) / 100;

  let c = (1 - Math.abs(2 * l - 1)) * s,
      x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
      m = l - c / 2,
      r = 0,
      g = 0,
      b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return "#" + toHex(r) + toHex(g) + toHex(b);
}

interface ThemeEditorProps {
    initialName?: string;
    initialConfig: ThemeConfig;
    onSave: (name: string, config: ThemeConfig) => void;
    onSaveAndApply?: (name: string, config: ThemeConfig) => void;
}

const COLOR_KEYS: (keyof ThemeColors)[] = [
    "background", "foreground", "primary", "primary-foreground", 
    "secondary", "secondary-foreground", "accent", "accent-foreground",
    "muted", "muted-foreground", "card", "card-foreground",
    "popover", "popover-foreground", "destructive", "destructive-foreground",
    "border", "input", "ring"
];

export function ThemeEditor({ initialName = "", initialConfig, onSave, onSaveAndApply }: ThemeEditorProps) {
    const [name, setName] = useState(initialName);
    const [config, setConfig] = useState<ThemeConfig>(initialConfig);
    const [activeTab, setActiveTab] = useState<"light" | "dark">("light");
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    const handleColorChange = (key: keyof ThemeColors, hexValue: string) => {
        const hslValue = hexToHsl(hexValue);
        setConfig(prev => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                [key]: hslValue
            }
        }));
    };

    const handlePresetChange = (preset: ThemePreset) => {
        setConfig(prev => ({
            ...prev,
            light: preset.config.light,
            dark: preset.config.dark
        }));
    };

    const handleRadiusChange = (value: number) => {
        setConfig(prev => ({ ...prev, radius: value }));
    };

    return (
        <div className="grid gap-6 py-4">
            <div className="grid gap-2">
                <Label htmlFor="theme-name">Theme Name</Label>
                <Input 
                    id="theme-name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="e.g. Brand Corporate" 
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Customizer Column */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {THEME_PRESETS.map((preset) => {
                                // Check if this preset is "active" by comparing primary color
                                const isActive = config.light.primary === preset.config.light.primary;
                                return (
                                    <Button
                                        key={preset.name}
                                        variant={"outline"}
                                        className={cn(
                                            "justify-start gap-2 px-2", 
                                            isActive && "border-2 border-primary"
                                        )}
                                        onClick={() => handlePresetChange(preset)}
                                    >
                                        <span 
                                            className="h-4 w-4 rounded-full border bg-[hsl(var(--preset-color))]" 
                                            style={{ '--preset-color': preset.activeColor[activeTab] } as React.CSSProperties} 
                                        />
                                        <span className="text-xs">{preset.label}</span>
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Radius</Label>
                        <div className="flex flex-wrap gap-2">
                            {[0, 0.3, 0.5, 0.75, 1.0].map((r) => (
                                <Button
                                    key={r}
                                    variant={config.radius === r ? "default" : "outline"}
                                    className="w-12"
                                    onClick={() => handleRadiusChange(r)}
                                >
                                    {r}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                         <Label>Mode</Label>
                         <div className="flex items-center gap-2">
                             <Button 
                                variant={activeTab === "light" ? "default" : "outline"} 
                                onClick={() => setActiveTab("light")}
                                className="w-full justify-start gap-2"
                             >
                                 <Sun className="h-4 w-4" /> Light
                             </Button>
                             <Button 
                                variant={activeTab === "dark" ? "default" : "outline"} 
                                onClick={() => setActiveTab("dark")}
                                className="w-full justify-start gap-2"
                             >
                                 <Moon className="h-4 w-4" /> Dark
                             </Button>
                         </div>
                    </div>
                </div>

                {/* Preview Column */}
                <div className="space-y-2">
                    <Label>Preview</Label>
                    <ThemePreview config={config} mode={activeTab} />
                </div>
            </div>

            {/* Advanced Settings */}
            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <Label>Advanced Settings</Label>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                            {isAdvancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            <span className="sr-only">Toggle</span>
                        </Button>
                    </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="mt-4 space-y-4">
                    <div className="grid gap-2">
                        <Label>Radius: {config.radius}rem</Label>
                        <Slider 
                            defaultValue={[config.radius]} 
                            max={2} 
                            step={0.1} 
                            onValueChange={(v) => handleRadiusChange(v[0])} 
                        />
                    </div>
                     <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "light" | "dark")} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="light">Light Mode</TabsTrigger>
                            <TabsTrigger value="dark">Dark Mode</TabsTrigger>
                        </TabsList>
                        <TabsContent value="light" className="space-y-4 mt-4">
                            <ColorGrid config={config.light} onChange={handleColorChange} />
                        </TabsContent>
                        <TabsContent value="dark" className="space-y-4 mt-4">
                            <ColorGrid config={config.dark} onChange={handleColorChange} />
                        </TabsContent>
                    </Tabs>
                </CollapsibleContent>
            </Collapsible>

            <div className="flex justify-end gap-2 pt-4">
                {onSaveAndApply && (
                    <Button variant="secondary" onClick={() => onSaveAndApply(name, config)} disabled={!name}>
                        Save & Apply
                    </Button>
                )}
                <Button onClick={() => onSave(name, config)} disabled={!name}>Save Theme</Button>
            </div>
        </div>
    );
}

function ColorGrid({ config, onChange }: { config: ThemeColors, onChange: (key: keyof ThemeColors, value: string) => void }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {COLOR_KEYS.map((key) => (
                <div key={key} className="space-y-2">
                    <Label className="capitalize text-xs">{key.replace("-", " ")}</Label>
                    <div className="flex items-center gap-2">
                        <Input 
                            type="color" 
                            value={hslToHex(config[key] || "0 0% 100%")} 
                            onChange={(e) => onChange(key, e.target.value)}
                            className="h-8 w-12 p-0 border-none" 
                        />
                        <span className="text-xs text-muted-foreground font-mono truncate">
                            {config[key]}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
