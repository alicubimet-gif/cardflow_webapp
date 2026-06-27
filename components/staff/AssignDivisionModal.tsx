import React, { useState, useEffect } from 'react';
import { XCircle, CheckSquare, Square } from 'lucide-react';

interface AssignDivisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (selectedDivisionIds: string[]) => Promise<void>;
  divisionsList: any[];
  currentAssignments: any[];
  getClassName: (id: string) => string;
  isSubmitting?: boolean;
}

export function AssignDivisionModal({
  isOpen,
  onClose,
  onAssign,
  divisionsList,
  currentAssignments,
  getClassName,
  isSubmitting = false
}: AssignDivisionModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Find divisions that are currently assigned
      const divisionIds = currentAssignments
        .filter(a => a.assignment_level === 'division' && a.division)
        .map(a => String(a.division.id || a.division));
      setSelectedIds(divisionIds);
    }
  }, [isOpen, currentAssignments]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    await onAssign(selectedIds);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-55 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-extrabold text-sm text-slate-900">
            Assign Individual Divisions
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-655 rounded-lg p-1 cursor-pointer"
          >
            <XCircle size={18} />
          </button>
        </div>
        
        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
          <p className="text-[11px] font-semibold text-slate-500">
            Assigning individual divisions grants access only to the selected divisions within classes.
          </p>
          {divisionsList.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-4">No divisions available.</p>
          ) : (
            <div className="space-y-2">
              {divisionsList.map(d => {
                const classId = d.school_class || d.classId || d.class_id;
                const className = getClassName(classId);
                const isSelected = selectedIds.includes(String(d.id));
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleSelect(String(d.id))}
                    className={`w-full flex items-center gap-3 p-3 border rounded-xl text-left transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-blue-200 bg-blue-50/50 text-blue-900 font-bold' 
                        : 'border-slate-100 hover:bg-slate-50 text-slate-700 font-semibold'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare size={16} className="text-blue-600 shrink-0" />
                    ) : (
                      <Square size={16} className="text-slate-350 shrink-0" />
                    )}
                    <div className="text-xs">
                      <span className="text-slate-400 mr-1.5 font-bold">[{className}]</span>
                      <span>{d.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSubmitting && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            <span>Save Assignments</span>
          </button>
        </div>
      </div>
    </div>
  );
}
