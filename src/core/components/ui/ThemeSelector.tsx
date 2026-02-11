"use client";

import * as React from "react";
import { Check, Palette } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDynamicTheme } from "@/core/providers/dynamic-theme-provider";

export function ThemeSelector() {
  const { themes, activeThemeId, setThemeId } = useDynamicTheme();

  if (themes.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" suppressHydrationWarning>
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Select Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((theme) => (
          <DropdownMenuItem key={theme.id} onClick={() => setThemeId(theme.id)}>
            <span className="flex-1">{theme.name}</span>
            {activeThemeId === theme.id && <Check className="ml-2 h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
