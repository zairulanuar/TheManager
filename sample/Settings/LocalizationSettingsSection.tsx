import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { useSettings } from '@/lib/useSettings';
import { getTimezones } from '@/lib/timezones';
import { cn } from '../ui/utils';

interface LocalizationSettings {
  defaultLocale?: string;
  defaultTimezone?: string;
}

interface LocalizationSettingsSectionProps {
  settings: LocalizationSettings;
}

export function LocalizationSettingsSection({ settings }: LocalizationSettingsSectionProps) {
  const { updateSettings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const timezones = React.useMemo(() => getTimezones(), []);

  const {
    handleSubmit,
    formState: { isDirty },
    reset,
    setValue,
    watch,
  } = useForm<LocalizationSettings>({
    defaultValues: {
      defaultLocale: settings?.defaultLocale || 'en',
      defaultTimezone: settings?.defaultTimezone || 'UTC',
    },
  });

  const onSubmit = async (data: LocalizationSettings) => {
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
            onValueChange={(value) => setValue('defaultLocale', value, { shouldDirty: true })}
            defaultValue={watch('defaultLocale')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="pt">Portuguese</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[0.8rem] text-slate-500 dark:text-slate-400">
            Multi-language support is currently disabled.
          </p>
        </div>

        <div className="space-y-2 flex flex-col">
          <Label htmlFor="defaultTimezone">Default Timezone</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between font-normal"
              >
                {watch('defaultTimezone')
                  ? timezones.find((tz) => tz === watch('defaultTimezone'))?.replace(/_/g, ' ')
                  : "Select timezone..."}
                <i className="fad fa-sort ml-2 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search timezone..." />
                <CommandList>
                  <CommandEmpty>No timezone found.</CommandEmpty>
                  <CommandGroup>
                    {timezones.map((tz) => (
                      <CommandItem
                        key={tz}
                        value={tz}
                        onSelect={() => {
                          setValue('defaultTimezone', tz, { shouldDirty: true });
                          setOpen(false);
                        }}
                    >
                      <i
                        className={cn(
                          "fad fa-check mr-2",
                          watch('defaultTimezone') === tz ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {tz.replace(/_/g, ' ')}
                    </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
