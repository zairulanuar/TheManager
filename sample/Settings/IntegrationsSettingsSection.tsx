import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useSettings } from '@/lib/useSettings';

interface IntegrationsSettings {
  paymentGatewayApiKey?: string;
  paymentGatewayMode?: 'test' | 'live';
  smsProviderApiKey?: string;
  externalApiKey?: string;
}

interface IntegrationsSettingsSectionProps {
  settings: any;
}

export function IntegrationsSettingsSection({ settings }: IntegrationsSettingsSectionProps) {
  const { updateSettings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Track visibility state for each secret
  const [changePaymentKey, setChangePaymentKey] = useState(false);
  const [changeSmsKey, setChangeSmsKey] = useState(false);
  const [changeExternalKey, setChangeExternalKey] = useState(false);

  // Track show/hide state for passwords
  const [showPaymentKey, setShowPaymentKey] = useState(false);
  const [showSmsKey, setShowSmsKey] = useState(false);
  const [showExternalKey, setShowExternalKey] = useState(false);

  const defaultValues: IntegrationsSettings = {
    paymentGatewayApiKey: '',
    paymentGatewayMode: settings?.paymentGatewayMode || 'test',
    smsProviderApiKey: '',
    externalApiKey: '',
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<IntegrationsSettings>({
    defaultValues,
  });

  const hasPaymentKey = settings?.paymentGatewayApiKey?.hasValue;
  const hasSmsKey = settings?.smsProviderApiKey?.hasValue;
  const hasExternalKey = settings?.externalApiKey?.hasValue;

  const onSubmit = async (data: IntegrationsSettings) => {
    try {
      setIsSubmitting(true);
      
      const payload: any = { ...data };
      
      // Only send secrets if they were changed
      if (!changePaymentKey && !data.paymentGatewayApiKey) delete payload.paymentGatewayApiKey;
      if (!changeSmsKey && !data.smsProviderApiKey) delete payload.smsProviderApiKey;
      if (!changeExternalKey && !data.externalApiKey) delete payload.externalApiKey;

      await updateSettings({ integrations: payload });
      reset(data);
      
      setChangePaymentKey(false);
      setChangeSmsKey(false);
      setChangeExternalKey(false);
      setShowPaymentKey(false);
      setShowSmsKey(false);
      setShowExternalKey(false);
    } catch (error) {
      // Error handled in useSettings
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to render secret input
  const renderSecretInput = (
    id: keyof IntegrationsSettings,
    label: string,
    hasValue: boolean,
    changeState: boolean,
    setChangeState: (val: boolean) => void,
    showState: boolean,
    setShowState: (val: boolean) => void
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        {!changeState && hasValue ? (
          <>
            <Input disabled value="********" className="flex-1" />
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setChangeState(true);
                setValue(id, '');
              }}
            >
              Change
            </Button>
          </>
        ) : (
          <div className="flex-1 relative">
            <Input
              id={id}
              type={showState ? "text" : "password"}
              {...register(id)}
              placeholder="Enter API Key"
              autoComplete="off"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              onClick={() => setShowState(!showState)}
              tabIndex={-1}
            >
              {showState ? <i className="fad fa-eye-slash" /> : <i className="fad fa-eye" />}
              <span className="sr-only">{showState ? 'Hide' : 'Show'} API Key</span>
            </Button>
            
            {hasValue && changeState && (
              <Button 
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-8 top-0 h-full px-3 py-2 hover:bg-transparent mr-1"
                onClick={() => {
                  setChangeState(false);
                  setValue(id, '');
                  setShowState(false);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
      {/* Hidden fields to trick browser autofill */}
      <div className="absolute opacity-0 -z-10 w-0 h-0 overflow-hidden" aria-hidden="true">
        <input 
          type="text" 
          name="prevent_autofill_email" 
          autoComplete="username" 
          tabIndex={-1} 
          aria-label="Do not fill this field"
        />
        <input 
          type="password" 
          name="prevent_autofill_password" 
          autoComplete="new-password" 
          tabIndex={-1} 
          aria-label="Do not fill this field"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4 border-b border-slate-200 dark:border-slate-700 pb-6">
          <h3 className="text-lg font-medium">Payment Gateway</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="paymentGatewayMode">Mode</Label>
              <Select 
                onValueChange={(value) => setValue('paymentGatewayMode', value as 'test' | 'live', { shouldDirty: true })}
                defaultValue={watch('paymentGatewayMode')}
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
            
            {renderSecretInput(
              'paymentGatewayApiKey', 
              'API Key', 
              hasPaymentKey, 
              changePaymentKey, 
              setChangePaymentKey,
              showPaymentKey,
              setShowPaymentKey
            )}
          </div>
        </div>

        <div className="space-y-4 border-b border-slate-200 dark:border-slate-700 pb-6">
          <h3 className="text-lg font-medium">SMS Provider</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderSecretInput(
              'smsProviderApiKey', 
              'SMS API Key', 
              hasSmsKey, 
              changeSmsKey, 
              setChangeSmsKey,
              showSmsKey,
              setShowSmsKey
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">External Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderSecretInput(
              'externalApiKey', 
              'External Service API Key', 
              hasExternalKey, 
              changeExternalKey, 
              setChangeExternalKey,
              showExternalKey,
              setShowExternalKey
            )}
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
              <i className="fad fa-spinner-third fa-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <i className="fad fa-save mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
