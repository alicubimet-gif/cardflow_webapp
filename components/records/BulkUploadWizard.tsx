import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { OrganizationApi } from '@/api';

export interface BulkUploadWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  templateId?: string | null;
  templateName?: string | null;
  templateFields: any[]; 
  uploadBulkRecords: (formData: FormData) => Promise<any>;
  additionalFormData?: Record<string, string>;
}

export function BulkUploadWizard({
  isOpen,
  onClose,
  onSuccess,
  title = "Bulk Upload Wizard",
  templateFields,
  uploadBulkRecords,
  additionalFormData = {}
}: BulkUploadWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
  
  const [matchingField, setMatchingField] = useState('');
  const [batchName, setBatchName] = useState('');
  const [uploadMode, setUploadMode] = useState<'create' | 'update'>('create');
  
  // Mapping: excelHeader -> templateFieldKey
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [previewMetrics, setPreviewMetrics] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  
  const [result, setResult] = useState<any>(null);

  // Filter fields to exclude internal/system ones
  const matchableFields = templateFields.filter(f => {
    const type = (f.type || '').toLowerCase();
    const key = (f.key || '').toLowerCase();
    const excludedTypes = ['photo', 'image', 'signature', 'qrcode', 'barcode', 'qr_code', 'barcode_field', 'qr_field'];
    if (excludedTypes.includes(type)) return false;
    const excludedKeys = ['id', 'uuid', 'record_id', 'internal_id', 'organization_id', 'company_id', 'database_id', 'system_id'];
    if (excludedKeys.includes(key)) return false;
    if (f.hidden || f.internal || f.readOnly) return false;
    return true;
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFile(null);
      setParsedHeaders([]);
      setParsedData([]);
      setMatchingField('');
      setBatchName('');
      setColumnMapping({});
      setLoading(false);
      setError(null);
      setPreviewMetrics(null);
      setValidationResult(null);
      setResult(null);
      setUploadMode('create');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);

      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        if (workbook.SheetNames.length === 0) throw new Error('Spreadsheet does not contain any sheets.');
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
        
        if (rows.length === 0) throw new Error('The spreadsheet is empty.');
        
        const headers = Object.keys(rows[0]);
        setParsedHeaders(headers);
        setParsedData(rows);

        const defaultMatch = matchableFields.find(f =>
          headers.some(h => h.toLowerCase().trim().replace(/\*+$/, '') === (f.label || f.key || '').toLowerCase().trim())
        );
        if (defaultMatch) setMatchingField(defaultMatch.key || defaultMatch.id);
        else if (matchableFields.length > 0) setMatchingField(matchableFields[0].key || matchableFields[0].id);

        setStep(2);
      } catch (err: any) {
        setError(err.message || 'Failed to parse file headers.');
      }
    }
  };

  const proceedToMapping = () => {
    if (!matchingField) {
      setError('Please select a unique identifier field.');
      return;
    }
    setError(null);
    
    const newMapping: Record<string, string> = {};
    parsedHeaders.forEach(header => {
      const hNorm = header.toLowerCase().trim().replace(/\*+$/, '');
      const match = matchableFields.find(f => 
        (f.label || '').toLowerCase().trim() === hNorm || 
        (f.key || '').toLowerCase().trim() === hNorm
      );
      if (match) {
        newMapping[header] = match.key || match.id;
      }
    });
    setColumnMapping(newMapping);
    setStep(3);
  };

  const createMappedFile = (): File => {
    const newRows = parsedData.map(row => {
      const newRow: Record<string, any> = {};
      Object.keys(row).forEach(excelHeader => {
        const mappedKey = columnMapping[excelHeader];
        if (mappedKey) {
          newRow[mappedKey] = row[excelHeader];
        }
      });
      return newRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(newRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MappedData");
    
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    return new File([blob], file ? file.name.replace(/\.[^/.]+$/, "") + "_mapped.csv" : "mapped.csv", { type: 'text/csv' });
  };

  const handleValidate = async () => {
    setError(null);
    setLoading(true);

    try {
      const mappedFile = createMappedFile();
      const formData = new FormData();
      formData.append('file', mappedFile);
      formData.append('dry_run', 'true');
      formData.append('mode', uploadMode);
      formData.append('matching_field', matchingField);
      if (batchName.trim()) formData.append('batch_name', batchName.trim());
      
      Object.entries(additionalFormData).forEach(([k, v]) => formData.append(k, v));

      const data = await uploadBulkRecords(formData);
      
      setPreviewMetrics({
        total_rows: data?.total_rows || 0,
        matched_count: data?.matched_count || 0,
        unmatched_count: data?.unmatched_count || 0,
        duplicate_count: data?.duplicate_count || 0,
        invalid_count: data?.invalid_count || 0
      });
      setValidationResult({
        successCount: data?.success_count || 0,
        failedRows: data?.failed_rows || [],
        isValidated: true
      });
      setStep(4);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Validation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setError(null);
    setLoading(true);
    setStep(5);

    try {
      const mappedFile = createMappedFile();
      const formData = new FormData();
      formData.append('file', mappedFile);
      formData.append('dry_run', 'false');
      formData.append('mode', uploadMode);
      formData.append('matching_field', matchingField);
      if (batchName.trim()) formData.append('batch_name', batchName.trim());
      
      Object.entries(additionalFormData).forEach(([k, v]) => formData.append(k, v));

      const data = await uploadBulkRecords(formData);
      
      setResult({
        successCount: data?.success_count || 0,
        failedRows: data?.failed_rows || []
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to complete import.');
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  function handleClose() {
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={handleClose} />
      
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col z-10">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Step {step} of 5</p>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="w-full bg-slate-100 h-1">
          <div className="bg-blue-600 h-1 transition-all duration-500" style={{ width: `${(step / 5) * 100}%` }} />
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-700">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 flex items-start gap-3 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-slate-50/50 p-3.5 border border-slate-100 rounded-xl flex justify-between items-center">
                <div className="w-full mr-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Upload Action Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setUploadMode('create')} className={`h-9 rounded-lg text-xs font-bold transition-all border ${uploadMode === 'create' ? 'border-blue-600 bg-blue-50/70 text-blue-600 shadow-xs' : 'border-slate-200 bg-white text-slate-550 hover:bg-slate-50'}`}>Add New Records</button>
                    <button type="button" onClick={() => setUploadMode('update')} className={`h-9 rounded-lg text-xs font-bold transition-all border ${uploadMode === 'update' ? 'border-blue-600 bg-blue-50/70 text-blue-600 shadow-xs' : 'border-slate-200 bg-white text-slate-550 hover:bg-slate-50'}`}>Update Existing Records</button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const { AuthService } = await import('@/services/auth-service');
                      const orgId = user?.organization_id || '';
                      const blob = await OrganizationApi.downloadExcelTemplate({
                        organization_id: orgId,
                        ...additionalFormData
                      });
                      const url = window.URL.createObjectURL(new Blob([blob]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', 'Bulk_Upload_Template.xlsx');
                      document.body.appendChild(link);
                      link.click();
                      link.parentNode?.removeChild(link);
                    } catch (err: any) {
                      setError(err.message || 'Failed to download template');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 h-9 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                  disabled={loading}
                >
                  {loading && <Loader2 size={12} className="animate-spin" />}
                  <FileSpreadsheet size={14} />
                  <span>Download Excel Template</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Spreadsheet File</label>
                <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-8 transition-all flex flex-col items-center justify-center text-center bg-slate-50/50">
                  <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-600">Drag spreadsheet here or click to browse</p>
                  <p className="text-xs text-slate-400 mt-1">Supports Excel (.xlsx, .xls) and CSV</p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                <FileSpreadsheet className="text-blue-600 w-5 h-5 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-slate-900">{file?.name}</p>
                  <p className="text-slate-500 mt-0.5">Found {parsedHeaders.length} columns and {parsedData.length} rows.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Match Records By (Unique Identifier)</label>
                  <select className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-800" value={matchingField} onChange={e => setMatchingField(e.target.value)}>
                    <option value="">-- Select Unique Field --</option>
                    {matchableFields.map(f => (<option key={f.key || f.id} value={f.key || f.id}>{f.label} ({f.key})</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Batch Name (Optional)</label>
                  <input type="text" placeholder="e.g. Q3 New Hires" value={batchName} onChange={(e) => setBatchName(e.target.value)} className="w-full h-10 px-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-sm font-semibold text-slate-800 bg-white" />
                </div>
              </div>
              <div className="flex justify-between gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setStep(1)} className="h-9 px-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all">Back</button>
                <button type="button" onClick={proceedToMapping} disabled={!matchingField} className="bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 rounded-xl text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-md"><span>Next: Map Columns</span><ArrowRight size={14} /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <p className="text-xs text-slate-500 mb-2">Map the columns from your uploaded file to the assigned template fields.</p>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                    <tr><th className="px-4 py-3 font-bold">Excel Column</th><th className="px-4 py-3 font-bold">Template Field</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white max-h-64 overflow-y-auto block w-full table-fixed" style={{ display: 'table-row-group' }}>
                    {parsedHeaders.map(header => (
                      <tr key={header} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 font-medium text-slate-800 w-1/2 break-words">{header}</td>
                        <td className="px-4 py-2 w-1/2">
                          <select className="w-full h-8 px-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500" value={columnMapping[header] || ''} onChange={(e) => setColumnMapping({...columnMapping, [header]: e.target.value})}>
                            <option value="">-- Ignore --</option>
                            {matchableFields.map(f => (<option key={f.key || f.id} value={f.key || f.id}>{f.label} {f.required ? '*' : ''}</option>))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setStep(2)} className="h-9 px-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all">Back</button>
                <button type="button" onClick={handleValidate} disabled={loading} className="bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md">{loading && <Loader2 size={12} className="animate-spin" />}<span>Run Validation</span><ArrowRight size={14} /></button>
              </div>
            </div>
          )}

          {step === 4 && previewMetrics && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preview Import Statistics</div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center"><p className="text-slate-550 text-[9px] uppercase font-bold tracking-wider">Total</p><p className="text-base font-black text-slate-800 mt-1">{previewMetrics.total_rows}</p></div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-center"><p className="text-blue-600 text-[9px] uppercase font-bold tracking-wider">Matched</p><p className="text-base font-black text-blue-900 mt-1">{previewMetrics.matched_count}</p></div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center"><p className="text-emerald-600 text-[9px] uppercase font-bold tracking-wider">New</p><p className="text-base font-black text-emerald-950 mt-1">{previewMetrics.unmatched_count}</p></div>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center"><p className="text-amber-600 text-[9px] uppercase font-bold tracking-wider">Dupes</p><p className="text-base font-black text-amber-950 mt-1">{previewMetrics.duplicate_count}</p></div>
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-center"><p className="text-rose-600 text-[9px] uppercase font-bold tracking-wider">Invalid</p><p className="text-base font-black text-rose-950 mt-1">{previewMetrics.invalid_count}</p></div>
              </div>
              {validationResult?.failedRows?.length > 0 && (
                <div className="space-y-2 text-left">
                  <h5 className="font-bold text-[10px] text-rose-500 uppercase tracking-wider">Row Warnings ({validationResult.failedRows.length})</h5>
                  <div className="max-h-36 overflow-y-auto text-[10px] bg-rose-50 border border-rose-100 p-3 rounded-lg space-y-1 font-mono text-rose-700">
                    {validationResult.failedRows.map((fr: any, idx: number) => (
                      <div key={idx} className="flex gap-1.5 border-b border-rose-100/50 pb-1 last:border-0"><span className="font-extrabold bg-rose-200/50 px-1 rounded shrink-0">Row {fr.row || fr.row_num || idx + 1}:</span><span>{Array.isArray(fr.errors) ? fr.errors.join(', ') : (fr.errors || 'Validation error')}</span></div>
                    ))}
                  </div>
                </div>
              )}
              {validationResult?.failedRows?.length === 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-700"><CheckCircle2 size={14} className="shrink-0" />All mapped rows passed validation checks. Ready to import.</div>
              )}
              <div className="flex justify-between gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setStep(3)} className="h-9 px-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all">Back</button>
                <button type="button" onClick={handleImport} disabled={loading || (validationResult && validationResult.successCount === 0)} className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-5 rounded-xl text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-md">{loading && <Loader2 size={12} className="animate-spin" />}<span>{uploadMode === 'update' ? 'Confirm Bulk Update' : 'Confirm Import'}</span></button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 py-4 animate-in fade-in zoom-in-95 duration-300">
              {loading && !result ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                  <p className="text-sm font-bold text-slate-700">Processing Upload...</p>
                  <p className="text-xs text-slate-500 text-center max-w-xs">Please wait while we process your data. The frontend is displaying this progress state.</p>
                  <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden mt-4"><div className="h-full bg-blue-600 rounded-full animate-pulse w-full origin-left" style={{ animationDuration: '2s' }} /></div>
                </div>
              ) : result ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-5 flex items-start gap-3 text-emerald-800 text-xs font-semibold">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                    <div><p className="font-extrabold uppercase text-[11px] tracking-wider text-emerald-700">Import Finished Successfully</p><p className="mt-1 text-slate-700 font-medium">Successfully processed <strong className="text-emerald-700 font-bold">{result.successCount}</strong> records.</p></div>
                  </div>
                  {result.failedRows?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Skipped/Failed Rows ({result.failedRows.length})</h4>
                      <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[180px] overflow-y-auto bg-slate-50 p-2 space-y-1">
                        {result.failedRows.map((row: any, idx: number) => (
                          <div key={idx} className="py-1.5 px-2 text-[10px] font-medium text-slate-600 flex items-start gap-2"><span className="font-bold text-rose-600 bg-rose-50 px-1 rounded-sm shrink-0">Row {row.row || row.row_num || idx + 1}</span><span>{Array.isArray(row.errors) ? row.errors.join(', ') : (row.errors || 'Validation error')}</span></div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={handleClose} className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold transition-all shadow-sm">Done</button>
                </div>
              ) : null}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
