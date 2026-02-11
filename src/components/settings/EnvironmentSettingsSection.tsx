import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSettings } from '@/lib/useSettings';
import { Loader2, Trash2, RefreshCw } from 'lucide-react';

export function EnvironmentSettingsSection() {
  const { clearCache } = useSettings();
  const [isClearing, setIsClearing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleClearCache = async () => {
    try {
      setIsClearing(true);
      await clearCache();
      setIsOpen(false);
    } catch (error) {
      // Error handled in useSettings
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Cache</CardTitle>
          <CardDescription>
            Manage application cache and temporary data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Clear Application Cache</h4>
              <p className="text-sm text-muted-foreground">
                Remove all cached data, compiled templates, and temporary files. This may slow down the next request.
              </p>
            </div>
            
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Cache
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear System Cache?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. It will clear all application caches, including configuration, route, and view caches.
                    The application might be slightly slower for the first few requests after clearing.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleClearCache} disabled={isClearing}>
                    {isClearing ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        Clearing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Cache
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment Information</CardTitle>
          <CardDescription>
            Details about the current runtime environment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Environment</span>
              <p>Production</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Debug Mode</span>
              <p>False</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">PHP Version</span>
              <p>8.2.14</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Laravel Version</span>
              <p>10.45.0</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
