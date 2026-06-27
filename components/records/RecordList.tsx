import React from 'react';
import { ShieldCheck, Edit, Trash2, ArrowUpCircle } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RecordCard } from './RecordCard';
import { EmptyState } from '@/components/common/EmptyState';

interface RecordListProps {
  recordsList: any[];
  isSchool: boolean;
  onView: (rec: any) => void;
  onEdit: (rec: any) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  isAdmin: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onCorrection: (id: string) => void;
  templateFields?: any[];
}

export function RecordList({
  recordsList,
  isSchool,
  onView,
  onEdit,
  onDelete,
  onSubmit,
  isAdmin,
  onApprove,
  onReject,
  onCorrection,
  templateFields = []
}: RecordListProps) {
  if (recordsList.length === 0) {
    return (
      <EmptyState 
        title="No records found" 
        description="Roster database is empty or no records match your filter criteria."
      />
    );
  }

  const columns = (templateFields || []).filter(f => !['qr_code', 'qrcode', 'barcode'].includes(f.type));
  const hasCustomHeaders = columns.length > 0;

  return (
    <div>
      {/* Mobile grid view */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
        {recordsList.map((rec) => (
          <RecordCard 
            key={rec.id}
            record={rec}
            isSchool={isSchool}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onSubmit={onSubmit}
            isAdmin={isAdmin}
            onApprove={onApprove}
            onReject={onReject}
            onCorrection={onCorrection}
          />
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden lg:block overflow-x-auto border border-slate-150 rounded-xl bg-white shadow-3xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-150 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {hasCustomHeaders ? (
                <>
                  {columns.map(f => (
                    <th key={f.key} className="py-3 px-6">{f.label}</th>
                  ))}
                </>
              ) : (
                <>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">{isSchool ? 'Class / Division' : 'Branch / Dept'}</th>
                  <th className="py-3 px-6">{isSchool ? 'Roll ID' : 'Employee ID'}</th>
                </>
              )}
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6">Updated Date</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {recordsList.map((rec) => {
              const name = rec.name || rec.full_name || rec.student_name || rec.employee_name || 'Roster Record';
              const orgField1 = isSchool ? (rec.class_name || 'Class') : (rec.branch_name || 'Branch');
              const orgField2 = isSchool ? (rec.division_name || 'Division') : (rec.department_name || 'Department');
              const status = rec.approval_status || 'draft';
              const updatedDate = rec.updated_at ? new Date(rec.updated_at).toLocaleDateString() : '—';
              
              return (
                <tr key={rec.id} className="hover:bg-slate-50/40 transition-colors">
                  {hasCustomHeaders ? (
                    <>
                      {columns.map((f, idx) => {
                        const val = rec[f.key] ?? rec.data?.[f.key] ?? rec.field_values?.[f.key] ?? '—';
                        if (idx === 0) {
                          return (
                            <td key={f.key} className="py-4 px-6 font-bold text-slate-900">
                              <button 
                                onClick={() => onView(rec)}
                                className="hover:text-blue-600 text-left cursor-pointer transition-colors font-bold"
                              >
                                {val}
                              </button>
                            </td>
                          );
                        }
                        if (['photo', 'image', 'signature'].includes(f.type)) {
                          return (
                            <td key={f.key} className="py-4 px-6 font-semibold text-slate-750">
                              {val && val !== '—' ? '📷 Image' : '—'}
                            </td>
                          );
                        }
                        return (
                          <td key={f.key} className="py-4 px-6 font-semibold text-slate-750">
                            {String(val)}
                          </td>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        <button 
                          onClick={() => onView(rec)}
                          className="hover:text-blue-600 text-left cursor-pointer transition-colors font-bold"
                        >
                          {name}
                        </button>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-750">{orgField1} - {orgField2}</td>
                      <td className="py-4 px-6 font-mono text-slate-650">{rec.admission_number || rec.employee_id || '—'}</td>
                    </>
                  )}
                  <td className="py-4 px-6">
                    <StatusBadge status={status} />
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-500">{updatedDate}</td>
                  <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => onView(rec)}
                      className="px-2.5 py-1 text-slate-650 hover:text-slate-850 hover:bg-slate-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex"
                    >
                      View
                    </button>

                    {/* Operator Draft CRUD actions */}
                    {!isAdmin && status === 'draft' && (
                      <>
                        <button
                          onClick={() => onEdit(rec)}
                          className="px-2.5 py-1 text-blue-600 hover:text-blue-755 hover:bg-blue-50 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onSubmit(rec.id)}
                          className="px-2.5 py-1 text-emerald-600 hover:text-emerald-755 hover:bg-emerald-50 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <ArrowUpCircle size={10} />
                          <span>Submit</span>
                        </button>
                        <button
                          onClick={() => onDelete(rec.id)}
                          className="px-2.5 py-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex"
                        >
                          Delete
                        </button>
                      </>
                    )}

                    {/* Admin review workflow actions */}
                    {isAdmin && status === 'pending' && (
                      <>
                        <button
                          onClick={() => onApprove(rec.id)}
                          className="px-2.5 py-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <ShieldCheck size={10} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => onCorrection(rec.id)}
                          className="px-2.5 py-1 text-blue-605 hover:text-blue-705 hover:bg-blue-50 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex"
                        >
                          Request Correction
                        </button>
                        <button
                          onClick={() => onReject(rec.id)}
                          className="px-2.5 py-1 text-rose-600 hover:text-rose-750 hover:bg-rose-50 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export type RecordListType = typeof RecordList;
