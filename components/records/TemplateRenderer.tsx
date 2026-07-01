'use client';

import React from 'react';
import { RotateCw, Copy, Trash2, Upload } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import PremiumPhotoFrame from './PremiumPhotoFrame';
import JSONShapeRenderer from './JSONShapeRenderer';
import { resolvePhotoUrl } from '@/services/record-service';
import { resolveRenderFontSize, unitToPx, getResponsiveFontSize, MM_TO_PX } from '../../utils/unit-conversion';
import VectorElement from './VectorElement';
import VectorShape from './VectorShape';

const resolveMediaUrl = resolvePhotoUrl;

export interface TemplateRendererProps {
  elements: any[];
  side: 'FRONT' | 'BACK';
  recordData?: Record<string, any>;
  isDesignerMode?: boolean;
  selectedId?: string | null;
  editingId?: string | null;
  repositionMode?: boolean;
  editingRef?: React.RefObject<HTMLTextAreaElement | null>;
  zoom?: number;

  // Interactivity Handlers for Designer Mode
  onElementMouseDown?: (e: React.MouseEvent, el: any, side: 'FRONT' | 'BACK') => void;
  onElementTouchStart?: (e: React.TouchEvent, el: any, side: 'FRONT' | 'BACK') => void;
  onRotateMouseDown?: (e: React.MouseEvent) => void;
  onRotateTouchStart?: (e: React.TouchEvent) => void;
  onResizeMouseDown?: (e: React.MouseEvent, handle: 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w') => void;
  onResizeTouchStart?: (e: React.TouchEvent, handle: 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w') => void;
  onDuplicate?: (id: string | number) => void;
  onDelete?: (id: string | number) => void;
  onTextChange?: (id: string | number, text: string) => void;
  onTextBlur?: (id: string | number, text: string) => void;
  onStartEditing?: (id: string | number) => void;
  onPlaceholderUpload?: (e: React.ChangeEvent<HTMLInputElement>, id: string | number) => void;
}

// ─── Font utilities ───────────────────────────────────────────────────────────
function getFontFamily(family?: string): string {
  if (!family) return 'inherit';
  const maps: Record<string, string> = {
    'Outfit': 'Outfit, sans-serif',
    'Inter': 'Inter, sans-serif',
    'Poppins': 'Poppins, sans-serif',
    'Roboto': 'Roboto, sans-serif',
    'Space Grotesk': 'Space Grotesk, sans-serif',
    'monospace': 'monospace',
  };
  return maps[family] || family;
}

// ─── Photo utilities ──────────────────────────────────────────────────────────
const getImageClipPath = (shape: string) => {
  if (shape === 'circle' || shape === 'circular') return 'circle(50% at 50% 50%)';
  if (shape === 'oval') return 'ellipse(50% 35% at 50% 50%)';
  if (shape === 'hexagon') return 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
  if (shape === 'shield') return 'path("M 50 0 C 75 0, 100 15, 100 50 C 100 80, 50 100, 50 100 C 50 100, 0 80, 0 50 C 0 15, 25 0, 50 0 Z")';
  return 'none';
};

// Auto Scale Font sizing helpers
function getEstimatedTextWidthInEMs(text: string): number {
  let len = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (/[A-Z]/.test(char)) {
      len += 0.65;
    } else if (/[0-9]/.test(char)) {
      len += 0.55;
    } else if (/[i1l|!.,;' ]/.test(char)) {
      len += 0.25;
    } else {
      len += 0.5;
    }
  }
  return Math.max(len, 1);
}

export function getAutoScaledFontSize(text: string, width: number, height: number, minSize = 6, maxSize = 300): number {
  if (!text) return 14;
  const lines = text.split('\n');
  const lineCount = Math.max(lines.length, 1);
  const fontSizeHeight = (height / (lineCount * 1.25)) * 0.95;
  let maxLineEMs = 0;
  for (const line of lines) {
    maxLineEMs = Math.max(maxLineEMs, getEstimatedTextWidthInEMs(line));
  }
  const fontSizeWidth = (width / maxLineEMs) * 0.95;
  const finalSize = Math.min(fontSizeHeight, fontSizeWidth);
  return Math.max(minSize, Math.min(maxSize, finalSize));
}

function normalize(k: string): string {
  return k.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function resolveTokens(text: string, record: any): string {
  if (!text) return '';
  const customData = record?.custom_data || record?.custom_fields || record?.data || {};

  return text.replace(/\{\{([^}]+)\}\}/g, (_match, token) => {
    const rawKey = token.trim();
    const nk = normalize(rawKey);

    const directKey = Object.keys(record || {}).find(
      k => normalize(k) === nk && typeof record[k] !== 'object'
    );
    if (directKey && record[directKey] !== undefined && record[directKey] !== null) {
      return String(record[directKey]);
    }

    const customKey = Object.keys(customData).find(k => normalize(k) === nk);
    if (customKey && customData[customKey] !== undefined) {
      return String(customData[customKey]);
    }

    if (['name', 'fullname', 'studentname', 'employeename', 'full_name', 'student_name', 'employee_name'].includes(nk)) {
      return record?.name || record?.full_name || record?.student_name || record?.employee_name || '';
    }
    if (['uid', 'admissionnumber', 'employeeid', 'studentid', 'admission_number', 'employee_id', 'student_id'].includes(nk)) {
      return record?.uid || record?.admission_number || record?.employee_id || record?.student_id || String(record?.id || '');
    }
    if (['class', 'classname', 'class_name', 'extrafield'].includes(nk)) {
      return record?.extraField || record?.school_class_name || record?.class_name || '';
    }
    if (['department', 'dept', 'departmentname'].includes(nk)) {
      return record?.department_name || record?.department || '';
    }
    if (['division', 'divisionname', 'division_name', 'section'].includes(nk)) {
      return record?.division || record?.division_name || record?.section || '';
    }
    if (['branch', 'branchname', 'branch_name'].includes(nk)) {
      return record?.branch_name || record?.branch || '';
    }
    if (['address', 'addressline1', 'addressline2'].includes(nk)) {
      return record?.address || record?.address_line_1 || record?.address_line_2 || '';
    }
    if (['bloodgroup', 'blood', 'blood_group', 'bloodtype'].includes(nk)) {
      return record?.blood_group || record?.bloodGroup || record?.blood || '';
    }
    if (['phone', 'phonenumber', 'mobilenumber', 'mobile', 'phone_number', 'mobile_number'].includes(nk)) {
      return record?.phone || record?.mobile_number || record?.phone_number || record?.parent_mobile || '';
    }
    if (['email', 'emailaddress', 'email_address'].includes(nk)) {
      return record?.email || record?.email_address || '';
    }

    return '';
  });
}

function resolveFieldValue(key: string, record: any): string {
  if (!key || !record) return '';
  if (key.startsWith('el_') || key.startsWith('elem_') || /^[a-f0-9-]{8,}$/.test(key)) return '';

  const customData = record?.custom_data || record?.custom_fields || record?.data || {};

  if (record[key] !== undefined && record[key] !== null && typeof record[key] !== 'object') return String(record[key]);
  const dk = Object.keys(record).find(k => normalize(k) === normalize(key) && typeof record[k] !== 'object');
  if (dk && record[dk] !== undefined && record[dk] !== null) return String(record[dk]);

  if (customData[key] !== undefined && customData[key] !== null) return String(customData[key]);
  const ck = Object.keys(customData).find(k => normalize(k) === normalize(key));
  if (ck && customData[ck] !== undefined) return String(customData[ck]);

  const rowData = record?.rowData || {};
  if (rowData[key] !== undefined && rowData[key] !== null) return String(rowData[key]);
  const rk = Object.keys(rowData).find(k => normalize(k) === normalize(key));
  if (rk && rowData[rk] !== undefined) return String(rowData[rk]);

  return resolveTokens(`{{${key}}}`, record);
}

export function TemplateRenderer({
  elements,
  side,
  recordData = {},
  isDesignerMode = false,
  selectedId = null,
  editingId = null,
  repositionMode = false,
  editingRef,
  zoom = 1,
  onElementMouseDown,
  onElementTouchStart,
  onRotateMouseDown,
  onRotateTouchStart,
  onResizeMouseDown,
  onResizeTouchStart,
  onDuplicate,
  onDelete,
  onTextChange,
  onTextBlur,
  onStartEditing,
  onPlaceholderUpload,
}: TemplateRendererProps) {
  
  const getTypeWeight = (el: any): number => {
    const t = String(el.type || '').toUpperCase();
    if (t === 'SHAPE') return 1;
    if (t === 'IMAGE') return 2;
    if (['PHOTO', 'PHOTO_FRAME', 'PREMIUMPHOTOFRAME', 'IMAGE_FIELD', 'LOGO', 'SIGNATURE'].includes(t) || ['photo', 'profile_photo', 'signature', 'logo', 'student_photo', 'parent_photo'].includes(el.name)) return 3;
    if (t === 'TEXT' || t === 'FIELD') return 4;
    if (t === 'QRCODE' || t === 'QR' || t === 'QR_CODE') return 5;
    if (t === 'BARCODE') return 6;
    return 0;
  };

  const sortedElements = React.useMemo(() => {
    return [...elements]
      .filter((el) => !el.hidden && (String(el.side).toUpperCase() === side.toUpperCase()))
      .sort((a, b) => {
        const la = a.layerIndex ?? a.zIndex ?? a.z_index ?? 0;
        const lb = b.layerIndex ?? b.zIndex ?? b.z_index ?? 0;
        if (la !== lb) return la - lb;
        return getTypeWeight(a) - getTypeWeight(b);
      });
  }, [elements, side]);

  return (
    <>
      {sortedElements.map((el) => {
        const isSelected = el.id === selectedId;
        const typeUpper = String(el.type || '').toUpperCase();

        const outerStyle: React.CSSProperties = {
          position: 'absolute',
          left: el.x !== undefined ? el.x : 0,
          top: el.y !== undefined ? el.y : 0,
          width: el.width || 100,
          height: el.height || 25,
          transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
          transformOrigin: 'center center',
          opacity: el.opacity !== undefined ? el.opacity : 1,
          zIndex: (el.layerIndex ?? 0) + (isDesignerMode ? 2 : 1),
          userSelect: 'none',
          boxSizing: 'border-box',
          outline: isDesignerMode && isSelected ? (el.locked ? '2.5px solid #F59E0B' : '2.5px solid #3A75FF') : 'none',
          cursor: isDesignerMode ? (el.locked ? 'pointer' : (repositionMode && isSelected ? 'grab' : 'move')) : 'default',
        };

        const renderContent = () => {
          // ── TEXT / FIELD ───────────────────────────────────────────────────
          if (typeUpper === 'TEXT' || typeUpper === 'FIELD') {
            const minScale = el.minFontScale ?? el.style?.minFontScale ?? 0.5;
            const maxScale = el.maxFontScale ?? el.style?.maxFontScale ?? 2.5;
            const paddingX = el.paddingX ?? el.style?.paddingX ?? 1.5;
            const padLeft = paddingX * MM_TO_PX;
            const padRight = paddingX * MM_TO_PX;

            if (isDesignerMode) {
              const elText = el.text || el.sampleValue || 'Text';
              const calculatedFontSize = getResponsiveFontSize(
                elText,
                el.width,
                el.height,
                padLeft,
                minScale,
                maxScale
              );

              if (editingId === el.id) {
                return (
                  <input
                    type="text"
                    ref={editingRef as any}
                    autoFocus
                    value={el.text || ''}
                    onChange={(ev) => onTextChange?.(el.id, ev.target.value)}
                    onBlur={() => onTextBlur?.(el.id, el.text)}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Escape') {
                        onTextBlur?.(el.id, el.text);
                      }
                      ev.stopPropagation();
                    }}
                    onClick={(ev) => ev.stopPropagation()}
                    onMouseDown={(ev) => ev.stopPropagation()}
                    className="w-full h-full bg-transparent border-0 outline-none p-0 m-0"
                    style={{
                      fontFamily: getFontFamily(el.fontFamily),
                      fontSize: `${calculatedFontSize}px`,
                      fontWeight: el.fontWeight === 'semibold' ? 600 : el.fontWeight === 'medium' ? 500 : el.fontWeight === 'bold' ? 700 : 400,
                      color: el.color || el.textColor || '#111827',
                      textAlign: el.textAlign || 'left',
                      fontStyle: el.italic ? 'italic' : 'normal',
                      letterSpacing: `${el.letterSpacing || 0}px`,
                      lineHeight: el.lineHeight || 1.2,
                      opacity: el.opacity !== undefined ? el.opacity : 1,
                      paddingLeft: padLeft,
                      paddingRight: padRight,
                      paddingTop: 0,
                      paddingBottom: 0,
                      boxSizing: 'border-box',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden'
                    }}
                  />
                );
              }
              return (
                <div
                  className="w-full h-full select-none flex items-center cursor-text"
                  onDoubleClick={(ev) => {
                    ev.stopPropagation();
                    if (!el.locked) onStartEditing?.(el.id);
                  }}
                  style={{
                    fontFamily: getFontFamily(el.fontFamily),
                    fontSize: `${calculatedFontSize}px`,
                    fontWeight: el.fontWeight === 'semibold' ? 600 : el.fontWeight === 'medium' ? 500 : el.fontWeight === 'bold' ? 700 : (typeUpper === 'FIELD' ? 700 : 400),
                    color: el.color || el.textColor || '#111827',
                    textAlign: el.textAlign || 'left',
                    fontStyle: el.italic ? 'italic' : 'normal',
                    letterSpacing: `${el.letterSpacing || 0}px`,
                    justifyContent: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start',
                    lineHeight: el.lineHeight || 1.2,
                    opacity: el.opacity !== undefined ? el.opacity : 1,
                    paddingLeft: padLeft,
                    paddingRight: padRight,
                    paddingTop: 0,
                    paddingBottom: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      width: '100%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'clip',
                      textAlign: el.textAlign || el.align || el.style?.textAlign || el.style?.align || 'center',
                    }}
                  >
                    {el.text}
                  </span>
                </div>
              );
            }

            // Static Render Mode
            let resolvedText = '';
            if (el.field_key && recordData[el.field_key] !== undefined) {
              resolvedText = String(recordData[el.field_key]);
            } else {
              const rawText = el.text || '';
              if (rawText.includes('{{')) {
                resolvedText = resolveTokens(rawText, recordData);
              } else if (typeUpper === 'FIELD') {
                const key = el.dataKey || el.name || el.field_key || el.field_name || '';
                resolvedText = resolveFieldValue(key, recordData);
              } else {
                const isId = rawText.startsWith('el_') || rawText.startsWith('elem_') || /^[a-f0-9-]{8,}$/.test(rawText);
                resolvedText = isId ? '' : rawText;
              }
            }

            const isRealRecord = recordData && recordData.id !== 'preview';
            if (isRealRecord && resolvedText) {
              const cleaned = resolvedText.trim();
              if (
                cleaned === 'Jane Doe' ||
                cleaned === 'PREVIEW-123' ||
                cleaned === 'student_name' ||
                cleaned === 'employee_name' ||
                cleaned === 'student_id' ||
                cleaned === 'employee_id' ||
                cleaned.startsWith('el_') ||
                cleaned.startsWith('elem_') ||
                /^[a-f0-9-]{8,}$/.test(cleaned)
              ) {
                resolvedText = '';
              }
            }

            const calculatedFontSize = getResponsiveFontSize(
              resolvedText,
              el.width,
              el.height,
              padLeft,
              minScale,
              maxScale
            );
            return (
              <span
                style={{
                  width: '100%',
                  height: '100%',
                  fontSize: `${calculatedFontSize}px`,
                  fontFamily: getFontFamily(el.fontFamily),
                  fontWeight: el.fontWeight || 'normal',
                  fontStyle: el.italic ? 'italic' : 'normal',
                  color: el.textColor || el.color || el.fill || '#111827',
                  backgroundColor: 'transparent',
                  textAlign: el.textAlign || el.align || 'center',
                  letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : 'normal',
                  lineHeight: el.lineHeight || '1.25',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: (el.textAlign || el.align) === 'left' ? 'flex-start' : (el.textAlign || el.align) === 'right' ? 'flex-end' : 'center',
                  paddingLeft: padLeft,
                  paddingRight: padRight,
                  paddingTop: 0,
                  paddingBottom: 0,
                  boxSizing: 'border-box',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    width: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'clip',
                    textAlign: el.textAlign || el.align || 'center',
                  }}
                >
                  {resolvedText}
                </span>
              </span>
            );
          }

          // ── PHOTO / PHOTO_FRAME ────────────────────────────────────────────
          const isPhotoFrame = typeUpper === 'PHOTO_FRAME' || typeUpper === 'PREMIUMPHOTOFRAME' || typeUpper === 'PHOTOFIELD' || !!el.frameStyle || !!el.frameId || !!el.frame;
          const isPhoto = !isPhotoFrame && (
            typeUpper === 'PHOTO' ||
            typeUpper === 'STUDENT-PHOTO' || typeUpper === 'EMPLOYEE-PHOTO' ||
            typeUpper === 'IMAGE_FIELD' ||
            (typeUpper === 'IMAGE' && (
              el.name === 'student_photo' || el.name === 'parent_photo' ||
              el.name === 'photo' || el.name === 'profile_photo' ||
              el.dataKey === 'photo' || el.dataKey === 'profile_photo'
            ))
          );

          if (isPhotoFrame) {
            const fieldKey = el.fieldKey || el.field_key || el.dataKey || 'photo';
            const rawPhoto = recordData ? (recordData[fieldKey] || recordData.photoUrl || recordData.profile_photo || recordData.photo || '') : '';
            const resolvedPhoto = isDesignerMode ? (el.imageSrc || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300') : resolveMediaUrl(rawPhoto);
            const hasPhoto = resolvedPhoto && resolvedPhoto.trim() !== '' && !resolvedPhoto.includes('dicebear.com');

            return (
              <PremiumPhotoFrame
                frameStyle={el.frameId || el.frameStyle}
                width={el.width !== undefined ? el.width : 100}
                height={el.height !== undefined ? el.height : 100}
                imageUrl={hasPhoto ? resolvedPhoto : undefined}
                borderColor={el.style?.borderColor || el.borderColor}
                borderWidth={el.style?.borderWidth || el.borderWidth}
                accentColor={el.style?.accentColor || el.accentColor}
                secondaryColor={el.style?.secondaryColor || el.secondaryColor}
                shadowColor={el.style?.shadowColor || el.shadowColor || (el.style?.shadow ? '#000000' : undefined)}
                opacity={el.opacity}
                cropScale={el.cropScale}
                cropX={el.cropX}
                cropY={el.cropY}
                isDesignerMode={isDesignerMode}
                imageFit={el.imageFit === 'contain' ? 'contain' : 'cover'}
                padding={el.padding !== undefined ? el.padding : 0}
                backgroundColor={el.backgroundColor || el.style?.backgroundColor}
                borderRadius={el.borderRadius || el.style?.borderRadius}
                frameAsset={el.frame?.asset || el.frameAsset}
                frame={el.frame}
              />
            );
          }

          if (isPhoto) {
            const fieldKey = el.field_key || el.dataKey || 'photo';
            const rawPhoto = recordData ? (recordData[fieldKey] || recordData.photoUrl || recordData.profile_photo || recordData.photo || '') : '';
            const resolvedPhoto = isDesignerMode ? (el.imageSrc || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300') : resolveMediaUrl(rawPhoto);
            const hasPhoto = resolvedPhoto && resolvedPhoto.trim() !== '' && !resolvedPhoto.includes('dicebear.com');
            const radius = el.photoShape === 'circle' ? '50%' : (el.borderRadius ? `${el.borderRadius}px` : '0px');

            const borderStyleOverride = el.stroke
              ? { border: `${el.strokeWidth || el.borderWidth || 2}px ${el.strokeStyle || 'solid'} ${el.stroke}` }
              : (el.borderWidth && el.borderColor ? { border: `${el.borderWidth}px ${el.borderStyle || 'solid'} ${el.borderColor}` } : {});

            return (
              <div
                className="w-full h-full flex items-center justify-center overflow-hidden"
                style={{
                  borderRadius: radius,
                  backgroundColor: el.fill || el.backgroundColor || '#cbd5e1',
                  ...borderStyleOverride,
                }}
              >
                {hasPhoto ? (
                  <img
                    src={resolvedPhoto}
                    alt="Portrait"
                    className="pointer-events-none w-full h-full"
                    style={{
                      objectFit: el.fit || el.imageFit || 'cover',
                      transform: `scale(${el.cropScale ?? 1}) translate(${el.cropX ?? 0}px, ${el.cropY ?? 0}px)`,
                      transformOrigin: 'center center',
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-200" />
                )}
              </div>
            );
          }

          // ── LOGO / SIGNATURE / IMAGE ───────────────────────────────────────
          const isSignature = typeUpper === 'SIGNATURE' || (typeUpper === 'IMAGE' && el.name === 'signature');
          const isLogo = typeUpper === 'LOGO' || (typeUpper === 'IMAGE' && el.name === 'logo');
          const isMedia = el.category === 'media' || typeUpper === 'IMAGE' || isLogo || isSignature;

          if (isMedia) {
            if (isDesignerMode) {
              return (
                <div
                  className="w-full h-full relative"
                  style={{
                    clipPath: getImageClipPath(el.imageShape || 'rectangle'),
                    borderRadius: `${el.borderRadius !== undefined ? el.borderRadius : 0}px`,
                    opacity: el.opacity !== undefined ? el.opacity : 1.0,
                    overflow: 'hidden',
                    borderWidth: el.borderWidth !== undefined ? `${el.borderWidth}px` : undefined,
                    borderStyle: el.borderStyle || undefined,
                    borderColor: el.borderColor || undefined,
                  }}
                >
                  {el.imageSrc ? (
                    <img
                      src={resolveMediaUrl(el.imageSrc)}
                      alt={el.label}
                      className="absolute inset-0 pointer-events-none select-none"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (el.name === 'photo' || el.name === 'Student Photo' || el.name === 'Employee Photo' || el.id === 'photo' || el.fieldName === 'photo' || el.field_key === 'photo') ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-2 text-center relative">
                      <svg className="w-1/2 h-1/2 text-slate-350" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span className="text-[10px] font-bold tracking-wider mt-1">{el.label}</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 hover:bg-slate-200/80 transition-colors text-slate-400 p-2 text-center relative border border-dashed border-slate-300">
                      <span className="text-[10px] font-bold tracking-wider">{el.label}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onPlaceholderUpload?.(e, el.id)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <span className="text-[8px] text-slate-450 mt-1 flex items-center gap-0.5">
                        <Upload size={8} /> Click Upload
                      </span>
                    </div>
                  )}
                </div>
              );
            }

            // Static Render Mode for Images
            const radius = el.borderRadius ?? 0;
            const customSrc = isSignature
              ? (recordData.signature || el.imageSrc || el.imageUrl)
              : isLogo
                ? (recordData.logo || el.imageSrc || el.imageUrl)
                : (el.imageSrc || el.imageUrl || recordData.logo || recordData.signature);
            const finalSrc = resolveMediaUrl(customSrc);

            const borderStyleOverride = el.stroke
              ? { border: `${el.strokeWidth || el.borderWidth || 2}px ${el.strokeStyle || 'solid'} ${el.stroke}` }
              : (el.borderWidth && el.borderColor ? { border: `${el.borderWidth}px ${el.borderStyle || 'solid'} ${el.borderColor}` } : {});

            if (!finalSrc) {
              if (isLogo) return (
                <div className="w-full h-full bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center" style={{ borderRadius: `${radius}px` }}>
                  <span className="text-[8px] font-bold text-indigo-500">🏢 LOGO</span>
                </div>
              );
              if (isSignature) return (
                <div className="w-full h-full bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center" style={{ borderRadius: `${radius}px` }}>
                  <span className="text-[8px] font-bold text-indigo-500">🖋️ SIGNATURE</span>
                </div>
              );
              return (
                <div className="w-full h-full bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center" style={{ borderRadius: `${radius}px` }}>
                  <span className="text-[8px] text-slate-400 font-bold">{el.label || 'IMAGE'}</span>
                </div>
              );
            }

            return (
              <div
                className="w-full h-full flex items-center justify-center overflow-hidden"
                style={{
                  clipPath: getImageClipPath(el.imageShape || 'rectangle'),
                  borderRadius: `${radius}px`,
                  ...borderStyleOverride,
                }}
              >
                <img
                  src={finalSrc}
                  alt={el.label || 'Card Asset'}
                  className="pointer-events-none w-full h-full object-contain"
                />
              </div>
            );
          }

          // ── QR CODE ────────────────────────────────────────────────────────
          if (typeUpper === 'QRCODE' || typeUpper === 'QR' || typeUpper === 'QR_CODE') {
            const key = el.fieldName || el.fieldKey || el.name || '';
            const qrText = (el.qrDataType === 'custom' ? el.qrCustomText : recordData?.[key]) || (isDesignerMode ? `{{${key}}}` : resolveFieldValue(key, recordData)) || `{{${key}}}`;
            const qrColor = el.color || el.textColor || '#000000';
            const qrBg = el.fill || el.backgroundColor || '#ffffff';
            return (
              <div className="w-full h-full p-1 flex items-center justify-center bg-white shadow-sm rounded">
                <QRCodeSVG
                  value={qrText}
                  size={Math.min(el.width, el.height) - 8}
                  fgColor={qrColor}
                  bgColor={qrBg}
                  level="M"
                  includeMargin={false}
                />
              </div>
            );
          }

          // ── BARCODE ────────────────────────────────────────────────────────
          if (typeUpper === 'BARCODE') {
            const key = el.fieldName || el.fieldKey || el.name || '';
            const barcodeVal = (el.qrDataType === 'custom' ? el.qrCustomText : recordData?.[key]) || (isDesignerMode ? '12345678' : resolveFieldValue(key, recordData)) || '12345678';
            const barcodeColor = el.color || el.textColor || '#000000';
            const barcodeBg = el.fill || el.backgroundColor || '#ffffff';
            return (
              <div className="w-full h-full p-2 bg-white flex items-center justify-center overflow-hidden shadow-sm rounded">
                <Barcode
                  value={barcodeVal}
                  width={isDesignerMode ? Math.max(1, (el.width - 20) / 100) : 0.8}
                  height={el.height - 25}
                  displayValue={!isDesignerMode && el.width > 80}
                  fontSize={6}
                  margin={0}
                  format={(el as any).barcodeFormat || 'CODE128'}
                  lineColor={barcodeColor}
                  background={barcodeBg}
                  renderer="svg"
                />
              </div>
            );
          }

          // ── SHAPES ─────────────────────────────────────────────────────────
          const isShape = typeUpper === 'SHAPE' || el.category === 'graphic' || el.category === 'decorative';

          if (isShape) {
            return (
              <JSONShapeRenderer
                shapeId={el.shapeId || el.asset}
                asset={el.asset}
                shapeType={el.shapeType}
                fill={el.fill}
                secondaryFill={el.secondaryFill}
                accentColor={el.accentColor}
                stroke={el.stroke}
                strokeWidth={el.strokeWidth || el.borderWidth}
                strokeStyle={el.strokeStyle || el.borderStyle}
                borderRadius={el.borderRadius}
                opacity={el.opacity}
                flipH={el.flipH}
                flipV={el.flipV}
                gradientEnabled={el.gradientEnabled || el.fillType === 'gradient'}
                gradientColors={el.gradientColors || (el.gradientFrom && el.gradientTo ? [el.gradientFrom, el.gradientTo] : undefined)}
                gradientDirection={el.gradientDirection}
                shadowEnabled={el.shadowEnabled}
                shadowColor={el.shadowColor}
                shadowBlur={el.shadowBlur}
                shadowOffsetX={el.shadowOffsetX}
                shadowOffsetY={el.shadowOffsetY}
              />
            );
          }
          // ── PREMIUM DESIGN ELEMENT ─────────────────────────────────────────
          const isElement = typeUpper === 'ELEMENT';
          if (isElement) {
            return (
              <VectorElement
                assetId={el.assetId}
                primaryColor={el.primaryColor}
                secondaryColor={el.secondaryColor}
                borderColor={el.borderColor}
                borderWidth={el.borderWidth}
                opacity={el.opacity}
                gradient={el.gradient}
                width={el.width}
                height={el.height}
                flipH={el.flipH}
                flipV={el.flipV}
              />
            );
          }

          return null;
        };

        const getElStyle = (element: any): React.CSSProperties => {
          const shape = element.photoShape || element.imageShape || element.shapeType;
          const isCircleOrSquare = shape === 'circle' || shape === 'circular' || shape === 'square';
          const rawW = element.width !== undefined ? element.width : 100;
          const rawH = element.height !== undefined ? element.height : 25;
          const finalW = isCircleOrSquare ? Math.min(rawW, rawH) : rawW;
          const finalH = isCircleOrSquare ? Math.min(rawW, rawH) : rawH;

          const style: React.CSSProperties = {
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
          };
          if (element.shadowBlur) {
            style.filter = `drop-shadow(${element.shadowOffsetX || 0}px ${element.shadowOffsetY || 2}px ${element.shadowBlur}px ${element.shadowColor || '#00000040'})`;
          }
          if (element.borderWidth && element.borderColor && element.type !== 'shape' && element.type !== 'photo_frame' && element.type !== 'premiumPhotoFrame') {
            style.border = `${element.borderWidth}px ${element.borderStyle || 'solid'} ${element.borderColor}`;
          }
          return style;
        };

        return (
          <div
            key={el.id}
            style={outerStyle}
            onMouseDown={isDesignerMode ? (e) => onElementMouseDown?.(e, el, side) : undefined}
            onTouchStart={isDesignerMode ? (e) => onElementTouchStart?.(e, el, side) : undefined}
          >
            <div style={getElStyle(el)}>
              {renderContent()}
            </div>
            
            {/* Interactive handles in designer mode */}
            {isDesignerMode && isSelected && !repositionMode && !el.locked && (
              <>
                <div
                  onMouseDown={onRotateMouseDown}
                  onTouchStart={onRotateTouchStart}
                  className="absolute -top-9 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-center cursor-alias hover:bg-slate-50 transition-colors"
                  title="Rotate element"
                >
                  <RotateCw size={11} className="text-[#3A75FF]" />
                </div>
                {['nw', 'ne', 'se', 'sw'].map((h) => (
                  <div
                    key={h}
                    onMouseDown={(e) => onResizeMouseDown?.(e, h as any)}
                    onTouchStart={(e) => onResizeTouchStart?.(e, h as any)}
                    className={`absolute w-3.5 h-3.5 bg-white border-2 border-[#3A75FF] rounded-full z-10 shadow-sm ${
                      h === 'nw' ? '-top-1.5 -left-1.5 cursor-nwse-resize' :
                      h === 'ne' ? '-top-1.5 -right-1.5 cursor-nesw-resize' :
                      h === 'se' ? '-bottom-1.5 -right-1.5 cursor-nwse-resize' :
                      '-bottom-1.5 -left-1.5 cursor-nwse-resize'
                    }`}
                  />
                ))}
                {['n', 'e', 's', 'w'].map((h) => (
                  <div
                    key={h}
                    onMouseDown={(e) => onResizeMouseDown?.(e, h as any)}
                    onTouchStart={(e) => onResizeTouchStart?.(e, h as any)}
                    className={`absolute bg-white border border-[#3A75FF] z-10 rounded ${
                      h === 'n' ? '-top-1 left-1/2 -translate-x-1/2 w-3.5 h-1.5 cursor-ns-resize' :
                      h === 's' ? '-bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-1.5 cursor-ns-resize' :
                      h === 'e' ? '-right-1 top-1/2 -translate-y-1/2 w-1.5 h-3.5 cursor-ew-resize' :
                      '-left-1 top-1/2 -translate-y-1/2 w-1.5 h-3.5 cursor-ew-resize'
                    }`}
                  />
                ))}
              </>
            )}
            
            {/* Interactive actions overlay toolbar */}
            {isDesignerMode && isSelected && !repositionMode && !el.locked && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-white border border-[#E5E7EB] rounded-lg shadow-md px-1 py-0.5 flex gap-1 z-35 shrink-0"
              >
                <button
                  onClick={() => onDuplicate?.(el.id)}
                  className="p-1 rounded hover:bg-slate-50 text-slate-500 hover:text-slate-900"
                  title="Duplicate"
                >
                  <Copy size={11} />
                </button>
                <button
                  onClick={() => onDelete?.(el.id)}
                  className="p-1 rounded hover:bg-rose-50 text-rose-500"
                  title="Delete"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
