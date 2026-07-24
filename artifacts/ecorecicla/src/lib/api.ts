/**
 * Thin axios-free fetch wrapper for new API endpoints
 * (Settings, Audit Logs) that are not covered by Orval.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function getToken() {
  return localStorage.getItem("eco_token") || "";
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ──────────────────────────────────────────────
// Settings
// ──────────────────────────────────────────────

export type AppSettings = {
  orgName: string;
  orgAddress: string;
  orgPhone: string;
  orgEmail: string;
  logoUrl: string;
};

export function useSettings() {
  return useQuery<AppSettings>({
    queryKey: ["settings"],
    queryFn: () => apiFetch<AppSettings>("/settings"),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation<AppSettings, Error, Partial<AppSettings>>({
    mutationFn: (data) =>
      apiFetch<AppSettings>("/settings", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(["settings"], data);
    },
  });
}

// ──────────────────────────────────────────────
// Audit Logs
// ──────────────────────────────────────────────

export type AuditLogEntry = {
  id: number;
  userId: number | null;
  userFullName: string;
  action: string;
  resource: string;
  resourceId: number | null;
  details: string | null;
  createdAt: string;
};

export type AuditLogsResponse = {
  data: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
};

export type AuditLogsParams = {
  search?: string;
  action?: string;
  resource?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

// ──────────────────────────────────────────────
// Dashboard — Weekly Stats
// ──────────────────────────────────────────────

export type WeeklyStats = {
  thisWeekKg: number;
  thisWeekRecords: number;
  lastWeekKg: number;
  lastWeekRecords: number;
  weekTrendPct: number | null;
  activeResidentsThisMonth: number;
  totalResidents: number;
  participationRate: number;
  weeklyBreakdown: { label: string; totalKg: number; totalRecords: number }[];
};

export function useWeeklyStats() {
  return useQuery<WeeklyStats>({
    queryKey: ["dashboard-weekly-stats"],
    queryFn: () => apiFetch<WeeklyStats>("/dashboard/weekly-stats"),
  });
}

export function useAuditLogs(params: AuditLogsParams = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.action) qs.set("action", params.action);
  if (params.resource) qs.set("resource", params.resource);
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params.dateTo) qs.set("dateTo", params.dateTo);
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));

  return useQuery<AuditLogsResponse>({
    queryKey: ["audit-logs", params],
    queryFn: () => apiFetch<AuditLogsResponse>(`/audit-logs?${qs}`),
  });
}
