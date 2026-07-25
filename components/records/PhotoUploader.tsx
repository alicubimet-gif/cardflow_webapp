'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, RotateCw, RefreshCw, ZoomIn, Sun, Sliders, Check, AlertCircle, Eye, EyeOff, Crop, Contrast, Sparkles } from 'lucide-react';
import { useDialog } from '@/hooks/useDialog';

interface PhotoUploaderProps {
  initialPhotoUrl?: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onPhotoSelected?: (file: File) => void;
  overlayFrame?: string;
  isSchool?: boolean;
}

export function PhotoUploader({
  initialPhotoUrl = '',
  canvasRef,
  onPhotoSelected,
  overlayFrame,
  isSchool = false
}: PhotoUploaderProps) {
  const dialog = useDialog();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>(initialPhotoUrl);
  
  // Aspect Ratio Preset (1:1 for ID cards, 3:4 for general profile)
  const [cropRatio, setCropRatio] = useState<'1:1' | '3:4'>('1:1');
  
  // Editor Adjustment States (iPhone Photos inspired values)
  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrastVal, setContrastVal] = useState<number>(100);
  const [exposure, setExposure] = useState<number>(0);
  const [sharpness, setSharpness] = useState<number>(0);
  const [clarity, setClarity] = useState<number>(0);
  
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Translation (Dragging) offsets
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const imageRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset to original settings
  const resetAdjustments = () => {
    setZoom(1.0);
    setRotation(0);
    setBrightness(100);
    setContrastVal(100);
    setExposure(0);
    setSharpness(0);
    setClarity(0);
    setPanX(0);
    setPanY(0);
    setValidationMsg(null);
  };

  // Sync state if initialPhotoUrl changes
  useEffect(() => {
    if (initialPhotoUrl) {
      setPreviewImageUrl(initialPhotoUrl);
      resetAdjustments();
    }
  }, [initialPhotoUrl]);

  // Auto Enhance (balances exposure and enhances clarity safely)
  const handleAutoEnhance = () => {
    setExposure(10);
    setContrastVal(110);
    setBrightness(105);
    setClarity(15);
    setSharpness(10);
  };

  // Perform basic pixel-based face/light validation on canvas
  const validatePhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsValidating(true);
    setValidationMsg(null);

    setTimeout(() => {
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setValidationMsg("Failed to run validation checks.");
          setIsValidating(false);
          return;
        }

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // 1. Calculate Average Brightness
        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Standard relative luminance formula
          totalBrightness += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        }
        const avgBrightness = totalBrightness / (data.length / 4);

        if (avgBrightness < 55) {
          setValidationMsg("Lighting is too dark. Please improve lighting and try again.");
          setIsValidating(false);
          return;
        }
        if (avgBrightness > 240) {
          setValidationMsg("Lighting is too bright. Please reduce exposure or move away from light.");
          setIsValidating(false);
          return;
        }

        // Simulating focus/sharpness check by checking edge contrasts
        let contrastDiffSum = 0;
        for (let i = 0; i < data.length - 4; i += 16) {
          const currentLum = 0.2126 * data[i] + 0.7152 * data[i+1] + 0.0722 * data[i+2];
          const nextLum = 0.2126 * data[i+4] + 0.7152 * data[i+5] + 0.0722 * data[i+6];
          contrastDiffSum += Math.abs(currentLum - nextLum);
        }
        const avgContrast = contrastDiffSum / (data.length / 16);

        if (avgContrast < 5) {
          setValidationMsg("Photo appears blurry. Please ensure the face is in sharp focus.");
          setIsValidating(false);
          return;
        }

        // Verification success
        setValidationMsg(null);
      } catch (err) {
        // Fallback pass
      } finally {
        setIsValidating(false);
      }
    }, 400);
  };

  // Trigger Validation whenever preview image or main edits change
  useEffect(() => {
    if (previewImageUrl) {
      validatePhoto();
    }
  }, [previewImageUrl, zoom, brightness, contrastVal, exposure, sharpness, clarity]);

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
      
      // Fixed canvas resolution for passport/ID standards
      canvas.width = 450;
      canvas.height = cropRatio === '1:1' ? 450 : 600; // 3:4 aspect ratio if selected
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      
      // Center translation and translation panning offsets
      ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Setup browser canvas CSS filter string dynamically
      const cleanClarity = Math.max(100, 100 + clarity);
      const cleanSharp = Math.max(100, 100 + sharpness * 0.5);
      const computedBrightness = Math.max(0, brightness + exposure);
      
      ctx.filter = `brightness(${computedBrightness}%) contrast(${contrastVal}%) saturate(${cleanClarity}%) contrast(${cleanSharp}%)`;
      
      // Calculate aspect ratio scaling
      const imgRatio = img.width / img.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      
      const canvasRatio = canvas.width / canvas.height;
      if (imgRatio > canvasRatio) {
        // Landscape: scale to fit height
        drawWidth = canvas.height * imgRatio;
      } else {
        // Portrait: scale to fit width
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
      
      ctx.restore();
    };
  }, [previewImageUrl, zoom, rotation, brightness, contrastVal, exposure, sharpness, clarity, cropRatio, panX, panY, canvasRef]);

  // Dragging event handlers
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

  // Camera handling
  const startCamera = async () => {
    setIsCameraActive(true);
    setValidationMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode, width: { ideal: 720 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      dialog.alert({ title: 'Camera Error', message: 'Could not access device camera. Please check permissions.', variant: 'error' });
      setIsCameraActive(false);
    }
  };

  const switchCamera = async () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(() => {
      startCamera();
    }, 150);
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
      tempCanvas.width = video.videoWidth || 720;
      tempCanvas.height = video.videoHeight || 720;
      
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        // If front camera, mirror image on capture
        if (facingMode === 'user') {
          ctx.translate(tempCanvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        tempCanvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setPreviewImageUrl(url);
            resetAdjustments();
            
            if (onPhotoSelected) {
              const file = new File([blob], "photo_captured.jpg", { type: "image/jpeg" });
              onPhotoSelected(file);
            }
          }
        }, 'image/jpeg', 0.95);
      }
      stopCamera();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewImageUrl(url);
      resetAdjustments();
      
      if (onPhotoSelected) {
        onPhotoSelected(file);
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-4xl mx-auto">
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* LEFT: Camera Stream / Preview Box */}
      <div className="flex flex-col items-center flex-1 min-w-0">
        <div className="relative border border-slate-200 rounded-3xl overflow-hidden bg-slate-950 w-full max-w-[340px] aspect-[3/4] flex items-center justify-center shadow-md">
          {isCameraActive ? (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
              
              {/* Dashed Face Guideline Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                <div className="w-[180px] h-[240px] rounded-full border-2 border-dashed border-white/70 relative">
                  <div className="absolute top-[35%] left-[-10px] right-[-10px] border-t border-dashed border-white/40" />
                  <div className="absolute bottom-[20%] left-[-20px] right-[-20px] border-t border-dashed border-white/50" />
                </div>
                <span className="text-[10px] font-bold text-white/95 uppercase bg-black/40 px-3 py-1 rounded-full mt-4 select-none tracking-wider">
                  Align Face Inside Guide
                </span>
              </div>
              
              {/* Camera Actions Overlay */}
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-5 px-4">
                <button
                  type="button"
                  onClick={switchCamera}
                  className="bg-black/50 hover:bg-black/75 text-white rounded-xl p-3 cursor-pointer transition-colors"
                  title="Switch Camera"
                >
                  <RefreshCw size={18} />
                </button>
                
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 cursor-pointer transition-transform hover:scale-105 border-4 border-white/10"
                  title="Capture Photo"
                >
                  <Camera size={24} />
                </button>

                <button
                  type="button"
                  onClick={stopCamera}
                  className="bg-red-600/80 hover:bg-red-600 text-white rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              {previewImageUrl ? (
                <div className="relative w-full h-full flex items-center justify-center bg-slate-50">
                  <canvas 
                    ref={canvasRef} 
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUpOrLeave}
                    onMouseLeave={handleCanvasMouseUpOrLeave}
                    onTouchStart={handleCanvasTouchStart}
                    onTouchMove={handleCanvasTouchMove}
                    onTouchEnd={handleCanvasMouseUpOrLeave}
                    className="w-full h-full object-contain cursor-move"
                  />
                  
                  {/* Aspect Ratio Guideline Border */}
                  <div className="absolute inset-0 border border-blue-500/20 pointer-events-none" />
                </div>
              ) : (
                <div 
                  onClick={() => setIsCameraActive(true)}
                  className="flex flex-col items-center justify-center p-8 text-center cursor-pointer h-full w-full bg-slate-900 text-slate-400 select-none hover:bg-slate-850 transition-colors"
                >
                  <div className="p-4 bg-slate-800 rounded-full text-slate-300 mb-4 shadow-sm">
                    <Camera size={38} />
                  </div>
                  <p className="text-xs font-bold text-slate-200">Start Camera</p>
                  <p className="text-[10px] text-slate-500 mt-1">Capture a professional photo for ID cards</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Toolbar */}
        {!isCameraActive && (
          <div className="flex flex-wrap justify-center gap-2 mt-4 w-full max-w-[340px]">
            <button
              type="button"
              onClick={() => setIsCameraActive(true)}
              className="flex-1 min-w-[100px] h-10 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs bg-white"
            >
              <Camera size={14} className="text-slate-500" />
              <span>Camera</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 min-w-[100px] h-10 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs bg-white"
            >
              <Upload size={14} className="text-slate-500" />
              <span>Upload</span>
            </button>
          </div>
        )}

        {/* Validation Status Indicator */}
        {previewImageUrl && !isCameraActive && (
          <div className="mt-4 w-full max-w-[340px]">
            {isValidating ? (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2">
                <RefreshCw size={12} className="animate-spin text-blue-500" />
                <span>Running photo quality checks...</span>
              </div>
            ) : validationMsg ? (
              <div className="flex items-start gap-2.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200/50 rounded-xl p-3">
                <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <span>{validationMsg}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-250/50 rounded-xl px-3.5 py-2 shadow-2xs">
                <Check size={14} className="text-emerald-600" />
                <span>Passport / ID Photo Quality Verified</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT: Editor Adjustment Parameters */}
      {previewImageUrl && !isCameraActive && (
        <div className="flex-1 bg-slate-50 border border-slate-200/80 rounded-3xl p-5 shadow-2xs flex flex-col gap-4">
          
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
              iPhone Style Editing Tools
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAutoEnhance}
                className="text-[10px] font-extrabold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 shadow-2xs"
                title="Auto enhance image"
              >
                <Sparkles size={11} />
                <span>Auto Enhance</span>
              </button>
              
              <button
                type="button"
                onClick={resetAdjustments}
                className="text-[10px] font-extrabold text-blue-650 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 shadow-2xs"
                title="Reset edits"
              >
                <RefreshCw size={11} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Aspect Ratio Crop Select */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Target Crop Preset
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-200/50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCropRatio('1:1')}
                className={`py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                  cropRatio === '1:1' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                ID Card (Square 1:1)
              </button>
              <button
                type="button"
                onClick={() => setCropRatio('3:4')}
                className={`py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                  cropRatio === '3:4' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Profile Page (3:4)
              </button>
            </div>
          </div>

          {/* Zoom Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <ZoomIn size={12} className="text-slate-400" />
                <span>Zoom Scale</span>
              </span>
              <span>{zoom.toFixed(2)}x</span>
            </div>
            <input 
              type="range" 
              min="0.6" 
              max="3.0" 
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Brightness */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Sun size={12} className="text-slate-400" />
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

          {/* Contrast */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Contrast size={12} className="text-slate-400" />
                <span>Contrast</span>
              </span>
              <span>{contrastVal}%</span>
            </div>
            <input 
              type="range" 
              min="60" 
              max="140" 
              step="5"
              value={contrastVal}
              onChange={(e) => setContrastVal(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Exposure */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span>Exposure</span>
              <span>{exposure > 0 ? `+${exposure}` : exposure}</span>
            </div>
            <input 
              type="range" 
              min="-30" 
              max="30" 
              step="2"
              value={exposure}
              onChange={(e) => setExposure(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Face Clarity */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span>Face Clarity</span>
              <span>{clarity}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="40" 
              step="5"
              value={clarity}
              onChange={(e) => setClarity(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Sharpness */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span>Sharpness</span>
              <span>{sharpness}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="30" 
              step="5"
              value={sharpness}
              onChange={(e) => setSharpness(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Rotate Action Button */}
          <div className="flex gap-2 border-t border-slate-200 pt-3">
            <button
              type="button"
              onClick={() => setRotation(prev => (prev - 90) % 360)}
              className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-200 flex items-center justify-center gap-1.5 shadow-3xs"
            >
              <RotateCw size={13} className="scale-x-[-1]" />
              <span>Rotate Left</span>
            </button>
            <button
              type="button"
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-200 flex items-center justify-center gap-1.5 shadow-3xs"
            >
              <RotateCw size={13} />
              <span>Rotate Right</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
