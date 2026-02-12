'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { getSessionContext } from '@/core/services/auth-service';
import { revalidatePath } from 'next/cache';

export async function checkServerStatus(options?: GenerationOptions) {
  try {
    // Fetch settings from DB if not provided in options
    let apiUrl = options?.apiUrl;
    let apiKey = options?.apiKey;

    if (!apiUrl) {
      const settings = await db.systemSetting.findMany({
        where: { group: 'AI' }
      });
      apiUrl = settings.find(s => s.key === 'AI_API_URL')?.value || process.env.BLABLADOR_BASE_URL;
      apiKey = settings.find(s => s.key === 'AI_API_KEY')?.value || process.env.BLABLADOR_API_KEY || process.env.HF_TOKEN;
    }

    if (!apiUrl) {
      return { success: false, status: 'not_configured', latency: 0 };
    }

    // Determine health check endpoint
    // Blablador: GET /
    // OpenAI: GET /v1/models (requires auth usually)
    
    let endpoint = apiUrl;
    // Remove /v1 if present for base check, or check /v1/models if standard
    const isV1 = endpoint.endsWith('/v1');
    if (isV1) {
        endpoint = endpoint.replace('/v1', '');
    }

    const start = Date.now();
    
    // Attempt simple GET first
    const headers: Record<string, string> = {};
    if (apiKey) {
       headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
        let response = await fetch(endpoint, { 
            method: 'GET', 
            headers,
            signal: controller.signal,
            cache: 'no-store'
        });

        // Fallback for OpenAI/Blablador style APIs that might 404 on root
        if (!response.ok && isV1) {
             try {
                const v1Response = await fetch(`${endpoint}/v1/models`, { 
                    method: 'GET', 
                    headers,
                    signal: controller.signal,
                    cache: 'no-store'
                });
                if (v1Response.ok) {
                    response = v1Response;
                }
             } catch (e) {
                 // ignore, proceed with original response
             }
        }

        clearTimeout(timeoutId);

        const latency = Date.now() - start;

        if (response.ok) {
            // Check content type to distinguish between actual app and HF building page
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                const text = await response.text();
                // Check for our specific app signature
                if (text.includes('BestLa AI Space')) {
                    return { success: true, status: 'online', latency };
                }
                
                // If it's an HF URL but doesn't have our signature, it's likely building or initializing
                if (endpoint.includes('hf.space')) {
                    return { success: false, status: 'building', latency };
                }
            }
            
            return { success: true, status: 'online', latency };
        } else {
            // Some APIs might return 404 on root but are still running
            // If it's a 401/403, it's online but auth failed
            if (response.status === 401 || response.status === 403) {
                 return { success: true, status: 'online_auth_error', latency };
            }
            return { success: false, status: `error_${response.status}`, latency };
        }
    } catch (err) {
        clearTimeout(timeoutId);
        return { success: false, status: 'unreachable', latency: 0 };
    }
  } catch (error) {
    console.error('Check Server Status Error:', error);
    return { success: false, status: 'error', latency: 0 };
  }
}


export interface GenerationOptions {
  apiUrl?: string;
  apiKey?: string;
  modelName?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  repeatPenalty?: number;
  maxTokens?: number;
  systemPrompt?: string;
  images?: string[];
}

const generateSchema = z.object({
  prompt: z.string().min(1),
  max_tokens: z.number().int().min(1).max(4096).default(512).optional(),
  images: z.array(z.string()).optional(),
});

const DEFAULT_SYSTEM_PROMPT = `You are BestLa Ai, the intelligent assistant for 'The Manager', a comprehensive ERP platform available on web and mobile.
Your purpose is to assist users across various integrated modules including:
- Human Resources (HR)
- Finance & Accounting
- Project Management
- Ar-Rahnu (Islamic Pawnbroking)
- Gold Investment
- Cooperative (Coop) Membership Management

You have access to Malay Language Tools. If a user asks for Malay translation, spelling correction, or style rewriting, you MUST use these tools.
To use a tool, output ONLY a JSON object in this format (no markdown, no other text):
{"tool": "tool_name", "arguments": {"arg_name": "value"}}

Available Tools:
- detect_language(text): Detect language of text.
- normalize_malay(text): Normalize informal Malay text.
- correct_spelling(text): Correct Malay spelling errors.
- apply_glossary(term): Look up Malay terms in glossary.
- rewrite_style(text, style="formal"|"casual"): Rewrite text in a specific style.
- translate(text, source_lang="ms"|"en", target_lang="ms"|"en"): Translate text.

Example:
User: "Translate 'Hello' to Malay"
Assistant: {"tool": "translate", "arguments": {"text": "Hello", "source_lang": "en", "target_lang": "ms"}}

Guidelines:
1. Identity: Always identify yourself as 'BestLa Ai'.
2. Tone: Professional, efficient, and helpful.
3. Context Awareness: Understand that you are operating within a business environment.
4. Language: Respond in the same language as the user.
   - If the user speaks English, reply in English.
   - If the user speaks Malay, reply in Standard Malay (Bahasa Melayu), NOT Indonesian (Bahasa Indonesia).
   - STRICTLY AVOID Indonesian terms. Use Malay terms only:
     - Use "Apa khabar" (not "Apa kabar")
     - Use "Sila" (not "Silakan")
     - Use "Kerana" (not "Karena")
     - Use "Boleh" (not "Bisa")
     - Use "Berbeza" (not "Berbeda")
     - Use "Wang/Duit" (not "Uang")
   - If the user makes a typo or uses an Indonesian term (e.g., "Apa kabar"), DO NOT point it out or correct them. Simply reply in correct Standard Malay (e.g., "Saya baik, terima kasih.").
5. Tool Usage: Do NOT use tools for normal conversation unless explicitly requested.`;

async function callMalayExpert(tool: string, args: any) {
    const endpoint = "https://zairulanuar-malaylanguage-mcp.hf.space/tools/execute";
    const token = process.env.HF_TOKEN_MALAY || process.env.HF_TOKEN;
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: tool, arguments: args })
        });
        
        if (!response.ok) {
            const err = await response.text();
            return `Tool Error (${response.status}): ${err}`;
        }
        
        const data = await response.json();
        // Result is in data.result (list of text content)
        if (data.result && Array.isArray(data.result)) {
            return data.result.map((c: any) => c.text).join("\n");
        }
        return JSON.stringify(data);
    } catch (e: any) {
        return `Connection Error: ${e.message}`;
    }
}

export async function generateText(prompt: string, options?: GenerationOptions) {
  try {
    const validData = generateSchema.parse({ 
        prompt, 
        max_tokens: options?.maxTokens,
        images: options?.images 
    });
    
    // Fetch settings from DB
    const settings = await db.systemSetting.findMany({
      where: { group: 'AI' }
    });
    
    // Merge DB settings with options (options take precedence)
    const apiUrl = options?.apiUrl || settings.find(s => s.key === 'AI_API_URL')?.value || process.env.BLABLADOR_BASE_URL;
    const apiKey = options?.apiKey || settings.find(s => s.key === 'AI_API_KEY')?.value || process.env.BLABLADOR_API_KEY || process.env.HF_TOKEN;
    const modelName = options?.modelName || settings.find(s => s.key === 'AI_MODEL_NAME')?.value || process.env.BLABLADOR_MODEL || 'default';
    
    const maxTokens = options?.maxTokens || parseInt(settings.find(s => s.key === 'AI_MAX_TOKENS')?.value || '2048');
    const temperature = options?.temperature ?? parseFloat(settings.find(s => s.key === 'AI_TEMPERATURE')?.value || '0.7');
    const topP = options?.topP ?? parseFloat(settings.find(s => s.key === 'AI_TOP_P')?.value || '0.9');
    const topK = options?.topK ?? parseInt(settings.find(s => s.key === 'AI_TOP_K')?.value || '40');
    const repeatPenalty = options?.repeatPenalty ?? parseFloat(settings.find(s => s.key === 'AI_REPEAT_PENALTY')?.value || '1.1');
    
    // Smart system prompt selection:
    // 1. Check provided option (if not empty and not the old default)
    // 2. Check DB setting (if not empty and not the old default)
    // 3. Use new BestLa Ai default
    let systemPrompt = options?.systemPrompt;
    const oldDefault = 'You are a helpful AI assistant.';
    
    if (!systemPrompt || systemPrompt === oldDefault) {
        const dbSystemPrompt = settings.find(s => s.key === 'AI_SYSTEM_PROMPT')?.value;
        if (dbSystemPrompt && dbSystemPrompt !== oldDefault) {
            systemPrompt = dbSystemPrompt;
        } else {
            systemPrompt = DEFAULT_SYSTEM_PROMPT;
        }
    }

    if (!apiUrl) {
        throw new Error("AI API URL is not configured.");
    }

    // Determine if we need to append /generate or use OpenAI format
    // For now, assume the user provides the base URL. 
    // If it's the hf space, it needs /generate. 
    // If it's Ollama/OpenAI, it might need /v1/chat/completions
    
    let endpoint = apiUrl;
    let body: any = { prompt: validData.prompt };

    // Simple heuristic: if it looks like the HF space, append /generate
    if (apiUrl.includes('hf.space') && !apiUrl.endsWith('/generate')) {
        endpoint = `${apiUrl}/generate`;
        // Specific params if supported, otherwise just prompt
        // Assuming API might accept some params
    } 
    // If it looks like Ollama/OpenAI (e.g. localhost:11434/v1), use chat completions
    else if (apiUrl.includes('/v1')) {
         endpoint = `${apiUrl}/chat/completions`;
         
         const messages = [];
         if (systemPrompt) {
            messages.push({ role: "system", content: systemPrompt });
         }

         // Handle multimodal content if images are present
          if (validData.images && validData.images.length > 0) {
              const userContent: any[] = [
                  { type: "text", text: prompt }
              ];
              
              validData.images.forEach(img => {
                 userContent.push({
                     type: "image_url",
                     image_url: { url: img }
                 });
             });
             
             messages.push({ role: "user", content: userContent });
         } else {
             messages.push({ role: "user", content: prompt });
         }

         body = {
            model: modelName,
            messages: messages,
            max_tokens: maxTokens,
            temperature: temperature,
            top_p: topP,
            // OpenAI doesn't support top_k usually, but Ollama does. 
            // We can add it if the API supports it, or ignore.
            // repeat_penalty is presence_penalty or frequency_penalty in OpenAI
            presence_penalty: repeatPenalty > 1 ? repeatPenalty - 1 : 0, // Rough mapping
            stream: false
         };
         
         // Add extra params that might be supported by local inference engines
         if (topK > 0) (body as any).top_k = topK;
         if (repeatPenalty !== 1.1) (body as any).repeat_penalty = repeatPenalty;
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
                const errorText = await response.text();
                console.error('AI API Error details:', response.status, errorText);
                return { success: false, error: `API Error ${response.status}: ${errorText.slice(0, 200)}` };
            }

            const data = await response.json();
            
            // Normalize response
            let generatedText = "";
            if (data.response) {
                generatedText = data.response; // Generic style
            } else if (data.choices && data.choices[0] && data.choices[0].message) {
                generatedText = data.choices[0].message.content; // OpenAI/Ollama style
            } else if (typeof data === 'string') {
                generatedText = data;
            } else {
                generatedText = JSON.stringify(data); // Fallback
            }

            // Handle Tool Execution (Malay MCP)
            // Look for JSON object with "tool" and "arguments"
            let finalResponse = generatedText;
            
            // Try to find JSON block
            const jsonMatch = generatedText.match(/\{[\s\S]*"tool"[\s\S]*"arguments"[\s\S]*\}/);
            
            if (jsonMatch) {
                try {
                    const jsonStr = jsonMatch[0];
                    const toolCall = JSON.parse(jsonStr);
                    
                    if (toolCall.tool && toolCall.arguments) {
                        // Execute the tool
                        const toolResult = await callMalayExpert(toolCall.tool, toolCall.arguments);
                        
                        // Feed result back to LLM for natural response
                        if (apiUrl.includes('/v1')) {
                             // Add the tool interaction to history and request final response
                             const followUpMessages = [...(body.messages || [])];
                             
                             // 1. Add the assistant's tool call
                             followUpMessages.push({ role: "assistant", content: jsonStr });
                             
                             // 2. Add the tool output
                             followUpMessages.push({ 
                                 role: "system", 
                                 content: `Tool Execution Result (${toolCall.tool}):\n${toolResult}\n\nPlease use this result to answer the user's original request naturally.` 
                             });
                             
                             // 3. Call LLM again
                             const followUpBody = { ...body, messages: followUpMessages };
                             
                             const followUpResponse = await fetch(endpoint, {
                                method: 'POST',
                                headers,
                                body: JSON.stringify(followUpBody),
                             });
                             
                             if (followUpResponse.ok) {
                                 const followUpData = await followUpResponse.json();
                                 if (followUpData.choices && followUpData.choices[0] && followUpData.choices[0].message) {
                                     finalResponse = followUpData.choices[0].message.content;
                                 } else if (followUpData.response) {
                                     finalResponse = followUpData.response;
                                 }
                             } else {
                                 // Fallback if second call fails
                                 finalResponse = toolResult + "\n\n[System: Executed via Malay MCP]";
                             }
                        } else {
                            // Non-chat endpoint fallback
                            finalResponse = toolResult + "\n\n[System: Executed via Malay MCP]";
                        }
                    }
                } catch (e) {
                    console.warn("Attempted to parse tool call but failed:", e);
                    // Keep original text if parsing fails
                }
            }

            return { success: true as const, text: finalResponse };
          } catch (error: any) {
            console.error('AI API Error:', error);
            return { success: false, error: `Connection Failed: ${error.message || 'Unknown error'}` };
          }
        }

// Chat Management Actions

export async function createChatSession(title: string = "New Chat") {
    const session = await getSessionContext();
    if (!session?.userId) return { error: "Unauthorized" };

    try {
        const newSession = await db.chatSession.create({
            data: {
                userId: session.userId,
                title,
            }
        });
        revalidatePath('/system/ai-chat');
        return { success: true, session: newSession };
    } catch (error) {
        console.error("Failed to create chat session:", error);
        return { error: "Failed to create chat session" };
    }
}

export async function getChatSessions() {
    const session = await getSessionContext();
    if (!session?.userId) return [];

    try {
        return await db.chatSession.findMany({
            where: { userId: session.userId },
            orderBy: { updatedAt: 'desc' },
            include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } }
        });
    } catch (error) {
        console.error("Failed to get chat sessions:", error);
        return [];
    }
}

export async function getChatSession(sessionId: string) {
    const session = await getSessionContext();
    if (!session?.userId) return null;

    try {
        const chatSession = await db.chatSession.findUnique({
            where: { id: sessionId },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });

        if (chatSession?.userId !== session.userId) return null;

        return chatSession;
    } catch (error) {
        console.error("Failed to get chat session:", error);
        return null;
    }
}

export async function deleteChatSession(sessionId: string) {
    const session = await getSessionContext();
    if (!session?.userId) return { error: "Unauthorized" };

    try {
        const chatSession = await db.chatSession.findUnique({
            where: { id: sessionId },
        });

        if (chatSession?.userId !== session.userId) return { error: "Unauthorized" };

        await db.chatSession.delete({
            where: { id: sessionId }
        });

        revalidatePath('/system/ai-chat');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete chat session:", error);
        return { error: "Failed to delete chat session" };
    }
}

export async function saveChatMessage(sessionId: string, role: 'user' | 'assistant', content: string, images: string[] = []) {
    const session = await getSessionContext();
    if (!session?.userId) return { error: "Unauthorized" };

    try {
        // Verify ownership
        const chatSession = await db.chatSession.findUnique({
            where: { id: sessionId },
        });

        if (chatSession?.userId !== session.userId) return { error: "Unauthorized" };

        const message = await db.chatMessage.create({
            data: {
                sessionId,
                role,
                content,
                images
            }
        });

        // Update session timestamp
        const updateData: any = { updatedAt: new Date() };
        
        // Auto-title logic for first user message
        if (role === 'user' && chatSession.title === 'New Chat') {
             const generatedTitle = content.slice(0, 30) + (content.length > 30 ? "..." : "");
             updateData.title = generatedTitle;
        }

        await db.chatSession.update({
            where: { id: sessionId },
            data: updateData
        });

        revalidatePath('/system/ai-chat');
        return { success: true, message };
    } catch (error) {
        console.error("Failed to save chat message:", error);
        return { error: "Failed to save chat message" };
    }
}

export async function renameChatSession(sessionId: string, newTitle: string) {
    const session = await getSessionContext();
    if (!session?.userId) return { error: "Unauthorized" };

    try {
        const chatSession = await db.chatSession.findUnique({
            where: { id: sessionId },
        });

        if (chatSession?.userId !== session.userId) return { error: "Unauthorized" };

        await db.chatSession.update({
            where: { id: sessionId },
            data: { title: newTitle }
        });

        revalidatePath('/system/ai-chat');
        return { success: true };
    } catch (error) {
        return { error: "Failed to rename session" };
    }
}
