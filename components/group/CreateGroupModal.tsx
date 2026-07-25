import React, { useEffect, useState } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import { cleanText, restrictText } from '@/utils/validation';
import { useCreateGroup, useUpdateGroup } from '@/hooks/queries/useGroups';
import { useToast } from '@/hooks/useToast';

export interface CreateGroupModalProps {
  // Legacy DashboardModals props
  isOpen?: boolean;
  onClose?: () => void;
  editingId?: string | null;
  initialName?: string;

  // New reusable form dialog props
  open?: boolean;
  mode?: 'create' | 'edit';
  group?: any | null;
  onOpenChange?: (open: boolean) => void;
  onSave?: (name: string) => any;
  isLoading?: boolean;
}

export function CreateGroupModal({
  isOpen,
  onClose,
  editingId,
  initialName,
  open,
  mode,
  group,
  onOpenChange,
  onSave,
}: CreateGroupModalProps) {
  // Resolve props
  const resolvedOpen = open ?? isOpen ?? false;
  const resolvedOnClose = onOpenChange ? () => onOpenChange(false) : onClose ?? (() => {});
  const resolvedMode = mode ?? (editingId ? 'edit' : 'create');
  const resolvedEditingId = resolvedMode === 'edit' ? (group?.id ?? editingId ?? null) : null;

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);

  // Error states
  const [nameError, setNameError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const { toast } = useToast();
  const createMutation = useCreateGroup();
  const updateMutation = useUpdateGroup();

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Prefill form
  useEffect(() => {
    if (resolvedOpen) {
      if (resolvedMode === 'edit') {
        const activeGroup = group || null;
        setName(activeGroup?.name ?? initialName ?? '');
        setCode(activeGroup?.code ?? '');
        setStatus(activeGroup?.status === 'inactive' ? 'inactive' : 'active');
        setIsCodeManuallyEdited(Boolean(activeGroup?.code));
      } else {
        setName(initialName ?? '');
        setCode('');
        setStatus('active');
        setIsCodeManuallyEdited(false);
      }
      setNameError(null);
      setCodeError(null);
      setStatusError(null);
    }
  }, [resolvedOpen, resolvedMode, group, initialName]);

  if (!resolvedOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setCodeError(null);
    setStatusError(null);

    const cleanedName = cleanText(name);
    if (!cleanedName) {
      setNameError('Group name is required.');
      document.getElementById('groupName')?.focus();
      return;
    }

    if (cleanedName.length < 2) {
      setNameError('Group name must be at least 2 characters.');
      document.getElementById('groupName')?.focus();
      return;
    }

    if (onSave) {
      try {
        await onSave(cleanedName);
        resolvedOnClose();
      } catch (err) {
        console.error(err);
      }
      return;
    }

    const cleanedCode = cleanText(code);

    const payload = {
      name: cleanedName,
      code: cleanedCode || null,
      status,
    };

    const options = {
      onSuccess: () => {
        toast(`Group ${resolvedEditingId ? 'updated' : 'created'} successfully`, 'success');
        resolvedOnClose();
      },
      onError: (err: any) => {
        const data = err?.response?.data;
        if (data && typeof data === 'object') {
          // Map field errors
          if (data.name) {
            setNameError(Array.isArray(data.name) ? data.name[0] : data.name);
          }
          if (data.code) {
            setCodeError(Array.isArray(data.code) ? data.code[0] : data.code);
          }
          if (data.status) {
            setStatusError(Array.isArray(data.status) ? data.status[0] : data.status);
          }
          // Generic toast fallback
          if (!data.name && !data.code && !data.status) {
            toast(data.detail || data.message || 'An error occurred. Please try again.', 'error');
          }
        } else {
          toast('An error occurred. Please try again.', 'error');
        }
      },
    };

    if (resolvedEditingId) {
      updateMutation.mutate({ id: resolvedEditingId, payload }, options);
    } else {
      createMutation.mutate(payload, options);
    }
  };

  const handleNameChange = (val: string) => {
    const restricted = restrictText(val);
    setName(restricted);
    if (nameError) setNameError(null);

    if (!resolvedEditingId && !isCodeManuallyEdited) {
      const autoCode = restricted
        .toUpperCase()
        .replace(/[\s_]+/g, '-')
        .replace(/[^A-Z0-9-]/g, '')
        .substring(0, 15);
      setCode(autoCode);
      if (codeError) setCodeError(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-[#DFE4EA] flex items-center justify-between">
          <h3 className="font-semibold text-base text-[#0B0F19]" style={{ fontFamily: 'Sora, sans-serif' }}>
            {resolvedEditingId ? 'Edit Group' : 'Add Group'}
          </h3>
          <button type="button" onClick={resolvedOnClose} className="p-2 rounded-xl text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer">
            <XCircle size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          <div>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
              Group Name
            </label>
            <input
              id="groupName"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter group name"
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


          <div>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as 'active' | 'inactive');
                if (statusError) setStatusError(null);
              }}
              className="w-full h-11 px-4 border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium text-[#0B0F19] bg-white cursor-pointer transition-all"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {statusError && (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{statusError}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={resolvedOnClose}
              className="flex-1 h-11 border border-[#DFE4EA] rounded-xl text-sm font-semibold text-[#64748B] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-11 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              {resolvedEditingId ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Export under both names for compatibility
export { CreateGroupModal as GroupFormDialog };
