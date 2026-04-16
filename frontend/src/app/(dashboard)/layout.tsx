export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[256px_1fr]">
      <div className="hidden lg:block">
        {/* We dynamically import the sidebar here later if needed, but it's safe to just use it. */}
        <SidebarWrapper />
      </div>
      <div className="flex flex-col">
        <NavbarWrapper />
        <main className="flex-1 p-6 overflow-y-auto bg-muted/10">
          {children}
        </main>
      </div>
    </div>
  );
}

// Wrapper to prevent issues with React Server Components importing Client Components directly in Layouts
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';

function SidebarWrapper() {
  return <Sidebar />;
}

function NavbarWrapper() {
  return <Navbar />;
}
