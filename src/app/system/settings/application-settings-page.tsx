"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandingSettingsSection } from '@/components/settings/BrandingSettingsSection';
import { LocalizationSettingsSection } from '@/components/settings/LocalizationSettingsSection';
import { CurrenciesSettingsSection } from '@/components/settings/CurrenciesSettingsSection';
import { EmailSettingsSection } from '@/components/settings/EmailSettingsSection';
import { AuthSettingsSection } from '@/components/settings/AuthSettingsSection';
import { FeatureFlagsSettingsSection } from '@/components/settings/FeatureFlagsSettingsSection';
import { IntegrationsSettingsSection } from '@/components/settings/IntegrationsSettingsSection';
import { EnvironmentSettingsSection } from '@/components/settings/EnvironmentSettingsSection';
import { AiSettingsSection } from '@/components/settings/AiSettingsSection';
import { useSettings } from '@/lib/useSettings';
import { 
  Palette, 
  Globe, 
  DollarSign, 
  Mail, 
  Lock, 
  Flag, 
  Plug, 
  Settings, 
  Loader2,
  Bot
} from 'lucide-react';

export function ApplicationSettingsPage() {
  const { settings, isLoading, error } = useSettings();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'branding';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600">Error loading settings</h2>
          <p className="text-sm text-gray-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Application Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure global application settings, branding, and integrations.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="w-full justify-start md:justify-center inline-flex md:grid md:grid-cols-8 h-auto p-1">
            <TabsTrigger value="branding" className="px-4 py-2 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Branding</span>
            </TabsTrigger>
            <TabsTrigger value="localization" className="px-4 py-2 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Localization</span>
            </TabsTrigger>
            <TabsTrigger value="currencies" className="px-4 py-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Currencies</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="px-4 py-2 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="auth" className="px-4 py-2 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Auth</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="px-4 py-2 flex items-center gap-2">
              <Flag className="h-4 w-4" />
              <span className="hidden sm:inline">Features</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="px-4 py-2 flex items-center gap-2">
              <Plug className="h-4 w-4" />
              <span className="hidden sm:inline">Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="px-4 py-2 flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">BestLa</span>
            </TabsTrigger>
            <TabsTrigger value="environment" className="px-4 py-2 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Environment</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="branding" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Branding Settings</CardTitle>
              <CardDescription>
                Configure your application's branding and appearance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BrandingSettingsSection settings={settings.branding} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="localization" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Localization & Time Settings</CardTitle>
              <CardDescription>
                Set default locale and timezone for your application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LocalizationSettingsSection settings={settings.localization} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="currencies" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Currencies Settings</CardTitle>
              <CardDescription>
                Configure supported currencies and exchange rate settings for your application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CurrenciesSettingsSection settings={settings.currencies} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Email & Notifications</CardTitle>
              <CardDescription>
                Configure SMTP settings and notification preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmailSettingsSection settings={settings.email} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication & Access</CardTitle>
              <CardDescription>
                Manage authentication settings and security policies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuthSettingsSection settings={settings.auth} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Enable or disable application features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeatureFlagsSettingsSection settings={settings.featureFlags} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>
                Configure external service integrations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntegrationsSettingsSection settings={settings.integrations} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <AiSettingsSection settings={settings.ai} />
        </TabsContent>

        <TabsContent value="environment" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Environment & System</CardTitle>
              <CardDescription>
                System maintenance and configuration options.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnvironmentSettingsSection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
