"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, Menu, LogOut, User, Settings, Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import SidebarContent from "./SidebarContent";
import { cn } from "@/lib/utils";

import { logoutAction } from "@/app/auth/actions";

interface HeaderProps {
  user: any;
  onMenuClick?: () => void;
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" suppressHydrationWarning>
                    <Menu size={20} />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SidebarContent />
            </SheetContent>
        </Sheet>
        
        <div className="hidden md:flex items-center text-sm text-muted-foreground">
          {segments.map((segment, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="mx-2">/</span>}
              <span className={cn(
                "capitalize",
                index === segments.length - 1 && "text-foreground font-medium"
              )}>
                {segment}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-64 pl-9 h-9 bg-muted/50 border-none focus-visible:ring-1"
          />
        </div>

        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
            </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full" suppressHydrationWarning>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback>{user.email?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2">
            <div className="flex items-center gap-3 p-2 mb-1">
                <Avatar className="h-10 w-10 border">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback>{user.email?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-semibold leading-none">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {user.email}
                    </p>
                </div>
            </div>
            
            <DropdownMenuSeparator className="my-1" />
            
            <DropdownMenuItem className="cursor-pointer py-2.5">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>View profile</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="cursor-pointer py-2.5">
                <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Account Settings</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="my-1" />
            
            <div className="p-2">
                <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider pl-1">Theme</p>
                <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn("flex-1 h-7 rounded-md hover:bg-background/50", mounted && theme === 'light' && "bg-background shadow-sm text-primary hover:bg-background")}
                        onClick={() => setTheme("light")}
                    >
                        <Sun className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn("flex-1 h-7 rounded-md hover:bg-background/50", mounted && theme === 'system' && "bg-background shadow-sm text-primary hover:bg-background")}
                        onClick={() => setTheme("system")}
                    >
                        <Monitor className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn("flex-1 h-7 rounded-md hover:bg-background/50", mounted && theme === 'dark' && "bg-background shadow-sm text-primary hover:bg-background")}
                        onClick={() => setTheme("dark")}
                    >
                        <Moon className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            
            <DropdownMenuSeparator className="my-1" />
            
            <DropdownMenuItem 
                className="cursor-pointer py-2.5 text-muted-foreground focus:text-destructive focus:bg-destructive/10"
                onClick={() => logoutAction()}
            >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
