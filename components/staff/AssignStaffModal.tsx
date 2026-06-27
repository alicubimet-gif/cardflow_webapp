import React, { useState, useEffect } from 'react';
import { XCircle, Loader2 } from 'lucide-react';

interface AssignStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedIds: string[]) => void;
  staffList: any[];
  currentAssignments: any[];
  targetType: 'class' | 'division' | 'branch' | 'department';
  targetId: string | null;
  isLoading: boolean;
}

export function AssignStaffModal({
  isOpen,
  onClose,
  onSave,
  staffList,
  currentAssignments,
  targetType,
  targetId,
  isLoading
}: AssignStaffModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && targetId) {
      const activeStaffIds = currentAssignments
        .filter(a => {
          if (targetType === 'class') return a.assignment_level === 'class' && String(a.school_class || a.class_id) === String(targetId);
          if (targetType === 'division') return a.assignment_level === 'division' && String(a.division || a.division_id) === String(targetId);
          if (targetType === 'branch') return a.assignment_level === 'branch' && String(a.branch || a.branch_id) === String(targetId);
          if (targetType === 'department') return a.assignment_level === 'department' && String(a.department || a.department_id) === String(targetId);
          return false;
        })
        .map(a => String(a.staff || a.staff_id));
      setSelectedIds(activeStaffIds);
    }
  }, [isOpen, targetId, targetType, currentAssignments]);

  if (!isOpen) return null;

  const toggleStaff = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-[#DFE4EA] flex items-center justify-between">
          <h3 className="font-bold text-base text-[#0B0F19]" style={{ fontFamily: 'Sora, sans-serif' }}>
            Assign Staff
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-[#64748B] hover:bg-slate-100 transition-colors">
            <XCircle size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {staffList.length === 0 ? (
            <p className="text-sm text-slate-500 text-center">No staff members found.</p>
          ) : (
            <div className="space-y-2">
              {staffList.map(st => {
                const isChecked = selectedIds.includes(String(st.id));
                return (
                  <label key={st.id} className="flex items-center gap-3 p-3 border border-slate-100 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleStaff(String(st.id))}
                      className="w-4 h-4 text-[#2563EB] border-[#D1D5DB] rounded focus:ring-blue-100"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#0B0F19]">{st.name || st.full_name}</p>
                      <p className="text-xs text-[#64748B]">{st.email || st.email_address}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-[#DFE4EA] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 border border-[#DFE4EA] rounded-xl text-sm font-semibold text-[#64748B] hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onSave(selectedIds)}
            className="flex-1 h-10 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
