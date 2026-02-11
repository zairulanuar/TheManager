import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useSettings } from '@/lib/useSettings';
import FontAwesomeIcon from '../../../../../../Modules/HrManagement/resources/js/Components/FontAwesomeIcon';
import { toast } from 'sonner';

type FormatSeparator = 'comma-dot' | 'dot-comma' | 'space-dot' | 'apostrophe-dot';

interface CurrenciesSettings {
  defaultCurrency?: string;
  enabledCurrencies?: string[];
  exchangeRateUpdateFrequency?: 'manual' | 'daily' | 'weekly';
  currencyDecimals?: number;
  formatSeparator?: FormatSeparator;
  // Optional per-currency overrides, keyed by currency code
  currencyFormatOverrides?: Record<string, FormatSeparator>;
}

interface CurrenciesSettingsSectionProps {
  settings: CurrenciesSettings;
}

// Common currencies with codes and symbols
const COMMON_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق' },
];

export function CurrenciesSettingsSection({ settings }: CurrenciesSettingsSectionProps) {
  const { updateSettings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCurrency, setNewCurrency] = useState('');

  const {
    handleSubmit,
    control,
    formState: { isDirty },
    reset,
    watch,
    setValue,
  } = useForm<CurrenciesSettings>({
    defaultValues: {
      defaultCurrency: settings?.defaultCurrency || 'USD',
      enabledCurrencies: settings?.enabledCurrencies || ['USD', 'EUR'],
      exchangeRateUpdateFrequency: settings?.exchangeRateUpdateFrequency || 'daily',
      currencyDecimals: settings?.currencyDecimals || 2,
      formatSeparator: settings?.formatSeparator || 'comma-dot',
      currencyFormatOverrides: settings?.currencyFormatOverrides || {},
    },
  });

  const enabledCurrencies = watch('enabledCurrencies') || [];
  const defaultCurrency = watch('defaultCurrency');
  const currencyFormatOverrides = watch('currencyFormatOverrides') || {};

  const onSubmit = async (data: CurrenciesSettings) => {
    try {
      setIsSubmitting(true);
      await updateSettings({ currencies: data });
      reset(data);
    } catch (error) {
      // Error handled in useSettings
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCurrency = () => {
    if (newCurrency && !enabledCurrencies.includes(newCurrency)) {
      const updated = [...enabledCurrencies, newCurrency];
      setValue('enabledCurrencies', updated, { shouldDirty: true });
      setNewCurrency('');
    }
  };

  const handleRemoveCurrency = (code: string) => {
    if (code !== defaultCurrency) {
      const updated = enabledCurrencies.filter(c => c !== code);
      setValue('enabledCurrencies', updated, { shouldDirty: true });
    }
  };

  const currencyOptions = COMMON_CURRENCIES.filter(c => !enabledCurrencies.includes(c.code));
  const selectedCurrencies = COMMON_CURRENCIES.filter(c => enabledCurrencies.includes(c.code));

  // If default currency changes and we have a per-currency override, update the visible formatSeparator
  React.useEffect(() => {
    if (defaultCurrency && currencyFormatOverrides && currencyFormatOverrides[defaultCurrency]) {
      setValue('formatSeparator', currencyFormatOverrides[defaultCurrency] as FormatSeparator, { shouldDirty: false });
    }
  }, [defaultCurrency, JSON.stringify(currencyFormatOverrides)]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="defaultCurrency">Default Currency</Label>
          <Controller
            name="defaultCurrency"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select default currency" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCurrencies.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name} ({currency.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <p className="text-[0.8rem] text-slate-500 dark:text-slate-400">
            This will be used as the default currency for all financial transactions.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currencyDecimals">Decimal Places</Label>
          <Controller
            name="currencyDecimals"
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                min="0"
                max="8"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 2)}
              />
            )}
          />
          <p className="text-[0.8rem] text-slate-500 dark:text-slate-400">
            Number of decimal places for currency formatting (default: 2).
          </p>
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="exchangeRateUpdateFrequency">Exchange Rate Update Frequency</Label>
          <Controller
            name="exchangeRateUpdateFrequency"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select update frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <p className="text-[0.8rem] text-slate-500 dark:text-slate-400">
            How often exchange rates should be updated from external sources.
          </p>
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="formatSeparator">Format Separator</Label>
          <div className="flex items-center gap-3">
            <Controller
              name="formatSeparator"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v: FormatSeparator) => {
                    // update the shared field
                    field.onChange(v);
                    // also store a per-currency override for the currently selected default currency
                    if (defaultCurrency) {
                      setValue('currencyFormatOverrides', { ...(currencyFormatOverrides as Record<string, FormatSeparator>), [defaultCurrency]: v }, { shouldDirty: true });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select separator format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comma-dot">1,000.00 (comma for thousands, dot for decimal)</SelectItem>
                    <SelectItem value="dot-comma">1.000,00 (dot for thousands, comma for decimal)</SelectItem>
                    <SelectItem value="space-dot">1 000.00 (space for thousands, dot for decimal)</SelectItem>
                    <SelectItem value="apostrophe-dot">1'000.00 (apostrophe for thousands, dot for decimal)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const current = watch('formatSeparator') as FormatSeparator;
                if (!current) return;
                const overrides: Record<string, FormatSeparator> = {};
                (enabledCurrencies || []).forEach((c: string) => {
                  overrides[c] = current;
                });
                setValue('currencyFormatOverrides', { ...(currencyFormatOverrides as Record<string, FormatSeparator>), ...overrides }, { shouldDirty: true });
                try {
                  toast.success('Applied separator to all enabled currencies');
                } catch (e) {
                  // ignore
                }
              }}
              className="ml-auto"
            >
              Apply to all
            </Button>
          </div>

          <p className="text-[0.8rem] text-slate-500 dark:text-slate-400">
            Format to use when displaying currency amounts (thousands and decimal separators).
          </p>
        </div>
      </div>

      {/* Enabled Currencies Section */}
      <div className="space-y-4 pt-6 border-t">
        <div>
          <h3 className="text-lg font-semibold mb-3">Enabled Currencies</h3>
          <p className="text-[0.8rem] text-slate-500 dark:text-slate-400 mb-4">
            Add or remove currencies that should be available for transactions.
          </p>
        </div>

        {/* Add Currency Form */}
        <div className="flex gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <Select value={newCurrency} onValueChange={setNewCurrency}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select currency to add" />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map(currency => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            onClick={handleAddCurrency}
            disabled={!newCurrency}
            className="gap-2"
          >
            <FontAwesomeIcon name="plus" className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        {/* Currency List */}
        <div className="space-y-2">
          {selectedCurrencies.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              No currencies enabled yet.
            </p>
          ) : (
            <div className="grid gap-2">
              {selectedCurrencies.map((currency) => {
                  return (
                    <div
                      key={currency.code}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold">{currency.code}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {currency.name} ({currency.symbol})
                      </p>
                    </div>
                    {currency.code === defaultCurrency && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-4">
                      {currency.code !== defaultCurrency && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setValue('defaultCurrency', currency.code, { shouldDirty: true })}
                          className="text-xs"
                        >
                          <FontAwesomeIcon name="check" className="h-4 w-4 mr-2" />
                          Set as Default
                        </Button>
                      )}

                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Separator</Label>
                        <Select
                          value={(currencyFormatOverrides as Record<string, FormatSeparator>)[currency.code] || watch('formatSeparator')}
                          onValueChange={(v: FormatSeparator) => {
                            setValue('currencyFormatOverrides', { ...(currencyFormatOverrides as Record<string, FormatSeparator>), [currency.code]: v }, { shouldDirty: true });
                          }}
                        >
                          <SelectTrigger className="min-w-[200px]">
                            <SelectValue placeholder="Separator" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="comma-dot">1,000.00</SelectItem>
                            <SelectItem value="dot-comma">1.000,00</SelectItem>
                            <SelectItem value="space-dot">1 000.00</SelectItem>
                            <SelectItem value="apostrophe-dot">1'000.00</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveCurrency(currency.code)}
                        disabled={currency.code === defaultCurrency}
                        title={currency.code === defaultCurrency ? 'Cannot remove default currency' : 'Remove'}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FontAwesomeIcon name="x" className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={!isDirty}
        >
          <FontAwesomeIcon name="x" className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? (
            <>
              <FontAwesomeIcon name="spinner" className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <FontAwesomeIcon name="save" className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
