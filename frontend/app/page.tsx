'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-store';

export default function HomePage() {
  const router = useRouter();
  const { user, hydrate } = useAuth();

  useEffect(() => {
    hydrate();
    router.replace(user ? roleHome(user.role) : '/login');
  }, [user, hydrate, router]);

  return null;
}

function roleHome(role: string): string {
  switch (role) {
    case 'PROJECT_OFFICER':       return '/po';
    case 'HEAD_OF_PROGRAMS':      return '/hop';
    case 'GRANT_FINANCE_OFFICER': return '/gfo';
    case 'FINANCE_MANAGER':       return '/fm';
    case 'EXECUTIVE_DIRECTOR':    return '/ed';
    default:                       return '/po';
  }
}
