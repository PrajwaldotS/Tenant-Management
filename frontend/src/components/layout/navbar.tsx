'use client';

import { useAuthStore } from '@/store/auth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, RefreshCw } from 'lucide-react';
import { Sidebar } from './sidebar';

export function Navbar() {
  const { user } = useAuthStore();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 justify-between lg:justify-end">
      <Sheet>
        <SheetTrigger render={<Button variant="outline" size="icon" className="shrink-0 lg:hidden" />}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>
      
      <div className="flex items-center gap-4">
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
