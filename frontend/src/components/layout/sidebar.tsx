'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Building, UsersRound, CreditCard, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'MANAGER'], // COLLECTOR isn't supposed to see dashboard stats
    },
    {
      title: 'Users',
      href: '/users',
      icon: Users,
      roles: ['ADMIN'], // Only ADMIN
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
  ];

  const visibleNavItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-muted/40">
      <div className="flex h-14 items-center border-b px-6 font-semibold text-lg">
        PropManage Dashboard
      </div>
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
      <div className="border-t p-4">
        <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}
