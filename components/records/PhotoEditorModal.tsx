import React, { useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { PhotoUploader } from './PhotoUploader';
import { AuthService } from '@/services/auth-service';
import { resolvePhotoUrl } from '@/services/record-service';
import { useDialog } from '@/hooks/useDialog';
import { useToast } from '@/hooks/useToast';

interface PhotoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  isSchool: boolean;
  onSuccess: () => void;
}

export function PhotoEditorModal({
  isOpen,
  onClose,
  record,
  isSchool,
  onSuccess
}: PhotoEditorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const dialog = useDialog();
  const { toast } = useToast();

  if (!isOpen || !record) return null;

  const name = record.name || record.full_name || record.student_name || record.employee_name || 'Record';
  const initialPhotoUrl = resolvePhotoUrl(record.photoUrl || record.profile_photo || record.photo || '');

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      dialog.alert({ title: 'Error', message: 'Photo editor not initialized yet.', variant: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          dialog.alert({ title: 'Processing Failed', message: 'Failed to generate image data. Please ensure a photo is selected/loaded.', variant: 'error' });
          setIsSaving(false);
          return;
        }

        try {
          const formData = new FormData();
          const recordType = record.record_type || (isSchool ? 'student' : 'employee');
          // Match the format expected by the backend
          formData.append('record_type', recordType === 'staff' ? 'school-staff' : recordType);
          formData.append('record_id', record.id);
          formData.append('photo', blob, 'profile_photo.jpg');

          await AuthService.uploadPhoto(formData);
          toast('Photo updated successfully', 'success');
          onSuccess();
          onClose();
        } catch (err: any) {
          console.error('[PhotoEditor] Upload failed:', err);
          dialog.alert({ title: 'Save Failed', message: err?.response?.data?.message || err?.message || 'Failed to save photo.', variant: 'error' });
        } finally {
          setIsSaving(false);
        }
      }, 'image/jpeg', 0.9);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 leading-tight">Update Student Photo</h3>
            <p className="text-[10px] text-slate-550 font-medium mt-0.5">{name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-655 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <PhotoUploader
            initialPhotoUrl={initialPhotoUrl}
            canvasRef={canvasRef}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSaving ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Saving Photo...</span>
              </>
            ) : (
              <span>Save Photo</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
