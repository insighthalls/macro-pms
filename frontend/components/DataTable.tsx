'use client';
import clsx from 'clsx';
import { type ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;       // td className
  headClass?: string;       // th className
  align?: 'left' | 'right' | 'center';
}

export function DataTable<T>({
  rows, columns, getRowKey, onRowClick, empty, rowClass,
}: {
  rows: T[];
  columns: Column<T>[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  rowClass?: (row: T) => string | undefined;
}) {
  if (rows.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-ink-muted">
        {empty ?? 'No records.'}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-canvas/60">
            {columns.map((c) => (
              <th
                key={c.key}
                className={clsx(
                  'text-2xs font-medium uppercase tracking-wide text-ink-muted px-4 py-2.5',
                  c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                  c.headClass,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={clsx(
                'border-b border-line last:border-0 transition-colors',
                onRowClick && 'cursor-pointer hover:bg-canvas',
                rowClass?.(row),
              )}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={clsx(
                    'px-4 py-2.5 text-ink',
                    c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                    c.className,
                  )}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
