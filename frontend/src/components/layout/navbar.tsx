'use client';

import { useAuthStore } from '@/store/auth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, RefreshCw } from 'lucide-react';
import { Sidebar } from './sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { useState, useEffect } from 'react';

const BRANDING_STORAGE_KEY = 'app-branding';

interface BrandingData {
  companyName: string;
  logoBase64: string | null;
}

function getBranding(): BrandingData {
  if (typeof window === 'undefined') return { companyName: 'PropManage', logoBase64: null };
  try {
    const stored = localStorage.getItem(BRANDING_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { companyName: 'PropManage', logoBase64: null };
}

export function Navbar() {
  const { user } = useAuthStore();
  const [branding, setBranding] = useState<BrandingData>({ companyName: 'PropManage', logoBase64: null });

  useEffect(() => {
    setBranding(getBranding());

    const handleBrandingUpdate = () => setBranding(getBranding());
    window.addEventListener('branding-updated', handleBrandingUpdate);
    window.addEventListener('storage', handleBrandingUpdate);
    return () => {
      window.removeEventListener('branding-updated', handleBrandingUpdate);
      window.removeEventListener('storage', handleBrandingUpdate);
    };
  }, []);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 justify-between">
      {/* Left side: Mobile menu + branding on mobile */}
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="icon" className="shrink-0 lg:hidden" />}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>

        {/* Show branding on mobile (hidden on lg because sidebar shows it) */}
        <div className="flex items-center gap-2 lg:hidden">
          {branding.logoBase64 ? (
            <img src={branding.logoBase64} alt="Logo" className="h-7 w-7 rounded-md object-contain" />
          ) : null}
          <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate max-w-[150px]">
            {branding.companyName}
          </span>
        </div>
      </div>
      
      {/* Right side: Controls */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {user && (
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 h-8 hidden sm:flex"
            onClick={() => {
              sessionStorage.clear();
              window.dispatchEvent(new Event('dashboard-reload'));
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload Data
          </Button>
        )}
        <div className="text-sm font-medium">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs uppercase">
                {user.name.charAt(0)}
              </span>
              <div className="hidden md:flex flex-col text-right">
                <span>{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.role}</span>
              </div>
            </div>
          ) : (
            'Loading...'
          )}
        </div>
      </div>
    </header>
  );
}
