'use client';
import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-store';
import { onAuthFailure } from '@/lib/api';
import { toast } from './Toast';

/**
 * Hydrates auth on first paint, redirects to /login if no token,
 * and registers a 401 handler that clears auth + bounces.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, accessToken, hydrate, logout } = useAuth();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    onAuthFailure(() => {
      logout();
      toast.warn('Session expired — please sign in again.');
      router.replace('/login');
    });
  }, [logout, router]);

  useEffect(() => {
    // After hydrate runs once, if still no token, kick to login.
    const t = setTimeout(() => {
      if (!accessToken) router.replace('/login');
    }, 50);
    return () => clearTimeout(t);
  }, [accessToken, router]);

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-ink-muted">
        Loading…
      </div>
    );
  }
  return <>{children}</>;
}
