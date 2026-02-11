import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings, AppSettings } from '@/lib/useSettings';
import { toast } from 'sonner';
import { Upload, Image as ImageIcon, Loader2, Save } from 'lucide-react';

interface BrandingSettingsSectionProps {
  settings: AppSettings['branding'];
}

export function BrandingSettingsSection({ settings }: BrandingSettingsSectionProps) {
  const { updateSettings } = useSettings();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const loginImageInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<AppSettings['branding']>({
    defaultValues: settings,
  });

  React.useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  const logoUrl = watch('logo');
  const loginImageUrl = watch('loginImage');
  const defaultLogo = '/images/logo-colour-new.svg';
  const displayLogo = logoUrl || defaultLogo;
  const displayLoginImage = loginImageUrl || null;
  const [logoError, setLogoError] = React.useState(false);
  const [loginImageError, setLoginImageError] = React.useState(false);

  React.useEffect(() => {
    setLogoError(false);
  }, [displayLogo]);

  React.useEffect(() => {
    setLoginImageError(false);
  }, [displayLoginImage]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Mock upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockUrl = URL.createObjectURL(file);

      setValue('logo', mockUrl, { shouldDirty: true });
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
      
      // Mock upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockUrl = URL.createObjectURL(file);

      setValue('loginImage', mockUrl, { shouldDirty: true });
      toast.success('Login image uploaded successfully');
    } catch (error) {
      console.error('Failed to upload login image', error);
      toast.error('Failed to upload login image');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: AppSettings['branding']) => {
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
              <p className="text-sm text-destructive">{errors.siteName.message}</p>
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
              <p className="text-sm text-destructive">{errors.defaultFromEmail.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>System Logo</Label>
          <div className="flex flex-col gap-2">
            <div 
              className="relative w-32 h-32 border-2 border-dashed border-input rounded-lg overflow-hidden bg-muted/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors group"
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              {displayLogo && !logoError ? (
                <>
                  <img 
                    src={displayLogo} 
                    alt="Logo" 
                    className="w-full h-full object-contain p-2" 
                    onError={() => setLogoError(true)}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="text-white h-6 w-6" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mb-2" />
                  <span className="text-xs">Upload Logo</span>
                </div>
              )}
              
              {isUploading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Loader2 className="animate-spin text-primary h-6 w-6" />
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
            <p className="text-xs text-muted-foreground">
              Recommended size: 512x512px. Max: 2MB.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Login / Hero Image</Label>
            <div className="flex flex-col gap-2">
              <div 
                className="relative w-full h-48 border-2 border-dashed border-input rounded-lg overflow-hidden bg-muted/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors group"
                onClick={() => !isUploading && loginImageInputRef.current?.click()}
              >
                {displayLoginImage && !loginImageError ? (
                  <>
                    <img 
                      src={displayLoginImage} 
                      alt="Login image" 
                      className="absolute inset-0 w-full h-full object-cover" 
                      onError={() => setLoginImageError(true)}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="text-white h-6 w-6" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8 mb-2" />
                    <span className="text-xs">Upload hero/login image</span>
                  </div>
                )}

                {isUploading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary h-6 w-6" />
                  </div>
                )}
              </div>

              <Input
                ref={loginImageInputRef}
                id="login-image-upload"
                type="file"
                accept="image/*"
                onChange={handleLoginImageUpload}
                disabled={isUploading}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                Recommended size: 2048x1024px. Max: 5MB.
              </p>
            </div>
            {/* Hidden inputs to ensure values are submitted */}
            <input type="hidden" {...register('loginImage')} />
          </div>
          {/* Hidden input to ensure the value is submitted */}
          <input type="hidden" {...register('logo')} />
          {errors.logo && (
            <p className="text-sm text-destructive">{errors.logo.message}</p>
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
