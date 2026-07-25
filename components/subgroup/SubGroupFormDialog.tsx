import React, { useEffect, useState } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import { cleanText, restrictText } from '@/utils/validation';
import { useCreateSubgroup, useUpdateSubgroup } from '@/hooks/queries/useSubgroups';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/auth-context';
import { useOrgLabels } from '@/hooks/useOrgLabels';

export interface SubGroupFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  groupId: string;
  subGroup?: any | null;
  onOpenChange: (open: boolean) => void;
}

export function SubGroupFormDialog({
  open,
  mode,
  groupId,
  subGroup,
  onOpenChange,
}: SubGroupFormDialogProps) {
  const { user } = useAuth();
  const { subgroupLabel } = useOrgLabels(user?.organization_type);

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
  const createMutation = useCreateSubgroup(groupId);
  const updateMutation = useUpdateSubgroup(groupId);

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Prefill form
  useEffect(() => {
    if (open) {
      if (mode === 'edit') {
        const activeSub = subGroup || null;
        setName(activeSub?.name ?? '');
        setCode(activeSub?.code ?? '');
        setStatus(activeSub?.status === 'inactive' ? 'inactive' : 'active');
        setIsCodeManuallyEdited(Boolean(activeSub?.code));
      } else {
        setName('');
        setCode('');
        setStatus('active');
        setIsCodeManuallyEdited(false);
      }
      setNameError(null);
      setCodeError(null);
      setStatusError(null);
    }
  }, [open, mode, subGroup]);

  if (!open) return null;

  const handleClose = () => onOpenChange(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setCodeError(null);
    setStatusError(null);

    const cleanedName = cleanText(name);
    if (!cleanedName) {
      setNameError(`${subgroupLabel} name is required.`);
      document.getElementById('subGroupName')?.focus();
      return;
    }

    if (cleanedName.length < 2) {
      setNameError(`${subgroupLabel} name must be at least 2 characters.`);
      document.getElementById('subGroupName')?.focus();
      return;
    }

    const cleanedCode = cleanText(code);

    const options = {
      onSuccess: () => {
        toast(`${subgroupLabel} ${mode === 'edit' ? 'updated' : 'created'} successfully`, 'success');
        handleClose();
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

    if (mode === 'edit') {
      const payload = {
        name: cleanedName,
        code: cleanedCode || null,
        status,
        group: groupId,
      };
      updateMutation.mutate({ id: subGroup?.id, payload }, options);
    } else {
      const payload = {
        name: cleanedName,
        code: cleanedCode || null,
        status,
        group: groupId,
      };
      createMutation.mutate(payload, options);
    }
  };

  const handleNameChange = (val: string) => {
    const restricted = restrictText(val);
    setName(restricted);
    if (nameError) setNameError(null);

    const autoCode = restricted
      .toUpperCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^A-Z0-9-]/g, '')
      .substring(0, 15);
    setCode(autoCode);
    if (codeError) setCodeError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-[#DFE4EA] flex items-center justify-between">
          <h3 className="font-semibold text-base text-[#0B0F19]" style={{ fontFamily: 'Sora, sans-serif' }}>
            {mode === 'edit' ? `Edit ${subgroupLabel}` : `Add ${subgroupLabel}`}
          </h3>
          <button type="button" onClick={handleClose} className="p-2 rounded-xl text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer">
            <XCircle size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          <div>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
              {subgroupLabel} Name
            </label>
            <input
              id="subGroupName"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={`Enter ${subgroupLabel.toLowerCase()} name`}
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
              onClick={handleClose}
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
              {mode === 'edit' ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
