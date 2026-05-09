/**
 * Live notifications hook.
 * Connects to /v1/notifications/stream (SSE) and feeds a Zustand store.
 * Falls back gracefully if the stream errors — list is still populated by REST.
 */
'use client';
import { create } from 'zustand';
import { useEffect } from 'react';
import { api, getToken } from '@/lib/api';

export interface NotifRow {
  id: string;
  userId: string;
  kind: 'ASSIGNED' | 'RETURNED' | 'APPROVED' | 'ESCALATED' | 'SLA_BREACH' | 'SYSTEM';
  title: string;
  body?: string | null;
  entity: string;
  entityId: string;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
}

interface NotifStore {
  items: NotifRow[];
  set: (rows: NotifRow[]) => void;
  prepend: (row: NotifRow) => void;
  markRead: (ids: string[]) => void;
  markAll: () => void;
}

export const useNotifications = create<NotifStore>((set) => ({
  items: [],
  set: (rows) => set({ items: rows }),
  prepend: (row) => set((s) => ({ items: [row, ...s.items.filter((x) => x.id !== row.id)] })),
  markRead: (ids) =>
    set((s) => ({
      items: s.items.map((n) => (ids.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n)),
    })),
  markAll: () =>
    set((s) => ({ items: s.items.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })) })),
}));

/** Mount once near the app root. */
export function useNotificationsBoot() {
  const { set, prepend } = useNotifications();

  useEffect(() => {
    let cancelled = false;
    api.get<{ data: NotifRow[] }>('/v1/notifications').then((r) => {
      if (!cancelled) set(r.data);
    }).catch(() => {});

    const token = getToken();
    if (!token) return;
    const es = new EventSource(`/api/v1/notifications/stream?token=${encodeURIComponent(token)}`);
    es.addEventListener('notification', (ev) => {
      try {
        const row = JSON.parse((ev as MessageEvent).data) as NotifRow;
        prepend(row);
      } catch {}
    });
    es.onerror = () => {
      // Browser will retry automatically; close after long downtime
    };
    return () => {
      cancelled = true;
      es.close();
    };
  }, [set, prepend]);
}

export const notifApi = {
  read: (ids: string[]) => api.post('/v1/notifications/read', { ids }),
  readAll: () => api.post('/v1/notifications/read-all'),
};
