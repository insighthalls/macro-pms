'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import type { UserRole } from '@/lib/types';

interface NavItem { href: string; label: string; group?: string; }

const NAV: Record<UserRole, NavItem[]> = {
  PROJECT_OFFICER: [
    { href: '/po',                     label: 'My Day',           group: 'Workspace' },
    { href: '/po/activities',          label: 'My Activities',    group: 'Workspace' },
    { href: '/po/advance-requests',    label: 'Advance Requests', group: 'Workspace' },
    { href: '/po/liquidations',        label: 'Liquidations',     group: 'Workspace' },
    { href: '/action-points',          label: 'Action Points',    group: 'Workspace' },
    { href: '/po/advance-requests/new',label: 'New Advance',      group: 'Create' },
    { href: '/po/forms',               label: 'Forms & Templates',group: 'Reference' },
    { href: '/po/dsa-rates',           label: 'DSA & Rates',      group: 'Reference' },
  ],
  HEAD_OF_PROGRAMS: [
    { href: '/hop',                 label: 'Recommendation Queue', group: 'Workspace' },
    { href: '/action-points',       label: 'Action Points',        group: 'Workspace' },
  ],
  GRANT_FINANCE_OFFICER: [
    { href: '/gfo',                  label: 'My Day',           group: 'Workspace' },
    { href: '/gfo/payment-vouchers', label: 'Payment Vouchers', group: 'Workspace' },
    { href: '/gfo/advance-requests', label: 'Advance Requests', group: 'Workspace' },
    { href: '/action-points',        label: 'Action Points',    group: 'Workspace' },
  ],
  FINANCE_MANAGER: [
    { href: '/fm',                   label: 'My Day',           group: 'Workspace' },
    { href: '/fm/approvals',         label: 'Approval Queue',   group: 'Workspace' },
    { href: '/fm/payment-vouchers',  label: 'Payment Vouchers', group: 'Workspace' },
    { href: '/fm/advance-requests',  label: 'Advance Requests', group: 'Workspace' },
    { href: '/fm/eft-batches',       label: 'EFT Batches',      group: 'Workspace' },
    { href: '/action-points',        label: 'Action Points',    group: 'Workspace' },
    { href: '/fm/reports',           label: 'Reports',          group: 'Insight' },
  ],
  EXECUTIVE_DIRECTOR: [
    { href: '/ed',                   label: 'Dashboard',        group: 'Workspace' },
    { href: '/ed/approvals',         label: 'Approval Queue',   group: 'Workspace' },
    { href: '/action-points',        label: 'Action Points',    group: 'Workspace' },
    { href: '/fm/reports',           label: 'Reports',          group: 'Insight' },
  ],
  PROCUREMENT_OFFICER: [
    { href: '/prc',                 label: 'Procurement Queue',    group: 'Workspace' },
    { href: '/action-points',       label: 'Action Points',        group: 'Workspace' },
  ],
  ADMINISTRATOR: [
    { href: '/admin',               label: 'Administration',       group: 'Workspace' },
    { href: '/action-points',       label: 'Action Points',        group: 'Workspace' },
  ],
  VENDOR: [
    { href: '/vendor',              label: 'My Invoices',          group: 'Workspace' },
  ],
};

const ROLE_TITLE: Record<UserRole, string> = {
  PROJECT_OFFICER:       'Project Officer',
  HEAD_OF_PROGRAMS:      'Head of Programs',
  GRANT_FINANCE_OFFICER: 'Grant Finance Officer',
  FINANCE_MANAGER:       'Finance Manager',
  EXECUTIVE_DIRECTOR:    'Executive Director',
  PROCUREMENT_OFFICER:   'Procurement Officer',
  ADMINISTRATOR:         'Administrator',
  VENDOR:                'Vendor',
};

export function Sidebar({ user }: { user: { fullName: string; role: UserRole; initials: string; region: string | null } }) {
  const pathname = usePathname();
  const items = NAV[user.role];

  // Group items
  const groups = items.reduce<Record<string, NavItem[]>>((acc, item) => {
    const g = item.group ?? 'Menu';
    (acc[g] ??= []).push(item);
    return acc;
  }, {});

  return (
    <aside className="flex flex-col w-[236px] bg-canvas-rail text-white shrink-0">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded bg-brand grid place-items-center text-xs font-bold">M</div>
          <div>
            <div className="text-sm font-semibold leading-tight">MACRO PMS</div>
            <div className="text-2xs text-white/50">v4.1</div>
          </div>
        </div>
      </div>

      {/* Persona card */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-brand-400 grid place-items-center text-xs font-bold">
            {user.initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{user.fullName}</div>
            <div className="text-2xs text-white/60 truncate">{ROLE_TITLE[user.role]}{user.region ? ` · ${user.region}` : ''}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {Object.entries(groups).map(([group, list]) => (
          <div key={group}>
            <div className="px-3 pb-1.5 text-2xs uppercase tracking-wider text-white/40">{group}</div>
            <ul className="space-y-0.5">
              {list.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={clsx(
                        'flex items-center px-3 h-8 rounded text-[13px] transition-colors',
                        active
                          ? 'bg-white/10 text-white font-medium'
                          : 'text-white/70 hover:bg-white/5 hover:text-white',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-white/10 text-2xs text-white/40">
        © MACRO Malawi · audit on
      </div>
    </aside>
  );
}
