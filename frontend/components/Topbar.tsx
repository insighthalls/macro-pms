'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { Button } from './Button';
import { ProjectPicker } from './ProjectPicker';
import { useNotifications, notifApi, type NotifRow } from '@/lib/notifications';

export function Topbar({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  return (
    <header className="h-14 bg-white border-b border-line flex items-center px-6 gap-4 shrink-0">
      <div className="min-w-0 flex-1">
        <h1 className="text-base font-semibold text-ink truncate">{title}</h1>
        {subtitle && <p className="text-xs text-ink-muted truncate">{subtitle}</p>}
      </div>
      {action}
      <div className="flex items-center gap-3 pl-3 border-l border-line">
        <NotificationsBell />
        <ProjectPicker />
        <Button variant="ghost" size="sm" onClick={() => { logout(); router.replace('/login'); }}>
          Sign out · {user?.initials}
        </Button>
      </div>
    </header>
  );
}

function NotificationsBell() {
  const { items, markRead, markAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  const unread = items.filter((n) => !n.readAt);

  const onMarkAll = async () => {
    await notifApi.readAll();
    markAll();
  };
  const onClick = async (n: NotifRow) => {
    if (!n.readAt) {
      await notifApi.read([n.id]);
      markRead([n.id]);
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative h-8 w-8 grid place-items-center rounded hover:bg-canvas">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-bad text-white text-[10px] font-semibold grid place-items-center">
            {unread.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-10 w-96 bg-white border border-line rounded-md shadow-lg z-50">
          <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
            <div className="text-sm font-semibold text-ink">Notifications</div>
            {unread.length > 0 ? (
              <button onClick={onMarkAll} className="text-2xs font-medium text-brand hover:underline">
                Mark all read
              </button>
            ) : (
              <div className="text-2xs text-ink-muted">All read</div>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-6 text-center text-sm text-ink-muted">All caught up.</div>
            ) : (
              items.slice(0, 30).map((n) => (
                <Link
                  key={n.id}
                  href={n.link || '#'}
                  onClick={() => onClick(n)}
                  className={`flex gap-3 px-4 py-2.5 border-b border-line last:border-0 hover:bg-canvas ${n.readAt ? 'opacity-60' : ''}`}
                >
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${kindColor(n.kind)}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ink truncate">{n.title}</div>
                    {n.body && <div className="text-2xs text-ink-muted line-clamp-2">{n.body}</div>}
                    <div className="text-[10px] text-ink-muted/80 mt-0.5">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function kindColor(k: NotifRow['kind']) {
  switch (k) {
    case 'RETURNED':
    case 'SLA_BREACH':
      return 'bg-bad';
    case 'ESCALATED':
      return 'bg-warn';
    case 'APPROVED':
      return 'bg-good';
    default:
      return 'bg-brand';
  }
}
