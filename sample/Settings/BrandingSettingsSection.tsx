import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useSettings } from '@/lib/useSettings';
import { toast } from 'sonner';
import axios from 'axios';

interface BrandingSettings {
  siteName?: string;
  logo?: string;
  loginImage?: string;
  loginImageVariants?: Record<string, string>;
  defaultFromEmail?: string;
}

interface BrandingSettingsSectionProps {
  settings: BrandingSettings;
}

export function BrandingSettingsSection({ settings }: BrandingSettingsSectionProps) {
  const { updateSettings } = useSettings();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<BrandingSettings>({
    defaultValues: settings,
  });

  React.useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  const logoUrl = watch('logo');
  const loginImageUrl = watch('loginImage');
  const loginImageVariants = watch('loginImageVariants') || {};
  const defaultLogo = '/storage/System-App/logo-M.svg';
  const displayLogo = logoUrl || defaultLogo;
  const displayLoginImage = loginImageVariants.webp_1024 || loginImageUrl || null;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('logo', file);

      const response = await axios.post('/api/v1/admin/settings/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setValue('logo', response.data.url, { shouldDirty: true });
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Failed to upload logo', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoginImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('login_image', file);

      const response = await axios.post('/api/v1/admin/settings/upload-login-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // response.data: { url, variants }
      setValue('loginImage', response.data.url, { shouldDirty: true });
      setValue('loginImageVariants', response.data.variants || {}, { shouldDirty: true });
      toast.success('Login image uploaded and optimized (if supported)');
    } catch (error) {
      console.error('Failed to upload login image', error);
      toast.error('Failed to upload login image');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: BrandingSettings) => {
    try {
      setIsSubmitting(true);
      await updateSettings({ branding: data });
      reset(data); // Reset form to mark as not dirty
    } catch (error) {
      // Error is handled in useSettings
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="siteName">Application Name</Label>
            <Input
              id="siteName"
              {...register('siteName', { required: 'Application name is required' })}
              placeholder="My Application"
            />
            {errors.siteName && (
              <p className="text-sm text-red-600">{errors.siteName.message}</p>
            )}
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
              placeholder="noreply@myapp.com"
            />
            {errors.defaultFromEmail && (
              <p className="text-sm text-red-600">{errors.defaultFromEmail.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>System Logo</Label>
          <div className="flex flex-col gap-2">
            <div 
              className="relative w-32 h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 transition-colors group"
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              {displayLogo ? (
                <>
                  <img src={displayLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <i className="fad fa-upload text-2xl text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <i className="fad fa-image text-4xl mb-2" />
                  <span className="text-xs">Upload Logo</span>
                </div>
              )}
              
              {isUploading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center">
                  <i className="fad fa-spinner-third fa-spin text-2xl text-primary" />
                </div>
              )}
            </div>
            
            <Input
              ref={fileInputRef}
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={isUploading}
              className="hidden"
            />
            <p className="text-xs text-slate-500">
              Recommended size: 512x512px. Max: 2MB.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Login / Hero Image</Label>
            <div className="flex flex-col gap-2">
              <div 
                className="relative w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 transition-colors group"
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                {displayLoginImage ? (
                  <>
                    <img src={displayLoginImage} alt="Login image" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <i className="fad fa-upload text-2xl text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <i className="fad fa-image text-4xl mb-2" />
                    <span className="text-xs">Upload hero/login image</span>
                  </div>
                )}

                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center">
                    <i className="fad fa-spinner-third fa-spin text-2xl text-primary" />
                  </div>
                )}
              </div>

              <Input
                ref={fileInputRef}
                id="login-image-upload"
                type="file"
                accept="image/*"
                onChange={handleLoginImageUpload}
                disabled={isUploading}
                className="hidden"
              />
              <p className="text-xs text-slate-500">
                Recommended size: 2048x1024px. Max: 5MB. WebP/AVIF variants will be generated if supported on the server.
              </p>
            </div>
            {/* Hidden inputs to ensure values are submitted */}
            <input type="hidden" {...register('loginImage')} />
            <input type="hidden" {...register('loginImageVariants')} />
          </div>
          {/* Hidden input to ensure the value is submitted */}
          <input type="hidden" {...register('logo')} />
          {errors.logo && (
            <p className="text-sm text-red-600">{errors.logo.message}</p>
          )}
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
