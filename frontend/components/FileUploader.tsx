'use client';
import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './Button';

type Entity = 'AR' | 'PV' | 'PR' | 'AP' | 'ACT' | 'VENDOR' | 'BR' | 'EFT';

export interface AttachmentRow {
  id: string;
  bucket: string;
  path: string;
  filename: string;
  mime?: string | null;
  sizeBytes: number;
  createdAt: string;
}

export function FileUploader({ entity, entityId }: { entity: Entity; entityId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ['attachments', entity, entityId],
    queryFn: () => api.get<{ data: AttachmentRow[] }>(`/v1/attachments?entity=${entity}&entityId=${entityId}`).then((r) => r.data),
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      setError(null);
      setProgress(`Signing…`);
      const sign = await api.post<{ data: { signedUrl: string; token: string; path: string; filename: string; bucket: string } }>(
        '/v1/attachments/sign',
        { entity, entityId, filename: file.name }
      );
      setProgress(`Uploading ${file.name}…`);
      const put = await fetch(sign.data.signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);
      setProgress(`Registering…`);
      await api.post('/v1/attachments', {
        entity, entityId,
        bucket: sign.data.bucket,
        path: sign.data.path,
        filename: sign.data.filename,
        mime: file.type,
        sizeBytes: file.size,
      });
      setProgress(null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attachments', entity, entityId] }),
    onError: (e: any) => { setError(e.message || 'Upload failed'); setProgress(null); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/v1/attachments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attachments', entity, entityId] }),
  });

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) await upload.mutateAsync(f);
    if (fileRef.current) fileRef.current.value = '';
  };

  const openDownload = async (id: string) => {
    const r = await api.get<{ data: { url: string; filename: string } }>(`/v1/attachments/${id}/url`);
    const a = document.createElement('a');
    a.href = r.data.url;
    a.download = r.data.filename;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="rounded-md border border-line bg-white">
      <div className="px-4 py-2.5 border-b border-line flex items-center gap-3">
        <div className="text-sm font-semibold text-ink flex-1">Attachments</div>
        <input ref={fileRef} type="file" className="hidden" onChange={onPick} />
        <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
          {upload.isPending ? 'Uploading…' : 'Upload'}
        </Button>
      </div>
      {progress && <div className="px-4 py-1.5 text-2xs text-ink-muted bg-canvas border-b border-line">{progress}</div>}
      {error && <div className="px-4 py-1.5 text-2xs text-bad bg-red-50 border-b border-line">{error}</div>}
      {isLoading ? (
        <div className="p-4 text-2xs text-ink-muted">Loading…</div>
      ) : attachments.length === 0 ? (
        <div className="p-4 text-2xs text-ink-muted">No files attached.</div>
      ) : (
        <ul className="divide-y divide-line">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-2">
              <span className="h-7 w-7 rounded bg-brand-50 text-brand-700 grid place-items-center text-2xs font-bold">
                {(a.filename.split('.').pop() || '?').toUpperCase().slice(0, 3)}
              </span>
              <button onClick={() => openDownload(a.id)} className="text-sm text-ink hover:underline truncate flex-1 text-left">
                {a.filename}
              </button>
              <span className="text-2xs text-ink-muted">{prettyBytes(a.sizeBytes)}</span>
              <button onClick={() => remove.mutate(a.id)} className="text-2xs text-ink-muted hover:text-bad ml-2">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function prettyBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
