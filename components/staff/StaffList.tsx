import React, { useState } from 'react';
import { Search, PlusCircle, KeyRound, Edit, UserMinus, UserCheck, Eye, Users } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StaffCard } from './StaffCard';
import { EmptyState } from '@/components/common/EmptyState';

interface StaffListProps {
  staffList: any[];
  allAssignmentsList: any[];
  onView: (st: any) => void;
  onEdit: (st: any) => void;
  onResetPassword: (st: any) => void;
  onToggleStatus: (id: string, currentStatus: boolean, name: string) => Promise<void>;
  onAddStaff: () => void;
}

export function StaffList({
  staffList,
  allAssignmentsList,
  onView,
  onEdit,
  onResetPassword,
  onToggleStatus,
  onAddStaff
}: StaffListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getAssignmentsCount = (staffId: string) => {
    return allAssignmentsList.filter(
      a => String(a.staff?.id || a.staff || a.staff_id) === String(staffId)
    ).length;
  };

  // Filter staff list based on search query and status filter
  const filteredStaff = staffList.filter(st => {
    const name = (st.name || st.full_name || '').toLowerCase();
    const email = (st.email || st.email_address || '').toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
    
    const isActive = st.status === 'active' || st.is_active;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && isActive) || 
      (statusFilter === 'inactive' && !isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search, Filter and Add Button Header Panel */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-white p-4 border border-slate-150 rounded-2xl shadow-3xs">
        <div className="flex flex-1 gap-2 flex-col sm:flex-row">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search staff by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs font-semibold text-slate-900 bg-slate-50/20"
            />
            <div className="absolute left-3 top-3 text-slate-400 pointer-events-none">
              <Search size={14} />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-10 px-3 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-blue-500 min-w-[130px]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Add Staff Button */}
        <button
          onClick={onAddStaff}
          className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs shrink-0"
        >
          <PlusCircle size={15} />
          <span>Add Staff Member</span>
        </button>
      </div>

      {filteredStaff.length === 0 ? (
        <EmptyState
          title="No staff found"
          description="Create credentials and assign structure bounds for your organization's staff."
        />
      ) : (
        <div>
          {/* Mobile grid view */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
            {filteredStaff.map((st) => (
              <StaffCard
                key={st.id}
                staff={st}
                onView={onView}
                onEdit={onEdit}
                onResetPassword={onResetPassword}
                onToggleStatus={onToggleStatus}
                assignmentsCount={getAssignmentsCount(st.id)}
              />
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden lg:block overflow-x-auto border border-slate-150 rounded-xl bg-white shadow-3xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-150 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Staff Name</th>
                  <th className="py-3.5 px-6">Email Address</th>
                  <th className="py-3.5 px-6">Phone</th>
                  <th className="py-3.5 px-6">Assigned Areas</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredStaff.map((st) => {
                  const isActive = st.status === 'active' || st.is_active;
                  const count = getAssignmentsCount(st.id);
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        <button
                          onClick={() => onView(st)}
                          className="hover:text-blue-600 text-left cursor-pointer transition-colors font-bold flex items-center gap-2"
                        >
                          <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-extrabold">
                            {(st.name || st.full_name || 'ST').slice(0, 2).toUpperCase()}
                          </div>
                          <span>{st.name || st.full_name}</span>
                        </button>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-600">{st.email || st.email_address}</td>
                      <td className="py-4 px-6 font-medium text-slate-550">{st.phone || '—'}</td>
                      <td className="py-4 px-6 font-bold text-slate-800">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-md text-[10px] text-slate-650 font-bold border border-slate-200">
                          <Users size={10} className="text-slate-400" />
                          <span>{count} {count === 1 ? 'Area' : 'Areas'}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={isActive} />
                      </td>
                      <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => onView(st)}
                          className="px-2.5 py-1 text-slate-650 hover:text-blue-650 hover:bg-slate-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-0.5"
                          title="View Profile Details"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => onEdit(st)}
                          className="px-2.5 py-1 text-indigo-650 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-0.5"
                          title="Edit Details"
                        >
                          <Edit size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => onResetPassword(st)}
                          className="px-2.5 py-1 text-blue-650 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-0.5"
                          title="Reset Password"
                        >
                          <KeyRound size={12} />
                          <span>Reset</span>
                        </button>
                        <button
                          onClick={() => onToggleStatus(st.id, isActive, st.name || st.full_name)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-0.5 ${
                            isActive
                              ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title={isActive ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {isActive ? (
                            <>
                              <UserMinus size={12} />
                              <span>Deactivate</span>
                            </>
                          ) : (
                            <>
                              <UserCheck size={12} />
                              <span>Activate</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
