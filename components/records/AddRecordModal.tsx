import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, ArrowRight, ArrowLeft, User, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/auth-context';
import { useOrgLabels } from '@/hooks/useOrgLabels';
import { useGroups } from '@/hooks/queries/useGroups';
import { useSubgroups } from '@/hooks/queries/useSubgroups';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { PhotoUploader } from './PhotoUploader';
import { BulkUploadCard } from './BulkUploadCard';
import { BulkUpdateCard } from './BulkUpdateCard';

// 1. Types & Interfaces
interface TemplateField {
  field_id: string;
  label: string;
  type: string;
  required: boolean;
  visible: boolean;
  placeholder?: string | null;
  default_value?: any;
  options?: any[];
}

interface TemplateFieldsData {
  fields: TemplateField[];
  schema?: Record<string, any>;
  uiSchema?: Record<string, any>;
  templateId: string | null;
  templateName: string | null;
  hasTemplate: boolean;
  resolutionLevel?: string | null;
}

interface AddRecordModalProps {
  open: boolean;
  onClose: () => void;
  onOpenChange?: (open: boolean) => void;
  onSuccess: () => void;
  preselectedGroupId?: string;
  preselectedSubgroupId?: string;
  lockGroup?: boolean;
  lockSubgroup?: boolean;
  initialMode?: 'selector' | 'single' | 'bulk' | 'bulk-update';
}

// Normalize column name for matching heuristic
function normalizeColumnName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function formatFieldLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function resolveFieldLabel(field: any) {
  const rawLabel = field.label ?? field.display_name ?? field.title ?? field.name ?? field.field_id;
  if (!rawLabel) return 'Unnamed Field';
  if (rawLabel === field.field_id && rawLabel.includes('_')) {
    return formatFieldLabel(rawLabel);
  }
  return rawLabel;
}

function normalizeTemplateFieldsResponse(response: any) {
  const payload = response?.data?.data ?? response?.data ?? response ?? {};
  
  const template = payload.template ?? payload.template_id ?? payload.card_template ?? null;
  const templateId = typeof template === 'object' && template !== null ? template.id : template;
  const hasTemplate = payload.has_template === true || Boolean(templateId);

  const rawFields = Array.isArray(payload.fields) ? payload.fields : [];
  const normalizedFields = rawFields.map((f: any) => ({
    field_id: String(f.field_id ?? f.id ?? f.key ?? f.name ?? f.field_name ?? f.slug ?? ''),
    label: resolveFieldLabel(f),
    type: String(f.type ?? f.field_type ?? 'text'),
    required: Boolean(f.required ?? f.is_required ?? false),
    visible: f.visible !== false,
    placeholder: f.placeholder ?? undefined,
    default_value: f.default_value ?? null,
    options: Array.isArray(f.options) ? f.options.map((opt: any) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          label: String(opt.label ?? opt.name ?? opt.value ?? ''),
          value: String(opt.value ?? opt.id ?? ''),
        };
      }
      return { label: String(opt), value: String(opt) };
    }) : []
  })).filter((f: any) => f.field_id);

  return {
    templateId,
    template,
    templateName: payload.template_name ?? null,
    resolutionLevel: payload.resolution_level ?? null,
    fields: normalizedFields,
    schema: payload.schema ?? {},
    uiSchema: payload.uiSchema ?? {},
    hasTemplate,
  };
}

// Generate default values dynamically
function buildDefaultValues(fields: TemplateField[]) {
  return fields.reduce<Record<string, any>>((values, field) => {
    if (field.default_value !== null && field.default_value !== undefined) {
      values[field.field_id] = field.default_value;
      return values;
    }
    switch (field.type) {
      case 'checkbox':
        values[field.field_id] = [];
        break;
      case 'boolean':
        values[field.field_id] = false;
        break;
      case 'number':
        values[field.field_id] = '';
        break;
      default:
        values[field.field_id] = '';
    }
    return values;
  }, {});
}

export function AddRecordModal({
  open,
  onClose,
  onOpenChange,
  onSuccess,
  preselectedGroupId,
  preselectedSubgroupId,
  lockGroup = false,
  lockSubgroup = false,
  initialMode = 'selector',
}: AddRecordModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const labels = useOrgLabels(user?.organization_type);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { register, handleSubmit, watch, setValue, reset, setError, formState: { errors } } = useForm({
    defaultValues: {
      field_values: buildDefaultValues([])
    }
  });

  // Workflow states
  const [workflowStep, setWorkflowStep] = useState<1 | 2 | 3 | 4 | 5>(
    (preselectedGroupId && preselectedSubgroupId && (initialMode === 'single' || initialMode === 'bulk')) ? 2 : 1
  );
  const [recordType, setRecordType] = useState<'single' | 'bulk'>(initialMode === 'bulk' ? 'bulk' : 'single');
  const [selectedGroup, setSelectedGroup] = useState<string>(preselectedGroupId || '');
  const [selectedSubGroup, setSelectedSubGroup] = useState<string>(preselectedSubgroupId || '');

  // Bulk specific states
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [matchingField, setMatchingField] = useState('');
  const [uploadMode, setUploadMode] = useState<'create' | 'update'>('create');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [previewMetrics, setPreviewMetrics] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [bulkResult, setBulkResult] = useState<any>(null);

  // Single record specific states
  const [singlePhotoFile, setSinglePhotoFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize from preselection props
  useEffect(() => {
    if (open) {
      if (preselectedGroupId) {
        setSelectedGroup(preselectedGroupId);
      } else {
        setSelectedGroup('');
      }
      if (preselectedSubgroupId) {
        setSelectedSubGroup(preselectedSubgroupId);
      } else {
        setSelectedSubGroup('');
      }

      if (initialMode === 'single') {
        setRecordType('single');
        setUploadMode('create');
        setWorkflowStep(2);
      } else if (initialMode === 'bulk') {
        setRecordType('bulk');
        setUploadMode('create');
        setWorkflowStep(2);
      } else if (initialMode === 'bulk-update') {
        setRecordType('bulk');
        setUploadMode('update');
        setWorkflowStep(2);
      } else {
        setRecordType('single');
        setUploadMode('create');
        setWorkflowStep(1);
      }
      reset({
        field_values: buildDefaultValues([])
      });
    } else {
      // RESET ONLY when closing
      setBulkFile(null);
      setParsedHeaders([]);
      setParsedData([]);
      setMatchingField('');
      setColumnMapping({});
      setPreviewMetrics(null);
      setValidationResult(null);
      setBulkResult(null);
      setSinglePhotoFile(null);
      setSubmitError(null);
    }
  }, [open, preselectedGroupId, preselectedSubgroupId, lockGroup, lockSubgroup, initialMode, reset]);

  // Fetch groups and subgroups dynamically
  const { data: groupsData, isLoading: isGroupsLoading } = useGroups({}, { enabled: open });
  const groupsList = Array.isArray(groupsData) 
    ? groupsData 
    : (groupsData?.results && Array.isArray(groupsData.results))
      ? groupsData.results
      : [];

  const { data: subgroupsData, isLoading: isSubgroupsLoading } = useSubgroups(selectedGroup, {}, { enabled: open && Boolean(selectedGroup) });
  const subgroupsList = Array.isArray(subgroupsData) 
    ? subgroupsData 
    : (subgroupsData?.results && Array.isArray(subgroupsData.results))
      ? subgroupsData.results
      : [];

  // Fetch template fields with Group and Sub Group in queryKey
  const templateFieldsQuery = useQuery({
    queryKey: ["template-fields", user?.organization_id || '', selectedGroup, selectedSubGroup],
    queryFn: async () => {
      const organizationId = user?.organization_id || '';
      console.debug("Add Record context", {
        organizationId,
        groupId: selectedGroup,
        subgroupId: selectedSubGroup,
      });
      const res = await apiClient.get(`/api/studio/organizations/${organizationId}/template-fields/`, {
        params: {
          group: selectedGroup,
          subgroup: selectedSubGroup
        }
      });
      return normalizeTemplateFieldsResponse(res);
    },
    enabled: open && workflowStep >= 2 && Boolean(user?.organization_id) && Boolean(selectedGroup) && Boolean(selectedSubGroup),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const templateData = templateFieldsQuery.data;
  const visibleFields = templateData?.fields?.filter((f: any) => f.visible !== false) ?? [];
  const isLoadingTemplate = templateFieldsQuery.isLoading || templateFieldsQuery.isFetching;

  const hasTemplate = Boolean(templateData?.templateId);
  const hasVisibleFields = visibleFields.length > 0;

  const matchableFields = visibleFields.filter((f: any) => {
    const type = (f.type || f.field_type || '').toLowerCase();
    const key = (f.field_id || f.id || f.key || f.label || '').toLowerCase();
    if (!key) return false;
    const excludedTypes = ['photo', 'image', 'signature', 'qrcode', 'barcode', 'qr_code', 'barcode_field', 'qr_field'];
    if (excludedTypes.includes(type)) return false;
    const excludedKeys = ['id', 'uuid', 'record_id', 'internal_id', 'organization_id', 'company_id', 'database_id', 'system_id'];
    if (excludedKeys.includes(key)) return false;
    return true;
  });

  // useForm initialized at top of component

  // Reset form when modal opens (handled in consolidated initialization useEffect above)

  // Reset form defaults when template fields finish loading
  useEffect(() => {
    if (workflowStep === 2 && visibleFields.length > 0) {
      reset({
        field_values: buildDefaultValues(visibleFields)
      });
    }
  }, [workflowStep, templateData?.templateId, reset]);

  // Calculations for Step 3 Mapping Statuses
  const mappedFieldValues = Object.values(columnMapping).filter(Boolean);
  const duplicateFieldValues = new Set(
    mappedFieldValues.filter((v, i) => mappedFieldValues.indexOf(v) !== i)
  );
  const unmappedRequiredFields = visibleFields.filter((f: any) => f.required && !mappedFieldValues.includes(f.field_id));
  const hasUnmappedRequired = unmappedRequiredFields.length > 0;

  const totalColumnsCount = parsedHeaders.length;
  const mappedColumnsCount = mappedFieldValues.length;
  const columnsRequireAttention = totalColumnsCount - mappedColumnsCount;

  // Mutations
  const createSingleRecordMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiClient.post('/api/mobile/records/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["records"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      ]);
      onClose();
      onSuccess();
    },
    onError: (err: any) => {
      const responseData = err?.response?.data;
      if (responseData && typeof responseData === 'object') {
        const errSource = responseData.errors || responseData;
        Object.entries(errSource).forEach(([key, msg]) => {
          const text = Array.isArray(msg) ? String(msg[0]) : String(msg);
          if (visibleFields.some((f: any) => f.field_id === key)) {
            setError(`field_values.${key}` as any, { message: text });
          } else {
            setSubmitError(text);
          }
        });
      } else {
        setSubmitError('Failed to save record.');
      }
    }
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiClient.post('/api/mobile/records/bulk-upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },
    onSuccess: async (data, variables) => {
      const isDryRun = variables.get('dry_run') === 'true';
      if (isDryRun) {
        setPreviewMetrics({
          total_rows: data?.total_rows || 0,
          matched_count: data?.matched_count || 0,
          unmatched_count: data?.unmatched_count || 0,
          duplicate_count: data?.duplicate_count || 0,
          invalid_count: data?.invalid_count || 0
        });
        setValidationResult({
          successCount: data?.success_count || 0,
          failedRows: data?.errors || data?.failed_rows || [],
          isValidated: true
        });
        setWorkflowStep(4);
      } else {
        setBulkResult({
          successCount: data?.success_count || 0,
          failedRows: data?.errors || data?.failed_rows || []
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["records"] }),
          queryClient.invalidateQueries({ queryKey: ["dashboard"] })
        ]);
        setWorkflowStep(5);
      }
    },
    onError: (err: any) => {
      setSubmitError(err?.response?.data?.detail || err?.message || 'Bulk upload failed.');
    }
  });

  const handleContinue = () => {
    if (!selectedGroup || !selectedSubGroup) return;
    setWorkflowStep(2);
  };

  // Excel template downloader
  const handleDownloadTemplate = () => {
    try {
      const headers = visibleFields.map((f: any) => f.label);
      const ws = XLSX.utils.aoa_to_sheet([headers]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${labels.recordLabel}_Bulk_Upload_Template.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to generate Excel template.');
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    e.target.value = ""; // Reset value so same file can be selected again
    
    if (!selectedFile) return;
    setSubmitError(null);

    // Validate file extensions
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['xlsx', 'xls', 'csv'];
    if (!extension || !validExtensions.includes(extension)) {
      setSubmitError('Unsupported file type. Upload an Excel or CSV file.');
      setBulkFile(null);
      return;
    }

    setBulkFile(selectedFile);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      if (workbook.SheetNames.length === 0) throw new Error('Spreadsheet is empty.');
      
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
      if (rows.length === 0) throw new Error('Spreadsheet contains no rows.');
      
      const headers = Object.keys(rows[0]);
      setParsedHeaders(headers);
      setParsedData(rows);

      // Pre-match and auto-map
      const defaultMatch = matchableFields.find((f: any) =>
        headers.some((h: any) => normalizeColumnName(h) === normalizeColumnName(f.label) || normalizeColumnName(h) === normalizeColumnName(f.field_id))
      );
      if (defaultMatch) setMatchingField(defaultMatch.field_id);

      const newMapping: Record<string, string> = {};
      headers.forEach(header => {
        const normHeader = normalizeColumnName(header);
        const match = matchableFields.find((f: any) => 
          normalizeColumnName(f.label) === normHeader || 
          normalizeColumnName(f.field_id) === normHeader
        );
        if (match) {
          newMapping[header] = match.field_id;
        } else {
          newMapping[header] = '';
        }
      });
      setColumnMapping(newMapping);
      setWorkflowStep(3);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to parse file.');
      setBulkFile(null);
    }
  };

  const handleCreateMappedCSV = (): File => {
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
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    return new File([blob], bulkFile ? bulkFile.name.replace(/\.[^/.]+$/, "") + "_mapped.csv" : "mapped.csv", { type: 'text/csv' });
  };

  const runBulkValidation = () => {
    setSubmitError(null);
    const mappedFile = handleCreateMappedCSV();
    const formData = new FormData();
    formData.append('file', mappedFile);
    formData.append('dry_run', 'true');
    formData.append('mode', uploadMode);
    formData.append('matching_field', matchingField);
    formData.append('group', selectedGroup);
    formData.append('sub_group', selectedSubGroup);
    formData.append('template', templateData?.templateId || '');

    bulkUploadMutation.mutate(formData);
  };

  const runBulkImport = () => {
    setSubmitError(null);
    const mappedFile = handleCreateMappedCSV();
    const formData = new FormData();
    formData.append('file', mappedFile);
    formData.append('dry_run', 'false');
    formData.append('mode', uploadMode);
    formData.append('matching_field', matchingField);
    formData.append('group', selectedGroup);
    formData.append('sub_group', selectedSubGroup);
    formData.append('template', templateData?.templateId || '');

    bulkUploadMutation.mutate(formData);
  };

  const handleSaveSingleRecord = async (values: any) => {
    setSubmitError(null);
    const formData = new FormData();
    formData.append('group', selectedGroup);
    formData.append('sub_group', selectedSubGroup);
    formData.append('template', templateData?.templateId || '');

    // Normalize field values
    const normalizedValues = Object.fromEntries(
      Object.entries(values.field_values).map(([k, v]) => {
        const fConfig = visibleFields.find((f: any) => f.field_id === k);
        if (fConfig?.type === 'number') {
          return [k, v === '' || v === undefined ? null : Number(v)];
        }
        if (fConfig?.type === 'checkbox' || fConfig?.type === 'boolean') {
          return [k, Boolean(v)];
        }
        return [k, v === undefined ? null : v];
      })
    );
    formData.append('custom_data', JSON.stringify(normalizedValues));
    formData.append('data', JSON.stringify(normalizedValues));

    // Handle photo
    const photoField = visibleFields.find((f: any) => f.type === 'image' || f.type === 'photo' || f.field_id === 'photo');
    if (photoField) {
      const canvas = canvasRef.current;
      if (canvas) {
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', 0.95);
        });
        if (blob) {
          const photoBlobFile = new File([blob], singlePhotoFile?.name || 'photo.jpg', { type: 'image/jpeg' });
          formData.append('photo', photoBlobFile);
        } else if (singlePhotoFile) {
          formData.append('photo', singlePhotoFile);
        }
      } else if (singlePhotoFile) {
        formData.append('photo', singlePhotoFile);
      }
    }

    createSingleRecordMutation.mutate(formData);
  };

  const handleBackAction = () => {
    if (lockGroup && lockSubgroup) {
      onClose();
      if (onOpenChange) onOpenChange(false);
    } else {
      setWorkflowStep(1);
    }
  };

  // Error and Warning States Layout Renderer
  const renderTemplateStatus = () => {
    const organizationId = user?.organization_id || '';
    if (!organizationId) {
      return (
        <div className="space-y-4 py-6 text-center text-xs font-semibold text-rose-500">
          Organization context could not be loaded.
        </div>
      );
    }

    if (isLoadingTemplate) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs text-slate-500 font-bold">Loading form fields...</p>
        </div>
      );
    }
    if (templateFieldsQuery.isError) {
      return (
        <div className="space-y-4 py-6">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-700 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Unable to load template fields.</p>
              <p className="mt-1 text-rose-600">Please verify connection or try again.</p>
            </div>
          </div>
          <button type="button" onClick={() => templateFieldsQuery.refetch()} className="h-9 px-4 bg-white border border-[#DFE4EA] hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer">
            Try Again
          </button>
        </div>
      );
    }
    if (templateFieldsQuery.isSuccess && !hasTemplate) {
      return (
        <div className="space-y-4 py-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800 text-xs">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Template Required</p>
              <p className="mt-1 text-amber-600">No card template has been assigned to this Group/Subgroup. Please contact your administrator.</p>
            </div>
          </div>
          <button type="button" onClick={handleBackAction} className="h-9 px-4 bg-white border border-[#DFE4EA] hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer">
            OK
          </button>
        </div>
      );
    }
    if (templateFieldsQuery.isSuccess && !hasVisibleFields) {
      return (
        <div className="space-y-4 py-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800 text-xs">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">No fields have been configured for this template.</p>
              <p className="mt-1 text-amber-600">Please configure template fields before adding records.</p>
            </div>
          </div>
          <button type="button" onClick={handleBackAction} className="h-9 px-4 bg-white border border-[#DFE4EA] hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer">
            OK
          </button>
        </div>
      );
    }
    return null;
  };

  // Close modal on backdrop click or escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !createSingleRecordMutation.isPending && !bulkUploadMutation.isPending) {
        onClose();
        if (onOpenChange) onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, onOpenChange, createSingleRecordMutation.isPending, bulkUploadMutation.isPending]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !createSingleRecordMutation.isPending && !bulkUploadMutation.isPending) {
      onClose();
      if (onOpenChange) onOpenChange(false);
    }
  };

  if (!open) return null;

  const showStatusOverlay = isLoadingTemplate || templateFieldsQuery.isError || !hasTemplate || !hasVisibleFields;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-[calc(100vw-24px)] max-w-3xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto">
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-[#DFE4EA] flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-[#0B0F19]" style={{ fontFamily: 'Sora, sans-serif' }}>
              Add {labels.recordLabel}
            </h3>
            {recordType === 'bulk' && workflowStep > 1 && (
              <p className="text-[10px] text-slate-500 mt-0.5">Step {workflowStep - 1} of 4</p>
            )}
          </div>
          <button 
            type="button" 
            aria-label="Close"
            onClick={() => {
              onClose();
              if (onOpenChange) onOpenChange(false);
            }}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 space-y-4">
          {submitError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="font-semibold">{submitError}</div>
            </div>
          )}

          {/* STEP 1: Select Mode, Group & Subgroup */}
          {workflowStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div 
                  onClick={() => setRecordType('single')}
                  className={`border rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    recordType === 'single'
                      ? 'border-[#2563EB] bg-blue-50/40 shadow-xs'
                      : 'border-[#DFE4EA] hover:border-slate-300 bg-white'
                  }`}
                >
                  <User size={20} className={recordType === 'single' ? 'text-[#2563EB]' : 'text-slate-400'} />
                  <span className={`text-xs font-bold mt-2 ${recordType === 'single' ? 'text-[#2563EB]' : 'text-slate-700'}`}>Single Record</span>
                  <span className="text-[10px] text-slate-400 mt-1 leading-tight hidden sm:inline">Add a single record using the dynamic form</span>
                </div>
                <div 
                  onClick={() => setRecordType('bulk')}
                  className={`border rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    recordType === 'bulk'
                      ? 'border-[#2563EB] bg-blue-50/40 shadow-xs'
                      : 'border-[#DFE4EA] hover:border-slate-300 bg-white'
                  }`}
                >
                  <Users size={20} className={recordType === 'bulk' ? 'text-[#2563EB]' : 'text-slate-400'} />
                  <span className={`text-xs font-bold mt-2 ${recordType === 'bulk' ? 'text-[#2563EB]' : 'text-slate-700'}`}>Bulk Upload</span>
                  <span className="text-[10px] text-slate-400 mt-1 leading-tight hidden sm:inline">Upload multiple records via Excel template</span>
                </div>
              </div>

              {/* Group & Subgroup dropdowns */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Select {labels.groupLabel} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="group"
                    value={selectedGroup}
                    disabled={isGroupsLoading}
                    onChange={(e) => {
                      setSelectedGroup(e.target.value);
                      setSelectedSubGroup('');
                    }}
                    className="w-full h-10 px-3 border border-[#DFE4EA] rounded-xl text-xs font-semibold text-[#0B0F19] focus:outline-none focus:border-[#2563EB] bg-white cursor-pointer"
                  >
                    <option value="">Select {labels.groupLabel}</option>
                    {groupsList.map((g: any) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Select {labels.subgroupLabel} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="sub_group"
                    value={selectedSubGroup}
                    disabled={!selectedGroup || isSubgroupsLoading}
                    onChange={(e) => setSelectedSubGroup(e.target.value)}
                    className="w-full h-10 px-3 border border-[#DFE4EA] rounded-xl text-xs font-semibold text-[#0B0F19] focus:outline-none focus:border-[#2563EB] bg-white cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select {labels.subgroupLabel}</option>
                    {subgroupsList.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[#DFE4EA] flex justify-end">
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!selectedGroup || !selectedSubGroup}
                  className="w-full sm:w-auto h-9 px-4 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* SINGLE RECORD FORM */}
          {workflowStep === 2 && recordType === 'single' && (
            showStatusOverlay ? (
              renderTemplateStatus()
            ) : (
              <form 
                id="add-record-form" 
                onSubmit={(e) => handleSubmit(handleSaveSingleRecord)(e)} 
                className="space-y-4" 
                noValidate
              >
                {lockGroup && lockSubgroup && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl mb-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {labels.groupLabel}
                      </label>
                      <input
                        type="text"
                        value={groupsList.find((g: any) => String(g.id) === String(selectedGroup))?.name || selectedGroup || '—'}
                        disabled
                        className="w-full h-10 px-3 border border-[#DFE4EA] rounded-xl text-xs font-semibold text-slate-500 bg-slate-100 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {labels.subgroupLabel}
                      </label>
                      <input
                        type="text"
                        value={subgroupsList.find((s: any) => String(s.id) === String(selectedSubGroup))?.name || selectedSubGroup || '—'}
                        disabled
                        className="w-full h-10 px-3 border border-[#DFE4EA] rounded-xl text-xs font-semibold text-slate-500 bg-slate-100 cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {visibleFields.map((f: any) => {
                    const isRequired = f.required;
                    const fieldError = (errors.field_values as any)?.[f.field_id];
                    const hasError = !!fieldError;

                    if (f.type === 'image' || f.type === 'photo' || f.field_id === 'photo') {
                      return (
                        <div key={f.field_id} className="sm:col-span-2 space-y-1">
                          <PhotoUploader 
                            canvasRef={canvasRef}
                            onPhotoSelected={(file) => setSinglePhotoFile(file)}
                          />
                        </div>
                      );
                    }

                    const isTextarea = f.type === 'textarea';
                    const inputType = f.type === 'email' ? 'email' : f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text';

                    return (
                      <div key={f.field_id} className={`space-y-1 ${isTextarea ? 'sm:col-span-2' : ''}`}>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {f.label} {isRequired && <span className="text-rose-500">*</span>}
                        </label>
                        {isTextarea ? (
                          <textarea
                            id={f.field_id}
                            {...register(`field_values.${f.field_id}` as any, { required: isRequired ? `${f.label} is required.` : false })}
                            placeholder={f.placeholder || `Enter ${f.label.toLowerCase()}`}
                            rows={3}
                            className={`w-full p-3 border rounded-xl text-xs font-semibold text-[#0B0F19] focus:outline-none transition-all ${
                              hasError ? 'border-rose-500 focus:border-rose-500' : 'border-[#DFE4EA] focus:border-[#2563EB]'
                            }`}
                          />
                        ) : f.type === 'select' ? (
                          <select
                            id={f.field_id}
                            {...register(`field_values.${f.field_id}` as any, { required: isRequired ? `${f.label} is required.` : false })}
                            className={`w-full h-10 px-3 border rounded-xl text-xs font-semibold text-[#0B0F19] focus:outline-none transition-all bg-white cursor-pointer ${
                              hasError ? 'border-rose-500 focus:border-rose-500' : 'border-[#DFE4EA] focus:border-[#2563EB]'
                            }`}
                          >
                            <option value="">Select {f.label}</option>
                            {f.options?.map((opt: any) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : f.type === 'checkbox' || f.type === 'boolean' ? (
                          <div className="flex items-center h-10">
                            <input
                              id={f.field_id}
                              type="checkbox"
                              {...register(`field_values.${f.field_id}` as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-xs font-semibold text-[#0B0F19]">{f.label}</span>
                          </div>
                        ) : (
                          <input
                            id={f.field_id}
                            type={inputType}
                            {...register(`field_values.${f.field_id}` as any, { required: isRequired ? `${f.label} is required.` : false })}
                            placeholder={f.placeholder || `Enter ${f.label.toLowerCase()}`}
                            className={`w-full h-10 px-3 border rounded-xl text-xs font-semibold text-[#0B0F19] focus:outline-none transition-all ${
                              hasError ? 'border-rose-500 focus:border-rose-500' : 'border-[#DFE4EA] focus:border-[#2563EB]'
                            }`}
                          />
                        )}
                        {hasError && (
                          <p className="text-[10px] font-semibold text-rose-500 mt-1">{String(fieldError.message)}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-[#DFE4EA] flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setWorkflowStep(1)}
                    className="w-full sm:w-auto h-9 px-4 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl border border-[#DFE4EA] transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isLoadingTemplate ||
                      templateFieldsQuery.isError ||
                      !hasTemplate ||
                      !hasVisibleFields ||
                      createSingleRecordMutation.isPending
                    }
                    className="w-full sm:w-auto h-9 px-4 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {createSingleRecordMutation.isPending ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save {labels.recordLabel}</span>
                    )}
                  </button>
                </div>
              </form>
            )
          )}

          {/* BULK UPLOAD / UPDATE STEP 2: Download Template & Drop File */}
          {recordType === 'bulk' && workflowStep === 2 && (
            showStatusOverlay ? (
              renderTemplateStatus()
            ) : (
              <div className="space-y-4">
                {lockGroup && lockSubgroup && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl mb-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {labels.groupLabel}
                      </label>
                      <input
                        type="text"
                        value={groupsList.find((g: any) => String(g.id) === String(selectedGroup))?.name || selectedGroup || '—'}
                        disabled
                        className="w-full h-10 px-3 border border-[#DFE4EA] rounded-xl text-xs font-semibold text-slate-500 bg-slate-100 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {labels.subgroupLabel}
                      </label>
                      <input
                        type="text"
                        value={subgroupsList.find((s: any) => String(s.id) === String(selectedSubGroup))?.name || selectedSubGroup || '—'}
                        disabled
                        className="w-full h-10 px-3 border border-[#DFE4EA] rounded-xl text-xs font-semibold text-slate-500 bg-slate-100 cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                {/* Two equal-width cards for Create vs Update */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <BulkUploadCard
                    recordLabelPlural={labels.recordLabelPlural}
                    onDownloadTemplate={handleDownloadTemplate}
                    onFileSelect={(e) => {
                      setUploadMode('create');
                      handleFileChange(e);
                    }}
                    selectedFile={uploadMode === 'create' ? bulkFile : null}
                    fileSizeFormatted={uploadMode === 'create' && bulkFile ? formatFileSize(bulkFile.size) : undefined}
                  />

                  <BulkUpdateCard
                    recordLabelPlural={labels.recordLabelPlural}
                    onDownloadUpdateTemplate={handleDownloadTemplate}
                    onFileSelect={(e) => {
                      setUploadMode('update');
                      handleFileChange(e);
                    }}
                    selectedFile={uploadMode === 'update' ? bulkFile : null}
                    fileSizeFormatted={uploadMode === 'update' && bulkFile ? formatFileSize(bulkFile.size) : undefined}
                  />
                </div>

                <div className="pt-4 border-t border-[#DFE4EA] flex justify-start">
                  <button type="button" onClick={() => setWorkflowStep(1)} className="h-9 px-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer">Back</button>
                </div>
              </div>
            )
          )}

          {/* BULK UPLOAD STEP 3: Mobile-First Responsive Mapping */}
          {recordType === 'bulk' && workflowStep === 3 && (
            <div className="space-y-4">
              {/* 3. Uploaded File Summary Card */}
              <div 
                className="flex min-w-0 items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3"
                title={bulkFile?.name || ''}
              >
                <div className="h-9 w-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{bulkFile?.name}</p>
                  <p className="text-xs text-slate-500">Found {totalColumnsCount} columns and {parsedData.length} rows</p>
                </div>
              </div>

              {/* 4. Unique Identifier Section */}
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Match Records By (Unique Identifier)
                </label>
                <select 
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium focus:outline-none" 
                  value={matchingField} 
                  onChange={e => setMatchingField(e.target.value)}
                >
                  <option value="">-- Select Unique Field --</option>
                  {matchableFields.map((f: any) => (
                    <option key={f.field_id} value={f.field_id}>{f.label} ({f.field_id})</option>
                  ))}
                </select>
              </div>

              {/* 10. Mapping Status Summary Header */}
              <div className="flex justify-between items-center py-1">
                <span className="text-xs font-medium text-slate-500">
                  {mappedColumnsCount} of {totalColumnsCount} columns mapped
                </span>
                {columnsRequireAttention > 0 && (
                  <span className="text-xs font-semibold text-amber-600">
                    {columnsRequireAttention} columns require attention
                  </span>
                )}
              </div>

              {/* Warnings Block */}
              {hasUnmappedRequired && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex gap-2 items-start">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Required fields not mapped:</p>
                    <p className="mt-0.5 text-amber-700">{unmappedRequiredFields.map((f: any) => `${f.label} *`).join(', ')}</p>
                  </div>
                </div>
              )}

              {duplicateFieldValues.size > 0 && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex gap-2 items-start">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Duplicate mapping violation:</p>
                    <p className="mt-0.5 text-rose-700">
                      Multiple columns are mapped to the same template fields. Please resolve mappings.
                    </p>
                  </div>
                </div>
              )}

              {/* 5. Mobile Mapping Cards (< 640px) */}
              <div className="space-y-3 sm:hidden">
                {parsedHeaders.map((column) => {
                  const mappedKey = columnMapping[column] || '';
                  const isDuplicate = mappedKey && duplicateFieldValues.has(mappedKey);
                  return (
                    <div
                      key={column}
                      className={`rounded-xl border bg-white p-3 space-y-2 transition-colors ${
                        isDuplicate ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
                      }`}
                    >
                      <div>
                        <p className="text-[11px] font-semibold uppercase text-slate-400">Excel Column</p>
                        <p className="mt-0.5 break-words text-sm font-semibold text-slate-800">{column}</p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase text-slate-400">Template Field</p>
                        <select 
                          className="mt-1.5 h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none"
                          value={mappedKey} 
                          onChange={(e) => setColumnMapping({...columnMapping, [column]: e.target.value})}
                        >
                          <option value="">-- Ignore --</option>
                          {visibleFields.map((f: any) => (
                            <option key={f.field_id} value={f.field_id}>
                              {f.label} {f.required ? '*' : ''} ({f.field_id})
                            </option>
                          ))}
                        </select>
                        {isDuplicate && (
                          <p className="text-[10px] text-rose-500 font-semibold mt-1">
                            {visibleFields.find((f: any) => f.field_id === mappedKey)?.label} is already mapped to another Excel column.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 6. Desktop Mapping Table (>= 640px breakpoint) */}
              <div className="hidden overflow-hidden rounded-xl border border-slate-200 sm:block bg-white">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[42%]" />
                    <col className="w-[58%]" />
                  </colgroup>
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Excel Column</th>
                      <th className="px-4 py-3 text-left">Template Field</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedHeaders.map((column) => {
                      const mappedKey = columnMapping[column] || '';
                      const isDuplicate = mappedKey && duplicateFieldValues.has(mappedKey);
                      return (
                        <tr key={column} className={`hover:bg-slate-50/50 ${isDuplicate ? 'bg-rose-50/10' : ''}`}>
                          <td className="px-4 py-3 align-middle text-sm font-medium text-slate-700 break-words">{column}</td>
                          <td className="px-4 py-3 align-middle">
                            <select 
                              className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none"
                              value={mappedKey} 
                              onChange={(e) => setColumnMapping({...columnMapping, [column]: e.target.value})}
                            >
                              <option value="">-- Ignore --</option>
                              {visibleFields.map((f: any) => (
                                <option key={f.field_id} value={f.field_id}>
                                  {f.label} {f.required ? '*' : ''} ({f.field_id})
                                </option>
                              ))}
                            </select>
                            {isDuplicate && (
                              <p className="text-[10px] text-rose-500 font-semibold mt-1">
                                {visibleFields.find((f: any) => f.field_id === mappedKey)?.label} is already mapped to another column.
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Sticky footer attached below at root modal level */}
            </div>
          )}

          {/* BULK UPLOAD STEP 4: Validation Results */}
          {recordType === 'bulk' && workflowStep === 4 && previewMetrics && (
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preview Import Statistics</div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center"><p className="text-slate-550 text-[9px] uppercase font-bold tracking-wider">Total</p><p className="text-base font-black text-slate-800 mt-1">{previewMetrics.total_rows}</p></div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-center"><p className="text-blue-600 text-[9px] uppercase font-bold tracking-wider">Matched</p><p className="text-base font-black text-blue-900 mt-1">{previewMetrics.matched_count}</p></div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center"><p className="text-emerald-600 text-[9px] uppercase font-bold tracking-wider">New</p><p className="text-base font-black text-emerald-950 mt-1">{previewMetrics.unmatched_count}</p></div>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center"><p className="text-amber-600 text-[9px] uppercase font-bold tracking-wider">Dupes</p><p className="text-base font-black text-amber-950 mt-1">{previewMetrics.duplicate_count}</p></div>
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-center"><p className="text-rose-600 text-[9px] uppercase font-bold tracking-wider">Invalid</p><p className="text-base font-black text-rose-950 mt-1">{previewMetrics.invalid_count}</p></div>
              </div>

              {validationResult?.failedRows?.length > 0 ? (
                <div className="space-y-2">
                  <h5 className="font-bold text-[10px] text-rose-500 uppercase tracking-wider">Row Validation Errors ({validationResult.failedRows.length})</h5>
                  <div className="max-h-36 overflow-y-auto text-[10px] bg-rose-50 border border-rose-100 p-3 rounded-lg space-y-1 font-mono text-rose-700">
                    {validationResult.failedRows.map((fr: any, idx: number) => (
                      <div key={idx} className="flex gap-1.5 border-b border-rose-100/50 pb-1 last:border-0">
                        <span className="font-extrabold bg-rose-200/50 px-1 rounded shrink-0">Row {fr.row || fr.row_num || idx + 1}:</span>
                        <span>{Array.isArray(fr.errors) ? fr.errors.join(', ') : (fr.errors || 'Validation error')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={14} className="shrink-0" />
                  All rows passed validation checks. Ready to import.
                </div>
              )}
            </div>
          )}

          {/* BULK UPLOAD STEP 5: Success Results */}
          {recordType === 'bulk' && workflowStep === 5 && bulkResult && (
            <div className="space-y-6 py-4">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-5 flex items-start gap-3 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                <div>
                  <p className="font-extrabold uppercase text-[11px] tracking-wider text-emerald-700">Import Process Finished</p>
                  <p className="mt-1 text-slate-700 font-medium">Successfully processed <strong className="text-emerald-700 font-bold">{bulkResult.successCount}</strong> records.</p>
                </div>
              </div>

              {bulkResult.failedRows?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Skipped/Failed Rows ({bulkResult.failedRows.length})</h4>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[180px] overflow-y-auto bg-slate-50 p-2 space-y-1">
                    {bulkResult.failedRows.map((row: any, idx: number) => (
                      <div key={idx} className="py-1.5 px-2 text-[10px] font-medium text-slate-600 flex items-start gap-2">
                        <span className="font-bold text-rose-600 bg-rose-50 px-1 rounded-sm shrink-0">Row {row.row || row.row_num || idx + 1}</span>
                        <span>{Array.isArray(row.errors) ? row.errors.join(', ') : (row.errors || 'Validation error')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 14. Sticky Footer (attached at root level of popup modal layout) */}
        {recordType === 'bulk' && workflowStep >= 3 && (
          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {workflowStep === 3 && (
                <>
                  <button 
                    type="button" 
                    onClick={() => setWorkflowStep(2)} 
                    className="w-full sm:w-auto h-11 rounded-xl border border-slate-200 hover:bg-slate-50 px-5 text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button 
                    type="button" 
                    onClick={runBulkValidation} 
                    disabled={
                      bulkUploadMutation.isPending || 
                      !matchingField || 
                      hasUnmappedRequired || 
                      duplicateFieldValues.size > 0
                    } 
                    className="w-full sm:w-auto bg-[#2563EB] text-white hover:bg-blue-700 h-11 rounded-xl px-5 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    {bulkUploadMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                    <span>Validate & Continue</span>
                  </button>
                </>
              )}

              {workflowStep === 4 && (
                <>
                  <button 
                    type="button" 
                    onClick={() => setWorkflowStep(3)} 
                    className="w-full sm:w-auto h-11 rounded-xl border border-slate-200 hover:bg-slate-50 px-5 text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button 
                    type="button" 
                    onClick={runBulkImport} 
                    disabled={bulkUploadMutation.isPending} 
                    className="w-full sm:w-auto bg-[#2563EB] hover:bg-blue-700 text-white h-11 rounded-xl px-5 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    {bulkUploadMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                    <span>Confirm Import</span>
                  </button>
                </>
              )}

              {workflowStep === 5 && (
                <button 
                  onClick={onClose} 
                  className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
