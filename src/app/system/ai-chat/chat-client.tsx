'use client';

import { useState, useRef, useEffect, createElement } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Send, Bot, User, Loader2, Sparkles, SlidersHorizontal, 
    Paperclip, X, Trash2, Plus, MessageSquare, MoreHorizontal, Edit2, History, Menu,
    Search, SquarePen
} from 'lucide-react';
import { 
    createChatSession, getChatSession, saveChatMessage, 
    deleteChatSession, renameChatSession, generateText, checkServerStatus 
} from './actions';
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSettings, AppSettings } from '@/lib/useSettings';
import { ModelSettingsSidebar } from '@/components/chat/ModelSettingsSidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
}

interface ChatSession {
    id: string;
    title: string;
    updatedAt: Date | string;
}

interface ChatClientProps {
    initialSessions: ChatSession[];
    userRole: string;
    userId: string;
    userName: string;
    userAvatar?: string | null;
}

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ChatClient({ initialSessions, userRole, userId, userName, userAvatar }: ChatClientProps) {
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load latest session on mount if exists
  useEffect(() => {
    if (sessions.length > 0 && !currentSessionId) {
        loadSession(sessions[0].id);
    }
  }, []);

  const loadSession = async (sessionId: string) => {
    if (currentSessionId === sessionId) return;
    
    setIsLoading(true);
    try {
        const session = await getChatSession(sessionId);
        if (session) {
            setCurrentSessionId(sessionId);
            const uiMessages = session.messages.map((m: any) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
                images: m.images
            }));
            setMessages(uiMessages);
        }
    } catch (e) {
        console.error("Failed to load session", e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    setIsLoading(true);
    try {
        const result = await createChatSession();
        if (result.success && result.session) {
            const newSession = { 
                ...result.session, 
                updatedAt: result.session.updatedAt.toISOString() 
            };
            setSessions([newSession, ...sessions]);
            setCurrentSessionId(newSession.id);
            setMessages([]);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat?")) return;

    const result = await deleteChatSession(sessionId);
    if (result.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSessionId === sessionId) {
            setCurrentSessionId(null);
            setMessages([]);
        }
    }
  };

  // Renaming state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const startEditing = (session: ChatSession, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingSessionId(session.id);
      setEditTitle(session.title);
  };

  const saveTitle = async () => {
      if (!editingSessionId) return;
      const result = await renameChatSession(editingSessionId, editTitle);
      if (result.success) {
          setSessions(prev => prev.map(s => s.id === editingSessionId ? { ...s, title: editTitle } : s));
          setEditingSessionId(null);
      }
  };
  
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
        checkStatus(newSettings);
    }
  }, [globalSettings]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && images.length === 0) || isLoading) return;

    if (!currentSessionId) {
        // Create session first if none exists (shouldn't happen usually due to auto-create on mount, but just in case)
        await handleNewChat();
        // Wait for state update? No, handleNewChat sets state but it's async. 
        // We might need to block or handle this better. 
        // For now let's assume currentSessionId is set or we return.
        // Actually, handleNewChat updates state, but we need the ID immediately.
        // Let's modify handleNewChat to return the ID or handle it here.
        // Simpler: Just force user to create chat or auto-create in background.
        // Let's rely on the useEffect that creates/loads a session.
        if (!currentSessionId) return; 
    }

    const sessionId = currentSessionId!; // We know it exists now (or we skipped)
    
    const userMessage = input.trim();
    const currentImages = [...images];
    
    setInput('');
    setImages([]);
    
    // Optimistic update
    const newMsg: Message = { role: 'user', content: userMessage, images: currentImages };
    setMessages(prev => [...prev, newMsg]);
    setIsLoading(true);

    try {
      // 1. Save user message to DB
      await saveChatMessage(sessionId, 'user', userMessage, currentImages);

      // 2. Generate AI response
      const result = await generateText(userMessage, { 
          ...sessionSettings, 
          images: currentImages 
      });

      let assistantContent = '';
      if (result.success) {
        assistantContent = result.text || '';
      } else {
        assistantContent = result.error || 'Error: Failed to get response.';
      }

      // 3. Save assistant message to DB
      await saveChatMessage(sessionId, 'assistant', assistantContent);

      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }]);
      
      // Refresh session list to update titles/timestamps
      setSessions(prev => {
          const sessionIndex = prev.findIndex(s => s.id === sessionId);
          if (sessionIndex === -1) return prev;

          const updatedSession = { 
              ...prev[sessionIndex], 
              updatedAt: new Date().toISOString()
          };
          
          const newSessions = [...prev];
          newSessions.splice(sessionIndex, 1);
          newSessions.unshift(updatedSession);
          return newSessions;
      });

      // If it was the start of a conversation, fetch the new title
      if (messages.length <= 1) {
          const sessionData = await getChatSession(sessionId);
          if (sessionData) {
              setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: sessionData.title } : s));
          }
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Unexpected client error.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!currentSessionId) return;
    // Just clear messages in current session? Or delete session?
    // "Clear History" usually means delete all messages.
    // Let's interpret it as clearing current conversation.
    // For now, maybe just hide messages?
    // User asked for "personal memory", so clearing history might mean deleting the session.
    if (confirm("Clear this conversation?")) {
        // We can use deleteChatSession but that removes the session.
        // Maybe we just want to clear messages? 
        // Let's assume user wants to start over.
        // Just empty the messages array?
        setMessages([]);
        // But they are still in DB. 
        // We probably need a clearMessages action or just delete session and create new one.
        // Let's map it to delete session for now and create new.
        await deleteChatSession(currentSessionId);
        await handleNewChat();
    }
  };

  const SidebarContent = () => {
    const filteredSessions = sessions.filter(session => 
        session.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
     <div className="flex flex-col h-full">
         <div className="p-4 pt-14 border-b space-y-3">
             <Button onClick={handleNewChat} className="w-full justify-between shadow-sm" variant="default">
                 <span className="flex items-center gap-2">
                     <SquarePen size={16} /> New chat
                 </span>
                 <span className="text-xs opacity-60">Ctrl + Shift + O</span>
             </Button>
             <div className="relative">
                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input 
                    placeholder="Search chats" 
                    className="pl-9 h-9" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
             </div>
         </div>
         <ScrollArea className="flex-1">
             <div className="flex flex-col gap-1 p-2">
                 {filteredSessions.map(session => (
                     <div key={session.id} className="group flex items-center gap-1 relative">
                        {editingSessionId === session.id ? (
                            <div className="flex items-center gap-1 w-full px-2 py-1">
                                <Input 
                                    value={editTitle} 
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="h-8 text-sm"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveTitle();
                                        if (e.key === 'Escape') setEditingSessionId(null);
                                    }}
                                    onBlur={saveTitle}
                                />
                            </div>
                        ) : (
                            <Button 
                                variant={currentSessionId === session.id ? "secondary" : "ghost"}
                                className={cn(
                                    "flex-1 justify-start text-left truncate h-10 px-3",
                                    currentSessionId === session.id && "bg-secondary"
                                )}
                                onClick={() => loadSession(session.id)}
                            >
                                <MessageSquare size={14} className="mr-2 shrink-0 opacity-70" />
                                <span className="truncate flex-1">{session.title}</span>
                            </Button>
                        )}
                        
                        {!editingSessionId && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 absolute right-1">
                                        <MoreHorizontal size={14} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => startEditing(session, e)}>
                                        <Edit2 size={14} className="mr-2" /> Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => handleDeleteSession(session.id, e)}>
                                        <Trash2 size={14} className="mr-2" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                     </div>
                 ))}
                 {filteredSessions.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                        {searchQuery ? "No chats found" : "No chat history"}
                    </div>
                 )}
             </div>
         </ScrollArea>
     </div>
  );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6"> {/* Negative margin to counteract page padding if necessary, or just use h-full */}
      {/* Sidebar hidden on default, available via Sheet */}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative min-w-0">
        <div className="p-6 flex flex-col gap-6 h-full">
            <ModelSettingsSidebar 
                open={showSettings} 
                onOpenChange={setShowSettings}
                settings={sessionSettings}
                onSettingsChange={setSessionSettings}
                isSuperAdmin={isSuperAdmin}
            />

            <div className="flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" title="Chat History">
                                    <History className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-80 p-0">
                                <SheetTitle className="sr-only">Chat History</SheetTitle>
                                <SidebarContent />
                            </SheetContent>
                        </Sheet>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Sparkles className="w-8 h-8 text-primary" />
                            BestLa Ai
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={clearHistory} title="Clear Current Chat" disabled={!currentSessionId || messages.length === 0}>
                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </Button>
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
                                        {serverStatus === 'online' ? 'Online' : 
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
                            Settings
                        </Button>
                    </div>
                </div>
                <p className="text-muted-foreground">
                Chat with BestLa AI, your intelligent assistant.
                </p>
            </div>

            <Card className="flex-1 flex flex-col min-h-0 shadow-md">
                <CardHeader className="border-b px-6 py-4 bg-muted/20 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Bot className="w-5 h-5 text-primary" />
                        {sessions.find(s => s.id === currentSessionId)?.title || "New Chat"}
                    </CardTitle>
                    <Button variant="outline" size="icon" onClick={handleNewChat} title="New Chat" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                        <SquarePen className="w-5 h-5" />
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground py-12 flex flex-col items-center justify-center h-full">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Bot className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg mb-1">Hey {userName}, how can I help you?</h3>
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
                        {msg.role === 'user' ? (
                            <Avatar className="w-8 h-8 border border-primary">
                                <AvatarImage src={userAvatar || undefined} alt={userName} className="object-cover" />
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                    <User size={16} />
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-background border-border">
                                <Bot size={16} />
                            </div>
                        )}
                        <div className={cn(
                            "p-3 rounded-lg text-sm shadow-sm overflow-hidden",
                            msg.role === 'user' 
                            ? "bg-primary text-primary-foreground rounded-tr-none" 
                            : "bg-muted/50 text-foreground border border-border rounded-tl-none"
                        )}>
                            {msg.images && msg.images.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                {msg.images.map((img, imgIndex) => (
                                    <img key={imgIndex} src={img} alt="User upload" className="max-w-[200px] max-h-[200px] rounded-md object-cover border bg-background" />
                                ))}
                                </div>
                            )}
                            <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2" {...props} />,
                                li: ({node, ...props}) => createElement('li', { className: "mb-1", ...props }),
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
                
                <div className="p-4 border-t bg-background mt-auto flex flex-col gap-2">
                    {images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                        {images.map((img, i) => (
                            <div key={i} className="relative w-16 h-16 shrink-0 group">
                                <img src={img} alt="Preview" className="w-full h-full object-cover rounded-md border" />
                                <button 
                                    type="button"
                                    onClick={() => removeImage(i)}
                                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-sm opacity-90 hover:opacity-100 transition-opacity"
                                    aria-label="Remove image"
                                    title="Remove image"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                    <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            aria-label="Upload image"
                            title="Upload image"
                        />
                    <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            className="shrink-0"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                        >
                            <Paperclip size={20} className="text-muted-foreground" />
                            <span className="sr-only">Attach image</span>
                    </Button>
                    <Input
                        placeholder="Type your message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        className="flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <Button type="submit" disabled={(isLoading || (!input.trim() && images.length === 0))}>
                        <Send size={16} />
                        <span className="sr-only">Send</span>
                    </Button>
                    </form>
                </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}