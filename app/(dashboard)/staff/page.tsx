'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  UserRound, 
  Pencil, 
  Trash2, 
  Loader2, 
  X, 
  UserPlus, 
  Mail
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/useToast';
import { normalizeOrganizationType, ORGANIZATION_CONFIG } from '@/config/organization.config';
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
  variant?: 'primary' | 'outline' | 'danger';
}

function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  let baseClass = "h-11 px-4 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 ";
  if (variant === 'primary') {
    baseClass += "bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/10";
  } else if (variant === 'outline') {
    baseClass += "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs";
  } else if (variant === 'danger') {
    baseClass += "border border-red-200 bg-white hover:bg-red-50 text-red-655 shadow-xs";
  }
  return (
    <button className={`${baseClass} ${className}`} {...props}>
      {children}
    </button>
  );
}

// Compact Status Badge
function StatusBadge({ status }: { status?: string }) {
  const isActive = String(status).toLowerCase() === 'active' || status === 'true' || status === '1';
  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-wide ${
      isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
    }`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

// Compact Role Badge
function RoleBadge({ role }: { role?: string }) {
  const cleanRole = String(role || 'staff').toLowerCase();
  let roleClass = 'bg-blue-100 text-blue-700';
  let label = 'Staff';

  if (cleanRole.includes('admin')) {
    roleClass = 'bg-purple-100 text-purple-700';
    label = 'Admin';
  } else if (cleanRole.includes('manager')) {
    roleClass = 'bg-indigo-100 text-indigo-700';
    label = 'Manager';
  }
  return (
    <span className={`inline-flex h-6 items-center rounded-md px-2 text-[10px] font-semibold uppercase ${roleClass}`}>
      {label}
    </span>
  );
}

// Metric component for Mobile Cards
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2.5 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

// API Fetcher for Staff
async function fetchStaff({ search, status, role, page }: { search: string; status: string; role: string; page: number }) {
  const params: any = { page };
  if (search) params.search = search;
  if (status && status !== 'all') params.status = status.toLowerCase();
  if (role && role !== 'all') params.role = role.toLowerCase();

  const res = await apiClient.get('/mobile/staff/', { params });
  return res;
}

// Normalize Response
function normalizeStaffResponse(response: any) {
  const payload =
    response?.data?.data ??
    response?.data ??
    response ??
    {};

  const staff = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.results)
      ? payload.results
      : Array.isArray(payload.staff)
        ? payload.staff
        : [];

  return {
    staff,
    totalCount:
      typeof payload.count === "number"
        ? payload.count
        : typeof payload.total_count === "number"
          ? payload.total_count
          : staff.length,
    next: payload.next ?? null,
    previous: payload.previous ?? null,
    summary: payload.summary ?? null,
  };
}

export default function StaffPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const orgType = normalizeOrganizationType(user?.organization_type);
  const orgLabels = ORGANIZATION_CONFIG[orgType];

  // Filters State
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, roleFilter]);

  // Main Staff Query
  const staffQuery = useQuery({
    queryKey: ['staff', debouncedSearch, statusFilter, roleFilter, page],
    queryFn: () => fetchStaff({ search: debouncedSearch, status: statusFilter, role: roleFilter, page }),
  });

  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  const handleResendInvitation = async (member: any) => {
    setSendingEmailId(member.id);
    try {
      try {
        await apiClient.post(`/mobile/staff/${member.id}/resend-invite/`);
      } catch {
        await apiClient.post(`/mobile/staff/${member.id}/resend-invitation/`);
      }
      toast('Invitation email sent successfully.', 'success');
    } catch (err: any) {
      toast(getApiErrorMessage(err) || 'Unable to resend invitation email. Please try again.', 'error');
    } finally {
      setSendingEmailId(null);
    }
  };

  const { staff, totalCount, summary } = useMemo(() => {
    return normalizeStaffResponse(staffQuery.data);
  }, [staffQuery.data]);

  // Modals state
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<any | null>(null);
  const [deleteStaffConfirm, setDeleteStaffConfirm] = useState<any | null>(null);
  const [assignStaff, setAssignStaff] = useState<any | null>(null);

  // Form Field States
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('organization_staff');
  const [formStatus, setFormStatus] = useState('active');
  const [formPassword, setFormPassword] = useState('');
  const [formInvite, setFormInvite] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set up forms for Edit
  useEffect(() => {
    if (editStaff) {
      setFormName(editStaff.name || editStaff.full_name || '');
      setFormEmail(editStaff.email || editStaff.email_address || '');
      setFormPhone(editStaff.phone || '');
      setFormRole(editStaff.role || 'organization_staff');
      setFormStatus(editStaff.status || 'active');
      setFormErrors({});
    }
  }, [editStaff]);

  // Set up forms for Add
  useEffect(() => {
    if (addStaffOpen) {
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormRole('organization_staff');
      setFormStatus('active');
      setFormPassword('');
      setFormInvite(true);
      setFormErrors({});
    }
  }, [addStaffOpen]);

  const clearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setRoleFilter('all');
    setPage(1);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = 'Full name is required';
    if (!formEmail.trim()) errors.email = 'Email is required';
    if (!formInvite && !formPassword) errors.password = 'Password is required when not inviting via email';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formName.trim(),
        full_name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        email_address: formEmail.trim().toLowerCase(),
        phone: formPhone.trim(),
        mobile_number: formPhone.trim(),
        role: formRole,
        status: formStatus,
        is_active: formStatus === 'active',
      };
      if (formInvite) {
        payload.send_invite = true;
      } else {
        payload.password = formPassword;
      }

      await apiClient.post('/mobile/staff/', payload);
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast('Staff member created successfully', 'success');
      setAddStaffOpen(false);
    } catch (err: any) {
      const msg = getApiErrorMessage(err);
      toast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = 'Full name is required';
    if (!formEmail.trim()) errors.email = 'Email is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        full_name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        email_address: formEmail.trim().toLowerCase(),
        phone: formPhone.trim(),
        mobile_number: formPhone.trim(),
        role: formRole,
        status: formStatus,
        is_active: formStatus === 'active',
      };

      await apiClient.patch(`/mobile/staff/${editStaff.id}/`, payload);
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast('Staff member updated successfully', 'success');
      setEditStaff(null);
    } catch (err: any) {
      const msg = getApiErrorMessage(err);
      toast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/mobile/staff/${deleteStaffConfirm.id}/`);
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast('Staff member deleted successfully', 'success');
      setDeleteStaffConfirm(null);
    } catch (err: any) {
      const msg = getApiErrorMessage(err);
      toast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = user?.role === 'organization_admin';

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
        <h3 className="font-bold text-sm">Access Denied</h3>
        <p className="text-xs text-red-600 mt-1">
          Only Organization Admins are permitted to access Staff Management.
        </p>
      </div>
    );
  }

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
            Staff
          </span>
        </nav>

        {/* Header Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Staff
              </h1>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Manage staff members and their assignments
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setAddStaffOpen(true)}
              className="h-11 w-full rounded-xl px-4 text-sm font-semibold sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </div>
        </section>

        {/* Search and Filters */}
        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search staff"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </select>

          {(searchText || statusFilter !== 'all' || roleFilter !== 'all') && (
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              className="h-11 w-full rounded-xl md:w-auto"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Staff</span>
              <span className="text-2xl font-bold text-slate-900 block mt-1">{summary.total ?? 0}</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active</span>
              <span className="text-2xl font-bold text-emerald-700 block mt-1">{summary.active ?? 0}</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm col-span-2 sm:col-span-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Inactive</span>
              <span className="text-2xl font-bold text-slate-600 block mt-1">{summary.inactive ?? 0}</span>
            </div>
          </div>
        )}

        {/* Query States */}
        {staffQuery.isLoading && (
          <div className="mt-4 space-y-3">
            {/* Skeletons */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {staffQuery.isError && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-semibold text-red-700">Unable to load staff.</p>
            <Button variant="outline" onClick={() => staffQuery.refetch()} className="mt-3 mx-auto">
              Retry
            </Button>
          </div>
        )}

        {!staffQuery.isLoading && !staffQuery.isError && (
          <>
            {/* Empty State */}
            {staff.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <UserRound className="h-10 w-10 text-slate-400 mx-auto" />
                {debouncedSearch ? (
                  <>
                    <h3 className="mt-4 text-base font-bold text-slate-900">No staff found for &ldquo;{debouncedSearch}&rdquo;</h3>
                    <p className="mt-1 text-xs text-slate-500">Try adjusting your filters or search terms.</p>
                    <Button variant="outline" onClick={clearFilters} className="mt-4 mx-auto">
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="mt-4 text-base font-bold text-slate-900">No staff members found</h3>
                    <p className="mt-1 text-xs text-slate-500">Add staff members and assign them to branches, departments, classes, or divisions.</p>
                    <Button onClick={() => setAddStaffOpen(true)} className="mt-4 mx-auto">
                      Add Staff
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Mobile View */}
                <div className="mt-4 space-y-3 sm:hidden">
                  {staff.map((member: any) => (
                    <article key={member.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                          <UserRound className="h-5 w-5 text-slate-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="break-words text-sm font-bold text-slate-900">
                            {member.name || member.full_name}
                          </h2>
                          {member.email && (
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {member.email}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <RoleBadge role={member.role} />
                            <StatusBadge status={member.status} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Metric label={orgLabels.groupLabelPlural} value={member.group_count ?? 0} />
                        <Metric label={orgLabels.subgroupLabelPlural} value={member.subgroup_count ?? 0} />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={() => setAssignStaff(member)}>
                          Assign
                        </Button>
                        <Button variant="outline" onClick={() => setEditStaff(member)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={sendingEmailId === member.id}
                          onClick={() => handleResendInvitation(member)}
                          className="col-span-2 text-xs font-semibold h-9 rounded-lg"
                        >
                          {sendingEmailId === member.id ? (
                            <>
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="mr-1.5 h-4 w-4" />
                              Resend Email
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setDeleteStaffConfirm(member)}
                          className="col-span-2 border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Desktop View */}
                <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
                  <table className="w-full table-fixed">
                    <colgroup>
                      <col className="w-[24%]" />
                      <col className="w-[22%]" />
                      <col className="w-[14%]" />
                      <col className="w-[16%]" />
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/75 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                        <th className="px-5 py-3.5">Staff</th>
                        <th className="px-5 py-3.5">Contact</th>
                        <th className="px-5 py-3.5">Role</th>
                        <th className="px-5 py-3.5">Assignments</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-sm">
                      {staff.map((member: any) => (
                        <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                                <UserRound className="h-4.5 w-4.5 text-slate-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {member.name || member.full_name}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                  {member.serial_id || "—"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {member.email && (
                              <p className="truncate text-slate-900 font-medium">{member.email}</p>
                            )}
                            {member.phone && (
                              <p className="truncate text-xs text-slate-500 mt-0.5">{member.phone}</p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <RoleBadge role={member.role} />
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            <span className="font-bold">{orgLabels.groupLabelPlural}:</span> {member.group_count ?? 0} <br/>
                            <span className="font-bold">{orgLabels.subgroupLabelPlural}:</span> {member.subgroup_count ?? 0}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={member.status} />
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setAssignStaff(member)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                                title="Assign"
                              >
                                <UserPlus className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditStaff(member)}
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleResendInvitation(member)}
                                disabled={sendingEmailId === member.id}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                                title="Resend Email"
                              >
                                {sendingEmailId === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteStaffConfirm(member)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalCount > 25 && (
                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 bg-transparent pt-4 px-1">
                    <span className="text-xs text-slate-500 font-semibold">
                      Showing {Math.min(totalCount, (page - 1) * 25 + 1)}–{Math.min(totalCount, page * 25)} of {totalCount}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-9 rounded-lg text-xs"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page * 25 >= totalCount}
                        className="h-9 rounded-lg text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

      </div>

      {/* Add / Edit Staff Modal */}
      {(addStaffOpen || editStaff) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-[calc(100vw-24px)] max-w-lg max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editStaff ? 'Edit Staff Member' : 'Add Staff Member'}
              </h3>
              <button
                type="button"
                onClick={() => { setAddStaffOpen(false); setEditStaff(null); }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={editStaff ? handleEditSubmit : handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Vivek Sharma"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-blue-500"
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-600 font-semibold">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. vivek@cardflow.com"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-blue-500"
                />
                {formErrors.email && (
                  <p className="mt-1 text-xs text-red-600 font-semibold">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {!editStaff && (
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="inviteCheckbox"
                      checked={formInvite}
                      onChange={(e) => setFormInvite(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-100 cursor-pointer"
                    />
                    <label htmlFor="inviteCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                      Send email invitation to set up password
                    </label>
                  </div>

                  {!formInvite && (
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Temporary Password *
                      </label>
                      <input
                        type="password"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="Enter temporary password"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-blue-500"
                      />
                      {formErrors.password && (
                        <p className="mt-1 text-xs text-red-600 font-semibold">{formErrors.password}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setAddStaffOpen(false); setEditStaff(null); }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editStaff ? 'Save Changes' : 'Create Staff'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteStaffConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-[calc(100vw-24px)] max-w-md rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900">
              Delete &ldquo;{deleteStaffConfirm.name || deleteStaffConfirm.full_name}&rdquo;?
            </h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              This staff member will lose access to assigned groups and subgroups.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteStaffConfirm(null)}
                className="h-10 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteSubmit}
                className="h-10 text-xs bg-red-600 hover:bg-red-750 text-white shadow-xs shadow-red-500/10"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Staff'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lazy Assignment Modal */}
      {assignStaff && (
        <AssignmentModal
          isOpen={!!assignStaff}
          onClose={() => setAssignStaff(null)}
          staff={assignStaff}
          orgLabels={orgLabels}
        />
      )}
    </div>
  );
}

// Separate assignment modal component to ensure React Query calls are strictly lazily enabled only when modal is open
function AssignmentModal({ isOpen, onClose, staff, orgLabels }: { isOpen: boolean; onClose: () => void; staff: any; orgLabels: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedSubgroup, setSelectedSubgroup] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Queries (lazy)
  const groupsQuery = useQuery({
    queryKey: ['groups-for-assignment'],
    queryFn: async () => {
      const res = await apiClient.get('/mobile/groups/');
      const payload = res.data?.data ?? res.data ?? res ?? {};
      return Array.isArray(payload) ? payload : (payload.results ?? []);
    },
    enabled: isOpen,
  });

  const subgroupsQuery = useQuery({
    queryKey: ['subgroups-for-assignment', selectedGroup],
    queryFn: async () => {
      const res = await apiClient.get('/mobile/subgroups/', { params: { group: selectedGroup } });
      const payload = res.data?.data ?? res.data ?? res ?? {};
      return Array.isArray(payload) ? payload : (payload.results ?? []);
    },
    enabled: isOpen && !!selectedGroup,
  });

  const assignmentsQuery = useQuery({
    queryKey: ['staff-assignments', staff.id],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/mobile/staff/${staff.id}/assignments/`);
        return res.data?.data ?? res.data ?? res ?? [];
      } catch {
        const res = await apiClient.get('/mobile/staff-assignments/', { params: { staff: staff.id } });
        const payload = res.data?.data ?? res.data ?? res ?? {};
        return Array.isArray(payload) ? payload : (payload.results ?? []);
      }
    },
    enabled: isOpen && !!staff.id,
  });

  // Reset subgroup when group changes
  useEffect(() => {
    setSelectedSubgroup('');
  }, [selectedGroup]);

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    setIsSaving(true);
    try {
      const payload = {
        staff: staff.id,
        group: selectedGroup,
        subgroup: selectedSubgroup || null,
        sub_group: selectedSubgroup || null,
        assignment_level: selectedSubgroup ? 'subgroup' : 'group',
        inherit_children: true
      };

      try {
        await apiClient.post(`/mobile/staff/${staff.id}/assignments/`, payload);
      } catch {
        await apiClient.post('/mobile/staff-assignments/', payload);
      }

      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff-assignments', staff.id] });
      toast('Assignment added successfully', 'success');
      setSelectedGroup('');
      setSelectedSubgroup('');
    } catch (err: any) {
      toast(getApiErrorMessage(err), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string | number) => {
    try {
      await apiClient.delete(`/mobile/staff-assignments/${assignmentId}/`);
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff-assignments', staff.id] });
      toast('Assignment removed successfully', 'success');
    } catch (err: any) {
      toast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-[calc(100vw-24px)] max-w-lg max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Manage Assignments
            </h3>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              Staff: {staff.name || staff.full_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Add New Assignment Form */}
          <form onSubmit={handleAddAssignment} className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Add Assignment
            </h4>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  {orgLabels.groupLabel}
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Select {orgLabels.groupLabel}</option>
                  {(groupsQuery.data || []).map((g: any) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  {orgLabels.subgroupLabel} (Optional)
                </label>
                <select
                  value={selectedSubgroup}
                  onChange={(e) => setSelectedSubgroup(e.target.value)}
                  disabled={!selectedGroup}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50"
                >
                  <option value="">Select {orgLabels.subgroupLabel}</option>
                  {(subgroupsQuery.data || []).map((sg: any) => (
                    <option key={sg.id} value={sg.id}>{sg.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSaving || !selectedGroup}
              className="h-10 w-full text-xs font-bold"
            >
              {isSaving ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : 'Assign'}
            </Button>
          </form>

          {/* Current Assignments List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Current Assignments
            </h4>

            {assignmentsQuery.isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : (assignmentsQuery.data || []).length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                No active assignments.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[25vh] overflow-y-auto pr-1">
                {(assignmentsQuery.data || []).map((assignment: any) => {
                  const gName = assignment.group_name || assignment.group?.name || '—';
                  const sgName = assignment.subgroup_name || assignment.subgroup?.name || assignment.sub_group?.name || '';
                  return (
                    <div key={assignment.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {gName}
                        </p>
                        {sgName && (
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
                            {sgName}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                        title="Remove Assignment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 text-xs px-5"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
