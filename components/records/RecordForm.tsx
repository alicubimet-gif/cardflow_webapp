import React, { useState, useEffect, useRef } from 'react';
import { XCircle } from 'lucide-react';
import { PhotoUploader } from './PhotoUploader';
import { cleanText, restrictText, restrictNumber, validateEmail, validateMobile } from '@/utils/validation';

interface RecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any, processedBlob: Blob | null) => Promise<void>;
  editingRecord: any | null;
  requiredFields: any[];
  isSchool: boolean;
  classesList: any[];
  divisionsList: any[];
  branchesList: any[];
  departmentsList: any[];
  isSubmitting?: boolean;
  prefilledValues?: Record<string, any>;
}

export function RecordForm({
  isOpen,
  onClose,
  onSubmit,
  editingRecord,
  requiredFields,
  isSchool,
  classesList,
  divisionsList,
  branchesList,
  departmentsList,
  isSubmitting = false,
  prefilledValues
}: RecordFormProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load field values
  useEffect(() => {
    if (isOpen) {
      setFieldErrors({});
      if (editingRecord) {
        const values: Record<string, any> = {};
        requiredFields.forEach(f => {
          values[f.key] = editingRecord[f.key] ?? editingRecord.data?.[f.key] ?? editingRecord.field_values?.[f.key] ?? '';
        });
        // Extra aliases
        if (isSchool) {
          values['student_name'] = editingRecord.student_name || editingRecord.name || editingRecord.full_name || '';
          values['school_class'] = editingRecord.class_id || editingRecord.classId || editingRecord.school_class || '';
          values['division'] = editingRecord.division_id || editingRecord.divId || editingRecord.division || '';
        } else {
          values['employee_name'] = editingRecord.employee_name || editingRecord.name || editingRecord.full_name || '';
          values['branch'] = editingRecord.branch_id || editingRecord.branchId || editingRecord.branch || '';
          values['department'] = editingRecord.dept_id || editingRecord.deptId || editingRecord.department || '';
        }
        values['email_address'] = editingRecord.email || editingRecord.email_address || '';
        values['phone'] = editingRecord.phone || '';
        
        // Also load nested dictionary keys just in case
        if (editingRecord.data && typeof editingRecord.data === 'object') {
          Object.keys(editingRecord.data).forEach(k => {
            if (values[k] === undefined || values[k] === '') {
              values[k] = editingRecord.data[k];
            }
          });
        }

        if (prefilledValues) {
          Object.assign(values, prefilledValues);
        }
        setFormValues(values);
      } else {
        const defaults: Record<string, any> = {};
        requiredFields.forEach(f => {
          if (f.type === 'select_class' || f.type === 'class') {
            defaults[f.key] = classesList[0]?.id ? String(classesList[0].id) : '';
          } else if (f.type === 'select_division' || f.type === 'division') {
            const defaultClassId = classesList[0]?.id;
            const filteredDivs = divisionsList.filter(d => String(d.school_class || d.classId || d.class_id) === String(defaultClassId));
            defaults[f.key] = filteredDivs[0]?.id ? String(filteredDivs[0].id) : '';
          } else if (f.type === 'select_branch' || f.type === 'branch') {
            defaults[f.key] = branchesList[0]?.id ? String(branchesList[0].id) : '';
          } else if (f.type === 'select_department' || f.type === 'department') {
            const defaultBranchId = branchesList[0]?.id;
            const filteredDepts = departmentsList.filter(d => String(d.branch || d.branchId || d.branch_id) === String(defaultBranchId));
            defaults[f.key] = filteredDepts[0]?.id ? String(filteredDepts[0].id) : '';
          } else {
            defaults[f.key] = '';
          }
        });
        
        if (prefilledValues) {
          Object.assign(defaults, prefilledValues);
        }
        setFormValues(defaults);
      }
    }
  }, [isOpen, editingRecord, requiredFields, classesList, divisionsList, branchesList, departmentsList, isSchool, prefilledValues]);

  if (!isOpen) return null;

  const handleFieldChange = (key: string, value: any) => {
    const f = requiredFields.find(field => field.key === key);
    let finalValue = value;
    
    if (f && typeof value === 'string') {
      if (f.type === 'phone' || key.includes('phone') || key.includes('mobile') || key.includes('pin') || key.includes('roll') || key.includes('employee_id') || key.includes('admission')) {
        const isMobile = f.type === 'phone' || key.includes('phone') || key.includes('mobile');
        finalValue = restrictNumber(value, isMobile ? 10 : undefined);
      } else if (f.type === 'email') {
        finalValue = value.toLowerCase().replace(/\s/g, '');
      } else if (f.type === 'text' && (key.includes('name') || key.includes('school') || key.includes('organization') || key.includes('department') || key.includes('class') || key.includes('designation'))) {
        finalValue = restrictText(value);
      }
    }

    setFormValues(prev => {
      const updated = { ...prev, [key]: finalValue };
      
      // Auto alignment of child select list values
      if (key === 'school_class' || key === 'class') {
        const filtered = divisionsList.filter(d => String(d.school_class || d.classId || d.class_id) === String(finalValue));
        updated['division'] = filtered[0]?.id || '';
      } else if (key === 'branch') {
        const filtered = departmentsList.filter(d => String(d.branch || d.branchId || d.branch_id) === String(finalValue));
        updated['department'] = filtered[0]?.id || '';
      }
      return updated;
    });

    if (fieldErrors[key]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const getCanvasBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (canvas && canvas.width > 0 && canvas.height > 0) {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.9);
      } else {
        resolve(null);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const newErrors: Record<string, string> = {};
    
    // Validate required fields
    for (const f of requiredFields) {
      const isPhoto = ['photo', 'image', 'signature'].includes(f.type);
      const rawVal = formValues[f.key];
      
      let cleanedVal = rawVal;
      if (typeof rawVal === 'string') {
        if (f.type === 'email' || f.key.includes('email')) {
          cleanedVal = rawVal.trim().toLowerCase();
          const err = validateEmail(cleanedVal);
          if (f.required && !cleanedVal) {
            newErrors[f.key] = 'This field is required.';
          } else if (cleanedVal && err) {
            newErrors[f.key] = err;
          }
        } else if (f.type === 'phone' || f.key.includes('phone') || f.key.includes('mobile')) {
          cleanedVal = rawVal.trim();
          const err = validateMobile(cleanedVal);
          if (f.required && !cleanedVal) {
            newErrors[f.key] = 'This field is required.';
          } else if (cleanedVal && err) {
            newErrors[f.key] = err;
          }
        } else {
          cleanedVal = cleanText(rawVal);
          if (f.required && !cleanedVal && !isPhoto) {
            newErrors[f.key] = 'This field is required.';
          } else if (cleanedVal && (f.key.includes('name') || f.key.includes('organization') || f.key.includes('school') || f.key.includes('department') || f.key.includes('class') || f.key.includes('designation'))) {
            if (cleanedVal.length < 2) {
              newErrors[f.key] = `${f.label} must be at least 2 characters.`;
            }
          }
        }
        formValues[f.key] = cleanedVal;
      } else {
        if (f.required && !rawVal && !isPhoto) {
          newErrors[f.key] = 'This field is required.';
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      const firstKey = Object.keys(newErrors)[0];
      const element = document.getElementById(`field-${firstKey}`);
      if (element) {
        element.focus();
      }
      return;
    }

    const blob = await getCanvasBlob();
    try {
      await onSubmit(formValues, blob);
    } catch (err: any) {
      if (err?.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        Object.keys(err.response.data.errors).forEach(k => {
          const val = err.response.data.errors[k];
          backendErrors[k] = Array.isArray(val) ? val[0] : String(val);
        });
        setFieldErrors(backendErrors);
        const firstKey = Object.keys(backendErrors)[0];
        document.getElementById(`field-${firstKey}`)?.focus();
      }
    }
  };

  const renderInputField = (f: any) => {
    const key = f.key;
    const value = formValues[key] || '';
    const isLocked = prefilledValues && prefilledValues[key] !== undefined;
    const hasError = !!fieldErrors[key];

    if (f.type === 'select_class' || f.type === 'class') {
      return (
        <select
          id={`field-${key}`}
          value={value}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          disabled={isLocked}
          className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer transition-all ${
            hasError ? 'border-rose-500' : 'border-slate-200'
          } ${isLocked ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
        >
          {classesList.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      );
    }

    if (f.type === 'select_division' || f.type === 'division') {
      const classKey = isSchool ? 'school_class' : 'class';
      const selectedClassId = formValues[classKey];
      const filteredDivs = divisionsList.filter(
        d => String(d.school_class || d.classId || d.class_id) === String(selectedClassId)
      );

      return (
        <select
          id={`field-${key}`}
          value={value}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          disabled={isLocked}
          className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer transition-all ${
            hasError ? 'border-rose-500' : 'border-slate-200'
          } ${isLocked ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
        >
          {filteredDivs.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
          {filteredDivs.length === 0 && (
            <option value="">No divisions available for selected Class</option>
          )}
        </select>
      );
    }

    if (f.type === 'select_branch' || f.type === 'branch') {
      return (
        <select
          id={`field-${key}`}
          value={value}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          disabled={isLocked}
          className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer transition-all ${
            hasError ? 'border-rose-500' : 'border-slate-200'
          } ${isLocked ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
        >
          {branchesList.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      );
    }

    if (f.type === 'select_department' || f.type === 'department') {
      const selectedBranchId = formValues['branch'];
      const filteredDepts = departmentsList.filter(
        d => String(d.branch || d.branchId || d.branch_id) === String(selectedBranchId)
      );

      return (
        <select
          id={`field-${key}`}
          value={value}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          disabled={isLocked}
          className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer transition-all ${
            hasError ? 'border-rose-500' : 'border-slate-200'
          } ${isLocked ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
        >
          {filteredDepts.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
          {filteredDepts.length === 0 && (
            <option value="">No departments available for selected Branch</option>
          )}
        </select>
      );
    }

    if (f.type === 'select' || f.type === 'dropdown') {
      const options = Array.isArray(f.options) ? f.options : [];
      return (
        <select
          id={`field-${key}`}
          value={value}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          disabled={isLocked}
          className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer transition-all ${
            hasError ? 'border-rose-500' : 'border-slate-200'
          } ${isLocked ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
        >
          <option value="">Select option...</option>
          {options.map((opt: any) => {
            const optVal = typeof opt === 'string' ? opt : opt.value ?? opt.label ?? '';
            const optLabel = typeof opt === 'string' ? opt : opt.label ?? opt.value ?? '';
            return (
              <option key={optVal} value={optVal}>{optLabel}</option>
            );
          })}
        </select>
      );
    }

    if (f.type === 'textarea') {
      return (
        <textarea
          id={`field-${key}`}
          value={value}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          disabled={isLocked}
          placeholder={`Enter ${f.label.toLowerCase()}`}
          rows={3}
          className={`w-full px-3 py-2 border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-550/15 text-xs font-semibold text-slate-900 bg-white transition-all ${
            hasError 
              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10'
              : 'border-slate-200 focus:border-blue-500'
          } ${isLocked ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
        />
      );
    }

    if (f.type === 'date') {
      return (
        <input
          id={`field-${key}`}
          type="date"
          value={value}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          disabled={isLocked}
          className={`w-full px-3 py-2 border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-550/15 text-xs font-semibold text-slate-900 bg-white transition-all ${
            hasError 
              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10'
              : 'border-slate-200 focus:border-blue-500'
          } ${isLocked ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
        />
      );
    }

    if (f.type === 'checkbox' || f.type === 'boolean') {
      return (
        <div className="flex items-center gap-2 py-1">
          <input
            id={`field-${key}`}
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleFieldChange(key, e.target.checked)}
            disabled={isLocked}
            className="w-4 h-4 text-blue-600 border-slate-300 rounded-md focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor={`field-${key}`} className="text-xs text-slate-700 cursor-pointer select-none">
            {f.placeholder || f.label}
          </label>
        </div>
      );
    }

    if (f.type === 'radio') {
      const options = Array.isArray(f.options) ? f.options : [];
      return (
        <div className="flex flex-wrap gap-4 py-1.5" id={`field-${key}`}>
          {options.map((opt: any) => {
            const optVal = typeof opt === 'string' ? opt : opt.value ?? opt.label ?? '';
            const optLabel = typeof opt === 'string' ? opt : opt.label ?? opt.value ?? '';
            return (
              <div key={optVal} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name={key}
                  value={optVal}
                  checked={String(value) === String(optVal)}
                  onChange={() => handleFieldChange(key, optVal)}
                  disabled={isLocked}
                  id={`radio-${key}-${optVal}`}
                  className="w-3.5 h-3.5 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor={`radio-${key}-${optVal}`} className="text-xs text-slate-700 cursor-pointer select-none">
                  {optLabel}
                </label>
              </div>
            );
          })}
        </div>
      );
    }

    let inputType = 'text';
    if (f.type === 'number') inputType = 'number';
    else if (f.type === 'email') inputType = 'email';
    else if (f.type === 'phone') inputType = 'tel';

    const inputMode = (f.type === 'phone' || key.includes('phone') || key.includes('mobile') || key.includes('pin') || key.includes('roll') || key.includes('employee_id') || key.includes('admission')) ? 'numeric' : undefined;

    return (
      <input
        id={`field-${key}`}
        type={inputType}
        inputMode={inputMode}
        value={value}
        onChange={(e) => handleFieldChange(key, e.target.value)}
        disabled={isLocked}
        placeholder={`Enter ${f.label.toLowerCase()}`}
        className={`w-full px-3 py-2 border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-550/15 text-xs font-semibold text-slate-900 bg-white transition-all ${
          hasError 
            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10'
            : 'border-slate-200 focus:border-blue-500'
        } ${isLocked ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
      />
    );
  };

  const hasPhotoField = requiredFields.some(f => ['photo', 'image', 'signature'].includes(f.type));
  const photoField = requiredFields.find(f => ['photo', 'image', 'signature'].includes(f.type));
  const initialPhotoUrl = photoField 
    ? (editingRecord?.[photoField.key] || editingRecord?.photoUrl || editingRecord?.profile_photo || editingRecord?.photo || '')
    : '';

  return (
    <div className="fixed inset-0 bg-black/40 z-55 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-extrabold text-sm text-slate-900">
            {editingRecord 
              ? (isSchool ? 'Edit Student Record' : 'Edit Employee Record') 
              : (isSchool ? 'Add Student Record' : 'Add Employee Record')}
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-655 rounded-lg p-1 cursor-pointer"
          >
            <XCircle size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto" noValidate>
          {/* Dynamic input render */}
          {requiredFields
            .filter(f => !['qr_code', 'qrcode', 'barcode', 'photo', 'image', 'signature'].includes(f.type))
            .map(f => (
              <div key={f.key}>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {f.label} {f.required && <span className="text-rose-500">*</span>}
                </label>
                {renderInputField(f)}
                {fieldErrors[f.key] && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-500">{fieldErrors[f.key]}</p>
                )}
              </div>
            ))
          }

          {/* Photo Uploader Panel (if configured) */}
          {hasPhotoField && (
            <div className="pt-2">
              <PhotoUploader
                initialPhotoUrl={initialPhotoUrl}
                canvasRef={canvasRef}
              />
            </div>
          )}

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
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              <span>{editingRecord ? 'Save Record' : 'Create Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export type RecordFormType = typeof RecordForm;
