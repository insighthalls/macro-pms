/**
 * React-Query hooks for the AR module.
 *
 * Cache strategy:
 *   ['ar', 'list', filters?]      → list endpoint
 *   ['ar', 'detail', id]          → single AR
 * Mutations invalidate ['ar'] so list + detail both refresh.
 */

'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { AdvanceRequest } from './types';

// ---------- list ----------
export const useAdvanceRequests = (filters?: { stage?: string; projId?: string }) => {
  const qs = filters ? '?' + new URLSearchParams(filters as Record<string,string>).toString() : '';
  return useQuery({
    queryKey: ['ar', 'list', filters ?? null],
    queryFn: () => api.get<AdvanceRequest[]>(`/advance-requests${qs}`),
  });
};

// ---------- detail ----------
export const useAdvanceRequest = (id: string | undefined) =>
  useQuery({
    queryKey: ['ar', 'detail', id],
    queryFn:  () => api.get<AdvanceRequest>(`/advance-requests/${id}`),
    enabled:  !!id,
  });

// ---------- create ----------
export interface CreateArInput { activityId: string; amount: number; title: string; }
export const useCreateAdvanceRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateArInput) => api.post<AdvanceRequest>('/advance-requests', input),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['ar'] }); },
  });
};

// ---------- transitions ----------
const transitionMutation = (action: string) => {
  return () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (vars: { id: string; body?: unknown }) =>
        api.post<AdvanceRequest>(`/advance-requests/${vars.id}/${action}`, vars.body),
      onSuccess: () => { qc.invalidateQueries({ queryKey: ['ar'] }); },
    });
  };
};

export const useRecommendAr        = transitionMutation('recommend')();
export const useFmApproveAr        = transitionMutation('fm-approve')();
export const useEdApproveAr        = transitionMutation('ed-approve')();
export const useDisburseAr         = transitionMutation('disburse')();
export const useReturnAr           = transitionMutation('return')();
export const useSubmitLiquidation  = transitionMutation('submit-liquidation')();
export const useAcceptLiquidation  = transitionMutation('accept-liquidation')();
