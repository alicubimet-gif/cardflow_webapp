'use client';

import React from 'react';
import { Eye, Edit, CheckCircle2, XCircle, Trash2, Download } from 'lucide-react';

export interface RecordActionsProps {
  canApprove?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canDownload?: boolean;
  isApprovePending?: boolean;
  isRejectPending?: boolean;
  isDeletePending?: boolean;
  onViewCard?: () => void;
  onCapturePhoto?: () => void;
  onEdit?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  className?: string;
}

export function RecordActions({
  canApprove = false,
  canEdit = true,
  canDelete = true,
  canDownload = false,
  isApprovePending = false,
  isRejectPending = false,
  isDeletePending = false,
  onViewCard,
  onCapturePhoto,
  onEdit,
  onApprove,
  onReject,
  onDelete,
  onDownload,
  className = '',
}: RecordActionsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {onViewCard && (
        <button
          type="button"
          onClick={onViewCard}
          className="h-10 px-4 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors flex items-center justify-center cursor-pointer"
        >
          <Eye className="mr-1.5 h-4 w-4" />
          View Card
        </button>
      )}

      {onCapturePhoto && (
        <button
          type="button"
          onClick={onCapturePhoto}
          className="h-10 px-4 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors flex items-center justify-center cursor-pointer"
        >
          Capture Photo
        </button>
      )}

      {canEdit && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="h-10 px-4 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors flex items-center justify-center cursor-pointer"
        >
          <Edit className="mr-1.5 h-3.5 w-3.5" />
          Edit Record
        </button>
      )}

      {canApprove && onApprove && (
        <button
          type="button"
          disabled={isApprovePending || isRejectPending}
          onClick={onApprove}
          className="h-10 px-4 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
        >
          <CheckCircle2 className="mr-1.5 h-4 w-4" />
          {isApprovePending ? 'Approving…' : 'Approve Record'}
        </button>
      )}

      {canApprove && onReject && (
        <button
          type="button"
          disabled={isApprovePending || isRejectPending}
          onClick={onReject}
          className="h-10 px-4 text-xs font-semibold rounded-xl border border-red-300 text-red-650 hover:bg-red-50 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
        >
          <XCircle className="mr-1.5 h-4 w-4 text-red-600" />
          Reject
        </button>
      )}

      {canDownload && onDownload && (
        <button
          type="button"
          onClick={onDownload}
          className="h-10 px-4 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors flex items-center justify-center cursor-pointer"
        >
          <Download className="mr-1.5 h-4 w-4" />
          Download
        </button>
      )}

      {canDelete && onDelete && (
        <button
          type="button"
          disabled={isDeletePending}
          onClick={onDelete}
          className="h-10 px-4 text-xs font-semibold rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 shadow-xs transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          Delete
        </button>
      )}
    </div>
  );
}
