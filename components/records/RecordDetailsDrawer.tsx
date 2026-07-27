import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ShieldCheck, Trash2, Edit, Loader2 } from 'lucide-react';
import { RecordApi } from '@/api';
import { IdCardPreview } from './IdCardPreview';
import { SharedCardRenderer } from '@/components/record/SharedCardRenderer';
import { RecordStatusBadge } from '@/components/record/RecordStatusBadge';
import { useAuth } from '@/context/auth-context';

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
  onApprove,
  onReject,
  hasTemplate = true
}: RecordDetailsDrawerProps) {
  const { user } = useAuth();
  const canApprove = isAdmin || user?.can_approve_records;

  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'FRONT' | 'BACK'>('FRONT');

  const templateVersion = previewData?.template_version;
  const isSingleSided = templateVersion 
    ? String(templateVersion.canvas_json?.sides || templateVersion.sides || '2') === '1' ||
      String(templateVersion.canvas_json?.sides || templateVersion.sides || '').toLowerCase() === 'single'
    : true;

  const [displayWidth, setDisplayWidth] = useState<number>(320);
  const roRef = useRef<ResizeObserver | null>(null);

  const previewContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (roRef.current) {
      roRef.current.disconnect();
      roRef.current = null;
    }

    if (node) {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const canvasJson = templateVersion?.canvas_json || templateVersion || {};
          const orientation = canvasJson.orientation || 'vertical';
          const isHorizontal = orientation === 'horizontal';
          const maxCardW = isHorizontal ? 480 : 340;
          
          const availWidth = entry.contentRect.width;
          const originalWidth = Number(canvasJson.cardWidth || canvasJson.width || (orientation === 'horizontal' ? 1013 : 638));
          
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
          let targetWidth;
          if (isMobile) {
            targetWidth = Math.min(originalWidth, availWidth * 0.8);
          } else {
            targetWidth = Math.max(180, Math.min(availWidth - 24, maxCardW));
          }
          
          setDisplayWidth(targetWidth);
        }
      });
      ro.observe(node);
      roRef.current = ro;
    }
  }, [previewData, templateVersion, isSingleSided, viewMode]);

  useEffect(() => {
    if (isOpen && record) {
      setTimeout(() => {
        setPreviewData(null);
        setViewMode('FRONT');
      }, 0);
      
      const recordType = record.record_type || (isSchool ? 'student' : 'employee');
      const mappedType = recordType === 'staff' ? 'school-staff' : recordType;
      
      setPreviewLoading(true);
      RecordApi.getCardPreview(mappedType as any, record.id)
        .then((data) => {
          setPreviewData(data);
        })
        .catch(() => {})
        .finally(() => {
          setPreviewLoading(false);
        });
    }
  }, [isOpen, record, isSchool, isSingleSided]);

  if (!isOpen || !record) return null;

  const name = record.name || record.full_name || record.student_name || record.employee_name || 'Roster Record';
  const idNumber = record.admission_number || record.employee_id || '—';
  const status = record.approval_status || 'draft';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-[95vw] lg:max-w-4xl max-h-[90vh] flex flex-col z-10 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-white shrink-0">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Record Preview</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-slate-600">{name}</span>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-mono">{idNumber}</span>
              <RecordStatusBadge status={status} />
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-2 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body content (scrollable) */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-8 flex flex-col">
          {previewLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 my-auto">
              <Loader2 size={32} className="animate-spin text-blue-500 mb-3" />
              <span className="text-xs font-bold uppercase tracking-wider">Rendering Card Preview...</span>
            </div>
          ) : !templateVersion ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-sm mx-auto text-center my-auto">
              <span className="text-sm font-bold text-slate-600 mb-2">No Template Assigned</span>
              <p className="text-xs text-slate-500 leading-relaxed">
                This record cannot be previewed because no valid card template is assigned to its group.
              </p>
            </div>
          ) : (
            <div className="space-y-4 w-full">
              {/* View Mode Toggle Buttons */}
              {!isSingleSided && (
                <div className="flex bg-slate-100 p-1 rounded-xl shadow-xs border border-slate-200 w-fit shrink-0 mx-auto">
                  <button 
                    type="button"
                    onClick={() => setViewMode('FRONT')}
                    className={`px-4 py-1.5 text-xs font-extrabold rounded-lg transition-colors cursor-pointer ${viewMode === 'FRONT' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Front
                  </button>
                  <button 
                    type="button"
                    onClick={() => setViewMode('BACK')}
                    className={`px-4 py-1.5 text-xs font-extrabold rounded-lg transition-colors cursor-pointer ${viewMode === 'BACK' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Back
                  </button>
                </div>
              )}

              <div ref={previewContainerRef} className="card-flow-preview-container w-full max-w-full p-2.5 overflow-x-hidden overflow-y-auto flex flex-col items-center justify-center gap-6 mx-auto">
                {/* Front Card */}
                {viewMode === 'FRONT' && (
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:block">Front View</span>
                    <div className="p-2 record-preview-wrapper flex justify-center items-center mx-auto">
                      <SharedCardRenderer
                        record={previewData?.record_data || record}
                        effectiveTemplate={templateVersion}
                        side="FRONT"
                        displayWidth={displayWidth}
                      />
                    </div>
                  </div>
                )}

                {/* Back Card */}
                {!isSingleSided && viewMode === 'BACK' && (
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:block">Back View</span>
                    <div className="p-2 record-preview-wrapper flex justify-center items-center mx-auto">
                      <SharedCardRenderer
                        record={previewData?.record_data || record}
                        effectiveTemplate={templateVersion}
                        side="BACK"
                        displayWidth={displayWidth}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4 bg-white shrink-0 flex-wrap lg:flex-nowrap">
          <div className="flex items-center gap-2 w-full lg:w-auto order-2 lg:order-1">
            {(!isAdmin && onEdit) && (
              <button
                onClick={() => { onClose(); onEdit(record); }}
                disabled={!hasTemplate}
                className="flex-1 lg:flex-none py-2.5 lg:py-2 px-4 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Edit size={14} />
                <span>Edit Details</span>
              </button>
            )}
            
            {canApprove && status === 'pending' && (
              <>
                {onApprove && (
                  <button
                    onClick={() => { onClose(); onApprove(record.id); }}
                    disabled={!hasTemplate}
                    className="flex-1 lg:flex-none py-2.5 lg:py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <ShieldCheck size={14} />
                    <span>Approve</span>
                  </button>
                )}
                {onReject && (
                  <button
                    onClick={() => { onClose(); onReject(record.id); }}
                    disabled={!hasTemplate}
                    className="flex-1 lg:flex-none py-2.5 lg:py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Reject</span>
                  </button>
                )}
              </>
            )}
          </div>
          
          <div className="w-full lg:w-auto flex justify-end order-1 lg:order-2">
            <button
              onClick={onClose}
              className="w-full lg:w-auto py-2.5 lg:py-2 px-6 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export type RecordDetailsDrawerType = typeof RecordDetailsDrawer;
