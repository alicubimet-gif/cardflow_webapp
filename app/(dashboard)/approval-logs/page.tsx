'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronRight, Loader2, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { apiClient, getApiErrorMessage } from '@/api/client';

// Simple Debounce Hook
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// Reusable custom Button matching styling specs
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
}

function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  let baseClass = "h-10 px-4 text-xs font-bold rounded-xl transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 ";
  if (variant === 'primary') {
    baseClass += "bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/10";
  } else if (variant === 'outline') {
    baseClass += "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs";
  }
  return (
    <button className={`${baseClass} ${className}`} {...props}>
      {children}
    </button>
  );
}

// Compact Status Badge
function ApprovalStatusBadge({ status }: { status?: string }) {
  const cleanStatus = String(status || 'pending').toLowerCase();
  let statusClass = 'bg-amber-100 text-amber-700';
  let label = 'Pending';
  if (cleanStatus.includes('approve')) {
    statusClass = 'bg-emerald-100 text-emerald-700';
    label = 'Approved';
  } else if (cleanStatus.includes('reject')) {
    statusClass = 'bg-red-100 text-red-700';
    label = 'Rejected';
  } else if (cleanStatus.includes('correction')) {
    statusClass = 'bg-amber-100 text-amber-700';
    label = 'Correction';
  }
  return (
    <span className={`inline-flex h-6 items-center rounded-md px-2 text-[10px] font-semibold uppercase tracking-wide ${statusClass}`}>
      {label}
    </span>
  );
}

// Helper Row for Mobile Card Details
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="font-bold text-slate-800 break-all pl-2 text-right">{value || '—'}</span>
    </div>
  );
}

// Format DateTime Helper
function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

// API Fetcher for Approval Logs
async function fetchApprovalLogs({ search, page, pageSize }: { search: string; page: number; pageSize: number }) {
  const params: any = { page, page_size: pageSize };
  if (search) params.search = search;

  const res = await apiClient.get('/mobile/approval-logs/', { params });
  return res;
}

// Normalize Each Approval Log
function normalizeApprovalLog(log: any) {
  const recordName =
    log?.record_name ??
    log?.record?.display_name ??
    log?.record?.name ??
    "Unnamed Record";

  const groupName =
    log?.group_name ??
    log?.group?.name ??
    null;

  const subgroupName =
    log?.subgroup_name ??
    log?.sub_group_name ??
    log?.subgroup?.name ??
    log?.sub_group?.name ??
    null;

  const approverName =
    log?.approver_name ??
    log?.user_full_name ??
    log?.approver?.name ??
    null;

  const action =
    log?.action_display ??
    log?.action ??
    "Submitted";

  const status =
    log?.action_display ??
    log?.status ??
    log?.approval_status ??
    "pending";

  const comment =
    log?.comment ??
    log?.remarks ??
    log?.reason ??
    log?.rejection_reason ??
    null;

  const createdAt =
    log?.created_at ??
    log?.action_at ??
    null;

  return {
    id: log?.id ?? `${recordName}-${createdAt ?? Math.random()}`,
    recordName,
    groupName,
    subgroupName,
    action,
    approverName,
    status,
    comment,
    createdAt,
  };
}

// Normalize Paginated Response
function normalizeApprovalLogsResponse(response: any) {
  const payload =
    response?.data?.data ??
    response?.data ??
    response ??
    {};

  const rawLogs = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.results)
      ? payload.results
      : Array.isArray(payload.logs)
        ? payload.logs
        : [];

  const logs = rawLogs.map(normalizeApprovalLog);

  return {
    logs,
    totalCount:
      typeof payload.count === "number"
        ? payload.count
        : typeof payload.total_count === "number"
          ? payload.total_count
          : logs.length,
    next: payload.next ?? null,
    previous: payload.previous ?? null,
  };
}

function normalizeRole(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

type UserLike = {
  role?: string | null;
  user_type?: string | null;
  account_type?: string | null;
  is_organization_admin?: boolean;
  permissions?: string[];
};

function canViewApprovalLogs(user?: UserLike | null) {
  if (!user) return false;
  if (user.is_organization_admin === true) {
    return true;
  }
  if (
    Array.isArray(user.permissions) &&
    user.permissions.includes("approval_logs.view")
  ) {
    return true;
  }
  const role = normalizeRole(
    user.role ??
    user.user_type ??
    user.account_type
  );
  return [
    "organization_admin",
    "org_admin",
  ].includes(role);
}

function formatGroupPath(log: any) {
  return [log.groupName, log.subgroupName]
    .filter(Boolean)
    .join(" / ");
}

function formatApprovalAction(value?: string | null) {
  if (!value) return "Submitted";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function isPendingStatus(status?: string | null) {
  const s = String(status || '').toLowerCase();
  return s.includes('pending') || s.includes('submit') || s === 'draft';
}

export default function ApprovalLogsPage() {
  const { user, loading } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const isOrganizationAdmin = canViewApprovalLogs(user);

  // Main React Query Call
  const approvalLogsQuery = useQuery({
    queryKey: ['approval-logs', debouncedSearch, page],
    queryFn: () => fetchApprovalLogs({ search: debouncedSearch, page, pageSize }),
    enabled: Boolean(isOrganizationAdmin),
  });

  const { logs, totalCount, next, previous } = useMemo(() => {
    return normalizeApprovalLogsResponse(approvalLogsQuery.data);
  }, [approvalLogsQuery.data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isOrganizationAdmin) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
          <h3 className="font-bold text-sm">Access Denied</h3>
          <p className="text-xs text-red-600 mt-1">
            Only Organization Admins are permitted to access Approval Logs.
          </p>
        </div>
      </div>
    );
  }

  // Showing calculations
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-900">
            Approval Logs
          </span>
        </nav>

        {/* Page Header */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Approval Logs
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Review approval activity and status history
          </p>
        </section>

        {/* Search Input */}
        <div className="relative mt-4 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search approval logs"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {searchText && (
            <button
              type="button"
              onClick={() => setSearchText('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Query Loading State */}
        {approvalLogsQuery.isLoading && (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Query Error State */}
        {approvalLogsQuery.isError && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-semibold text-red-700">Unable to load approval logs.</p>
            <Button variant="outline" onClick={() => approvalLogsQuery.refetch()} className="mt-3 mx-auto">
              Retry
            </Button>
          </div>
        )}

        {!approvalLogsQuery.isLoading && !approvalLogsQuery.isError && (
          <>
            {/* Empty State */}
            {logs.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <Search className="h-10 w-10 text-slate-400 mx-auto" />
                {debouncedSearch ? (
                  <>
                    <h3 className="mt-4 text-base font-bold text-slate-900">No approval logs found for &ldquo;{debouncedSearch}&rdquo;</h3>
                    <p className="mt-1 text-xs text-slate-500">Try adjusting your filters or search terms.</p>
                    <Button variant="outline" onClick={() => setSearchText('')} className="mt-4 mx-auto">
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="mt-4 text-base font-bold text-slate-900">No approval logs found</h3>
                    <p className="mt-1 text-xs text-slate-500">There is currently no approval activity recorded.</p>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Mobile View */}
                <div className="mt-4 space-y-3 sm:hidden">
                  {logs.map((log: any) => (
                    <article key={log.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h2 className="break-words text-sm font-bold text-slate-900">
                            {log.recordName}
                          </h2>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatGroupPath(log) || "Not available"}
                          </p>
                        </div>
                        <ApprovalStatusBadge status={log.status} />
                      </div>

                      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                        <DetailRow label="Action" value={formatApprovalAction(log.action)} />
                        <DetailRow label="Approver" value={log.approverName ?? (isPendingStatus(log.status) ? "Awaiting review" : "Not available")} />
                        <DetailRow label="Date" value={log.createdAt ? formatDateTime(log.createdAt) : "Not available"} />
                      </div>

                      <div className="mt-3 rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-medium text-slate-500">
                          Comment
                        </p>
                        <p className="mt-1 break-words text-sm text-slate-800">
                          {log.comment || "No comment"}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Desktop View */}
                <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
                  <table className="w-full table-fixed">
                    <colgroup>
                      <col className="w-[18%]" />
                      <col className="w-[16%]" />
                      <col className="w-[10%]" />
                      <col className="w-[14%]" />
                      <col className="w-[12%]" />
                      <col className="w-[15%]" />
                      <col className="w-[15%]" />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/75 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                        <th className="px-5 py-3.5">Record</th>
                        <th className="px-5 py-3.5">Group / Subgroup</th>
                        <th className="px-5 py-3.5">Action</th>
                        <th className="px-5 py-3.5">Approver</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Date & Time</th>
                        <th className="px-5 py-3.5">Comment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-sm">
                      {logs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 font-semibold text-slate-900 break-words">
                            {log.recordName}
                          </td>
                          <td className="px-5 py-4 text-slate-500 break-words">
                            {formatGroupPath(log) || "Not available"}
                          </td>
                          <td className="px-5 py-4 font-medium text-slate-700 capitalize">
                            {formatApprovalAction(log.action)}
                          </td>
                          <td className="px-5 py-4 text-slate-900 font-medium break-words">
                            {log.approverName ?? (isPendingStatus(log.status) ? "Awaiting review" : "Not available")}
                          </td>
                          <td className="px-5 py-4">
                            <ApprovalStatusBadge status={log.status} />
                          </td>
                          <td className="px-5 py-4 text-slate-500 text-xs">
                            {log.createdAt ? formatDateTime(log.createdAt) : "Not available"}
                          </td>
                          <td className="px-5 py-4 text-slate-600 text-xs break-words">
                            {log.comment || 'No comment'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <span className="text-xs text-slate-500 font-semibold">
                    Showing {start}–{end} of {totalCount}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                      disabled={!previous || page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPage((value) => value + 1)}
                      disabled={!next}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}
