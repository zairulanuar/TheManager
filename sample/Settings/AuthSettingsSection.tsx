import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { useSettings } from '@/lib/useSettings';

interface AuthSettings {
  sessionTimeout?: number;
  enableSso?: boolean;
  passwordMinLength?: number;
  passwordRequireSpecialChars?: boolean;
  passwordExpiryDays?: number;
}

interface AuthSettingsSectionProps {
  settings: AuthSettings;
}

export function AuthSettingsSection({ settings }: AuthSettingsSectionProps) {
  const { updateSettings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<AuthSettings>({
    defaultValues: {
      sessionTimeout: settings?.sessionTimeout || 120,
      enableSso: settings?.enableSso || false,
      passwordMinLength: settings?.passwordMinLength || 8,
      passwordRequireSpecialChars: settings?.passwordRequireSpecialChars || false,
      passwordExpiryDays: settings?.passwordExpiryDays || 90,
    },
  });

  const onSubmit = async (data: AuthSettings) => {
    try {
      setIsSubmitting(true);
      // Ensure numbers are numbers
      const payload = {
        ...data,
        sessionTimeout: Number(data.sessionTimeout),
        passwordMinLength: Number(data.passwordMinLength),
        passwordExpiryDays: Number(data.passwordExpiryDays),
      };
      await updateSettings({ auth: payload });
      reset(payload);
    } catch (error) {
      // Error handled in useSettings
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4 border-b border-slate-200 dark:border-slate-700 pb-6">
        <h3 className="text-lg font-medium">Session Security</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              min={5}
              {...register('sessionTimeout', { required: 'Required', min: 5 })}
            />
            {errors.sessionTimeout && (
              <p className="text-sm text-red-600">{errors.sessionTimeout.message}</p>
            )}
            <p className="text-sm text-slate-500">
              Users will be logged out after this period of inactivity.
            </p>
          </div>

          <div className="flex items-center justify-between pt-8">
            <div className="space-y-0.5">
              <Label htmlFor="enableSso">Enable SSO</Label>
              <p className="text-sm text-slate-500">Allow users to log in with Single Sign-On.</p>
            </div>
            <Switch
              id="enableSso"
              checked={watch('enableSso')}
              onCheckedChange={(checked) => setValue('enableSso', checked, { shouldDirty: true })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Password Policy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
            <Input
              id="passwordMinLength"
              type="number"
              min={6}
              {...register('passwordMinLength', { required: 'Required', min: 6 })}
            />
            {errors.passwordMinLength && (
              <p className="text-sm text-red-600">{errors.passwordMinLength.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordExpiryDays">Password Expiry (days)</Label>
            <Input
              id="passwordExpiryDays"
              type="number"
              min={0}
              {...register('passwordExpiryDays', { required: 'Required', min: 0 })}
            />
            {errors.passwordExpiryDays && (
              <p className="text-sm text-red-600">{errors.passwordExpiryDays.message}</p>
            )}
            <p className="text-sm text-slate-500">Set to 0 to disable expiry.</p>
          </div>

          <div className="flex items-center justify-between md:col-span-2">
            <div className="space-y-0.5">
              <Label htmlFor="passwordRequireSpecialChars">Require Special Characters</Label>
              <p className="text-sm text-slate-500">Passwords must contain at least one special character.</p>
            </div>
            <Switch
              id="passwordRequireSpecialChars"
              checked={watch('passwordRequireSpecialChars')}
              onCheckedChange={(checked) => setValue('passwordRequireSpecialChars', checked, { shouldDirty: true })}
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
