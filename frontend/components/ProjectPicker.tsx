'use client';
import { useEffect, useRef, useState } from 'react';
import { useProject, type ProjectLite } from '@/lib/project-store';
import { api } from '@/lib/api';

/** Fetches the user's accessible projects once and seeds the picker. */
export function useProjectsBoot() {
  const { setList, list } = useProject();
  useEffect(() => {
    if (list.length) return;
    api
      .get<{ data: ProjectLite[] }>('/v1/projects')
      .then((r) => setList(r.data))
      .catch(() => {});
  }, [list.length, setList]);
}

export function ProjectPicker() {
  const { active, list, setActive } = useProject();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  if (!active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas text-ink-muted text-2xs font-medium px-2.5 py-1">
        No project
      </span>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-700 text-2xs font-medium pl-2.5 pr-2 py-1 transition-colors"
        title="Switch project"
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: active.colorHex }}
        />
        <span className="truncate max-w-[10rem]">{active.code}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="opacity-60"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-9 w-80 bg-white border border-line rounded-md shadow-lg z-50">
          <div className="px-3 py-2 border-b border-line text-2xs uppercase tracking-wider text-ink-muted">
            Switch project
          </div>
          {list.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActive(p);
                setOpen(false);
              }}
              className={`w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-canvas ${p.id === active.id ? 'bg-brand-50' : ''}`}
            >
              <span
                className="h-7 w-7 rounded-md grid place-items-center text-white text-2xs font-bold shrink-0"
                style={{ background: p.colorHex }}
              >
                {p.code.slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink truncate">{p.name}</div>
                <div className="text-2xs text-ink-muted truncate">{p.donor}</div>
              </div>
              {p.id === active.id && (
                <span className="text-2xs font-semibold text-brand">Active</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
