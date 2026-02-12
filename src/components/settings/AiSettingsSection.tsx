import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings, AppSettings } from '@/lib/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Bot } from 'lucide-react';

interface AiSettingsSectionProps {
  settings: AppSettings['ai'];
}

export function AiSettingsSection({ settings }: AiSettingsSectionProps) {
  const { updateSettings } = useSettings();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<AppSettings['ai']>({
    defaultValues: settings,
  });

  React.useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  const onSubmit = async (data: AppSettings['ai']) => {
    try {
      setIsSubmitting(true);
      await updateSettings({ ai: data });
      reset(data); // Reset form to mark as not dirty
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <CardTitle>BestLa Configuration</CardTitle>
        </div>
        <CardDescription>
          Configure AI model settings, API endpoints, and authentication keys.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="apiUrl">API URL</Label>
              <Input
                id="apiUrl"
                placeholder="https://api.provider.com/v1"
                {...register('apiUrl', { required: 'API URL is required' })}
              />
              {errors.apiUrl && (
                <p className="text-sm text-red-500">{errors.apiUrl.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The base URL for the OpenAI-compatible API.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                {...register('apiKey')}
              />
              <p className="text-xs text-muted-foreground">
                Optional if using a local instance that doesn't require auth.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                <Label htmlFor="modelName">Model Name</Label>
                <Input
                    id="modelName"
                    placeholder="llama3"
                    {...register('modelName', { required: 'Model name is required' })}
                />
                </div>

                <div className="grid gap-2">
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                    id="maxTokens"
                    type="number"
                    {...register('maxTokens', { 
                        required: 'Max tokens is required',
                        min: { value: 1, message: 'Minimum 1 token' },
                        max: { value: 32768, message: 'Maximum 32768 tokens' }
                    })}
                />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Input
                    id="systemPrompt"
                    placeholder="You are BestLa Ai..."
                    {...register('systemPrompt')}
                />
                <p className="text-xs text-muted-foreground">
                    The default system prompt for new conversations.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input
                        id="temperature"
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        {...register('temperature', { valueAsNumber: true })}
                    />
                 </div>
                 <div className="grid gap-2">
                    <Label htmlFor="topP">Top P</Label>
                    <Input
                        id="topP"
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        {...register('topP', { valueAsNumber: true })}
                    />
                 </div>
                 <div className="grid gap-2">
                    <Label htmlFor="topK">Top K</Label>
                    <Input
                        id="topK"
                        type="number"
                        step="1"
                        min="0"
                        {...register('topK', { valueAsNumber: true })}
                    />
                 </div>
                 <div className="grid gap-2">
                    <Label htmlFor="repeatPenalty">Repeat Penalty</Label>
                    <Input
                        id="repeatPenalty"
                        type="number"
                        step="0.1"
                        min="0"
                        {...register('repeatPenalty', { valueAsNumber: true })}
                    />
                 </div>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save AI Settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
