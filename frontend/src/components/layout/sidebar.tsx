'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Building, UsersRound, CreditCard, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [branding, setBranding] = useState<BrandingData>({ companyName: 'PropManage', logoBase64: null });

  // Load branding on mount + listen for updates
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

  if (!user) return null;

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      title: 'Users',
      href: '/users',
      icon: Users,
      roles: ['ADMIN'],
    },
    {
      title: 'Properties',
      href: '/properties',
      icon: Building,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      title: 'Tenants',
      href: '/tenants',
      icon: UsersRound,
      roles: ['ADMIN', 'MANAGER', 'COLLECTOR'],
    },
    {
      title: 'Payments',
      href: '/payments',
      icon: CreditCard,
      roles: ['ADMIN', 'MANAGER', 'COLLECTOR'],
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: ['ADMIN'],
    },
  ];

  const visibleNavItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-muted/40">
      {/* ─── Dynamic Branding Header ─────────────────── */}
      <div className="flex h-16 items-center border-b px-5 gap-3">
        {branding.logoBase64 ? (
          <img
            src={branding.logoBase64}
            alt="Company Logo"
            className="h-9 w-9 rounded-lg object-contain shrink-0 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5"
          />
        ) : (
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
            {branding.companyName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="font-bold text-base text-slate-800 dark:text-slate-100 truncate">
          {branding.companyName}
        </span>
      </div>

      {/* ─── Navigation Links ────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {visibleNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
              pathname.startsWith(item.href)
                ? "bg-primary text-primary-foreground hover:text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}
      </nav>

      {/* ─── Logout ──────────────────────────────────── */}
      <div className="border-t p-4">
        <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}
