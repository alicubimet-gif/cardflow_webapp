import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import * as recordService from '@/services/record-service';
import { PhotoUploader } from './PhotoUploader';
import { cleanText, restrictText, restrictNumber, validateEmail, validateMobile } from '@/utils/validation';

interface FieldConfig {
  key: string;
  label: string;
  type: string;
  required: boolean;
}

interface AddRecordModalProps {
  open: boolean;
  onClose: () => void;
  areaType: 'division' | 'department';
  classId?: string | null;
  divisionId?: string | null;
  branchId?: string | null;
  departmentId?: string | null;
  fields: FieldConfig[];
  onSuccess: () => void;
}

export function AddRecordModal({
  open,
  onClose,
  areaType,
  classId,
  divisionId,
  branchId,
  departmentId,
  fields,
  onSuccess
}: AddRecordModalProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize values when open
  useEffect(() => {
    if (open) {
      const initialValues: Record<string, string> = {};
      const initialFiles: Record<string, File | null> = {};
      fields.forEach((f) => {
        if (f.type !== 'image' && f.type !== 'photo' && f.key !== 'photo') {
          initialValues[f.key] = '';
        } else {
          initialFiles[f.key] = null;
        }
      });
      setFormValues(initialValues);
      setFiles(initialFiles);
      setErrorText(null);
      setFieldErrors({});
      setIsSubmitting(false);
    }
  }, [open, fields]);

  if (!open) return null;

  const handleInputChange = (key: string, value: string, fieldType: string) => {
    let finalValue = value;
    // Apply real-time input restrictions
    if (key.includes('phone') || key.includes('mobile') || key.includes('pin') || key.includes('roll') || key.includes('employee_id') || key.includes('admission')) {
      const isMobile = key.includes('phone') || key.includes('mobile');
      finalValue = restrictNumber(value, isMobile ? 10 : undefined);
    } else if (fieldType === 'email') {
      finalValue = value.toLowerCase().replace(/\s/g, '');
    } else if (fieldType === 'text' && (key.includes('name') || key.includes('school') || key.includes('organization') || key.includes('department') || key.includes('class') || key.includes('designation'))) {
      finalValue = restrictText(value);
    }

    setFormValues((prev) => ({ ...prev, [key]: finalValue }));

    // Remove validation error on typing
    if (fieldErrors[key]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleFileChange = (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorText(null);
    setFieldErrors({});

    const newErrors: Record<string, string> = {};
    const cleanedValues: Record<string, string> = {};

    fields.forEach((f) => {
      if (f.type === 'image' || f.type === 'photo' || f.key === 'photo') return;
      const rawVal = formValues[f.key] || '';
      
      // Clean/trim text fields
      let cleanedVal = rawVal;
      if (f.type === 'email' || f.key.includes('email')) {
        cleanedVal = rawVal.trim().toLowerCase();
        const err = validateEmail(cleanedVal);
        if (f.required && !cleanedVal) {
          newErrors[f.key] = 'This field is required.';
        } else if (cleanedVal && err) {
          newErrors[f.key] = err;
        }
      } else if (f.key.includes('phone') || f.key.includes('mobile')) {
        cleanedVal = rawVal.trim();
        const err = validateMobile(cleanedVal);
        if (f.required && !cleanedVal) {
          newErrors[f.key] = 'This field is required.';
        } else if (cleanedVal && err) {
          newErrors[f.key] = err;
        }
      } else {
        // text fields
        cleanedVal = cleanText(rawVal);
        if (f.required && !cleanedVal) {
          newErrors[f.key] = 'This field is required.';
        } else if (cleanedVal && (f.key.includes('name') || f.key.includes('organization') || f.key.includes('school') || f.key.includes('department') || f.key.includes('class') || f.key.includes('designation'))) {
          if (cleanedVal.length < 2) {
            newErrors[f.key] = `${f.label} must be at least 2 characters.`;
          }
        }
      }
      cleanedValues[f.key] = cleanedVal;
    });

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setIsSubmitting(false);
      // Focus first error field
      const firstErrorKey = Object.keys(newErrors)[0];
      document.getElementById(firstErrorKey)?.focus();
      return;
    }

    try {
      // Find dynamic photo/image field configuration
      const photoField = fields.find(f => f.type === 'image' || f.type === 'photo' || f.key === 'photo');
      const hasPhotoSelected = photoField ? !!files[photoField.key] : false;

      if (photoField && hasPhotoSelected) {
        // Use FormData
        const formData = new FormData();
        if (areaType === 'division') {
          formData.append('division', divisionId || '');
          formData.append('class_room', classId || '');
        } else {
          formData.append('department', departmentId || '');
          formData.append('branch', branchId || '');
        }

        // Build custom_data JSON object containing cleaned values
        const customDataObj: Record<string, string> = {};
        fields.forEach((f) => {
          if (f.type !== 'image' && f.type !== 'photo' && f.key !== 'photo') {
            customDataObj[f.key] = cleanedValues[f.key] || '';
          }
        });
        
        formData.append('custom_data', JSON.stringify(customDataObj));
        formData.append('status', 'pending_review');

        // Extract blob from Canvas (capturing all user edits: crop, rotation, brightness)
        const canvas = canvasRef.current;
        if (canvas) {
          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', 0.95);
          });
          if (blob) {
            const photoFile = new File([blob], files[photoField.key]?.name || 'photo.jpg', { type: 'image/jpeg' });
            formData.append('photo', photoFile);
          } else if (files[photoField.key]) {
            formData.append('photo', files[photoField.key]!);
          }
        } else if (files[photoField.key]) {
          formData.append('photo', files[photoField.key]!);
        }

        await recordService.createRecordWithPhoto(formData);
      } else {
        // Use JSON / normal payload without photo
        const payload: any = {
          status: 'pending_review'
        };

        if (areaType === 'division') {
          payload.division = divisionId || '';
          payload.class_room = classId || '';
        } else {
          payload.department = departmentId || '';
          payload.branch = branchId || '';
        }

        const customDataObj: Record<string, string> = {};
        fields.forEach((f) => {
          if (f.type !== 'image' && f.type !== 'photo' && f.key !== 'photo') {
            customDataObj[f.key] = cleanedValues[f.key] || '';
          }
        });
        payload.custom_data = customDataObj;

        await recordService.createRecord(payload);
      }

      // Success flows
      onSuccess();
    } catch (err: any) {
      console.error('[AddRecordModal] Submit error:', err);
      if (err.response?.data) {
        const errData = err.response.data;
        const errSource = errData.errors || errData;
        const backendErrors: Record<string, string> = {};
        
        fields.forEach((f) => {
          if (errSource[f.key]) {
            backendErrors[f.key] = Array.isArray(errSource[f.key]) ? errSource[f.key][0] : errSource[f.key];
          }
        });

        if (Object.keys(backendErrors).length > 0) {
          setFieldErrors(backendErrors);
          const firstErrorKey = Object.keys(backendErrors)[0];
          document.getElementById(firstErrorKey)?.focus();
        } else {
          setErrorText(errData.detail || errData.message || 'Failed to add record');
        }
      } else {
        setErrorText(err.message || 'Failed to add record');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-[#DFE4EA] rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#DFE4EA] flex items-center justify-between bg-slate-50/50">
          <h3 
            className="text-sm font-bold text-[#0B0F19]" 
            style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
          >
            {areaType === 'division' ? 'Add Student Record' : 'Add Employee Record'}
          </h3>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[70vh]" noValidate>
          {errorText && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="font-semibold">{errorText}</div>
            </div>
          )}

          {fields.map((f) => {
            const isRequired = f.required;
            const hasError = !!fieldErrors[f.key];

            if (f.type === 'image' || f.type === 'photo' || f.key === 'photo') {
              return (
                <div key={f.key} className="space-y-1">
                  <PhotoUploader 
                    canvasRef={canvasRef}
                    onPhotoSelected={(file) => handleFileChange(f.key, file)}
                  />
                </div>
              );
            }

            const inputType = f.type === 'email' ? 'email' : f.type === 'date' ? 'date' : 'text';
            const inputMode = (f.key.includes('phone') || f.key.includes('mobile') || f.key.includes('pin') || f.key.includes('roll') || f.key.includes('employee_id') || f.key.includes('admission')) ? 'numeric' : undefined;

            return (
              <div key={f.key} className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {f.label} {isRequired && <span className="text-rose-500">*</span>}
                </label>
                <input
                  id={f.key}
                  type={inputType}
                  inputMode={inputMode}
                  value={formValues[f.key] || ''}
                  onChange={(e) => handleInputChange(f.key, e.target.value, f.type)}
                  placeholder={`Enter ${f.label.toLowerCase()}`}
                  className={`w-full h-[40px] px-3 border rounded-xl text-xs font-semibold text-[#0B0F19] focus:outline-none focus:ring-4 transition-all ${
                    hasError
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10'
                      : 'border-[#DFE4EA] focus:border-[#2563EB] focus:ring-blue-500/10'
                  }`}
                />
                {hasError && (
                  <p className="text-[10px] font-bold text-rose-500 mt-1">{fieldErrors[f.key]}</p>
                )}
              </div>
            );
          })}

          {/* Modal Footer / Actions */}
          <div className="pt-4 border-t border-[#DFE4EA] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl border border-[#DFE4EA] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 min-w-[90px] justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Record</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
