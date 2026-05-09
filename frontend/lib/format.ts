/**
 * Formatting helpers — must mirror the prototype exactly.
 *  - MWK is whole-kwacha (no decimals) with thousands separators
 *  - Dates are dd MMM yyyy (e.g. 14 Mar 2026)
 *  - DIP codes render in JetBrains Mono via the <DipChip> component
 */

export const fmtMwk = (raw: string | number | bigint | null | undefined): string => {
  if (raw == null) return '—';
  const n = typeof raw === 'string' ? Number(raw) : Number(raw);
  if (!Number.isFinite(n)) return '—';
  return 'MK ' + Math.round(n).toLocaleString('en-US');
};

export const fmtMwkCompact = (raw: string | number | bigint | null | undefined): string => {
  if (raw == null) return '—';
  const n = typeof raw === 'string' ? Number(raw) : Number(raw);
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return 'MK ' + (n / 1_000_000).toFixed(2) + 'M';
  if (Math.abs(n) >= 1_000)     return 'MK ' + (n / 1_000).toFixed(1) + 'K';
  return 'MK ' + Math.round(n).toLocaleString('en-US');
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const fmtDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${fmtDate(iso)} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

export const daysFromNow = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return null;
  return Math.round((d - Date.now()) / 86_400_000);
};

export const fmtRelative = (iso: string | null | undefined): string => {
  const days = daysFromNow(iso);
  if (days == null) return '—';
  if (days === 0)  return 'today';
  if (days === 1)  return 'tomorrow';
  if (days === -1) return 'yesterday';
  if (days > 0)    return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
};
