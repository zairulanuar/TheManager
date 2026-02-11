import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppSettings } from '@/lib/useSettings';
import { Settings2, RotateCcw } from 'lucide-react';

interface ModelSettingsSidebarProps {
  settings: AppSettings['ai'];
  onSettingsChange: (newSettings: AppSettings['ai']) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import { Link as LinkIcon, Lock, Cpu } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// ... existing imports ...

export function ModelSettingsSidebar({ settings, onSettingsChange, open, onOpenChange }: ModelSettingsSidebarProps) {
  
  const handleChange = (key: keyof AppSettings['ai'], value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>BestLa Configuration</SheetTitle>
          <SheetDescription>
            Configure connection and model parameters for this session.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 py-6">
          
          <Accordion type="single" collapsible defaultValue="connection">
            <AccordionItem value="connection">
                <AccordionTrigger className="text-sm font-medium">Connection Settings</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                     <div className="grid gap-2">
                        <Label htmlFor="apiUrl" className="flex items-center gap-2">
                            <LinkIcon className="w-3 h-3" /> API URL
                        </Label>
                        <Input 
                            id="apiUrl" 
                            placeholder="https://..." 
                            value={settings.apiUrl || ''}
                            onChange={(e) => handleChange('apiUrl', e.target.value)}
                        />
                     </div>
                     <div className="grid gap-2">
                        <Label htmlFor="apiKey" className="flex items-center gap-2">
                            <Lock className="w-3 h-3" /> API Key
                        </Label>
                        <Input 
                            id="apiKey" 
                            type="password"
                            placeholder="sk-..." 
                            value={settings.apiKey || ''}
                            onChange={(e) => handleChange('apiKey', e.target.value)}
                        />
                     </div>
                     <div className="grid gap-2">
                        <Label htmlFor="modelName" className="flex items-center gap-2">
                            <Cpu className="w-3 h-3" /> Model Name
                        </Label>
                        <Input 
                            id="modelName" 
                            placeholder="llama3" 
                            value={settings.modelName || ''}
                            onChange={(e) => handleChange('modelName', e.target.value)}
                        />
                     </div>
                </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Preset - Placeholder for now */}
          <div className="grid gap-2">
            <Label>Preset</Label>
            <Select disabled>
              <SelectTrigger>
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
                <SelectItem value="precise">Precise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* System Prompt */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => handleChange('systemPrompt', '')}>Clear</Button>
            </div>
            <Textarea 
                id="systemPrompt" 
                placeholder="Example, 'Only answer in rhymes'" 
                className="min-h-[100px]"
                value={settings.systemPrompt || ''}
                onChange={(e) => handleChange('systemPrompt', e.target.value)}
            />
          </div>

          {/* Settings Group */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Settings
            </h3>
            
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label>Temperature</Label>
                        <span className="text-sm text-muted-foreground">{settings.temperature}</span>
                    </div>
                    <Slider 
                        value={[settings.temperature || 0.7]} 
                        max={2} 
                        step={0.1} 
                        onValueChange={(vals) => handleChange('temperature', vals[0])} 
                    />
                </div>

                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label>Max Tokens</Label>
                        <span className="text-sm text-muted-foreground">{settings.maxTokens}</span>
                    </div>
                    <Slider 
                        value={[settings.maxTokens || 2048]} 
                        min={1}
                        max={4096} 
                        step={1} 
                        onValueChange={(vals) => handleChange('maxTokens', vals[0])} 
                    />
                </div>
            </div>
          </div>

          {/* Sampling Group */}
          <div className="space-y-4">
             <h3 className="text-sm font-medium text-muted-foreground">Sampling</h3>
             
             <div className="grid gap-4">
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label>Top P Sampling</Label>
                        <span className="text-sm text-muted-foreground">{settings.topP}</span>
                    </div>
                    <Slider 
                        value={[settings.topP || 0.9]} 
                        max={1} 
                        step={0.01} 
                        onValueChange={(vals) => handleChange('topP', vals[0])} 
                    />
                </div>

                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label>Top K Sampling</Label>
                        <span className="text-sm text-muted-foreground">{settings.topK}</span>
                    </div>
                    <Input 
                        type="number" 
                        value={settings.topK} 
                        onChange={(e) => handleChange('topK', parseInt(e.target.value) || 0)}
                    />
                </div>

                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label>Repeat Penalty</Label>
                        <span className="text-sm text-muted-foreground">{settings.repeatPenalty}</span>
                    </div>
                     <Input 
                        type="number" 
                        step="0.1"
                        value={settings.repeatPenalty} 
                        onChange={(e) => handleChange('repeatPenalty', parseFloat(e.target.value) || 1)}
                    />
                </div>
             </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
