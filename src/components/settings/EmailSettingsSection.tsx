import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettings, AppSettings } from '@/lib/useSettings';
import { Loader2, Save } from 'lucide-react';

interface EmailSettingsSectionProps {
  settings: AppSettings['email'];
}

export function EmailSettingsSection({ settings }: EmailSettingsSectionProps) {
  const { updateSettings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<AppSettings['email']>({
    defaultValues: settings,
  });

  const onSubmit = async (data: AppSettings['email']) => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...data,
        smtpPort: Number(data.smtpPort),
      };
      await updateSettings({ email: payload });
      reset(payload);
    } catch (error) {
      // Error handled in useSettings
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4 border-b border-border pb-6">
        <h3 className="text-lg font-medium">SMTP Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="smtpHost">SMTP Host</Label>
            <Input
              id="smtpHost"
              {...register('smtpHost', { required: 'Required' })}
              placeholder="smtp.example.com"
            />
            {errors.smtpHost && (
              <p className="text-sm text-destructive">{errors.smtpHost.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtpPort">SMTP Port</Label>
            <Input
              id="smtpPort"
              type="number"
              {...register('smtpPort', { required: 'Required' })}
              placeholder="587"
            />
            {errors.smtpPort && (
              <p className="text-sm text-destructive">{errors.smtpPort.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtpUsername">SMTP Username</Label>
            <Input
              id="smtpUsername"
              {...register('smtpUsername')}
              placeholder="user@example.com"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtpPassword">SMTP Password</Label>
            <div className="relative">
              <Input
                id="smtpPassword"
                type={showPassword ? 'text' : 'password'}
                {...register('smtpPassword')}
                placeholder={settings?.smtpPassword ? '••••••••' : ''}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Sender Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="defaultFromName">Default From Name</Label>
            <Input
              id="defaultFromName"
              {...register('defaultFromName', { required: 'Required' })}
              placeholder="My System"
            />
            {errors.defaultFromName && (
              <p className="text-sm text-destructive">{errors.defaultFromName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultFromEmail">Default From Email</Label>
            <Input
              id="defaultFromEmail"
              type="email"
              {...register('defaultFromEmail', {
                required: 'Required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email',
                },
              })}
              placeholder="noreply@example.com"
            />
            {errors.defaultFromEmail && (
              <p className="text-sm text-destructive">{errors.defaultFromEmail.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between md:col-span-2 pt-4">
            <div className="space-y-0.5">
              <Label htmlFor="notifyOnNewOrder">Notify on New Order</Label>
              <p className="text-sm text-muted-foreground">Send an email to the default address when a new order is placed.</p>
            </div>
            <Switch
              id="notifyOnNewOrder"
              checked={watch('notifyOnNewOrder')}
              onCheckedChange={(checked) => setValue('notifyOnNewOrder', checked, { shouldDirty: true })}
            />
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
