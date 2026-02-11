"use client";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
        <div className="flex gap-1 bg-secondary p-1 rounded-xl border border-border h-[42px] w-[116px] animate-pulse" />
    );
  }

  return (
    <div className="flex gap-1 bg-secondary p-1 rounded-xl border border-border">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setTheme("light")} 
        className={cn("h-8 w-8 rounded-lg", theme === 'light' && "bg-background shadow-sm")}
      >
        <Sun size={16}/>
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setTheme("dark")} 
        className={cn("h-8 w-8 rounded-lg", theme === 'dark' && "bg-background shadow-sm")}
      >
        <Moon size={16}/>
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setTheme("system")} 
        className={cn("h-8 w-8 rounded-lg", theme === 'system' && "bg-background shadow-sm")}
      >
        <Monitor size={16}/>
      </Button>
    </div>
  );
}