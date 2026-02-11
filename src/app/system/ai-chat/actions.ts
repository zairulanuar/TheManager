'use server';

import { z } from 'zod';
import { db } from '@/lib/db';

export async function checkServerStatus(options?: GenerationOptions) {
  try {
    // Fetch settings from DB if not provided in options
    let apiUrl = options?.apiUrl;
    let apiKey = options?.apiKey;

    if (!apiUrl) {
      const settings = await db.systemSetting.findMany({
        where: { group: 'AI' }
      });
      apiUrl = settings.find(s => s.key === 'AI_API_URL')?.value || process.env.BITNET_API_URL;
      apiKey = settings.find(s => s.key === 'AI_API_KEY')?.value || process.env.HF_TOKEN;
    }

    if (!apiUrl) {
      return { success: false, status: 'not_configured', latency: 0 };
    }

    // Determine health check endpoint
    // Ollama: GET /
    // HF Space: GET /
    // OpenAI: GET /v1/models (requires auth usually)
    
    let endpoint = apiUrl;
    // Remove /v1 if present for base check, or check /v1/models if standard
    if (endpoint.endsWith('/v1')) {
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
        const response = await fetch(endpoint, { 
            method: 'GET', 
            headers,
            signal: controller.signal,
            cache: 'no-store'
        });
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
}

const generateSchema = z.object({
  prompt: z.string().min(1),
  max_tokens: z.number().int().min(1).max(4096).default(512).optional(),
});

export async function generateText(prompt: string, options?: GenerationOptions) {
  try {
    const validData = generateSchema.parse({ prompt, max_tokens: options?.maxTokens });
    
    // Fetch settings from DB
    const settings = await db.systemSetting.findMany({
      where: { group: 'AI' }
    });
    
    // Merge DB settings with options (options take precedence)
    const apiUrl = options?.apiUrl || settings.find(s => s.key === 'AI_API_URL')?.value || process.env.BITNET_API_URL;
    const apiKey = options?.apiKey || settings.find(s => s.key === 'AI_API_KEY')?.value || process.env.HF_TOKEN;
    const modelName = options?.modelName || settings.find(s => s.key === 'AI_MODEL_NAME')?.value || 'default';
    
    const maxTokens = options?.maxTokens || parseInt(settings.find(s => s.key === 'AI_MAX_TOKENS')?.value || '2048');
    const temperature = options?.temperature ?? parseFloat(settings.find(s => s.key === 'AI_TEMPERATURE')?.value || '0.7');
    const topP = options?.topP ?? parseFloat(settings.find(s => s.key === 'AI_TOP_P')?.value || '0.9');
    const topK = options?.topK ?? parseInt(settings.find(s => s.key === 'AI_TOP_K')?.value || '40');
    const repeatPenalty = options?.repeatPenalty ?? parseFloat(settings.find(s => s.key === 'AI_REPEAT_PENALTY')?.value || '1.1');
    const systemPrompt = options?.systemPrompt ?? settings.find(s => s.key === 'AI_SYSTEM_PROMPT')?.value;

    if (!apiUrl) {
        throw new Error("AI API URL is not configured.");
    }

    // Determine if we need to append /generate or use OpenAI format
    // For now, assume the user provides the base URL. 
    // If it's the bitnet space, it needs /generate. 
    // If it's Ollama/OpenAI, it might need /v1/chat/completions
    
    let endpoint = apiUrl;
    let body: any = { prompt: validData.prompt };

    // Simple heuristic: if it looks like the HF space, append /generate
    if (apiUrl.includes('hf.space') && !apiUrl.endsWith('/generate')) {
        endpoint = `${apiUrl}/generate`;
        // BitNet specific params if supported, otherwise just prompt
        // Assuming BitNet API might accept some params
    } 
    // If it looks like Ollama/OpenAI (e.g. localhost:11434/v1), use chat completions
    else if (apiUrl.includes('/v1')) {
         endpoint = `${apiUrl}/chat/completions`;
         
         const messages = [];
         if (systemPrompt) {
            messages.push({ role: "system", content: systemPrompt });
         }
         messages.push({ role: "user", content: prompt });

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
                generatedText = data.response; // BitNet style
            } else if (data.choices && data.choices[0] && data.choices[0].message) {
                generatedText = data.choices[0].message.content; // OpenAI/Ollama style
            } else if (typeof data === 'string') {
                generatedText = data;
            } else {
                generatedText = JSON.stringify(data); // Fallback
            }

            return { success: true as const, text: generatedText };
          } catch (error: any) {
            console.error('AI API Error:', error);
            return { success: false, error: `Connection Failed: ${error.message || 'Unknown error'}` };
          }
        }
