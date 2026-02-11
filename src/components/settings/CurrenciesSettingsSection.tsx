import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSettings, AppSettings } from '@/lib/useSettings';
import { getCurrencies, getCurrencyByCode } from '@/lib/currencies';
import { Loader2, Save, Plus, Check, X, ChevronsUpDown, Search } from 'lucide-react';

interface CurrenciesSettingsSectionProps {
  settings: AppSettings['currencies'];
}

export function CurrenciesSettingsSection({ settings }: CurrenciesSettingsSectionProps) {
  const { updateSettings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<AppSettings['currencies']>({
    defaultValues: settings,
  });

  const enabledCurrencies = watch('enabledCurrencies') || [];
  const defaultCurrency = watch('defaultCurrency');
  const allCurrencies = getCurrencies();

  const handleAddCurrency = (code: string) => {
    if (code && !enabledCurrencies.includes(code)) {
      setValue('enabledCurrencies', [...enabledCurrencies, code], { shouldDirty: true });
      setOpen(false);
      setSearchTerm('');
    }
  };

  const filteredCurrencies = allCurrencies.filter((c) =>
    !enabledCurrencies.includes(c.code) &&
    (c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRemoveCurrency = (code: string) => {
    if (code !== defaultCurrency) {
      setValue(
        'enabledCurrencies',
        enabledCurrencies.filter((c) => c !== code),
        { shouldDirty: true }
      );
    }
  };

  const onSubmit = async (data: AppSettings['currencies']) => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...data,
        currencyDecimals: Number(data.currencyDecimals),
      };
      await updateSettings({ currencies: payload });
      reset(payload);
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
          <Label htmlFor="defaultCurrency">Default Currency</Label>
          <Select
            value={defaultCurrency}
            onValueChange={(value) => setValue('defaultCurrency', value, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {enabledCurrencies.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            The base currency for all transactions.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="formatSeparator">Format Separator</Label>
          <Select
            value={watch('formatSeparator')}
            onValueChange={(value: any) => setValue('formatSeparator', value, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comma-dot">1,234.56 (Comma-Dot)</SelectItem>
              <SelectItem value="dot-comma">1.234,56 (Dot-Comma)</SelectItem>
              <SelectItem value="space-dot">1 234.56 (Space-Dot)</SelectItem>
              <SelectItem value="apostrophe-dot">1'234.56 (Apostrophe-Dot)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currencyDecimals">Decimal Places</Label>
          <Input
            id="currencyDecimals"
            type="number"
            min={0}
            max={4}
            {...register('currencyDecimals', { required: 'Required', min: 0, max: 4 })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="exchangeRateUpdateFrequency">Exchange Rate Update</Label>
          <Select
            value={watch('exchangeRateUpdateFrequency')}
            onValueChange={(value: any) => setValue('exchangeRateUpdateFrequency', value, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Enabled Currencies</Label>
        <div className="flex items-center gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-[300px] justify-between"
              >
                Select currency to add...
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <input
                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Search currency..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto p-1">
                {filteredCurrencies.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No currency found.
                  </div>
                ) : (
                  filteredCurrencies.map((currency) => (
                    <div
                      key={currency.code}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                      onClick={() => handleAddCurrency(currency.code)}
                    >
                      <span className="font-medium min-w-[3rem]">{currency.code}</span>
                      <span className="ml-2 text-muted-foreground truncate flex-1">
                        {currency.name}
                      </span>
                      <span className="ml-2 text-muted-foreground text-xs">
                        {currency.symbol}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enabledCurrencies.map((code) => {
                const currency = getCurrencyByCode(code);
                return (
                  <TableRow key={code}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{code}</span>
                        {currency && <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{currency.symbol}</span>}
                      </div>
                    </TableCell>
                    <TableCell>{currency?.name || '-'}</TableCell>
                    <TableCell>
                      {code === defaultCurrency && <Check className="h-4 w-4 text-green-500" />}
                    </TableCell>
                    <TableCell className="text-right">
                      {code !== defaultCurrency && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCurrency(code)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {enabledCurrencies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No currencies enabled.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
