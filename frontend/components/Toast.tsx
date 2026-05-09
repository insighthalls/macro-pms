'use client';
import { create } from 'zustand';
import { useEffect } from 'react';
import clsx from 'clsx';

type Toast = { id: number; kind: 'ok' | 'info' | 'warn' | 'bad'; msg: string };

interface ToastState {
  toasts: Toast[];
  push: (kind: Toast['kind'], msg: string) => void;
  dismiss: (id: number) => void;
}

const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (kind, msg) => {
    const id = Date.now() + Math.random();
    set({ toasts: [...get().toasts, { id, kind, msg }] });
    setTimeout(() => get().dismiss(id), 3500);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = {
  ok:   (m: string) => useToastStore.getState().push('ok',   m),
  info: (m: string) => useToastStore.getState().push('info', m),
  warn: (m: string) => useToastStore.getState().push('warn', m),
  bad:  (m: string) => useToastStore.getState().push('bad',  m),
};

const KIND: Record<Toast['kind'], string> = {
  ok:   'border-ok bg-ok-soft text-ok',
  info: 'border-brand bg-brand-50 text-brand-700',
  warn: 'border-warn bg-warn-soft text-warn',
  bad:  'border-bad bg-bad-soft text-bad',
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  // Hot-reload guard
  useEffect(() => {}, []);
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={clsx(
            'pointer-events-auto cursor-pointer rounded-md border-l-4 bg-white shadow-rise px-4 py-2.5 text-sm min-w-72 max-w-md',
            KIND[t.kind],
          )}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
