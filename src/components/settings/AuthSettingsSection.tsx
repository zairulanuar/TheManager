import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettings, AppSettings } from '@/lib/useSettings';
import { Loader2, Save } from 'lucide-react';

interface AuthSettingsSectionProps {
  settings: AppSettings['auth'];
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
  } = useForm<AppSettings['auth']>({
    defaultValues: {
      sessionTimeout: settings?.sessionTimeout || 120,
      enableSso: settings?.enableSso || false,
      passwordMinLength: settings?.passwordMinLength || 8,
      passwordRequireSpecialChars: settings?.passwordRequireSpecialChars || false,
      passwordExpiryDays: settings?.passwordExpiryDays || 90,
    },
  });

  const onSubmit = async (data: AppSettings['auth']) => {
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
      <div className="space-y-4 border-b border-border pb-6">
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
              <p className="text-sm text-destructive">{errors.sessionTimeout.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Users will be logged out after this period of inactivity.
            </p>
          </div>

          <div className="flex items-center justify-between pt-8">
            <div className="space-y-0.5">
              <Label htmlFor="enableSso">Enable SSO</Label>
              <p className="text-sm text-muted-foreground">Allow users to log in with Single Sign-On.</p>
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
              <p className="text-sm text-destructive">{errors.passwordMinLength.message}</p>
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
              <p className="text-sm text-destructive">{errors.passwordExpiryDays.message}</p>
            )}
            <p className="text-sm text-muted-foreground">Set to 0 to disable expiry.</p>
          </div>

          <div className="flex items-center justify-between md:col-span-2">
            <div className="space-y-0.5">
              <Label htmlFor="passwordRequireSpecialChars">Require Special Characters</Label>
              <p className="text-sm text-muted-foreground">Passwords must contain at least one special character.</p>
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
