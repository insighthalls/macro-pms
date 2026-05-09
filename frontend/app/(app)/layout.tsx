'use client';
import { AuthGate } from '@/components/AuthGate';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-store';
import { useNotificationsBoot } from '@/lib/notifications';
import { useProjectsBoot } from '@/components/ProjectPicker';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <Shell>{children}</Shell>
    </AuthGate>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  useNotificationsBoot();
  useProjectsBoot();
  if (!user) return null;
  return (
    <div className="min-h-screen flex">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
