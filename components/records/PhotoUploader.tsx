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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Set fixed card print size constraints (typically 600x600 for ID photos)
      canvas.width = 400;
      canvas.height = 400;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Save canvas state
      ctx.save();
      
      // Translate to center for rotation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Apply brightness filter
      ctx.filter = `brightness(${brightness}%)`;
      
      // Draw image scaled and centered
      const scale = zoom;
      const drawWidth = canvas.width * scale;
      const drawHeight = canvas.height * scale;
      
      ctx.drawImage(
        img, 
        -drawWidth / 2, 
        -drawHeight / 2, 
        drawWidth, 
        drawHeight
      );
      
      // Restore canvas context
      ctx.restore();
    };
  }, [previewImageUrl, zoom, rotation, brightness, canvasRef]);

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
      
      if (onPhotoSelected) {
        onPhotoSelected(file);
      }
    }
  };

  const triggerReset = () => {
    setZoom(1.0);
    setRotation(0);
    setBrightness(100);
  };

  return (
    <div className="space-y-4">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
        Profile Photo Capture & Edit
      </label>

      {/* Input Source Choice */}
      <div className="flex gap-2 mb-3">
        {!isCameraActive ? (
          <button
            type="button"
            onClick={startCamera}
            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
          >
            <Camera size={14} className="text-blue-500" />
            <span>Use Camera</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stopCamera}
            className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-rose-200"
          >
            <VideoOff size={14} />
            <span>Close Camera</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
        >
          <Upload size={14} className="text-blue-500" />
          <span>Upload File</span>
        </button>
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* Capture Stream / Canvas Display */}
      <div className="flex flex-col items-center justify-center">
        {isCameraActive ? (
          <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-black w-[300px] h-[300px] flex items-center justify-center shadow-3xs">
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
          <div className="flex flex-col items-center gap-3">
            <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 w-[300px] h-[300px] flex items-center justify-center shadow-3xs">
              <canvas 
                ref={canvasRef} 
                className="w-full h-full object-cover"
              />
              {!previewImageUrl && (
                <span className="text-slate-400 font-semibold text-xs italic text-center p-6">
                  No image selected. Please capture or upload a file.
                </span>
              )}
              {/* Crop box overlay */}
              {previewImageUrl && (
                <div className="absolute inset-4 border border-dashed border-white/80 pointer-events-none rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] flex items-center justify-center">
                  <span className="text-[9px] font-extrabold text-white uppercase tracking-widest bg-black/45 px-2 py-0.5 rounded-sm">
                    Cropped Output
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Editor Sliders & Controls */}
      {previewImageUrl && !isCameraActive && (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-3.5 shadow-3xs mt-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Image Adjustments
            </span>
            <button
              type="button"
              onClick={triggerReset}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <ResetIcon size={12} />
              <span>Reset</span>
            </button>
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
    </div>
  );
}
export type PhotoUploaderType = typeof PhotoUploader;
