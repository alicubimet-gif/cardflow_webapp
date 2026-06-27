import React, { useEffect, useState } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import { cleanText, restrictText } from '@/utils/validation';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  editingId: string | null;
  initialName: string;
  isLoading: boolean;
}

export function CreateClassModal({
  isOpen,
  onClose,
  onSave,
  editingId,
  initialName,
  isLoading
}: CreateClassModalProps) {
  const [name, setName] = useState(initialName);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setNameError(null);
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);

    const cleaned = cleanText(name);
    if (!cleaned) {
      setNameError('This field is required.');
      document.getElementById('className')?.focus();
      return;
    }

    if (cleaned.length < 2) {
      setNameError('Class name must be at least 2 characters.');
      document.getElementById('className')?.focus();
      return;
    }

    onSave(cleaned);
  };

  const handleNameChange = (val: string) => {
    const restricted = restrictText(val);
    setName(restricted);
    if (nameError) {
      setNameError(null);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-[#DFE4EA] flex items-center justify-between">
          <h3 className="font-semibold text-base text-[#0B0F19]" style={{ fontFamily: 'Sora, sans-serif' }}>
            {editingId ? 'Edit Class' : 'Add Class'}
          </h3>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer">
            <XCircle size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          <div>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
              Class Name
            </label>
            <input
              id="className"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter class name"
              className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium text-[#0B0F19] transition-all ${
                nameError 
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10'
                  : 'border-[#D1D5DB] focus:border-[#2563EB]'
              }`}
            />
            {nameError && (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{nameError}</p>
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
