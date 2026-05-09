/**
 * React-Query hooks — Payment Vouchers, Procurement, Action Points.
 * AR hooks remain in queries.ts.
 */

'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { PaymentVoucher, PurchaseRequisition, Vendor, ActionPoint, ApStatus, ApPriority } from './types';

// ---------- Payment Vouchers ----------
export const usePaymentVouchers = (filters?: { stage?: string; projId?: string; vendorId?: string; arId?: string }) => {
  const qs = filters ? '?' + new URLSearchParams(filters as Record<string,string>).toString() : '';
  return useQuery({
    queryKey: ['pv', 'list', filters ?? null],
    queryFn:  () => api.get<PaymentVoucher[]>(`/payment-vouchers${qs}`),
  });
};
export const usePaymentVoucher = (id: string | undefined) =>
  useQuery({
    queryKey: ['pv', 'detail', id],
    queryFn:  () => api.get<PaymentVoucher>(`/payment-vouchers/${id}`),
    enabled:  !!id,
  });

export interface CreatePvInput {
  projId: string; dipCode: string; title: string;
  grossAmount: number | string; whtAmount?: number | string;
  arId?: string; vendorId?: string;
  items?: Array<{ description: string; qty: number; unitPrice: number | string }>;
  attachments?: string[];
}
export const useCreatePv = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePvInput) => api.post<PaymentVoucher>('/payment-vouchers', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pv'] }),
  });
};

const pvTransition = (action: string) => () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body?: unknown }) =>
      api.post<PaymentVoucher>(`/payment-vouchers/${vars.id}/${action}`, vars.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pv'] }),
  });
};
export const useGfoReviewPv = pvTransition('gfo-review')();
export const useFmApprovePv = pvTransition('fm-approve')();
export const useEdApprovePv = pvTransition('ed-approve')();
export const useSchedulePv  = pvTransition('schedule')();
export const useMarkPvPaid  = pvTransition('mark-paid')();
export const useReturnPv    = pvTransition('return')();

// ---------- Procurement ----------
export const usePurchaseRequisitions = (filters?: { stage?: string; projId?: string; vendorId?: string }) => {
  const qs = filters ? '?' + new URLSearchParams(filters as Record<string,string>).toString() : '';
  return useQuery({
    queryKey: ['pr', 'list', filters ?? null],
    queryFn:  () => api.get<PurchaseRequisition[]>(`/procurement${qs}`),
  });
};
export const usePurchaseRequisition = (id: string | undefined) =>
  useQuery({
    queryKey: ['pr', 'detail', id],
    queryFn:  () => api.get<PurchaseRequisition>(`/procurement/${id}`),
    enabled:  !!id,
  });
export const useVendors = () =>
  useQuery({ queryKey: ['vendor', 'list'], queryFn: () => api.get<Vendor[]>('/procurement/vendors') });

const prTransition = (action: string) => () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body?: unknown }) =>
      api.post<PurchaseRequisition>(`/procurement/${vars.id}/${action}`, vars.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pr'] }),
  });
};
export const useOpenRfq    = prTransition('open-rfq')();
export const useEvaluateRfq = prTransition('evaluate')();
export const useIssueLpo   = prTransition('issue-lpo')();
export const useRecordGrn  = prTransition('record-grn')();
export const useClosePr    = prTransition('close')();

// ---------- Action Points ----------
export const useActionPoints = (filters?: { status?: ApStatus; ownerId?: string; raisedById?: string; projId?: string }) => {
  const qs = filters ? '?' + new URLSearchParams(filters as Record<string,string>).toString() : '';
  return useQuery({
    queryKey: ['ap', 'list', filters ?? null],
    queryFn:  () => api.get<ActionPoint[]>(`/action-points${qs}`),
  });
};
export interface CreateApInput {
  title: string; description?: string; ownerId: string; priority?: ApPriority;
  dueDate?: string; linkedEntity?: string; linkedEntityId?: string; projId?: string;
}
export const useCreateAp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateApInput) => api.post<ActionPoint>('/action-points', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ap'] }),
  });
};
const apTransition = (action: string) => () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body?: unknown }) =>
      api.post<ActionPoint>(`/action-points/${vars.id}/${action}`, vars.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ap'] }),
  });
};
export const useStartAp  = apTransition('start')();
export const useCloseAp  = apTransition('close')();
export const useReopenAp = apTransition('reopen')();
