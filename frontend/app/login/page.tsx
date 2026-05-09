'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-store';
import { Button } from '@/components/Button';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error } = useAuth();
  const [email, setEmail]       = useState('t.phiri@macro.org');
  const [password, setPassword] = useState('Password123!');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      router.replace('/');
    } catch { /* error in store */ }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-700 to-brand-900 text-white p-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-white/15 grid place-items-center font-bold">M</div>
            <div className="text-lg font-semibold tracking-tight">MACRO PMS</div>
          </div>
          <h1 className="mt-16 text-4xl font-bold leading-tight max-w-md">
            One source of truth for programmes &amp; finance.
          </h1>
          <p className="mt-4 text-brand-100 max-w-md leading-relaxed">
            Live DIP balances, auto-routed approvals, immutable audit. Every kwacha — every signature — accounted for.
          </p>
          <ul className="mt-10 space-y-3 text-sm text-brand-100">
            <li className="flex gap-3"><span className="text-brand-200">→</span> 17 modules · MWK · DIP-coded</li>
            <li className="flex gap-3"><span className="text-brand-200">→</span> Hash-chained audit log</li>
            <li className="flex gap-3"><span className="text-brand-200">→</span> Approval matrix per donor</li>
          </ul>
        </div>
        <div className="text-xs text-brand-200">v4.1 · macro.org · support@macro.org</div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <form onSubmit={onSubmit} className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-ink-muted">Welcome back. Enter your credentials below.</p>

          <label className="block mt-8 text-xs font-medium text-ink-muted uppercase tracking-wide">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full h-11 px-3 rounded-md border border-line bg-white focus:border-brand focus:outline-none focus:shadow-focus text-sm"
          />

          <label className="block mt-5 text-xs font-medium text-ink-muted uppercase tracking-wide">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full h-11 px-3 rounded-md border border-line bg-white focus:border-brand focus:outline-none focus:shadow-focus text-sm"
          />

          {error && <div className="mt-4 rounded border-l-4 border-bad bg-bad-soft text-bad text-sm px-3 py-2">{error}</div>}

          <Button type="submit" variant="primary" disabled={loading} className="mt-6 w-full h-11">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>

          <p className="mt-6 text-2xs text-ink-soft">
            Demo · <span className="font-mono">t.phiri@macro.org</span> / <span className="font-mono">Password123!</span>
          </p>
        </form>
      </div>
    </div>
  );
}
