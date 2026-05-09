/**
 * Active project store — persisted to localStorage.
 * Topbar + every list query reads activeProjId from here.
 */
'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProjectLite {
  id: string;
  code: string;
  name: string;
  donor: string;
  colorHex: string;
  ccy: string;
}

interface ProjectStore {
  active: ProjectLite | null;
  list: ProjectLite[];
  setActive: (p: ProjectLite) => void;
  setList: (l: ProjectLite[]) => void;
  clear: () => void;
}

export const useProject = create<ProjectStore>()(
  persist(
    (set) => ({
      active: null,
      list: [],
      setActive: (p) => set({ active: p }),
      setList: (l) =>
        set((s) => ({ list: l, active: s.active ?? l[0] ?? null })),
      clear: () => set({ active: null, list: [] }),
    }),
    { name: 'macro-project' }
  )
);
