'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, Sparkles, Settings, SlidersHorizontal, Activity } from 'lucide-react';
import { generateText, checkServerStatus } from './actions';
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { useSettings, AppSettings } from '@/lib/useSettings';
import { ModelSettingsSidebar } from '@/components/chat/ModelSettingsSidebar';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { settings: globalSettings } = useSettings();
  const [sessionSettings, setSessionSettings] = useState<AppSettings['ai']>({
    apiUrl: '',
    apiKey: '',
    modelName: 'default',
    maxTokens: 2048,
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    repeatPenalty: 1.1,
    systemPrompt: ''
  });
  const [showSettings, setShowSettings] = useState(false);

  // Status state
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'building' | 'error'>('checking');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [latency, setLatency] = useState<number>(0);

  const checkStatus = async (settings: AppSettings['ai']) => {
    setServerStatus('checking');
    setStatusMessage('');
    try {
        const result = await checkServerStatus(settings);
        if (result.success) {
            setServerStatus(result.status === 'building' ? 'building' : 'online');
            setLatency(result.latency);
        } else {
            setServerStatus('error');
            setStatusMessage(result.status || 'Unknown error');
        }
    } catch (e) {
        setServerStatus('error');
        setStatusMessage('Connection failed');
    }
  };

  useEffect(() => {
    if (globalSettings?.ai) {
        const newSettings = { ...globalSettings.ai };
        setSessionSettings(prev => ({ ...prev, ...newSettings }));
        // Check status when global settings load
        checkStatus(newSettings);
    }
  }, [globalSettings]);

  // Also check status when session connection settings change (debounced slightly or on close?)
  // For now, let's just expose a refresh button or check on open drawer
  useEffect(() => {
     if (!globalSettings?.ai) return; // Wait for init
     // Optional: debounce check if user is typing URL
     const timer = setTimeout(() => {
         if (sessionSettings.apiUrl !== globalSettings.ai.apiUrl) {
             checkStatus(sessionSettings);
         }
     }, 1000);
     return () => clearTimeout(timer);
  }, [sessionSettings.apiUrl, sessionSettings.apiKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const result = await generateText(userMessage, sessionSettings);
      if (result.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: result.text || '' }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: result.error || 'Error: Failed to get response.' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Unexpected client error.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full p-6 flex flex-col gap-6 relative">
      <ModelSettingsSidebar 
        open={showSettings} 
        onOpenChange={setShowSettings}
        settings={sessionSettings}
        onSettingsChange={setSessionSettings}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-primary" />
                BestLa Assistant
            </h1>
            <div className="flex items-center gap-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                                serverStatus === 'online' ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" :
                                serverStatus === 'building' ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" :
                                serverStatus === 'checking' ? "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100" :
                                "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            )} onClick={() => checkStatus(sessionSettings)}>
                                <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    serverStatus === 'online' ? "bg-green-500 animate-pulse" :
                                    serverStatus === 'building' ? "bg-blue-500 animate-pulse" :
                                    serverStatus === 'checking' ? "bg-yellow-500" :
                                    "bg-red-500"
                                )} />
                                {serverStatus === 'online' ? `Online (${latency}ms)` : 
                                 serverStatus === 'building' ? 'Building...' :
                                 serverStatus === 'checking' ? 'Checking...' : 'Offline'}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>
                                {serverStatus === 'online' ? 'BestLa Server is reachable' : 
                                 serverStatus === 'building' ? 'Server is building/initializing' :
                                 `Cannot connect: ${statusMessage}`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Click to refresh</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowSettings(true)}>
                    <SlidersHorizontal className="w-4 h-4" />
                    BestLa Settings
                </Button>
            </div>
        </div>
        <p className="text-muted-foreground">
          Chat with BestLa running on Hugging Face.
        </p>
      </div>

      <Card className="flex-1 flex flex-col min-h-0 shadow-md">
        <CardHeader className="border-b px-6 py-4 bg-muted/20">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="w-5 h-5 text-primary" />
            Live Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-12 flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">How can I help you?</h3>
                  <p className="text-sm max-w-sm">I'm running on the BestLa model. Ask me anything!</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex w-full gap-3 max-w-[80%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                    msg.role === 'user' ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"
                  )}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={cn(
                    "p-3 rounded-lg text-sm shadow-sm overflow-hidden",
                    msg.role === 'user' 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-muted/50 text-foreground border border-border rounded-tl-none"
                  )}>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        code: ({node, className, children, ...props}: any) => {
                          const match = /language-(\w+)/.exec(className || '')
                          const isInline = !match && !String(children).includes('\n')
                          return isInline ? (
                            <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-xs" {...props}>
                              {children}
                            </code>
                          ) : (
                            <div className="overflow-x-auto my-2 rounded-md bg-black/90 text-white p-3">
                              <code className="font-mono text-xs block whitespace-pre" {...props}>
                                {children}
                              </code>
                            </div>
                          )
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex w-full gap-3 max-w-[80%] mr-auto">
                  <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                    <Bot size={16} />
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg rounded-tl-none border border-border">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t bg-background mt-auto">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1"
                autoFocus
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send size={16} />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
