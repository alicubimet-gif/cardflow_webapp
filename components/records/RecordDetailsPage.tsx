'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, User, Calendar, Mail, Phone, Clock, ShieldCheck, 
  Trash2, Edit, AlertCircle, RotateCw, Shield, Loader2, Download, X
} from 'lucide-react';
import { AuthService } from '@/services/auth-service';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { IdCardPreview } from './IdCardPreview';
import { RecordForm } from './RecordForm';
import { PhotoEditorModal } from './PhotoEditorModal';
import * as recordService from '@/services/record-service';
import { useDashboard } from '@/context/dashboard-context';
import { useDialog } from '@/hooks/useDialog';
import { useToast } from '@/hooks/useToast';

interface RecordDetailsPageProps {
  record: any;
  onBack: () => void;
  isAdmin: boolean;
  isSchool: boolean;
  onEdit: (rec: any) => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onCorrection: (id: string, note: string) => Promise<void>;
  onSubmit: (id: string) => Promise<void>;
  onRefreshRecord: (id: string) => Promise<any>;
  hasTemplate?: boolean;
  templateFields?: any[];
}

export function RecordDetailsPage({
  record: initialRecord,
  onBack,
  isAdmin,
  isSchool,
  onEdit,
  onApprove,
  onReject,
  onCorrection,
  onSubmit,
  onRefreshRecord,
  hasTemplate = true,
  templateFields = []
}: RecordDetailsPageProps) {
  const [record, setRecord] = useState(initialRecord);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const { 
    setIsSubscriberModalOpen, 
    setSubscriberInfo,
    classesList,
    divisionsList,
    branchesList,
    departmentsList,
    fetchDashboardData
  } = useDashboard();

  const dialog = useDialog();
  const { toast } = useToast();

  const handleLocalError = (err: any, fallbackMsg: string) => {
    if (err?.response?.data?.code === 'SUBSCRIBER_ACTION_REQUIRED') {
      setSubscriberInfo(err.response.data.subscriber);
      setIsSubscriberModalOpen(true);
    } else {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || fallbackMsg;
      if (msg) {
        dialog.alert({ title: 'Action Failed', message: msg, variant: 'error' });
      }
    }
  };
  
  // Photo management state
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Template preview modal state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewSide, setPreviewSide] = useState<'FRONT' | 'BACK'>('FRONT');

  // Reject reason modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Correction modal state
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionNote, setCorrectionNote] = useState('');
  const [isCorrecting, setIsCorrecting] = useState(false);

  // Approve confirmation modal state
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Sync state if initialRecord changes
  useEffect(() => {
    setRecord(initialRecord);
  }, [initialRecord]);

  // Teacher-friendly inline form/editor modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditModalLoading, setIsEditModalLoading] = useState(false);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);

  // Container ref + state for container-width-driven responsive card scaling
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [containerDisplayWidth, setContainerDisplayWidth] = useState<number>(320);

  const handleOpenEditModal = async () => {
    setIsEditModalLoading(true);
    try {
      const fullRecord = await recordService.getRecord(record.id);
      setRecord(fullRecord);
      setIsEditModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch full record', err);
      dialog.alert({ title: 'Error', message: 'Unable to load the record. Please try again.', variant: 'error' });
    } finally {
      setIsEditModalLoading(false);
    }
  };

  const handleSaveEdit = async (payload: any, processedBlob: Blob | null) => {
    try {
      const recordType = record.record_type || (isSchool ? 'student' : 'employee');
      const mappedType = recordType === 'staff' ? 'school-staff' : recordType;
      
      const payloadWithOrg = {
        ...payload,
        record_type: mappedType
      };
      
      const updated = await recordService.patchRecord(record.id, payloadWithOrg);
      setRecord(updated);
      await loadPreview();
      setIsEditModalOpen(false);
      await fetchDashboardData();
      toast('Record updated successfully.', 'success');
    } catch (err: any) {
      console.error('Failed to update record details:', err);
      dialog.alert({ title: 'Save Failed', message: err?.response?.data?.message || err?.message || 'Failed to save changes.', variant: 'error' });
    }
  };

  // Load preview data when component mounts or record updates
  const loadPreview = async () => {
    const recordType = record.record_type || (isSchool ? 'student' : 'employee');
    const mappedType = recordType === 'staff' ? 'school-staff' : recordType;
    
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const data = await AuthService.getCardPreview(mappedType as any, record.id);
      setPreviewData(data);
      if (!data || !data.template_version) {
        setPreviewError('No template assigned.');
      }
    } catch (err: any) {
      console.error('[Preview] Failed to load card preview:', err);
      if (err?.response?.status === 404) {
        setPreviewError('Record not found.');
      } else {
        setPreviewError('No template assigned.');
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (record) {
      loadPreview();
    }
  }, [record, isSchool]);

  // ResizeObserver: keep containerDisplayWidth in sync with the card preview container
  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Subtract inner white-card border padding (p-2 = 8px × 2 = 16px)
        setContainerDisplayWidth(Math.max(180, entry.contentRect.width - 16));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleRefresh = async () => {
    try {
      const updated = await onRefreshRecord(record.id);
      if (updated) {
        setRecord(updated);
      }
    } catch (err) {
      console.error('Failed to refresh record:', err);
    }
  };

  // Photo handlers
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPhotoUploading(true);
    try {
      const formData = new FormData();
      const recordType = record.record_type || (isSchool ? 'student' : 'employee');
      formData.append('record_type', recordType === 'staff' ? 'school-staff' : recordType);
      formData.append('record_id', record.id);
      formData.append('photo', file);

      await recordService.uploadPhoto(formData);
      await handleRefresh();
    } catch (err) {
      console.error('Failed to upload photo:', err);
      dialog.alert({ title: 'Upload Failed', message: 'Failed to upload/replace photo.', variant: 'error' });
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const handlePhotoRemove = async () => {
    const confirmed = await dialog.confirm({ title: 'Remove Photo', message: 'Are you sure you want to remove the photo?', variant: 'danger' });
    if (!confirmed) return;
    
    setIsPhotoUploading(true);
    try {
      // Send empty string for photo to clear it via partial PATCH update
      const updated = await recordService.patchRecord(record.id, { photo: '' });
      setRecord(updated);
      await handleRefresh();
    } catch (err) {
      console.error('Failed to remove photo:', err);
      dialog.alert({ title: 'Remove Failed', message: 'Failed to remove photo.', variant: 'error' });
    } finally {
      setIsPhotoUploading(false);
    }
  };

  // Submit Reject modal handler
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;

    setIsRejecting(true);
    try {
      await onReject(record.id, rejectReason);
      setIsRejectModalOpen(false);
      setRejectReason('');
      await handleRefresh();
    } catch (err) {
      console.error('Rejection failed:', err);
    } finally {
      setIsRejecting(false);
    }
  };

  // Submit Correction modal handler
  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionNote.trim()) return;

    setIsCorrecting(true);
    try {
      await onCorrection(record.id, correctionNote);
      setIsCorrectionModalOpen(false);
      setCorrectionNote('');
      await handleRefresh();
    } catch (err) {
      console.error('Correction request failed:', err);
    } finally {
      setIsCorrecting(false);
    }
  };

  // Download PDF Card
  const handleDownloadPDF = async () => {
    try {
      const data = await recordService.downloadPDF(record.card_id || record.id);
      if (data && data.file_url) {
        const resolvedUrl = recordService.resolvePhotoUrl(data.file_url);
        const response = await fetch(resolvedUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${record.name || record.full_name || record.student_name || record.employee_name || 'id_card'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        await handleRefresh();
      } else {
        dialog.alert({ title: 'Download Failed', message: 'Failed to get download URL.', variant: 'error' });
      }
    } catch (err: any) {
      console.error('Failed to download PDF:', err);
      handleLocalError(err, 'Download failed. Please check credit balance.');
    }
  };

  if (!record) return null;

  const name = record.name || record.full_name || record.student_name || record.employee_name || 'Roster Record';
  const idNumber = record.admission_number || record.employee_id || '—';
  const status = record.approval_status || 'draft';
  const photoUrl = recordService.resolvePhotoUrl(record.photoUrl || record.profile_photo || record.photo || '');
  
  // Format dates
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const customData = record.custom_data || record.data || {};
  const fieldsToDisplay = (templateFields && templateFields.length > 0)
    ? templateFields
        .filter(f => !['qr_code', 'qrcode', 'barcode', 'photo', 'image', 'signature'].includes(f.type))
        .map(f => {
          const key = f.key || f.id;
          const val = record[key] ?? customData[key] ?? record.field_values?.[key] ?? '';
          return [key, val, f.label || key];
        })
    : Object.entries(customData)
        .filter(([key]) => {
          const normalizedKey = key.toLowerCase();
          return !['photo', 'profile_photo', 'photourl', 'photo_url', 'image', 'imagesrc', 'imageurl', 'assigned_divisions', 'assigned_departments'].includes(normalizedKey);
        })
        .map(([key, val]) => [key, val, key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())]);

  if (!isAdmin) {
    const templateVersion = previewData?.template_version;
    const isSingleSided = templateVersion
      ? String(templateVersion.canvas_json?.sides || templateVersion.sides || '2') === '1' ||
        String(templateVersion.canvas_json?.sides || templateVersion.sides || '').toLowerCase() === 'single' ||
        String(templateVersion.cardSides || '').toLowerCase() === 'single'
      : true;

    return (
      <div className="flex flex-col items-center w-full" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

        {/* ── Sticky top bar: back navigation + name + status ──────────── */}
        <div className="w-full bg-white/95 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-20" style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.06)' }}>
          <div className="max-w-lg mx-auto px-[10px] py-3 flex items-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
            <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
              <span className="font-extrabold text-sm text-slate-900 truncate">{name}</span>
              <StatusBadge status={status} />
            </div>
          </div>
        </div>

        {/* ── Page content ─────────────────────────────────────────────── */}
        <div className="w-full max-w-lg mx-auto px-[10px] pt-5 pb-16 space-y-4">

          {/* Section label + action buttons row */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              {isSchool ? 'Student Card' : 'Employee Card'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenEditModal}
                disabled={isEditModalLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.97] text-slate-800 text-[11px] font-extrabold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-75 disabled:cursor-wait"
              >
                {isEditModalLoading ? <Loader2 size={14} className="animate-spin" /> : <span>✏️</span>}
                <span>{isEditModalLoading ? 'Loading...' : 'Edit Details'}</span>
              </button>
              <button
                onClick={() => setIsPhotoEditorOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.97] text-white text-[11px] font-extrabold rounded-xl transition-all shadow-md cursor-pointer"
              >
                <span>📷</span>
                <span>Update Photo</span>
              </button>
            </div>
          </div>

          {/* Card preview — ref always present for ResizeObserver measurement */}
          <div ref={previewContainerRef} className="w-full">
            {previewLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 w-full bg-white rounded-3xl border border-slate-100" style={{ boxShadow: '0 1px 3px 0 rgba(0,0,0,0.06)' }}>
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                <p className="text-[10px] font-bold uppercase tracking-wider">Rendering ID Card...</p>
              </div>
            ) : previewError ? (
              <div className="w-full flex flex-col items-center justify-center py-16 px-6 bg-white border border-slate-100 rounded-3xl text-slate-400 text-center">
                <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                <span className="text-xs font-bold">{previewError}</span>
              </div>
            ) : templateVersion ? (
              <div className="space-y-5">

                {/* Front Card */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Front View</span>
                  <div className="w-full bg-white rounded-2xl border border-slate-150 p-2 flex justify-center overflow-hidden" style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.07)' }}>
                    <IdCardPreview
                      record={previewData?.record_data || record}
                      templateVersion={templateVersion}
                      side="FRONT"
                      displayWidth={containerDisplayWidth}
                    />
                  </div>
                </div>

                {/* Back Card (if double-sided) */}
                {!isSingleSided && (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Back View</span>
                    <div className="w-full bg-white rounded-2xl border border-slate-150 p-2 flex justify-center overflow-hidden" style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.07)' }}>
                      <IdCardPreview
                        record={previewData?.record_data || record}
                        templateVersion={templateVersion}
                        side="BACK"
                        displayWidth={containerDisplayWidth}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center py-16 bg-white border border-slate-100 rounded-3xl text-slate-400 text-center">
                <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                <span className="text-xs font-bold">No template assigned.</span>
              </div>
            )}
          </div>
        </div>

        {/* ── MODALS ──────────────────────────────────────────────────────── */}
        {isEditModalOpen && (
          <RecordForm
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSubmit={handleSaveEdit}
            editingRecord={record}
            requiredFields={templateFields}
            isSchool={isSchool}
            classesList={classesList}
            divisionsList={divisionsList}
            branchesList={branchesList}
            departmentsList={departmentsList}
            hidePhoto={true}
          />
        )}

        {isPhotoEditorOpen && (
          <PhotoEditorModal
            isOpen={isPhotoEditorOpen}
            onClose={() => setIsPhotoEditorOpen(false)}
            record={record}
            isSchool={isSchool}
            onSuccess={async () => {
              await handleRefresh();
              await loadPreview();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Hidden File Input for photo uploads */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handlePhotoChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Navigation Row */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to List</span>
        </button>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left Column (Record details and fields - Mobile: order-2, Desktop: order-1) */}
        <div className="flex-1 space-y-6 order-2 lg:order-1 w-full min-w-0">
          
          {/* Record Basic Info Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs flex items-center gap-4">
            {/* Photo Avatar slot */}
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm bg-slate-50 flex items-center justify-center shrink-0 group">
              {isPhotoUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white z-10">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              )}
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt={name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <User size={24} className="stroke-[1.5]" />
                </div>
              )}

              {/* Photo Actions Overlay */}
              {status !== 'approved' && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center text-[8px] font-bold text-white transition-opacity duration-200 cursor-pointer" onClick={handlePhotoClick}>
                  <span>Change</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight truncate">{name}</h3>
              <p className="text-[10px] font-mono font-bold text-slate-450 tracking-wider">ID: {idNumber}</p>
              <div className="mt-1">
                <StatusBadge status={status} />
              </div>
            </div>

            {/* Photo Action Buttons */}
            {status !== 'approved' && (
              <div className="flex flex-col gap-1 text-[9px]">
                <button 
                  onClick={handlePhotoClick}
                  disabled={isPhotoUploading}
                  className="px-2 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  {photoUrl ? 'Replace' : 'Upload'}
                </button>
                {photoUrl && (
                  <button 
                    onClick={handlePhotoRemove}
                    disabled={isPhotoUploading}
                    className="px-2 py-1 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Dynamic Record Data Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-50 pb-2">
              Record Data Fields
            </h4>
            
            {fieldsToDisplay.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No custom data fields are populated for this record.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fieldsToDisplay.map(([key, value, label]) => {
                  return (
                    <div key={key} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                        {String(label)}
                      </span>
                      <span className="text-xs font-bold text-slate-800 mt-1 block truncate font-sans">
                        {String(value || '—')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Stats Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-50 pb-2">
              Metadata Trail
            </h4>
            <div className="space-y-3 text-xs font-semibold text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Created Date</span>
                <span>{formatDate(record.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Updated Date</span>
                <span>{formatDate(record.updated_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Created By</span>
                <span className="truncate max-w-[60%]">{record.created_by_name || record.created_by?.email || 'System'}</span>
              </div>
            </div>
          </div>

          {/* Approval Logs & History Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-50 pb-2">
              Approval History
            </h4>

            {status === 'approved' && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-950 text-xs font-semibold flex items-start gap-3">
                <ShieldCheck className="text-emerald-600 mt-0.5 shrink-0" size={16} />
                <div>
                  <span className="font-extrabold block text-[10px] uppercase tracking-wider text-emerald-800">
                    Card Printing Approved
                  </span>
                  <div className="mt-2 space-y-1 text-emerald-900">
                    <p><span className="text-emerald-700 font-bold">Approved By:</span> {record.approved_by || record.approved_by_name || 'Organization Admin'}</p>
                    <p><span className="text-emerald-700 font-bold">Date & Time:</span> {record.approved_at ? new Date(record.approved_at).toLocaleString() : '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {status === 'rejected' && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-950 text-xs font-semibold flex items-start gap-3">
                <AlertCircle className="text-rose-600 mt-0.5 shrink-0" size={16} />
                <div>
                  <span className="font-extrabold block text-[10px] uppercase tracking-wider text-rose-800">
                    Card Printing Rejected
                  </span>
                  <div className="mt-2 space-y-1 text-rose-900">
                    <p><span className="text-rose-700 font-bold">Rejected By:</span> {record.rejected_by || 'Organization Admin'}</p>
                    <p><span className="text-rose-700 font-bold">Date & Time:</span> {record.rejected_at ? new Date(record.rejected_at).toLocaleString() : '—'}</p>
                    {record.rejection_reason && (
                      <p className="mt-2 p-2 bg-white/70 border border-rose-100 rounded-lg italic">
                        <span className="text-rose-800 font-extrabold not-italic block text-[9px] uppercase tracking-wide">Reason:</span>
                        {record.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {status === 'correction_required' && (
              <div className="p-4 bg-amber-50 border border-amber-250 rounded-xl text-amber-900 text-xs font-semibold flex items-start gap-3">
                <AlertCircle className="text-amber-600 mt-0.5 shrink-0" size={16} />
                <div>
                  <span className="font-extrabold block text-[10px] uppercase tracking-wider text-amber-800">
                    Correction Required
                  </span>
                  <div className="mt-2 space-y-1">
                    {record.correction_note && (
                      <p className="leading-relaxed p-2.5 bg-white/70 border border-amber-200 rounded-lg">
                        <span className="text-amber-800 font-extrabold block text-[9px] uppercase tracking-wide mb-0.5">Instructions:</span>
                        {record.correction_note}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {status !== 'approved' && status !== 'rejected' && status !== 'correction_required' && (
              <div className="flex items-center gap-2.5 p-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 text-xs">
                <Clock size={16} className="text-slate-400" />
                <span>No approval history is recorded yet for this record.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Card Preview and Actions - Mobile: order-1, Desktop: order-2) */}
        <div className="w-full lg:w-[420px] space-y-6 order-1 lg:order-2 shrink-0">
          
          {/* Card Preview Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Real Card Preview
                </h4>
                <span className="text-[9px] font-bold text-slate-400 block mt-0.5">
                  {previewData?.template_name || 'Assigned Layout'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleOpenEditModal}
                  disabled={isEditModalLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.97] text-slate-800 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer disabled:opacity-75 disabled:cursor-wait"
                >
                  {isEditModalLoading ? <Loader2 size={12} className="animate-spin" /> : <span>✏️</span>}
                  <span>{isEditModalLoading ? '...' : 'Edit'}</span>
                </button>
                <button
                  onClick={() => setIsPhotoEditorOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.97] text-white text-[10px] font-extrabold rounded-lg transition-all cursor-pointer"
                >
                  <span>📷</span>
                  <span>Photo</span>
                </button>
              </div>
            </div>
            
            {previewLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 w-full bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                <p className="text-[10px] font-bold uppercase tracking-wider">Rendering ID Card Preview...</p>
              </div>
            ) : previewError ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 w-full bg-slate-50 rounded-xl border border-slate-100 shadow-inner text-center px-4">
                <AlertCircle className="w-8 h-8 text-slate-350 mb-2" />
                <span className="text-xs font-bold">{previewError}</span>
              </div>
            ) : previewData?.template_version ? (() => {
              const templateVersion = previewData.template_version;
              const isSingleSided = String(templateVersion.canvas_json?.sides || templateVersion.sides || '2') === '1' ||
                String(templateVersion.canvas_json?.sides || templateVersion.sides || '').toLowerCase() === 'single' ||
                String(templateVersion.cardSides || templateVersion.cardSides || '').toLowerCase() === 'single';

              return (
                <div className="flex flex-col gap-6 py-5 bg-slate-50 rounded-xl w-full border border-slate-100 shadow-inner items-center overflow-x-auto">
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Front View</span>
                    <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-150 record-preview-wrapper">
                      <IdCardPreview
                        record={previewData?.record_data || record}
                        templateVersion={previewData.template_version}
                        side="FRONT"
                        className="webapp-card-preview"
                      />
                    </div>
                  </div>
                  
                  {!isSingleSided && (
                    <div className="flex flex-col items-center gap-1.5 w-full">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Back View</span>
                      <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-150 record-preview-wrapper">
                        <IdCardPreview
                          record={previewData?.record_data || record}
                          templateVersion={previewData.template_version}
                          side="BACK"
                          className="webapp-card-preview"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })() : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 w-full bg-slate-50 rounded-xl border border-slate-100 shadow-inner text-center px-4">
                <AlertCircle className="w-8 h-8 text-slate-350 mb-2" />
                <span className="text-xs font-bold">No template assigned.</span>
              </div>
            )}
          </div>

          {/* Assigned Card Design Info & Actions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">
            <div className="space-y-1 border-b border-slate-100 pb-3">
              <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Assigned Design Details</span>
              <h4 className="font-extrabold text-slate-900 text-sm">
                {previewData?.template_name || (isSchool ? 'Student ID Card Layout' : 'Employee ID Card Layout')}
              </h4>
              <span className="inline-block mt-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-lg text-xs font-bold text-[#2563EB]">
                Cost: 10 Credits
              </span>
            </div>

            {/* Workflow Actions */}
            <div className="flex flex-col gap-2.5 w-full pt-1">
              
              {status !== 'approved' && (
                <>
                  <button
                    onClick={() => setIsApproveConfirmOpen(true)}
                    disabled={!hasTemplate}
                    className="w-full py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck size={14} />
                    <span>Approve Record</span>
                  </button>
                  <button
                    onClick={() => setIsRejectModalOpen(true)}
                    disabled={!hasTemplate}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    <span>Reject Record</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── REJECT REASON MODAL ───────────────────────────────────────── */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsRejectModalOpen(false)} />
          <form onSubmit={handleRejectSubmit} className="relative bg-white border border-slate-200 rounded-2xl shadow-xl p-5 max-w-md w-full z-10 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight border-b border-slate-100 pb-2">
              Reject Card Printing
            </h3>
            <div className="space-y-1">
              <label htmlFor="rejection-reason" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Rejection Reason
              </label>
              <textarea
                id="rejection-reason"
                required
                rows={3}
                placeholder="Enter rejection reason instructions..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border border-[#DFE4EA] p-3 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setIsRejectModalOpen(false); setRejectReason(''); }}
                className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRejecting || !rejectReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isRejecting ? 'Rejecting...' : 'Reject Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── CORRECTION REQUIRED MODAL ─────────────────────────────────── */}
      {isCorrectionModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsCorrectionModalOpen(false)} />
          <form onSubmit={handleCorrectionSubmit} className="relative bg-white border border-slate-200 rounded-2xl shadow-xl p-5 max-w-md w-full z-10 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight border-b border-slate-100 pb-2">
              Request Correction
            </h3>
            <div className="space-y-1">
              <label htmlFor="correction-note" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Correction Instructions
              </label>
              <textarea
                id="correction-note"
                required
                rows={3}
                placeholder="Specify what needs to be corrected (e.g. invalid photo crop, typo in roll number)..."
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
                className="w-full border border-[#DFE4EA] p-3 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setIsCorrectionModalOpen(false); setCorrectionNote(''); }}
                className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCorrecting || !correctionNote.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isCorrecting ? 'Submitting...' : 'Send Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── APPROVE CONFIRMATION MODAL ─────────────────────────────────── */}
      {isApproveConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsApproveConfirmOpen(false)} />
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl p-5 max-w-md w-full z-10 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight border-b border-slate-100 pb-2">
              Confirm Record Approval
            </h3>
            <div className="space-y-2 text-xs text-slate-700 font-semibold leading-relaxed">
              <p>This record uses:</p>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Template:</span>
                  <span className="text-slate-900 font-bold">{previewData?.template_name || (isSchool ? 'Student ID Card Layout' : 'Employee ID Card Layout')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cost:</span>
                  <span className="text-slate-900 font-extrabold">10 Credits</span>
                </div>
              </div>
              <p className="text-slate-500 font-medium">Do you want to continue?</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsApproveConfirmOpen(false)}
                className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isApproving}
                onClick={async () => {
                  setIsApproving(true);
                  try {
                    await onApprove(record.id);
                    setIsApproveConfirmOpen(false);
                    await handleRefresh();
                  } catch (err: any) {
                    handleLocalError(err, 'Approval failed. Please check your credit balance.');
                  } finally {
                    setIsApproving(false);
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isApproving ? 'Approving...' : 'Approve & Deduct Credits'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT DETAILS MODAL (admin) ───────────────────────────────── */}
      {isEditModalOpen && (
        <RecordForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleSaveEdit}
          editingRecord={record}
          requiredFields={templateFields}
          isSchool={isSchool}
          classesList={classesList}
          divisionsList={divisionsList}
          branchesList={branchesList}
          departmentsList={departmentsList}
          hidePhoto={true}
        />
      )}

      {/* ── UPDATE PHOTO MODAL (admin) ───────────────────────────────── */}
      {isPhotoEditorOpen && (
        <PhotoEditorModal
          isOpen={isPhotoEditorOpen}
          onClose={() => setIsPhotoEditorOpen(false)}
          record={record}
          isSchool={isSchool}
          onSuccess={async () => {
            await handleRefresh();
            await loadPreview();
          }}
        />
      )}
    </div>
  );
}
