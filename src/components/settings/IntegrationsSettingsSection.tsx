import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings, AppSettings } from '@/lib/useSettings';
import { Loader2, Save, Eye, EyeOff } from 'lucide-react';

interface IntegrationsSettingsSectionProps {
  settings: AppSettings['integrations'];
}

export function IntegrationsSettingsSection({ settings }: IntegrationsSettingsSectionProps) {
  const { updateSettings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentKey, setShowPaymentKey] = useState(false);
  const [showSmsKey, setShowSmsKey] = useState(false);
  const [showExternalKey, setShowExternalKey] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<AppSettings['integrations']>({
    defaultValues: settings,
  });

  const onSubmit = async (data: AppSettings['integrations']) => {
    try {
      setIsSubmitting(true);
      await updateSettings({ integrations: data });
      reset(data);
    } catch (error) {
      // Error handled in useSettings
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-6 border-b border-border pb-6">
        <h3 className="text-lg font-medium">Payment Gateway</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="paymentGatewayMode">Mode</Label>
            <Select
              value={watch('paymentGatewayMode')}
              onValueChange={(value: any) => setValue('paymentGatewayMode', value, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Test / Sandbox</SelectItem>
                <SelectItem value="live">Live / Production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentGatewayApiKey">API Key</Label>
            <div className="relative">
              <Input
                id="paymentGatewayApiKey"
                type={showPaymentKey ? 'text' : 'password'}
                {...register('paymentGatewayApiKey')}
                placeholder={settings?.paymentGatewayApiKey ? '••••••••' : ''}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPaymentKey(!showPaymentKey)}
              >
                {showPaymentKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 border-b border-border pb-6">
        <h3 className="text-lg font-medium">SMS Provider</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="smsProviderApiKey">API Key</Label>
            <div className="relative">
              <Input
                id="smsProviderApiKey"
                type={showSmsKey ? 'text' : 'password'}
                {...register('smsProviderApiKey')}
                placeholder={settings?.smsProviderApiKey ? '••••••••' : ''}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowSmsKey(!showSmsKey)}
              >
                {showSmsKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-medium">External Service</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="externalApiKey">Service API Key</Label>
            <div className="relative">
              <Input
                id="externalApiKey"
                type={showExternalKey ? 'text' : 'password'}
                {...register('externalApiKey')}
                placeholder={settings?.externalApiKey ? '••••••••' : ''}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowExternalKey(!showExternalKey)}
              >
                {showExternalKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
