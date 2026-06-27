import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Mail, Phone, Hash, Layers, GraduationCap, ShieldCheck, Trash2, Edit, AlertCircle, ArrowUpCircle, RotateCw, Shield, Loader2 } from 'lucide-react';
import { AuthService } from '@/services/auth-service';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { resolvePhotoUrl } from '@/services/record-service';

interface RecordDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
  isSchool: boolean;
  isAdmin: boolean;
  onEdit?: (rec: any) => void;
  onSubmit?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onCorrection?: (id: string) => void;
  hasTemplate?: boolean;
}

export function RecordDetailsDrawer({
  isOpen,
  onClose,
  record,
  isSchool,
  isAdmin,
  onEdit,
  onSubmit,
  onApprove,
  onReject,
  onCorrection,
  hasTemplate = true
}: RecordDetailsDrawerProps) {
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    if (isOpen && record) {
      setPreviewData(null);
      setShowBack(false);
      
      const recordType = record.record_type || (isSchool ? 'student' : 'employee');
      const mappedType = recordType === 'staff' ? 'school-staff' : recordType;
      
      setPreviewLoading(true);
      AuthService.getCardPreview(mappedType as any, record.id)
        .then((data) => {
          setPreviewData(data);
        })
        .catch((err) => {
          console.error('[Preview] Failed to load card preview:', err);
        })
        .finally(() => {
          setPreviewLoading(false);
        });
    }
  }, [isOpen, record, isSchool]);

  if (!isOpen || !record) return null;

  const name = record.name || record.full_name || record.student_name || record.employee_name || 'Roster Record';
  const orgField1 = isSchool ? (record.class_name || 'Class') : (record.branch_name || 'Branch');
  const orgField2 = isSchool ? (record.division_name || 'Division') : (record.department_name || 'Department');
  const idNumber = record.admission_number || record.employee_id || '—';
  const status = record.approval_status || 'draft';
  const photoUrl = resolvePhotoUrl(record.photoUrl || record.profile_photo || record.photo || '');
  const dateUpdated = record.updated_at ? new Date(record.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '—';

  // Inline CSS Styles for 3D flip card
  const containerStyle: React.CSSProperties = {
    perspective: '1000px',
    width: '300px',
    height: '190px',
  };

  const innerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    transition: 'transform 0.6s',
    transformStyle: 'preserve-3d',
    transform: showBack ? 'rotateY(180deg)' : 'rotateY(0deg)',
  };

  const cardFaceStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: '16px',
    overflow: 'hidden',
  };

  const cardBackStyle: React.CSSProperties = {
    ...cardFaceStyle,
    transform: 'rotateY(180deg)',
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center lg:justify-center p-0 lg:p-4 animate-in fade-in duration-200">
      {/* Background click handler */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Container: Slides from bottom on mobile, centers on desktop */}
      <div className="relative bg-white border border-slate-200 rounded-t-2xl lg:rounded-2xl shadow-xl w-full lg:max-w-md max-h-[85vh] lg:max-h-[90vh] overflow-hidden flex flex-col z-10 animate-in slide-in-from-bottom duration-300 lg:slide-in-from-bottom-0 lg:zoom-in-95">
        
        {/* Mobile handle indicator */}
        <div className="lg:hidden flex justify-center py-2 shrink-0">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            {isSchool ? 'Student Profile Card' : 'Employee ID Card'}
          </span>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body content (scrollable) */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Animated 3D Flip ID Card Preview */}
          <div className="flex flex-col items-center">
            {previewLoading ? (
              <div className="w-[300px] h-[190px] rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                <Loader2 size={24} className="animate-spin text-blue-500 mb-2" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Loading Preview...</span>
              </div>
            ) : (
              <>
                <div style={containerStyle} className="cursor-pointer select-none" onClick={() => setShowBack(!showBack)}>
                  <div style={innerStyle}>
                    {/* FRONT FACE */}
                    <div style={cardFaceStyle} className="border border-slate-250 shadow-md">
                      {previewData?.front_preview_url ? (
                        <div 
                          className="w-full h-full bg-cover bg-center relative"
                          style={{ backgroundImage: `url(${previewData.front_preview_url})` }}
                        >
                          {/* Photo slot overlay */}
                          <div className="absolute top-[32%] left-[10%] w-[24%] h-[40%] rounded-lg border border-white/80 bg-slate-100 overflow-hidden shadow-xs">
                            {photoUrl ? (
                              <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <User size={20} />
                              </div>
                            )}
                          </div>
                          {/* Text overlays */}
                          <div className="absolute top-[32%] left-[40%] text-left max-w-[55%] space-y-0.5">
                            <p className="text-[10px] font-black text-slate-900 leading-tight uppercase truncate">{name}</p>
                            <p className="text-[8px] font-black text-[#2563EB] truncate tracking-wider">{idNumber}</p>
                            <p className="text-[7px] font-extrabold text-slate-500 uppercase truncate leading-none">{orgField1}</p>
                            <p className="text-[7px] font-semibold text-slate-450 uppercase truncate leading-none">{orgField2}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-700 flex flex-col justify-between p-4 text-white">
                          <div className="flex justify-between items-start">
                            <Shield size={20} className="text-white" />
                            <span className="text-[8px] font-black tracking-widest bg-white/20 px-2 py-0.5 rounded-full uppercase">ID Card Preview</span>
                          </div>
                          <div>
                            <p className="text-xs font-black tracking-tight uppercase truncate leading-tight">{name}</p>
                            <p className="text-[9px] font-mono tracking-wider opacity-85">{idNumber}</p>
                          </div>
                          <div className="flex justify-between items-end border-t border-white/20 pt-1.5 text-[8px] font-bold uppercase opacity-80 leading-none">
                            <span className="truncate max-w-[75%]">{orgField1} – {orgField2}</span>
                            <span className="shrink-0 text-amber-300">Front</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BACK FACE */}
                    <div style={cardBackStyle} className="border border-slate-250 shadow-md">
                      {previewData?.back_preview_url ? (
                        <div 
                          className="w-full h-full bg-cover bg-center relative"
                          style={{ backgroundImage: `url(${previewData.back_preview_url})` }}
                        >
                          <div className="absolute bottom-[10%] left-[5%] right-[5%] text-center text-[5px] font-bold text-slate-500 leading-tight">
                            If found, please return immediately to organization office.
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-slate-900 flex flex-col justify-between p-4 text-white">
                          <div className="w-full h-5 bg-slate-800 rounded-sm flex items-center px-2">
                            <div className="w-full h-1.5 bg-slate-950 rounded-xs" />
                          </div>
                          <div className="text-center text-[7px] text-slate-400 font-semibold leading-relaxed px-4">
                            This identity card remains the property of the issuing organization. If found, return to administration office.
                          </div>
                          <div className="flex justify-between items-end border-t border-slate-800 pt-1.5 text-[8px] font-bold uppercase tracking-wider text-slate-500 leading-none">
                            <span>CardFlow System</span>
                            <span className="text-amber-400">Back</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBack(!showBack)}
                  className="mt-3.5 flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200 text-[9px] font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  <RotateCw size={10} className="text-slate-500" />
                  <span>Flip to {showBack ? 'Front' : 'Back'}</span>
                </button>
              </>
            )}
          </div>

          {/* Details list */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Binding Section</span>
                <span className="text-xs font-bold text-slate-800 mt-1 block truncate">
                  {orgField1} - {orgField2}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">ID Identifier</span>
                <span className="text-xs font-mono font-bold text-slate-800 mt-1 block truncate">
                  {idNumber}
                </span>
              </div>
            </div>

            <div className="border border-slate-150 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white text-xs font-semibold text-slate-700 shadow-3xs">
              <div className="p-3.5 flex items-center gap-3">
                <Mail size={14} className="text-blue-500 shrink-0" />
                <div className="overflow-hidden">
                  <div className="text-[9px] font-bold text-slate-450 uppercase block">Email Address</div>
                  <div className="text-slate-800 truncate mt-0.5">{record.email_address || '—'}</div>
                </div>
              </div>
              <div className="p-3.5 flex items-center gap-3">
                <Phone size={14} className="text-blue-500 shrink-0" />
                <div>
                  <div className="text-[9px] font-bold text-slate-455 uppercase block">Contact Number</div>
                  <div className="text-slate-800 mt-0.5">{record.phone || '—'}</div>
                </div>
              </div>
              <div className="p-3.5 flex items-center gap-3">
                <Calendar size={14} className="text-blue-500 shrink-0" />
                <div>
                  <div className="text-[9px] font-bold text-slate-455 uppercase block">Last Updated Date</div>
                  <div className="text-slate-800 mt-0.5">{dateUpdated}</div>
                </div>
              </div>
            </div>

            {/* Audit Correction logs note (if exists) */}
            {(record.correction_note || record.rejection_reason) && (
              <div className="p-4 bg-amber-50 border border-amber-250 rounded-xl text-amber-900 text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block uppercase text-[10px] tracking-wider text-amber-800">
                    {status === 'rejected' ? 'Rejection Reason' : 'Correction Required Instruction'}
                  </span>
                  <p className="mt-1 leading-relaxed">{record.correction_note || record.rejection_reason}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions (Review/Correction triggers) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2.5 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-3xs"
          >
            Close
          </button>

          {!isAdmin && status === 'draft' && (
            <>
              {onEdit && (
                <button
                  onClick={() => { onClose(); onEdit(record); }}
                  disabled={!hasTemplate}
                  className="flex-1 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-3xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Edit size={14} />
                  <span>Edit Form</span>
                </button>
              )}
              {onSubmit && (
                <button
                  onClick={() => { onClose(); onSubmit(record.id); }}
                  disabled={!hasTemplate}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowUpCircle size={14} />
                  <span>Submit Card</span>
                </button>
              )}
            </>
          )}

          {isAdmin && status === 'pending' && (
            <div className="flex gap-2 w-full">
              {onApprove && (
                <button
                  onClick={() => { onClose(); onApprove(record.id); }}
                  disabled={!hasTemplate}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldCheck size={14} />
                  <span>Approve</span>
                </button>
              )}
              {onCorrection && (
                <button
                  onClick={() => { onClose(); onCorrection(record.id); }}
                  disabled={!hasTemplate}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Correct
                </button>
              )}
              {onReject && (
                <button
                  onClick={() => { onClose(); onReject(record.id); }}
                  disabled={!hasTemplate}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />
                  <span>Reject</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export type RecordDetailsDrawerType = typeof RecordDetailsDrawer;
