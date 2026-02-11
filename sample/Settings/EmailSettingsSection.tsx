import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { useSettings } from '@/lib/useSettings';

interface EmailSettings {
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string; // We'll handle the object -> string transformation
  defaultFromName?: string;
  defaultFromEmail?: string;
  notifyOnNewOrder?: boolean;
}

interface EmailSettingsSectionProps {
  settings: any; // Using any here because the raw settings has complex types for secrets
}

export function EmailSettingsSection({ settings }: EmailSettingsSectionProps) {
  const { updateSettings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  const defaultValues: EmailSettings = {
    smtpHost: settings?.smtpHost || '',
    smtpPort: settings?.smtpPort || 587,
    smtpUsername: settings?.smtpUsername || '',
    smtpPassword: '', // Default to empty, we only send if changed
    defaultFromName: settings?.defaultFromName || '',
    defaultFromEmail: settings?.defaultFromEmail || '',
    notifyOnNewOrder: settings?.notifyOnNewOrder || false,
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<EmailSettings>({
    defaultValues,
  });

  const hasPassword = settings?.smtpPassword?.hasValue;

  const onSubmit = async (data: EmailSettings) => {
    try {
      setIsSubmitting(true);
      
      // Filter out empty password if it wasn't changed
      const payload: any = { ...data };
      if (!changePassword && !data.smtpPassword) {
        delete payload.smtpPassword;
      }

      await updateSettings({ email: payload });
      reset(data); // Reset form to mark as not dirty
      setChangePassword(false);
    } catch (error) {
      // Error is handled in useSettings
    } finally {
      setIsSubmitting(false);
    }
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="smtpHost">SMTP Host</Label>
          <Input
            id="smtpHost"
            {...register('smtpHost', { required: 'SMTP Host is required' })}
            placeholder="smtp.example.com"
          />
          {errors.smtpHost && (
            <p className="text-sm text-red-600">{errors.smtpHost.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="smtpPort">SMTP Port</Label>
          <Input
            id="smtpPort"
            type="number"
            {...register('smtpPort', { required: 'SMTP Port is required' })}
            placeholder="587"
          />
          {errors.smtpPort && (
            <p className="text-sm text-red-600">{errors.smtpPort.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="smtpUsername">SMTP Username</Label>
          <Input
            id="smtpUsername"
            {...register('smtpUsername')}
            placeholder="user@example.com"
            autoComplete="off"
            data-lpignore="true" // Ignore LastPass
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="smtpPassword">SMTP Password</Label>
          <div className="flex gap-2">
            {!changePassword && hasPassword ? (
              <>
                <Input
                  disabled
                  value="********"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setChangePassword(true);
                    setValue('smtpPassword', '');
                  }}
                >
                  Change
                </Button>
              </>
            ) : (
              <div className="flex-1 relative">
                <Input
                  id="smtpPassword"
                  type="password"
                  {...register('smtpPassword')}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  data-lpignore="true" // Ignore LastPass
                />
                {hasPassword && changePassword && (
                   <Button 
                     type="button"
                     variant="ghost"
                     size="sm"
                     className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                     onClick={() => {
                       setChangePassword(false);
                       setValue('smtpPassword', '');
                     }}
                   >
                     Cancel
                   </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultFromName">Default From Name</Label>
          <Input
            id="defaultFromName"
            {...register('defaultFromName')}
            placeholder="My System"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultFromEmail">Default From Email</Label>
          <Input
            id="defaultFromEmail"
            type="email"
            {...register('defaultFromEmail', {
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Must be a valid email address',
              },
            })}
            placeholder="noreply@example.com"
          />
          {errors.defaultFromEmail && (
            <p className="text-sm text-red-600">{errors.defaultFromEmail.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-medium">Notifications</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifyOnNewOrder">Notify on New Order</Label>
            <p className="text-sm text-slate-500">Receive an email when a new order is placed.</p>
          </div>
          <Switch
            id="notifyOnNewOrder"
            checked={watch('notifyOnNewOrder')}
            onCheckedChange={(checked) => setValue('notifyOnNewOrder', checked, { shouldDirty: true })}
          />
        </div>
      </div>

      <div className="flex justify-end">
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
