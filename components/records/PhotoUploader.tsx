import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, RotateCw, RotateCcw, ZoomIn, Sun, RotateCcw as ResetIcon, VideoOff } from 'lucide-react';

interface PhotoUploaderProps {
  initialPhotoUrl?: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onPhotoSelected?: (file: File) => void;
}

export function PhotoUploader({
  initialPhotoUrl = '',
  canvasRef,
  onPhotoSelected
}: PhotoUploaderProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>(initialPhotoUrl);
  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  
  // New States for Panning / Dragging (Crop translation)
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const imageRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if initialPhotoUrl changes
  useEffect(() => {
    if (initialPhotoUrl) {
      setPreviewImageUrl(initialPhotoUrl);
      setPanX(0);
      setPanY(0);
      setZoom(1.0);
      setRotation(0);
      setBrightness(100);
      setIsFlipped(false);
    }
  }, [initialPhotoUrl]);

  // Redraw Canvas on adjustments
  useEffect(() => {
    if (!previewImageUrl) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = previewImageUrl;

    img.onload = () => {
      imageRef.current = img;
      // Set fixed card print size constraints (typically 400x400 for profile photo)
      canvas.width = 400;
      canvas.height = 400;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Save canvas state
      ctx.save();
      
      // Translate to center for rotation and apply pan offsets
      ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Apply mirroring
      if (isFlipped) {
        ctx.scale(-1, 1);
      }
      
      // Apply brightness filter
      ctx.filter = `brightness(${brightness}%)`;
      
      // Draw image scaled and centered, preserving aspect ratio (avoiding squish)
      const imgRatio = img.width / img.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      
      if (imgRatio > 1) {
        // Landscape: fit height, overflow width
        drawWidth = canvas.height * imgRatio;
      } else {
        // Portrait: fit width, overflow height
        drawHeight = canvas.width / imgRatio;
      }
      
      const finalWidth = drawWidth * zoom;
      const finalHeight = drawHeight * zoom;
      
      ctx.drawImage(
        img, 
        -finalWidth / 2, 
        -finalHeight / 2, 
        finalWidth, 
        finalHeight
      );
      
      // Restore canvas context
      ctx.restore();
    };
  }, [previewImageUrl, zoom, rotation, brightness, isFlipped, panX, panY, canvasRef]);

  // Mouse Drag / Touch Pan Event Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!previewImageUrl) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { x: panX, y: panY };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPanX(panStartRef.current.x + dx);
    setPanY(panStartRef.current.y + dy);
  };

  const handleCanvasMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!previewImageUrl || e.touches.length !== 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    panStartRef.current = { x: panX, y: panY };
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setPanX(panStartRef.current.x + dx);
    setPanY(panStartRef.current.y + dy);
  };

  // Camera Management
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access failed:', err);
      alert('Could not access camera. Please check permissions.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (video) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth || 640;
      tempCanvas.height = video.videoHeight || 640;
      
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        tempCanvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setPreviewImageUrl(url);
            setZoom(1.0);
            setRotation(0);
            setBrightness(100);
            setIsFlipped(false);
            setPanX(0);
            setPanY(0);
            
            // Invoke callback if photo was selected
            if (onPhotoSelected) {
              const file = new File([blob], "captured_photo.jpg", { type: "image/jpeg" });
              onPhotoSelected(file);
            }
          }
        }, 'image/jpeg');
      }
      stopCamera();
    }
  };

  // File Upload Management
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewImageUrl(url);
      setZoom(1.0);
      setRotation(0);
      setBrightness(100);
      setIsFlipped(false);
      setPanX(0);
      setPanY(0);
      
      if (onPhotoSelected) {
        onPhotoSelected(file);
      }
    }
  };

  const handleAutoFit = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const ratio = img.width / img.height;
    if (ratio > 1) {
      setZoom(1 / ratio);
    } else {
      setZoom(ratio);
    }
    setPanX(0);
    setPanY(0);
    setRotation(0);
    setBrightness(100);
    setIsFlipped(false);
  };

  const triggerReset = () => {
    setZoom(1.0);
    setRotation(0);
    setBrightness(100);
    setIsFlipped(false);
    setPanX(0);
    setPanY(0);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
      
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center w-full">
        {/* Camera stream view */}
        {isCameraActive ? (
          <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-black w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] flex items-center justify-center shadow-3xs">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <button
              type="button"
              onClick={capturePhoto}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg cursor-pointer transition-transform hover:scale-105"
            >
              <Camera size={20} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            {previewImageUrl ? (
              // Selected preview container
              <div className="flex flex-col items-center">
                <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] flex items-center justify-center shadow-3xs">
                  <canvas 
                    ref={canvasRef} 
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUpOrLeave}
                    onMouseLeave={handleCanvasMouseUpOrLeave}
                    onTouchStart={handleCanvasTouchStart}
                    onTouchMove={handleCanvasTouchMove}
                    onTouchEnd={handleCanvasMouseUpOrLeave}
                    className="w-full h-full object-cover cursor-move"
                    title="Drag to crop/reposition"
                  />
                </div>
                <span className="text-[10px] font-medium text-slate-400 mt-2 select-none">
                  💡 Drag image inside the frame to pan/reposition
                </span>
                
                {/* Quick actions for chosen photo */}
                <div className="flex gap-3 w-[280px] sm:w-[300px] mt-4">
                  <button
                    type="button"
                    onClick={() => setIsOptionsOpen(true)}
                    className="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 shadow-2xs"
                  >
                    <Upload size={14} className="text-slate-500" />
                    <span>Replace Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFlipped(prev => !prev)}
                    className="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 shadow-2xs"
                  >
                    <RotateCw size={14} className="text-slate-500" />
                    <span>Flip Photo</span>
                  </button>
                </div>
              </div>
            ) : (
              // Empty state: Tap to upload modern card
              <div 
                onClick={() => setIsOptionsOpen(true)}
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/10 bg-slate-50/40 rounded-2xl w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] cursor-pointer transition-all duration-200 shadow-3xs p-6 text-center select-none active:scale-[0.98]"
              >
                <div className="p-4 bg-white rounded-full shadow-3xs text-slate-400">
                  <Camera size={36} />
                </div>
                <span className="text-xs font-bold text-slate-700 mt-4">Tap to Upload Photo</span>
                <span className="text-[10px] font-semibold text-slate-400 mt-1.5 uppercase tracking-wider">Camera • Gallery</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editor Sliders & Controls */}
      {previewImageUrl && !isCameraActive && (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-3.5 shadow-3xs mt-5 w-[280px] sm:w-[300px]">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Image Adjustments
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleAutoFit}
                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 cursor-pointer"
                title="Fit image inside frame"
              >
                <span>Auto Fit</span>
              </button>
              <button
                type="button"
                onClick={triggerReset}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
                title="Reset adjustments"
              >
                <ResetIcon size={12} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Zoom Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-550">
              <span className="flex items-center gap-1">
                <ZoomIn size={12} />
                <span>Zoom Scale</span>
              </span>
              <span>{zoom.toFixed(2)}x</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="2.5" 
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Brightness Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-550">
              <span className="flex items-center gap-1">
                <Sun size={12} />
                <span>Brightness</span>
              </span>
              <span>{brightness}%</span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="150" 
              step="5"
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Rotation Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setRotation(prev => (prev - 90) % 360)}
              className="flex-1 py-1.5 bg-white hover:bg-slate-100 text-slate-650 text-[10px] font-bold rounded-xl transition-colors cursor-pointer border border-slate-200 flex items-center justify-center gap-1 shadow-3xs"
            >
              <RotateCcw size={12} />
              <span>Left 90°</span>
            </button>
            <button
              type="button"
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="flex-1 py-1.5 bg-white hover:bg-slate-100 text-slate-650 text-[10px] font-bold rounded-xl transition-colors cursor-pointer border border-slate-200 flex items-center justify-center gap-1 shadow-3xs"
            >
              <RotateCw size={12} />
              <span>Right 90°</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Option Sheet */}
      {isOptionsOpen && (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-300">
          <div className="absolute inset-0" onClick={() => setIsOptionsOpen(false)} />
          
          <div className="relative w-full max-w-sm bg-white rounded-t-3xl shadow-xl overflow-hidden p-6 space-y-4 border-t border-slate-100 animate-slide-up" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2" />
            <h3 className="text-center font-bold text-sm text-slate-800 tracking-tight">Select Photo Source</h3>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsOptionsOpen(false);
                  startCamera();
                }}
                className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-blue-100 shadow-2xs"
              >
                <Camera size={16} />
                <span>Take Photo (Camera)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOptionsOpen(false);
                  fileInputRef.current?.click();
                }}
                className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200 shadow-2xs"
              >
                <Upload size={16} />
                <span>Choose from Gallery</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOptionsOpen(false)}
                className="w-full py-3 bg-white hover:bg-slate-50 text-slate-550 text-xs font-bold rounded-xl flex items-center justify-center transition-all cursor-pointer border border-slate-200 mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export type PhotoUploaderType = typeof PhotoUploader;
