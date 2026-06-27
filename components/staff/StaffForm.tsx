import React, { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { SearchableMultiSelect } from '@/components/ui/SearchableMultiSelect';

interface StaffFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    email: string;
    phone: string;
    status: 'active' | 'inactive';
    assignments: string[];
  }) => Promise<void>;
  editingStaff: any | null;
  departmentsList: any[];
  divisionsList: any[];
  isSchool: boolean;
  getBranchName: (id: string) => string;
  getClassName: (id: string) => string;
  initialAssignments: string[];
  isSubmitting?: boolean;
}

export function StaffForm({
  isOpen,
  onClose,
  onSubmit,
  editingStaff,
  departmentsList,
  divisionsList,
  isSchool,
  getBranchName,
  getClassName,
  initialAssignments = [],
  isSubmitting = false
}: StaffFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (editingStaff) {
        setName(editingStaff.name || editingStaff.full_name || '');
        setEmail(editingStaff.email || editingStaff.email_address || '');
        setPhone(editingStaff.phone || '');
        setStatus(editingStaff.status === 'active' || editingStaff.is_active ? 'active' : 'inactive');
        setSelectedAssignments(initialAssignments);
      } else {
        setName('');
        setEmail('');
        setPhone('');
        setStatus('active');
        setSelectedAssignments([]);
      }
    }
  }, [isOpen, editingStaff, initialAssignments]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) return;
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      status,
      assignments: selectedAssignments
    });
  };

  const getBranchLabel = (dept: any) => {
    const branchId = dept.branch || dept.branchId || dept.branch_id;
    return getBranchName(branchId);
  };

  const getClassLabel = (div: any) => {
    const classId = div.school_class || div.classId || div.class_id;
    return getClassName(classId);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-55 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-extrabold text-sm text-slate-900">
            {editingStaff ? 'Update Staff Profile' : 'Create Staff Member'}
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-655 rounded-lg p-1 cursor-pointer"
          >
            <XCircle size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john.doe@cardflow.com"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone Number</label>
            <input 
              type="text" 
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs font-semibold text-slate-900"
            />
          </div>

          {/* Assignment Section */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">Assignment Section</span>
            
            {!isSchool ? (
              // OFFICE MULTI-ASSIGNMENT
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Assign Departments
                </label>
                <SearchableMultiSelect
                  options={departmentsList.map(dept => ({
                    value: String(dept.id),
                    label: `${getBranchLabel(dept)} - ${dept.name}`
                  }))}
                  selectedValues={selectedAssignments}
                  onChange={(vals) => setSelectedAssignments(vals)}
                  placeholder="Search and select departments..."
                />
              </div>
            ) : (
              // SCHOOL MULTI-ASSIGNMENT
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Assign Divisions
                </label>
                <SearchableMultiSelect
                  options={divisionsList.map(div => ({
                    value: String(div.id),
                    label: `${getClassLabel(div)} - ${div.name}`
                  }))}
                  selectedValues={selectedAssignments}
                  onChange={(vals) => setSelectedAssignments(vals)}
                  placeholder="Search and select divisions..."
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !email.trim() || !phone.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              <span>{editingStaff ? 'Update Staff' : 'Save Staff'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export type StaffFormType = typeof StaffForm;
