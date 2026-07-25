import React, { useState, useRef, useMemo } from 'react';
import { 
  Paperclip, UploadCloud, Search, Trash2, Download, 
  File, FileText, FileSpreadsheet, Image as ImageIcon, 
  Loader2, ExternalLink
} from 'lucide-react';
import { uploadGenericFile } from '@/services/record-service';
import { useDialog } from '@/hooks/useDialog';

export interface RecordFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface RecordFilesSectionProps {
  record: any;
  onUpdateRecord: (updatedData: any) => Promise<void>;
  disabled?: boolean;
}

const getFileIcon = (type: string, className = "w-8 h-8") => {
  if (type.includes('image')) return <ImageIcon className={`${className} text-blue-500`} />;
  if (type.includes('pdf')) return <FileText className={`${className} text-red-500`} />;
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return <FileSpreadsheet className={`${className} text-emerald-500`} />;
  if (type.includes('word') || type.includes('document')) return <FileText className={`${className} text-blue-600`} />;
  return <File className={`${className} text-slate-400`} />;
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export function RecordFilesSection({ record, onUpdateRecord, disabled }: RecordFilesSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date');
  const [previewFile, setPreviewFile] = useState<RecordFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialog = useDialog();

  const files: RecordFile[] = record?.data?.files || [];

  const handleUploadClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';

    // Check size limit (e.g., 20MB)
    if (file.size > 20 * 1024 * 1024) {
      dialog.alert({ title: 'File Too Large', message: 'Maximum file size is 20MB.', variant: 'error' });
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await uploadGenericFile(formData);
      
      const newFile: RecordFile = {
        id: crypto.randomUUID(),
        name: response.filename || file.name,
        url: response.url,
        size: response.size || file.size,
        type: response.content_type || file.type,
        uploadedBy: 'Current User',
        uploadedAt: new Date().toISOString(),
      };

      const currentData = { ...record.data };
      const currentFiles = currentData.files || [];
      currentData.files = [newFile, ...currentFiles];

      await onUpdateRecord(currentData);

    } catch (err: any) {
      console.error(err);
      dialog.alert({ 
        title: 'Upload Failed', 
        message: err.response?.data?.error || err.response?.data?.detail || 'Failed to upload file.', 
        variant: 'error' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (disabled) return;
    const confirmed = await dialog.confirm({
      title: 'Delete File',
      message: 'Are you sure you want to remove this file? This action cannot be undone.',
      variant: 'danger'
    });
    
    if (!confirmed) return;
    
    try {
      const currentData = { ...record.data };
      currentData.files = (currentData.files || []).filter((f: RecordFile) => f.id !== fileId);
      await onUpdateRecord(currentData);
    } catch (err) {
      console.error(err);
      dialog.alert({ title: 'Delete Failed', message: 'Failed to remove file from record.', variant: 'error' });
    }
  };

  const filteredAndSortedFiles = useMemo(() => {
    let result = [...files];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(q));
    }
    
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'type') {
        return a.type.localeCompare(b.type);
      }
      return 0;
    });
    
    return result;
  }, [files, searchQuery, sortBy]);

  const handlePreview = (file: RecordFile) => {
    if (file.type.includes('image')) {
      setPreviewFile(file);
    } else if (file.type.includes('pdf')) {
      window.open(file.url, '_blank');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <Paperclip size={18} className="text-slate-400" />
          <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Sora' }}>Files & Attachments</h3>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {files.length}
          </span>
        </div>
        
        <button
          onClick={handleUploadClick}
          disabled={disabled || isUploading}
          className="flex items-center justify-center gap-1.5 px-4 h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 cursor-pointer w-full sm:w-auto"
        >
          {isUploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
          <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv" 
        />
      </div>

      {/* Toolbar */}
      {files.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-9 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 bg-white border border-slate-200 rounded-lg text-xs px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-[120px] text-slate-600 font-medium cursor-pointer"
          >
            <option value="date">Newest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="type">File Type</option>
          </select>
        </div>
      )}

      {/* File List */}
      <div className="pt-2">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
              <UploadCloud className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No files uploaded yet</p>
            <p className="text-xs text-slate-500 mt-1">Upload documents, photos, or other attachments to this record.</p>
          </div>
        ) : filteredAndSortedFiles.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500 font-medium italic">
            No files match your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredAndSortedFiles.map((file) => {
              const isPreviewable = file.type.includes('image') || file.type.includes('pdf');
              
              return (
                <div key={file.id} className="group relative flex items-start p-3 border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-3xs transition-all bg-white">
                  <div className="w-10 h-10 shrink-0 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 mr-3">
                    {getFileIcon(file.type, "w-5 h-5")}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-6">
                    <p 
                      className={`text-xs font-bold text-slate-800 truncate mb-0.5 ${isPreviewable ? 'cursor-pointer hover:text-blue-600' : ''}`}
                      onClick={() => isPreviewable && handlePreview(file)}
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <div className="flex items-center text-[10px] text-slate-500 font-medium">
                      <span>{formatBytes(file.size)}</span>
                      <span className="mx-1.5">•</span>
                      <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a 
                      href={file.url} 
                      download={file.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Download"
                    >
                      <Download size={14} />
                    </a>
                    {!disabled && (
                      <button 
                        onClick={() => handleDelete(file.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={() => setPreviewFile(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                {getFileIcon(previewFile.type, "w-5 h-5")}
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{previewFile.name}</h3>
                  <p className="text-[10px] text-slate-500 font-medium">{formatBytes(previewFile.size)} • Uploaded {new Date(previewFile.uploadedAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={previewFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                >
                  <ExternalLink size={14} />
                  <span>Open</span>
                </a>
                <button 
                  onClick={() => setPreviewFile(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-100 min-h-[300px]">
              <img 
                src={previewFile.url} 
                alt={previewFile.name} 
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
