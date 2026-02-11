import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings, AppSettings } from '@/lib/useSettings';
import { getTimezones } from '@/lib/timezones';
import { Loader2, Save } from 'lucide-react';

interface LocalizationSettingsSectionProps {
  settings: AppSettings['localization'];
}

export function LocalizationSettingsSection({ settings }: LocalizationSettingsSectionProps) {
  const { updateSettings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timezones = getTimezones();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<AppSettings['localization']>({
    defaultValues: settings,
  });

  const onSubmit = async (data: AppSettings['localization']) => {
    try {
      setIsSubmitting(true);
      await updateSettings({ localization: data });
      reset(data);
    } catch (error) {
      // Error handled in useSettings
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="defaultLocale">Default Language</Label>
          <Select
            disabled
            value={watch('defaultLocale')}
            onValueChange={(value) => setValue('defaultLocale', value, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English (US)</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Multi-language support is currently disabled.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultTimezone">Default Timezone</Label>
          <Select
            value={watch('defaultTimezone')}
            onValueChange={(value) => setValue('defaultTimezone', value, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent className="h-[300px]">
              {timezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
