'use client';

import React from 'react';
import { resolvePhotoUrl } from '@/services/record-service';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';

export interface FieldMapping {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  side: 'FRONT' | 'BACK';
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | 'semibold';
  color?: string;
  align?: 'left' | 'center' | 'right';
  shape?: 'circular' | 'square' | 'rounded';
  borderRadius?: number;
  category?: 'text' | 'graphic' | 'media' | 'id-card' | 'decorative';
  rotation?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  imageSrc?: string;
  fit?: 'cover' | 'contain' | 'fill';
  cropScale?: number;
  cropX?: number;
  cropY?: number;
  hidden?: boolean;
  layerIndex?: number;
  dataKey?: string;
  letterSpacing?: number;
  lineHeight?: number;
}

export const isImageUrl = (src: string) => {
  if (!src) return false;
  const s = src.trim();
  return (
    s.startsWith('http://') ||
    s.startsWith('https://') ||
    s.startsWith('data:') ||
    s.startsWith('/') ||
    /\.(png|jpg|jpeg|webp|svg|gif)($|\?)/i.test(s)
  );
};

export function replaceTokens(text: string, record: any): string {
  if (!text) return '';

  // Custom data lookup fallback
  const customData = record.custom_data || record.data || {};

  return text.replace(/\{\{([^}]+)\}\}/g, (match, token) => {
    const rawKey = token.trim();
    const normalize = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedKey = normalize(rawKey);

    // Try case-insensitive normalized matching on the flattened record object
    const foundKey = Object.keys(record).find(k => normalize(k) === normalizedKey);
    if (foundKey && record[foundKey] !== undefined && typeof record[foundKey] !== 'object') {
      return String(record[foundKey]);
    }

    // Try case-insensitive normalized matching on nested custom_data/data
    const foundCustomKey = Object.keys(customData).find(k => normalize(k) === normalizedKey);
    if (foundCustomKey && customData[foundCustomKey] !== undefined) {
      return String(customData[foundCustomKey]);
    }

    // Standard fallback lookups
    if (
      normalizedKey === 'name' ||
      normalizedKey === 'fullname' ||
      normalizedKey === 'studentname' ||
      normalizedKey === 'employeename' ||
      normalizedKey === 'full_name' ||
      normalizedKey === 'student_name' ||
      normalizedKey === 'employee_name'
    ) {
      return record.name || record.full_name || record.student_name || record.employee_name || '';
    }

    if (
      normalizedKey === 'uid' ||
      normalizedKey === 'admissionnumber' ||
      normalizedKey === 'employeeid' ||
      normalizedKey === 'studentid' ||
      normalizedKey === 'admission_number' ||
      normalizedKey === 'employee_id' ||
      normalizedKey === 'student_id'
    ) {
      return record.uid || record.admission_number || record.employee_id || record.student_id || record.id || '';
    }

    if (
      normalizedKey === 'class' ||
      normalizedKey === 'classname' ||
      normalizedKey === 'department' ||
      normalizedKey === 'dept' ||
      normalizedKey === 'extrafield' ||
      normalizedKey === 'class_name'
    ) {
      return record.extraField || record.school_class_name || record.class_name || record.department_name || record.department || '';
    }

    if (
      normalizedKey === 'division' ||
      normalizedKey === 'divisionname' ||
      normalizedKey === 'division_name' ||
      normalizedKey === 'section'
    ) {
      return record.division || record.division_name || record.section || '';
    }

    if (
      normalizedKey === 'address' ||
      normalizedKey === 'addressline1' ||
      normalizedKey === 'addressline2' ||
      normalizedKey === 'address_line_1' ||
      normalizedKey === 'address_line_2'
    ) {
      return record.address || record.address_line_1 || record.address_line_2 || '';
    }

    if (
      normalizedKey === 'bloodgroup' ||
      normalizedKey === 'blood' ||
      normalizedKey === 'blood_group'
    ) {
      return record.blood_group || record.bloodGroup || record.blood || '';
    }

    if (
      normalizedKey === 'phone' ||
      normalizedKey === 'phonenumber' ||
      normalizedKey === 'mobilenumber' ||
      normalizedKey === 'mobile' ||
      normalizedKey === 'phone_number' ||
      normalizedKey === 'mobile_number'
    ) {
      return record.phone || record.mobile_number || record.phone_number || record.parent_mobile || '';
    }

    if (
      normalizedKey === 'email' ||
      normalizedKey === 'emailaddress' ||
      normalizedKey === 'email_address'
    ) {
      return record.email || record.email_address || '';
    }

    // Try custom_data nested lookup if not flattened (direct key match)
    if (customData[rawKey] !== undefined) {
      return String(customData[rawKey]);
    }

    return match; // Return the raw token if not found
  });
}

export function resolveCodeValue(
  sourceField: string | undefined,
  recordData: any,
  type: 'qr' | 'barcode'
): string {
  // Helper to extract value from recordData
  const getValue = (key: string): string | null | undefined => {
    if (!recordData) return null;

    // Check custom_data / data
    const customData = recordData.custom_data || recordData.data || {};
    if (customData[key] !== undefined) return String(customData[key]);

    // Case-insensitive lookup in customData
    const foundCustomKey = Object.keys(customData).find(
      (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === key.toLowerCase().replace(/[^a-z0-9]/g, '')
    );
    if (foundCustomKey && customData[foundCustomKey] !== undefined) return String(customData[foundCustomKey]);

    // Direct properties
    if (recordData[key] !== undefined && typeof recordData[key] !== 'object') {
      return String(recordData[key]);
    }

    // Case-insensitive lookup on direct object
    const foundDirectKey = Object.keys(recordData).find(
      (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === key.toLowerCase().replace(/[^a-z0-9]/g, '')
    );
    if (foundDirectKey && recordData[foundDirectKey] !== undefined && typeof recordData[foundDirectKey] !== 'object') {
      return String(recordData[foundDirectKey]);
    }

    return null;
  };

  if (!sourceField || sourceField.startsWith('el_')) {
    const idVal = getValue('student_id') || getValue('employee_id') || getValue('admission_number') || getValue('uid') || getValue('id') || recordData?.uid || recordData?.id;
    if (idVal) return idVal;
    return type === 'qr' ? 'QR_PLACEHOLDER' : '123456789';
  }

  // Special system / computed values:
  if (sourceField === 'url') {
    const idVal = getValue('id') || getValue('uid') || recordData?.id || recordData?.uid || '12345';
    return `https://cardflow.com/verify/${idVal}`;
  }
  if (sourceField === 'uuid') {
    return recordData?.uuid || getValue('uuid') || '8f5a109a-6c82-45e0-b618-9774a3260c87';
  }
  if (sourceField === 'id' || sourceField === 'record_id') {
    return recordData?.id || recordData?.uid || getValue('id') || getValue('uid') || '12345';
  }
  if (sourceField === 'auto_generated') {
    const idVal = recordData?.id || recordData?.uid || getValue('id') || getValue('uid') || '12345';
    return type === 'qr' ? `QR-${idVal}` : `${idVal}`;
  }
  if (sourceField === 'registration_number') {
    return getValue('registration_number') || getValue('uid') || recordData?.uid || 'REG123456';
  }

  // Look up source field value
  const val = getValue(sourceField);
  if (val !== null && val !== undefined) {
    return val;
  }

  // Fallbacks for compatibility mapping or standard fields if key not directly found
  if (sourceField === 'student_id' || sourceField === 'employee_id' || sourceField === 'admission_number') {
    return recordData?.uid || getValue('uid') || '123456789';
  }

  // If not resolved, return the record identifier instead of the raw key string:
  return recordData?.uid || recordData?.id || getValue('uid') || getValue('id') || '';
}

interface IdCardPreviewProps {
  record: any;
  templateVersion: any;
  side: 'FRONT' | 'BACK';
  scale?: number;
  className?: string;
}

export function IdCardPreview({ record, templateVersion, side, scale, className = '' }: IdCardPreviewProps) {
  const canvas = templateVersion?.canvas_json || {};
  const isSingleSided = 
    String(canvas.sides || templateVersion?.sides || '2') === '1' ||
    String(canvas.sides || templateVersion?.sides || '').toLowerCase() === 'single' ||
    String(canvas.cardSides || templateVersion?.cardSides || '').toLowerCase() === 'single';

  if (side === 'BACK' && isSingleSided) {
    return null;
  }

  const orientation = canvas.orientation || 'vertical';

  const canvasWidth = Number(canvas.cardWidth || canvas.width || (orientation === 'horizontal' ? 1013 : 638));
  const canvasHeight = Number(canvas.cardHeight || canvas.height || (orientation === 'horizontal' ? 638 : 1013));

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [parentSize, setParentSize] = React.useState({ width: canvasWidth, height: canvasHeight });

  React.useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    const updateSize = () => {
      const style = window.getComputedStyle(parent);
      const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

      const availWidth = parent.clientWidth - (isNaN(paddingX) ? 32 : paddingX);
      let availHeight = parent.clientHeight - (isNaN(paddingY) ? 32 : paddingY);
      if (availHeight <= 0) {
        availHeight = window.innerHeight * 0.8; // Safe fallback for unconstrained height
      }

      setParentSize({
        width: availWidth,
        height: availHeight
      });
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });
    observer.observe(parent);
    return () => {
      observer.disconnect();
    };
  }, [canvasWidth, canvasHeight]);

  const isVertical = canvasHeight > canvasWidth;
  const isHorizontal = canvasWidth >= canvasHeight;

  let displayScale = scale;
  if (displayScale === undefined) {
    displayScale = Math.min(
      parentSize.width / canvasWidth,
      parentSize.height / canvasHeight,
      1
    );
  }

  const bg = side === 'FRONT' ? canvas.frontBackground : canvas.backBackground;

  const getBackgroundStyle = (): React.CSSProperties => {
    if (!bg) return { backgroundColor: '#ffffff' };

    const imageSrc = bg.imageData || bg.imageSrc || bg.url;
    if (imageSrc) {
      return {
        backgroundImage: `url(${resolvePhotoUrl(imageSrc)})`,
        backgroundSize: bg.imageFit === 'contain' ? 'contain' : bg.imageFit === 'stretch' ? '100% 100%' : 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: bg.color || (side === 'FRONT' ? '#ffffff' : '#ffffff')
      };
    }

    if (bg.type === 'gradient') {
      const dir = bg.gradientDirection || 'to-br';
      const cssDir = dir === 'to-r' ? 'to right' : dir === 'to-b' ? 'to bottom' : dir === 'to-tr' ? 'to top right' : 'to bottom right';
      return { background: `linear-gradient(${cssDir}, ${bg.gradientFrom || '#ffffff'}, ${bg.gradientTo || '#ffffff'})` };
    }

    return { backgroundColor: bg.color || '#ffffff' };
  };

  const getFontFamily = (family?: string) => {
    if (!family) return 'inherit';
    const maps: Record<string, string> = {
      'Outfit': 'Outfit, sans-serif',
      'Inter': 'Inter, sans-serif',
      'Roboto': 'Roboto, sans-serif',
      'monospace': 'monospace',
    };
    return maps[family] || family;
  };

  const tplJson = templateVersion?.canvas_json || templateVersion || {};
  const elements = side === 'FRONT'
    ? (tplJson.front?.elements || tplJson.frontElements || tplJson.elements?.filter((el: any) => el.side === 'FRONT') || [])
    : (tplJson.back?.elements || tplJson.backElements || tplJson.elements?.filter((el: any) => el.side === 'BACK') || []);

  const getElementTypeWeight = (el: any): number => {
    const typeUpper = String(el.type || el.element_type || '').toUpperCase();
    const isShape = typeUpper === 'SHAPE' || el.category === 'graphic' || el.category === 'decorative';
    if (isShape) return 1;

    const isPhoto = typeUpper === 'PHOTO' ||
      typeUpper === 'PHOTO_FRAME' ||
      typeUpper === 'STUDENT-PHOTO' ||
      typeUpper === 'EMPLOYEE-PHOTO' ||
      typeUpper === 'IMAGE_FIELD' ||
      (typeUpper === 'IMAGE' &&
        (el.name === 'student_photo' ||
          el.name === 'parent_photo' ||
          el.name === 'photo' ||
          el.name === 'profile_photo' ||
          el.dataKey === 'photo' ||
          el.dataKey === 'profile_photo'));
    const isSignature = typeUpper === 'SIGNATURE' || (typeUpper === 'IMAGE' && el.name === 'signature');
    const isLogo = typeUpper === 'LOGO' || (typeUpper === 'IMAGE' && el.name === 'logo');
    const isMedia = el.category === 'media' || typeUpper === 'IMAGE' || isLogo || isSignature;
    
    if (isPhoto || isMedia) return 2;

    if (typeUpper === 'TEXT' || typeUpper === 'FIELD') return 3;

    if (typeUpper === 'QRCODE' || typeUpper === 'QR_CODE' || typeUpper === 'BARCODE') return 4;

    return 0;
  };

  // Filter and sort by layerIndex / z_index, and then type weight
  const sorted = [...elements]
    .filter(el => !el.hidden && (el.side === side || !el.side))
    .sort((a, b) => {
      const zA = a.layerIndex ?? a.z_index ?? 0;
      const zB = b.layerIndex ?? b.z_index ?? 0;
      if (zA !== zB) {
        return zA - zB;
      }
      return getElementTypeWeight(a) - getElementTypeWeight(b);
    });

  const getElementStyle = (el: any): React.CSSProperties => {
    const x = el.x !== undefined ? el.x : (el.position_x !== undefined ? el.position_x : 0);
    const y = el.y !== undefined ? el.y : (el.position_y !== undefined ? el.position_y : 0);

    return {
      position: 'absolute',
      left: x,
      top: y,
      width: el.width || 100,
      height: el.height || 25,
      transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      transformOrigin: 'center center',
      opacity: el.opacity ?? 1,
      zIndex: (el.layerIndex ?? 0) + 1,
      userSelect: 'none',
      boxSizing: 'border-box',
    };
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden bg-white shadow-md ${className}`}
      style={{
        width: canvasWidth * displayScale,
        height: canvasHeight * displayScale,
        minWidth: canvasWidth * displayScale,
        minHeight: canvasHeight * displayScale,
        borderRadius: `${(canvas.borderRadius || 16) * displayScale}px`,
        border: canvas.border || '1px solid #DFE4EA',
        transition: 'transform 0.2s ease-in-out',
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .record-preview-wrapper {
          width: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: auto !important;
          padding: 16px !important;
        }
      `}} />
      {/* Background Section */}
      <div
        className="absolute inset-0 w-full h-full z-0 pointer-events-none"
        style={getBackgroundStyle()}
      />

      {/* Render elements */}
      <div
        className="absolute inset-0 z-10"
        style={{
          transform: `scale(${displayScale})`,
          transformOrigin: 'top left',
          width: canvasWidth,
          height: canvasHeight
        }}
      >
        {sorted.map((el) => {
          const typeUpper = String(el.type || el.element_type || '').toUpperCase();

          // 1. Text Elements
          if (typeUpper === 'TEXT' || typeUpper === 'FIELD') {
            let resolvedText = '';
            if (el.field_key && record[el.field_key] !== undefined) {
              resolvedText = String(record[el.field_key]);
            } else {
              resolvedText = el.text || '';
              if (resolvedText.includes('{{')) {
                resolvedText = replaceTokens(resolvedText, record);
              } else if (typeUpper === 'FIELD') {
                const key = el.dataKey || el.name || el.text || el.field_key || el.field_name || '';
                resolvedText = replaceTokens(`{{${key}}}`, record);
                if (resolvedText === `{{${key}}}`) {
                  resolvedText = el.text || ''; // fallback to text if key is not found
                }
              }
            }

            const textStyle: React.CSSProperties = {
              width: '100%',
              height: '100%',
              fontSize: `${el.fontSize || 10}px`,
              fontFamily: getFontFamily(el.fontFamily),
              fontWeight: el.fontWeight || 'normal',
              color: el.color || el.fill || '#000000',
              textAlign: el.textAlign || el.align || 'center',
              letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : 'normal',
              lineHeight: el.lineHeight || '1.25',
              display: 'flex',
              alignItems: 'center',
              justifyContent: (el.textAlign || el.align) === 'left' ? 'flex-start' : (el.textAlign || el.align) === 'right' ? 'flex-end' : 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            };

            return (
              <div key={el.id} style={getElementStyle(el)} className="px-1">
                <span style={textStyle}>{resolvedText}</span>
              </div>
            );
          }

          // 2. Photos / Photo Frames
          const isPhoto = typeUpper === 'PHOTO' ||
            typeUpper === 'PHOTO_FRAME' ||
            typeUpper === 'STUDENT-PHOTO' ||
            typeUpper === 'EMPLOYEE-PHOTO' ||
            typeUpper === 'IMAGE_FIELD' ||
            (typeUpper === 'IMAGE' &&
              (el.name === 'student_photo' ||
                el.name === 'parent_photo' ||
                el.name === 'photo' ||
                el.name === 'profile_photo' ||
                el.dataKey === 'photo' ||
                el.dataKey === 'profile_photo'));

          if (isPhoto) {
            const fieldKey = el.field_key || el.dataKey || 'photo';
            const rawPhoto = record[fieldKey] || record.photoUrl || record.profile_photo || record.photo || '';
            const photoUrl = resolvePhotoUrl(rawPhoto);
            const hasPhoto = photoUrl && isImageUrl(photoUrl);
            const radius = el.photoShape === 'circle' ? '50%' : el.photoShape === 'rounded' ? `${el.borderRadius || 12}px` : (el.borderRadius ? `${el.borderRadius}px` : '0px');

            return (
              <div
                key={el.id}
                style={{
                  ...getElementStyle(el),
                  borderRadius: radius,
                  border: el.stroke ? `${el.strokeWidth || el.borderWidth || 2}px ${el.strokeStyle || 'solid'} ${el.stroke}` : (el.strokeWidth ? `${el.strokeWidth}px solid ${el.color || '#ffffff'}` : 'none'),
                  backgroundColor: el.fill || '#cbd5e1',
                  overflow: 'hidden',
                }}
                className="shadow-sm flex items-center justify-center"
              >
                {hasPhoto ? (
                  <img
                    src={photoUrl}
                    alt={record.name || 'Photo'}
                    className="pointer-events-none w-full h-full"
                    crossOrigin="anonymous"
                    style={{
                      objectFit: el.fit || 'cover',
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

          // 3. Image elements / Logos / Signatures
          const isSignature = typeUpper === 'SIGNATURE' || (typeUpper === 'IMAGE' && el.name === 'signature');
          const isLogo = typeUpper === 'LOGO' || (typeUpper === 'IMAGE' && el.name === 'logo');
          const isMedia = el.category === 'media' || typeUpper === 'IMAGE' || isLogo || isSignature;

          if (isMedia) {
            const radius = el.borderRadius ?? 0;
            const customSrc = isSignature
              ? (record.signature || el.imageSrc || el.imageUrl)
              : isLogo
                ? (record.logo || el.imageSrc || el.imageUrl)
                : (el.imageSrc || el.imageUrl);

            const finalSrc = resolvePhotoUrl(customSrc);

            if (!finalSrc) {
              if (isLogo) {
                return (
                  <div key={el.id} style={{ ...getElementStyle(el), border: '1px dashed #cbd5e1', borderRadius: `${radius}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#6366f1' }}>
                    <span className="text-[8px] font-bold">🏢 LOGO</span>
                  </div>
                );
              } else if (isSignature) {
                return (
                  <div key={el.id} style={{ ...getElementStyle(el), border: '1px dashed #cbd5e1', borderRadius: `${radius}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#64748b' }}>
                    <span className="text-[8px] font-serif italic">Signature</span>
                  </div>
                );
              }
              return null;
            }

            return (
              <div
                key={el.id}
                style={{
                  ...getElementStyle(el),
                  borderRadius: `${radius}px`,
                  border: el.stroke ? `${el.strokeWidth || 1}px ${el.strokeStyle || 'solid'} ${el.stroke}` : 'none',
                  backgroundColor: el.fill || 'transparent',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={finalSrc}
                  alt={el.name || 'Media Asset'}
                  crossOrigin="anonymous"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: el.fit || 'contain',
                    transform: `scale(${el.cropScale ?? 1}) translate(${el.cropX ?? 0}px, ${el.cropY ?? 0}px)`,
                    transformOrigin: 'center center',
                  }}
                />
              </div>
            );
          }

          // 4. QR and Barcodes
          if (typeUpper === 'QRCODE' || typeUpper === 'QR_CODE') {
            const source = el.source_field || el.source_context || el.dataKey;
            const qrVal = resolveCodeValue(source, record, 'qr');
            return (
              <div key={el.id} style={getElementStyle(el)} className="bg-white p-1 rounded border border-slate-100 flex items-center justify-center shadow-sm">
                <QRCodeSVG
                  value={qrVal}
                  size={Math.min(el.width, el.height) - 4}
                  level="M"
                  includeMargin={false}
                />
              </div>
            );
          }

          if (typeUpper === 'BARCODE') {
            const source = el.source_field || el.source_context || el.dataKey;
            const barcodeVal = resolveCodeValue(source, record, 'barcode');
            return (
              <div key={el.id} style={getElementStyle(el)} className="bg-white p-1 rounded border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                <Barcode
                  value={barcodeVal}
                  width={0.8}
                  height={el.height - 12}
                  fontSize={6}
                  displayValue={el.width > 80}
                  margin={0}
                  format={el.barcodeFormat || 'CODE128'}
                />
              </div>
            );
          }

          // 5. Shapes / Graphics
          const isShape = typeUpper === 'SHAPE' || el.category === 'graphic' || el.category === 'decorative';

          if (isShape) {
            const radius = el.borderRadius ?? 0;
            const fillVal = el.fill || '#cbd5e1';
            const borderVal = el.stroke ? `${el.strokeWidth || 1}px ${el.strokeStyle || 'solid'} ${el.stroke}` : 'none';
            const shapeType = String(el.shapeType || el.type || '').toLowerCase();

            if (shapeType === 'circle') {
              return (
                <div
                  key={el.id}
                  style={{
                    ...getElementStyle(el),
                    backgroundColor: fillVal,
                    border: borderVal,
                    borderRadius: '50%'
                  }}
                />
              );
            }
            if (shapeType === 'line' || shapeType === 'divider') {
              const thickness = el.strokeWidth || 2;
              return (
                <div
                  key={el.id}
                  style={{
                    ...getElementStyle(el),
                    borderTop: `${thickness}px ${shapeType === 'divider' ? 'dashed' : 'solid'} ${el.stroke || fillVal}`,
                    height: '0px'
                  }}
                />
              );
            }
            if (shapeType === 'triangle') {
              return (
                <div key={el.id} style={getElementStyle(el)}>
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polygon points="50,0 0,100 100,100" fill={fillVal} stroke={el.stroke || 'transparent'} strokeWidth={el.strokeWidth ? el.strokeWidth * 2 : 0} />
                  </svg>
                </div>
              );
            }
            if (shapeType === 'star') {
              return (
                <div key={el.id} style={getElementStyle(el)}>
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polygon points="50,2.5 64.3,31.7 96.6,36.4 73.2,59.2 78.7,91.4 50,76.3 21.3,91.4 26.8,59.2 3.4,36.4 35.7,31.7" fill={fillVal} stroke={el.stroke || 'transparent'} strokeWidth={el.strokeWidth ? el.strokeWidth * 2 : 0} />
                  </svg>
                </div>
              );
            }
            if (shapeType === 'badge') {
              return (
                <div key={el.id} style={getElementStyle(el)}>
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M50,5 L90,25 L90,65 C90,80 70,95 50,98 C30,95 10,80 10,65 L10,25 Z" fill={fillVal} stroke={el.stroke || 'transparent'} strokeWidth={el.strokeWidth ? el.strokeWidth * 2 : 0} />
                  </svg>
                </div>
              );
            }
            if (shapeType === 'border-frame') {
              return (
                <div
                  key={el.id}
                  style={{
                    ...getElementStyle(el),
                    backgroundColor: fillVal === '#cbd5e1' ? 'transparent' : fillVal,
                    border: `${el.strokeWidth || 3}px solid ${el.stroke || '#6366f1'}`,
                    borderRadius: `${radius}px`
                  }}
                />
              );
            }
            if (shapeType === 'gradient-shape') {
              const colors = el.gradientColors || ['#4f46e5', '#2563eb'];
              return (
                <div
                  key={el.id}
                  style={{
                    ...getElementStyle(el),
                    background: `linear-gradient(135deg, ${colors.join(', ')})`,
                    border: borderVal,
                    borderRadius: `${radius}px`
                  }}
                />
              );
            }
            if (shapeType === 'wave-shape') {
              return (
                <div key={el.id} style={getElementStyle(el)}>
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0,40 C30,70 70,10 100,40 L100,100 L0,100 Z" fill={fillVal} stroke={el.stroke || 'transparent'} strokeWidth={el.strokeWidth ? el.strokeWidth * 2 : 0} />
                  </svg>
                </div>
              );
            }
            if (shapeType === 'corner-pattern') {
              return (
                <div key={el.id} style={getElementStyle(el)}>
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0,0 L100,0 C100,0 70,30 30,30 C30,70 0,100 0,100 Z" fill={fillVal} stroke={el.stroke || 'transparent'} />
                  </svg>
                </div>
              );
            }
            if (shapeType === 'circle-pattern') {
              return (
                <div key={el.id} style={getElementStyle(el)}>
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <circle cx="50" cy="50" r="40" fill="none" stroke={el.stroke || fillVal} strokeWidth={el.strokeWidth || 1} opacity="0.2" />
                    <circle cx="50" cy="50" r="30" fill="none" stroke={el.stroke || fillVal} strokeWidth={el.strokeWidth || 1} opacity="0.3" />
                    <circle cx="50" cy="50" r="20" fill="none" stroke={el.stroke || fillVal} strokeWidth={el.strokeWidth || 1} opacity="0.4" />
                  </svg>
                </div>
              );
            }
            if (shapeType === 'modern-abstract-shape') {
              return (
                <div key={el.id} style={getElementStyle(el)}>
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polygon points="0,0 100,30 80,100 0,70" fill={fillVal} opacity="0.2" />
                    <polygon points="100,0 30,50 100,100" fill={el.stroke || fillVal} opacity="0.1" />
                  </svg>
                </div>
              );
            }

            const gradStyle: React.CSSProperties = {};
            if (el.fillType === 'gradient') {
              const dirMap: Record<string, string> = { 'to-r': 'to right', 'to-b': 'to bottom', 'to-br': 'to bottom right', 'to-tr': 'to top right' };
              gradStyle.background = `linear-gradient(${dirMap[el.gradientDirection || 'to-br'] || 'to bottom right'}, ${el.gradientFrom || '#4f46e5'}, ${el.gradientTo || '#2563eb'})`;
            } else {
              gradStyle.backgroundColor = fillVal;
            }

            return (
              <div
                key={el.id}
                style={{
                  ...getElementStyle(el),
                  borderRadius: radius,
                  border: borderVal,
                  ...gradStyle
                }}
              />
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
