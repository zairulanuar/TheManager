import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { useSettings } from '@/lib/useSettings';

interface FeatureFlagsSettings {
  experimentalFeatureX?: boolean;
}

interface FeatureFlagsSettingsSectionProps {
  settings: FeatureFlagsSettings;
}

export function FeatureFlagsSettingsSection({ settings }: FeatureFlagsSettingsSectionProps) {
  const { updateSettings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    handleSubmit,
    formState: { isDirty },
    reset,
    setValue,
    watch,
  } = useForm<FeatureFlagsSettings>({
    defaultValues: {
      experimentalFeatureX: settings?.experimentalFeatureX || false,
    },
  });

  const onSubmit = async (data: FeatureFlagsSettings) => {
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
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg border-slate-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-950/20">
          <div className="space-y-0.5">
            <Label htmlFor="experimentalFeatureX" className="text-base text-amber-900 dark:text-amber-200">
              Experimental Feature X
            </Label>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Beta feature. May be unstable. Use with caution.
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
