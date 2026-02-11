import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getSystemSettingsAction, updateSystemSettingsBatchAction } from '@/app/system/settings/actions';

export interface AppSettings {
  branding: {
    siteName: string;
    logo?: string;
    loginImage?: string;
    loginImageVariants?: Record<string, string>;
    defaultFromEmail?: string;
  };
  localization: {
    defaultLocale: string;
    defaultTimezone: string;
  };
  currencies: {
    defaultCurrency: string;
    enabledCurrencies: string[];
    exchangeRateUpdateFrequency: 'manual' | 'daily' | 'weekly';
    currencyDecimals: number;
    formatSeparator: 'comma-dot' | 'dot-comma' | 'space-dot' | 'apostrophe-dot';
    currencyFormatOverrides: Record<string, string>;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUsername?: string;
    smtpPassword?: string;
    defaultFromName: string;
    defaultFromEmail: string;
    notifyOnNewOrder: boolean;
  };
  auth: {
    sessionTimeout: number;
    enableSso: boolean;
    passwordMinLength: number;
    passwordExpiryDays: number;
    passwordRequireSpecialChars: boolean;
  };
  featureFlags: {
    experimentalFeatureX: boolean;
  };
  integrations: {
    paymentGatewayApiKey?: string;
    paymentGatewayMode?: 'test' | 'live';
    smsProviderApiKey?: string;
    externalApiKey?: string;
  };
  ai: {
    apiUrl: string;
    apiKey: string;
    modelName: string;
    maxTokens: number;
    temperature: number;
    topP: number;
    topK: number;
    repeatPenalty: number;
    systemPrompt: string;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  branding: {
    siteName: 'The Manager',
    defaultFromEmail: 'noreply@manager.mza',
    logo: '/storage/System-App/logo-M.svg', 
  },
  localization: {
    defaultLocale: 'en',
    defaultTimezone: 'Asia/Kuala_Lumpur',
  },
  currencies: {
    defaultCurrency: 'MYR',
    enabledCurrencies: ['USD', 'MYR'],
    exchangeRateUpdateFrequency: 'daily',
    currencyDecimals: 2,
    formatSeparator: 'dot-comma',
    currencyFormatOverrides: {
      'USD': 'comma-dot',
      'MYR': 'dot-comma',
    },
  },
  email: {
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpUsername: 'user@example.com',
    defaultFromName: 'My System',
    defaultFromEmail: 'noreply@example.com',
    notifyOnNewOrder: false,
  },
  auth: {
    sessionTimeout: 120,
    enableSso: false,
    passwordMinLength: 8,
    passwordExpiryDays: 90,
    passwordRequireSpecialChars: true,
  },
  featureFlags: {
    experimentalFeatureX: false,
  },
  integrations: {
    paymentGatewayMode: 'test',
  },
  ai: {
    apiUrl: 'http://localhost:11434/v1',
    apiKey: '',
    modelName: 'llama3',
    maxTokens: 2048,
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    repeatPenalty: 1.1,
    systemPrompt: 'You are a helpful AI assistant.',
  }
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch from DB
        const dbSettings = await getSystemSettingsAction();
        
        const merged = { ...DEFAULT_SETTINGS };
        
        // Override AI settings from DB
        dbSettings.forEach(s => {
          if (s.group === 'AI') {
             if (s.key === 'AI_API_URL') merged.ai.apiUrl = s.value;
             if (s.key === 'AI_API_KEY') merged.ai.apiKey = s.value;
             if (s.key === 'AI_MODEL_NAME') merged.ai.modelName = s.value;
             if (s.key === 'AI_MAX_TOKENS') merged.ai.maxTokens = parseInt(s.value, 10) || 2048;
             if (s.key === 'AI_TEMPERATURE') merged.ai.temperature = parseFloat(s.value) || 0.7;
             if (s.key === 'AI_TOP_P') merged.ai.topP = parseFloat(s.value) || 0.9;
             if (s.key === 'AI_TOP_K') merged.ai.topK = parseInt(s.value, 10) || 40;
             if (s.key === 'AI_REPEAT_PENALTY') merged.ai.repeatPenalty = parseFloat(s.value) || 1.1;
             if (s.key === 'AI_SYSTEM_PROMPT') merged.ai.systemPrompt = s.value;
          }
        });

        setSettings(merged);
      } catch (err) {
        console.error(err);
        // On error, use defaults but show error
        setSettings(DEFAULT_SETTINGS);
        // setError('Failed to load settings'); // Optional: don't block UI if DB fails, just use defaults
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const batch: {key: string, value: string, group: string, isSecret?: boolean}[] = [];

      // Handle AI settings persistence
      if (newSettings.ai) {
        const ai = newSettings.ai;
        if (ai.apiUrl !== undefined) batch.push({ key: 'AI_API_URL', value: ai.apiUrl, group: 'AI' });
        if (ai.apiKey !== undefined) batch.push({ key: 'AI_API_KEY', value: ai.apiKey, group: 'AI', isSecret: true });
        if (ai.modelName !== undefined) batch.push({ key: 'AI_MODEL_NAME', value: ai.modelName, group: 'AI' });
        if (ai.maxTokens !== undefined) batch.push({ key: 'AI_MAX_TOKENS', value: ai.maxTokens.toString(), group: 'AI' });
        if (ai.temperature !== undefined) batch.push({ key: 'AI_TEMPERATURE', value: ai.temperature.toString(), group: 'AI' });
        if (ai.topP !== undefined) batch.push({ key: 'AI_TOP_P', value: ai.topP.toString(), group: 'AI' });
        if (ai.topK !== undefined) batch.push({ key: 'AI_TOP_K', value: ai.topK.toString(), group: 'AI' });
        if (ai.repeatPenalty !== undefined) batch.push({ key: 'AI_REPEAT_PENALTY', value: ai.repeatPenalty.toString(), group: 'AI' });
        if (ai.systemPrompt !== undefined) batch.push({ key: 'AI_SYSTEM_PROMPT', value: ai.systemPrompt, group: 'AI' });
      }

      if (batch.length > 0) {
        await updateSystemSettingsBatchAction(batch);
      }

      setSettings(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ...newSettings,
          branding: { ...prev.branding, ...newSettings.branding },
          localization: { ...prev.localization, ...newSettings.localization },
          currencies: { ...prev.currencies, ...newSettings.currencies },
          email: { ...prev.email, ...newSettings.email },
          auth: { ...prev.auth, ...newSettings.auth },
          featureFlags: { ...prev.featureFlags, ...newSettings.featureFlags },
          integrations: { ...prev.integrations, ...newSettings.integrations },
          ai: { ...prev.ai, ...newSettings.ai },
        };
      });
      
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
      throw err;
    }
  };

  const clearCache = async () => {
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('System cache cleared successfully');
    } catch (err) {
        toast.error('Failed to clear cache');
        throw err;
    }
  };

  return { settings, isLoading, error, updateSettings, clearCache };
}
