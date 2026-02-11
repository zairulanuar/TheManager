import React, { useState } from 'react';
import { Button } from '../ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../ui/dialog';
import { useSettings } from '@/lib/useSettings';

export function EnvironmentSettingsSection() {
  const { clearCache } = useSettings();
  const [isClearing, setIsClearing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleClearCache = async () => {
    try {
      setIsClearing(true);
      await clearCache();
      setIsDialogOpen(false);
    } catch (error) {
      // Error handled in useSettings
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-medium mb-2">System Cache</h3>
        <p className="text-sm text-slate-500 mb-6">
          Clear the application cache and configuration cache. This may be necessary after updating
          environment variables or if you're experiencing unexpected behavior.
        </p>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <i className="fad fa-trash-alt mr-2" />
              Clear Cache
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear System Cache?</DialogTitle>
              <DialogDescription>
                This action will clear the application configuration cache and route cache.
                The application might respond slightly slower for the first few requests after clearing.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isClearing}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleClearCache} disabled={isClearing}>
                {isClearing ? (
                  <>
                    <i className="fad fa-spinner-third fa-spin mr-2" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <i className="fad fa-trash-alt mr-2" />
                    Clear Cache
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-medium mb-2">Configuration Reload</h3>
        <p className="text-sm text-slate-500 mb-6">
          Reload the system configuration from the database. This happens automatically on save,
          but you can force a reload if needed.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <i className="fad fa-sync mr-2" />
          Reload Page
        </Button>
      </div>
    </div>
  );
}
