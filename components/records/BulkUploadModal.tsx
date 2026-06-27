import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2, Download, Check, FileSpreadsheet } from 'lucide-react';
import { AuthService } from '@/services/auth-service';
import { useAuth } from '@/context/auth-context';
import * as XLSX from 'xlsx';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isSchool: boolean;
  prefilledClassId?: string;
  prefilledSubId?: string;
  prefilledClassName?: string;
  prefilledSubName?: string;
}

export function BulkUploadModal({
  isOpen,
  onClose,
  onSuccess,
  isSchool,
  prefilledClassId,
  prefilledSubId,
  prefilledClassName,
  prefilledSubName
}: BulkUploadModalProps) {
  const { user } = useAuth();
  const orgId = user?.organization_id;

  const [recordType, setRecordType] = useState<'student' | 'school_staff' | 'employee'>(
    isSchool ? 'student' : 'employee'
  );
  
  // Location Selection States
  const [classes, setClasses] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');

  // Template State
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [resolvedTemplate, setResolvedTemplate] = useState<{
    fields: any[];
    template_id: string | null;
    template_name: string | null;
    has_template: boolean;
  } | null>(null);

  // File and Upload/Validation states
  const [file, setFile] = useState<File | null>(null);
  const [batchName, setBatchName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dry run / Validation results
  const [validationResult, setValidationResult] = useState<{
    successCount: number;
    failedRows: any[];
    isValidated: boolean;
  } | null>(null);

  // Final success result
  const [result, setResult] = useState<{ successCount: number; failedRows: any[] } | null>(null);

  // Load classes/branches on mount/open
  useEffect(() => {
    if (isOpen) {
      if (isSchool) {
        AuthService.getClasses().then(setClasses).catch(console.error);
      } else {
        AuthService.getBranches().then(setBranches).catch(console.error);
      }
    }
  }, [isOpen, isSchool]);

  // Handle prefilled locations
  useEffect(() => {
    if (isOpen) {
      if (prefilledClassId) {
        if (isSchool) {
          setSelectedClassId(prefilledClassId);
          AuthService.getDivisions(prefilledClassId).then(setDivisions).catch(console.error);
        } else {
          setSelectedBranchId(prefilledClassId);
          AuthService.getDepartments(prefilledClassId).then(setDepartments).catch(console.error);
        }
      }
      if (prefilledSubId) {
        if (isSchool) {
          setSelectedDivisionId(prefilledSubId);
        } else {
          setSelectedDepartmentId(prefilledSubId);
        }
      }
    }
  }, [isOpen, prefilledClassId, prefilledSubId, isSchool]);

  // Load divisions when class changes
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedDivisionId('');
    setDivisions([]);
    setResolvedTemplate(null);
    setValidationResult(null);
    if (classId) {
      AuthService.getDivisions(classId).then(setDivisions).catch(console.error);
    }
  };

  // Load departments when branch changes
  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    setSelectedDepartmentId('');
    setDepartments([]);
    setResolvedTemplate(null);
    setValidationResult(null);
    if (branchId) {
      AuthService.getDepartments(branchId).then(setDepartments).catch(console.error);
    }
  };

  // Automatically determine the template when target location is fully resolved
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!orgId) return;

      let params: any = {};
      if (isSchool) {
        if (selectedClassId && selectedDivisionId) {
          params = { class_id: selectedClassId, division_id: selectedDivisionId };
        } else {
          setResolvedTemplate(null);
          return;
        }
      } else {
        if (selectedBranchId && selectedDepartmentId) {
          params = { branch_id: selectedBranchId, department_id: selectedDepartmentId };
        } else {
          setResolvedTemplate(null);
          return;
        }
      }

      setLoadingTemplate(true);
      setError(null);
      try {
        const data = await AuthService.getTemplateFields(orgId, params);
        setResolvedTemplate(data);
      } catch (err: any) {
        setError('Failed to resolve approved template for the selected location.');
        setResolvedTemplate(null);
      } finally {
        setLoadingTemplate(false);
      }
    };

    fetchTemplate();
  }, [isSchool, selectedClassId, selectedDivisionId, selectedBranchId, selectedDepartmentId, orgId]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setValidationResult(null);
    }
  };

  const getExcelFields = (fields: any[]) => {
    return fields.filter((field: any) => {
      const type = (field.type || '').toLowerCase();
      const key = (field.key || '').toLowerCase();
      
      const excludedTypes = [
        'photo', 'image', 'signature', 'qrcode', 'barcode', 
        'qr_code', 'barcode_field', 'qr_field'
      ];
      if (excludedTypes.includes(type)) {
        return false;
      }

      const excludedKeys = [
        'id', 'uuid', 'record_id', 'internal_id', 'organization_id', 'company_id',
        'database_id', 'system_id'
      ];
      if (excludedKeys.includes(key)) {
        return false;
      }

      if (field.hidden || field.internal || field.readOnly) {
        return false;
      }

      return true;
    });
  };

  const handleDownloadTemplate = async () => {
    if (!orgId || !resolvedTemplate) return;
    setError(null);
    setLoading(true);
    try {
      const filteredFields = getExcelFields(resolvedTemplate.fields);

      // Map fields to headers
      const headers = filteredFields.map((f: any) => {
        let lbl = f.label || f.key || '';
        if (f.required) {
          lbl = `${lbl} *`;
        }
        return lbl;
      });

      // Create sheet data AOA (first row is headers, then 5 empty input rows)
      const aoaData = [headers];
      for (let i = 0; i < 5; i++) {
        aoaData.push(headers.map(() => ''));
      }

      const ws = XLSX.utils.aoa_to_sheet(aoaData);

      // Freeze first row
      ws['!views'] = [
        { state: 'frozen', ySplit: 1, xSplit: 0, topLeftCell: 'A2', activePane: 'bottomLeft' }
      ];

      // Auto-adjust column widths
      ws['!cols'] = headers.map((h: string) => ({
        wch: Math.max(h.length + 5, 18)
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Entry');

      // Download trigger
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openpyxlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      let locationName = '';
      if (isSchool) {
        const clsName = classes.find(c => c.id === selectedClassId)?.name || 'Class';
        const divName = divisions.find(d => d.id === selectedDivisionId)?.name || 'Division';
        locationName = `${clsName}_${divName}`;
      } else {
        const brName = branches.find(b => b.id === selectedBranchId)?.name || 'Branch';
        const deptName = departments.find(d => d.id === selectedDepartmentId)?.name || 'Department';
        locationName = `${brName}_${deptName}`;
      }

      const cleanedLocation = locationName.replace(/[^a-zA-Z0-9_]/g, '');
      const filename = `${cleanedLocation}_Bulk_Upload.xlsx`;

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError('Failed to generate Excel template format.');
    } finally {
      setLoading(false);
    }
  };

  // Run dry-run validation check
  const handleValidate = async () => {
    setError(null);
    setValidationResult(null);

    if (!file) {
      setError('Please select a CSV or Excel file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('dry_run', 'true');
    if (batchName.trim()) {
      formData.append('batch_name', batchName.trim());
    }

    if (isSchool) {
      if (selectedClassId) formData.append('class_id', selectedClassId);
      if (selectedDivisionId) formData.append('division_id', selectedDivisionId);
    } else {
      if (selectedBranchId) formData.append('branch_id', selectedBranchId);
      if (selectedDepartmentId) formData.append('department_id', selectedDepartmentId);
    }

    setLoading(true);
    try {
      let data;
      if (recordType === 'student') {
        data = await AuthService.bulkUploadStudents(formData);
      } else if (recordType === 'school_staff') {
        data = await AuthService.bulkUploadSchoolStaff(formData);
      } else {
        data = await AuthService.bulkUploadEmployees(formData);
      }

      setValidationResult({
        successCount: data?.success_count || 0,
        failedRows: data?.failed_rows || [],
        isValidated: true
      });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Validation failed. Please verify the spreadsheet format.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Complete final Import records
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!file) {
      setError('Please select a file to import.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('dry_run', 'false');
    if (batchName.trim()) {
      formData.append('batch_name', batchName.trim());
    }

    if (isSchool) {
      if (selectedClassId) formData.append('class_id', selectedClassId);
      if (selectedDivisionId) formData.append('division_id', selectedDivisionId);
    } else {
      if (selectedBranchId) formData.append('branch_id', selectedBranchId);
      if (selectedDepartmentId) formData.append('department_id', selectedDepartmentId);
    }

    setLoading(true);
    try {
      let data;
      if (recordType === 'student') {
        data = await AuthService.bulkUploadStudents(formData);
      } else if (recordType === 'school_staff') {
        data = await AuthService.bulkUploadSchoolStaff(formData);
      } else {
        data = await AuthService.bulkUploadEmployees(formData);
      }

      setResult({
        successCount: data?.success_count || 0,
        failedRows: data?.failed_rows || []
      });
      
      setFile(null);
      setBatchName('');
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Failed to complete import.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setValidationResult(null);
    setError(null);
    setFile(null);
    setBatchName('');
    setSelectedClassId('');
    setSelectedDivisionId('');
    setSelectedBranchId('');
    setSelectedDepartmentId('');
    setResolvedTemplate(null);
    onClose();
  };

  // Current workflow validation status
  const isLocationSelected = isSchool 
    ? (selectedClassId && selectedDivisionId) 
    : (selectedBranchId && selectedDepartmentId);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={handleClose} />
      
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Bulk Import Records</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Import roster directly into structures with assigned templates</p>
          </div>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-700">
          
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 flex items-start gap-3 text-rose-700 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-5 flex items-start gap-3 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold uppercase text-[10px] tracking-wider text-emerald-700">Import Finished Successfully</p>
                  <p className="mt-1.5 text-slate-700 font-medium">Successfully created <strong className="text-emerald-700 font-bold">{result.successCount}</strong> records inside the system.</p>
                </div>
              </div>

              {result.failedRows && result.failedRows.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Skipped/Failed Rows ({result.failedRows.length})</h4>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[180px] overflow-y-auto bg-slate-50 p-2 space-y-1">
                    {result.failedRows.map((row: any, idx: number) => (
                      <div key={idx} className="py-1.5 px-2 text-[10px] font-medium text-slate-600 flex items-start gap-2">
                        <span className="font-bold text-rose-600 bg-rose-50 px-1 rounded-sm shrink-0">Row {row.row || row.row_num || idx + 1}</span>
                        <span>{Array.isArray(row.errors) ? row.errors.join(', ') : (row.errors || row.error || 'Validation error')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                Close Window
              </button>
            </div>
          )}

          {!result && (
            <div className="space-y-6">
              
              {/* Record Type Select (Only for Schools: Student vs Staff) */}
              {isSchool && (
                <div className="bg-slate-50/50 p-3.5 border border-slate-100 rounded-xl">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-2">
                    Target Record Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRecordType('student')}
                      className={`h-9 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        recordType === 'student'
                          ? 'border-blue-600 bg-blue-50/70 text-blue-600 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Students
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecordType('school_staff')}
                      className={`h-9 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        recordType === 'school_staff'
                          ? 'border-blue-600 bg-blue-50/70 text-blue-600 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      School Staff
                    </button>
                  </div>
                </div>
              )}

              {/* 5-Step Workflow Tracker */}
              <div className="space-y-5">
                
                {/* Step 1 – Target Location Selection */}
                <div className="space-y-3 relative pl-6 border-l border-slate-200">
                  <span className="absolute -left-[9px] top-0 w-[18px] h-[18px] rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Step 1: Select Target Location</h4>
                    {isLocationSelected && <Check size={14} className="text-emerald-500" />}
                  </div>
                  
                  {prefilledClassId && prefilledSubId ? (
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Locked Location Context</span>
                        <span className="text-xs font-bold text-slate-800 mt-1 block">
                          {isSchool ? 'Class' : 'Branch'}: <strong className="text-blue-600 font-bold">{
                            isSchool 
                              ? (classes.find(c => c.id === selectedClassId)?.name || prefilledClassName || 'Loading Class...') 
                              : (branches.find(b => b.id === selectedBranchId)?.name || prefilledClassName || 'Loading Branch...')
                          }</strong>
                          {'  ·  '}
                          {isSchool ? 'Division' : 'Department'}: <strong className="text-blue-600 font-bold">{
                            isSchool 
                              ? (divisions.find(d => d.id === selectedDivisionId)?.name || prefilledSubName || 'Loading Division...') 
                              : (departments.find(d => d.id === selectedDepartmentId)?.name || prefilledSubName || 'Loading Department...')
                          }</strong>
                        </span>
                      </div>
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    </div>
                  ) : isSchool ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-medium text-slate-455 block mb-1">Class</label>
                        <select
                          value={selectedClassId}
                          onChange={(e) => handleClassChange(e.target.value)}
                          className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                        >
                          <option value="">Select Class</option>
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-455 block mb-1">Division</label>
                        <select
                          value={selectedDivisionId}
                          onChange={(e) => { setSelectedDivisionId(e.target.value); setValidationResult(null); }}
                          disabled={!selectedClassId}
                          className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-50 disabled:text-slate-400"
                        >
                          <option value="">Select Division</option>
                          {divisions.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-medium text-slate-455 block mb-1">Branch</label>
                        <select
                          value={selectedBranchId}
                          onChange={(e) => handleBranchChange(e.target.value)}
                          className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                        >
                          <option value="">Select Branch</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-455 block mb-1">Department</label>
                        <select
                          value={selectedDepartmentId}
                          onChange={(e) => { setSelectedDepartmentId(e.target.value); setValidationResult(null); }}
                          disabled={!selectedBranchId}
                          className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-50 disabled:text-slate-400"
                        >
                          <option value="">Select Department</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Template Info Alert */}
                  {loadingTemplate && (
                    <div className="flex items-center gap-2 text-xs text-slate-450 italic">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                      <span>Resolving assigned card template...</span>
                    </div>
                  )}
                  {resolvedTemplate && (
                    <div className="rounded-xl bg-blue-50/70 border border-blue-100/50 p-3 flex items-start gap-2.5 text-blue-800 text-[11px] font-medium transition-all">
                      <FileSpreadsheet className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold uppercase text-[9px] tracking-wider text-blue-600 block">System Auto-Assigned Template</span>
                        <span className="mt-0.5 text-slate-700">
                          Template: <strong className="text-slate-900 font-bold">{resolvedTemplate.template_name || 'Generic Template'}</strong>
                        </span>
                        <span className="block mt-1 text-slate-400 font-normal">
                          Includes columns: {getExcelFields(resolvedTemplate.fields).map((f: any) => f.label || f.key).join(', ')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2 – Download Excel Template */}
                <div className="space-y-3 relative pl-6 border-l border-slate-200">
                  <span className={`absolute -left-[9px] top-0 w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center ${isLocationSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${isLocationSelected ? 'text-slate-800' : 'text-slate-400'}`}>Step 2: Download Excel Format</h4>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    disabled={!isLocationSelected || loading}
                    className="h-10 px-4 bg-white border border-slate-200 hover:bg-slate-50 disabled:bg-slate-50 disabled:opacity-40 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:cursor-not-allowed"
                  >
                    <Download size={14} className="text-blue-500" />
                    <span>Download Excel Template</span>
                  </button>
                </div>

                {/* Step 3 – Upload Completed Excel */}
                <div className="space-y-3 relative pl-6 border-l border-slate-200">
                  <span className={`absolute -left-[9px] top-0 w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center ${isLocationSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</span>
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${isLocationSelected ? 'text-slate-800' : 'text-slate-400'}`}>Step 3: Upload Completed Excel</h4>
                    {file && <Check size={14} className="text-emerald-500" />}
                  </div>

                  {/* Batch Name (Optional) */}
                  {isLocationSelected && (
                    <div className="max-w-sm">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Batch Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Class 10th Batch A 2026"
                        value={batchName}
                        onChange={(e) => setBatchName(e.target.value)}
                        disabled={loading}
                        className="w-full h-8 px-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs font-semibold text-slate-800 bg-white"
                      />
                    </div>
                  )}

                  <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center bg-slate-50/50 max-w-lg">
                    <input
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      onChange={handleFileChange}
                      disabled={!isLocationSelected || loading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    {file ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <FileText size={14} className="text-blue-500" />
                        <span className="truncate max-w-[220px]">{file.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    ) : (
                      <>
                        <p className={`text-xs font-bold ${isLocationSelected ? 'text-slate-655' : 'text-slate-400'}`}>Drag spreadsheet here or click to browse</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Supports Excel (.xlsx, .xls) and CSV</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Step 4 – Validate Data */}
                <div className="space-y-3 relative pl-6 border-l border-slate-200">
                  <span className={`absolute -left-[9px] top-0 w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center ${file ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>4</span>
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${file ? 'text-slate-800' : 'text-slate-400'}`}>Step 4: Validate Data</h4>
                    {validationResult?.isValidated && <Check size={14} className="text-emerald-500" />}
                  </div>

                  {file && (
                    <button
                      type="button"
                      onClick={handleValidate}
                      disabled={loading}
                      className="h-10 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                      <span>Run Validation Dry-Run</span>
                    </button>
                  )}

                  {/* Validation results summary */}
                  {validationResult && (
                    <div className="space-y-3 max-w-lg">
                      {validationResult.failedRows.length === 0 ? (
                        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3.5 flex items-start gap-2.5 text-emerald-800 text-[11px] font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="block font-bold">✓ Validation Passed</span>
                            <span className="font-normal text-slate-600 mt-0.5 block">
                              All {validationResult.successCount} rows look correct. Ready to import.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="rounded-xl bg-amber-50 border border-amber-100 p-3.5 flex items-start gap-2.5 text-amber-900 text-[11px] font-semibold">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="block font-bold">⚠️ Format Validation Issues Found</span>
                              <span className="font-normal text-slate-600 mt-0.5 block">
                                {validationResult.failedRows.length} rows contain validation errors. You can correct these or proceed to import only the valid rows ({validationResult.successCount}).
                              </span>
                            </div>
                          </div>
                          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[140px] overflow-y-auto bg-slate-50/50 p-2 space-y-1">
                            {validationResult.failedRows.map((row: any, idx: number) => (
                              <div key={idx} className="py-1 px-2 text-[10px] font-medium text-slate-600 flex items-start gap-2">
                                <span className="font-bold text-amber-700 bg-amber-50 px-1 rounded-sm shrink-0">Row {row.row || row.row_num || idx + 1}</span>
                                <span>{Array.isArray(row.errors) ? row.errors.join(', ') : (row.errors || row.error)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 5 – Import Records */}
                <div className="space-y-3 relative pl-6">
                  <span className={`absolute -left-[9px] top-0 w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center ${validationResult?.isValidated ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>5</span>
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${validationResult?.isValidated ? 'text-slate-800' : 'text-slate-400'}`}>Step 5: Import Records</h4>
                  
                  {validationResult?.isValidated && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleImport}
                        disabled={loading || validationResult.successCount === 0}
                        className="h-11 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                        <span>Import {validationResult.successCount} Valid Records</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
