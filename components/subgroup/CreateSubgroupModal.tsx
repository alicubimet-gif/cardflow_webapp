import React, { useEffect, useState } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import { cleanText, restrictText } from '@/utils/validation';

interface CreateSubgroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, parentId: string) => void;
  editingId: string | null;
  initialName: string;
  initialParentId: string;
  parentList: any[];
  isLoading: boolean;
}

export function CreateSubgroupModal({
  isOpen,
  onClose,
  onSave,
  editingId,
  initialName,
  initialParentId,
  parentList,
  isLoading
}: CreateSubgroupModalProps) {
  const [name, setName] = useState(initialName);
  const [parentId, setParentId] = useState(initialParentId);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; parentId?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setParentId(initialParentId || (parentList[0]?.id ? String(parentList[0].id) : ''));
      setFieldErrors({});
    }
  }, [isOpen, initialName, initialParentId, parentList]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const newErrors: { name?: string; parentId?: string } = {};

    const cleaned = cleanText(name);
    if (!cleaned) {
      newErrors.name = 'This field is required.';
    } else if (cleaned.length < 1) {
      newErrors.name = 'Subgroup name must not be empty.';
    }

    if (!parentId) {
      newErrors.parentId = 'This field is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      const firstInvalidField = newErrors.name ? 'subgroupName' : 'parentGroup';
      document.getElementById(firstInvalidField)?.focus();
      return;
    }

    onSave(cleaned, parentId);
  };

  const handleNameChange = (val: string) => {
    const restricted = restrictText(val);
    setName(restricted);
    if (fieldErrors.name) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.name;
        return next;
      });
    }
  };

  const handleParentChange = (val: string) => {
    setParentId(val);
    if (fieldErrors.parentId) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.parentId;
        return next;
      });
    }
  };


  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-[#DFE4EA] flex items-center justify-between">
          <h3 className="font-semibold text-base text-[#0B0F19]" style={{ fontFamily: 'Sora, sans-serif' }}>
            {editingId ? 'Edit Subgroup' : 'Add Subgroup'}
          </h3>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer">
            <XCircle size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          <div>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
              Subgroup Name
            </label>
            <input
              id="subgroupName"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter subgroup name"
              className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium text-[#0B0F19] transition-all ${
                fieldErrors.name 
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10'
                  : 'border-[#D1D5DB] focus:border-[#2563EB]'
              }`}
            />
            {fieldErrors.name && (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{fieldErrors.name}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
              Parent Group
            </label>
            <select
              id="parentGroup"
              value={parentId}
              onChange={(e) => handleParentChange(e.target.value)}
              className={`w-full h-11 px-4 border rounded-xl bg-white focus:outline-none focus:border-[#2563EB] text-sm font-medium text-[#0B0F19] cursor-pointer transition-all ${
                fieldErrors.parentId 
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-[#D1D5DB]'
              }`}
            >
              <option value="" disabled>Select parent class</option>
              {parentList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {fieldErrors.parentId && (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{fieldErrors.parentId}</p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 border border-[#DFE4EA] rounded-xl text-sm font-semibold text-[#64748B] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-11 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {editingId ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
