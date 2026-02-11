"use client";

import React, { useState } from 'react';
import { Lock, Mail, Loader2, ArrowRight, ShieldCheck, BarChart3, Globe } from 'lucide-react';
import { loginAction } from './actions';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Column - Brand & Visuals */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-900 text-white flex-col justify-between p-12 overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
           <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600 blur-[120px]" />
           <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600 blur-[100px]" />
        </div>

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tighter">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-zinc-950">
              <BarChart3 size={20} strokeWidth={3} />
            </div>
            THE MANAGER
          </div>
        </div>

        {/* Quote/Testimonial */}
        <div className="relative z-10 max-w-lg">
          <blockquote className="text-3xl font-medium leading-tight mb-6">
            "The modular architecture allows us to scale without friction. It's not just a dashboard, it's a command center."
          </blockquote>
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <Globe size={18} className="text-zinc-400"/>
             </div>
             <div>
               <div className="font-semibold text-sm">System Architect</div>
               <div className="text-zinc-500 text-xs">Enterprise Solutions Inc.</div>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-zinc-500 text-xs flex gap-6">
          <span>© 2026 The Manager Inc.</span>
          <span className="hover:text-zinc-300 cursor-pointer transition-colors">Privacy Policy</span>
          <span className="hover:text-zinc-300 cursor-pointer transition-colors">Terms of Service</span>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        <div className="w-full max-w-[400px] space-y-8">
          
          <div className="text-center lg:text-left space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="text-muted-foreground">Enter your credentials to access your account</p>
          </div>

          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-2.5 text-muted-foreground transition-colors group-focus-within:text-primary" size={18} />
                  <Input 
                    id="email"
                    name="email" 
                    type="email" 
                    required 
                    placeholder="name@example.com"
                    className="pl-10 h-11 bg-background border-input hover:border-primary/50 transition-colors focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <a href="#" className="text-xs text-primary hover:underline font-medium">Forgot password?</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-2.5 text-muted-foreground transition-colors group-focus-within:text-primary" size={18} />
                  <Input 
                    id="password"
                    name="password" 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    className="pl-10 h-11 bg-background border-input hover:border-primary/50 transition-colors focus-visible:ring-primary"
                  />
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              disabled={loading}
              className="w-full h-11 font-bold tracking-wide transition-all shadow-lg hover:shadow-primary/25"
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" size={18} />
              ) : (
                <span className="flex items-center gap-2">Sign In <ArrowRight size={16} /></span>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-10 hover:bg-muted/50" type="button">
              GitHub
            </Button>
            <Button variant="outline" className="h-10 hover:bg-muted/50" type="button">
              Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
