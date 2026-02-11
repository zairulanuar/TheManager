import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettings, AppSettings } from '@/lib/useSettings';
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface FeatureFlagsSettingsSectionProps {
  settings: AppSettings['featureFlags'];
}

export function FeatureFlagsSettingsSection({ settings }: FeatureFlagsSettingsSectionProps) {
  const { updateSettings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<AppSettings['featureFlags']>({
    defaultValues: settings,
  });

  const onSubmit = async (data: AppSettings['featureFlags']) => {
    try {
      setIsSubmitting(true);
      await updateSettings({ featureFlags: data });
      reset(data);
    } catch (error) {
      // Error handled in useSettings
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle>Experimental Features</AlertTitle>
        <AlertDescription>
          These features are experimental and may change or be removed at any time. Enable them at your own risk.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
          <div className="space-y-0.5">
            <Label htmlFor="experimentalFeatureX" className="text-base">
              Experimental Feature X
            </Label>
            <p className="text-sm text-muted-foreground">
              Enables the new X functionality for advanced users.
            </p>
          </div>
          <Switch
            id="experimentalFeatureX"
            checked={watch('experimentalFeatureX')}
            onCheckedChange={(checked) => setValue('experimentalFeatureX', checked, { shouldDirty: true })}
          />
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
