'use client';

/**
 * SharedCardRenderer (Web App Copy)
 *
 * Single shared rendering engine for CardFlow Web App previews,
 * keeping parity with the Studio canvas renderer.
 */

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { resolvePhotoUrl } from '@/services/record-service';
import PremiumPhotoFrame from './PremiumPhotoFrame';
import { denormalizeCanvasToPX } from '@/utils/unit-conversion';
import { TemplateRenderer } from './TemplateRenderer';

// Alias Studio image-resolving helpers to webapp record services
const resolveStudioImageUrl = resolvePhotoUrl;
const resolveMediaUrl = resolvePhotoUrl;

export interface SharedCardRendererProps {
  /** Raw canvas_json from the template version */
  canvasState: any;
  /** Which side to render */
  side: 'FRONT' | 'BACK';
  /** Record data to resolve dynamic fields against */
  recordData?: Record<string, any>;
  /** Optional fixed display width in px (overrides auto-scale) */
  displayWidth?: number;
  /** Optional ref forwarded to the inner card div */
  cardRef?: React.RefObject<HTMLDivElement>;
  /** Extra className for the outer wrapper */
  className?: string;
}

// ─── Field resolution helpers ─────────────────────────────────────────────────

export function getEstimatedTextWidthInEMs(text: string): number {
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

/** Resolve a {{token}} template string against a record */
export function resolveTokens(text: string, record: any): string {
  if (!text) return '';
  const customData = record?.custom_data || record?.custom_fields || record?.data || {};

  return text.replace(/\{\{([^}]+)\}\}/g, (_match, token) => {
    const rawKey = token.trim();
    const nk = normalize(rawKey);

    // 1. Direct property match
    const directKey = Object.keys(record || {}).find(
      k => normalize(k) === nk && typeof record[k] !== 'object'
    );
    if (directKey && record[directKey] !== undefined && record[directKey] !== null) {
      return String(record[directKey]);
    }

    // 2. custom_data / custom_fields / data lookup
    const customKey = Object.keys(customData).find(k => normalize(k) === nk);
    if (customKey && customData[customKey] !== undefined) {
      return String(customData[customKey]);
    }

    // 3. Standard field aliases
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

    return ''; // Unknown token
  });
}

/** Resolve a single field key from a record */
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

  return getValue(sourceField) || getValue(sourceField.replace(/[^a-zA-Z0-9]/g, '_')) || sourceField;
}

// ─── Background helper ────────────────────────────────────────────────────────

function getBackgroundStyle(bg: any, cardSettings: any, side: 'FRONT' | 'BACK', template_json?: any): React.CSSProperties {
  const sideKey = side === 'FRONT' ? 'front' : 'back';
  const sideSettings = cardSettings?.[sideKey] || template_json?.cardSettings?.[sideKey] || template_json?.canvas_json?.cardSettings?.[sideKey];
  
  const bgImageBlock = bg || template_json?.frontBackground || template_json?.backBackground || template_json?.canvas_json?.frontBackground || template_json?.canvas_json?.backBackground;
  
  let bgImage = '';
  let bgFit = 'cover';
  let bgColor = '#ffffff';

  if (sideSettings?.backgroundImage) {
    bgImage = sideSettings.backgroundImage;
  }
  if (sideSettings?.backgroundColor) {
    bgColor = sideSettings.backgroundColor;
  }

  const backgroundObj = template_json?.background || template_json?.canvas_json?.background;
  if (!bgImage && backgroundObj?.[sideKey]?.image) {
    bgImage = backgroundObj[sideKey].image;
  }

  if (!bgImage && bgImageBlock) {
    bgImage = bgImageBlock.imageData || bgImageBlock.imageSrc || bgImageBlock.url || bgImageBlock.image_url || '';
    bgFit = bgImageBlock.imageFit || bgImageBlock.fit || 'cover';
    if (bgImageBlock.color) {
      bgColor = bgImageBlock.color;
    }
  }

  if (bgImage) {
    return {
      backgroundImage: `url(${resolveStudioImageUrl(bgImage)})`,
      backgroundSize: bgFit === 'contain' ? 'contain' : bgFit === 'stretch' ? '100% 100%' : 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundColor: bgColor,
    };
  }

  if (bgImageBlock?.type === 'gradient') {
    const dir = bgImageBlock.gradientDirection || 'to-br';
    const cssDir = dir === 'to-r' ? 'to right' : dir === 'to-b' ? 'to bottom' : dir === 'to-tr' ? 'to top right' : 'to bottom right';
    return { background: `linear-gradient(${cssDir}, ${bgImageBlock.gradientFrom || '#ffffff'}, ${bgImageBlock.gradientTo || '#ffffff'})` };
  }

  return { backgroundColor: bgColor };
}

// ─── Font helper ──────────────────────────────────────────────────────────────

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

// ─── Main Component ───────────────────────────────────────────────────────────

export function SharedCardRenderer({
  canvasState,
  side,
  recordData = {},
  displayWidth,
  cardRef,
  className = '',
}: SharedCardRendererProps) {
  const canvas = React.useMemo(() => {
    return denormalizeCanvasToPX(
      canvasState?.active_version_details?.canvas_json ||
      canvasState?.active_version?.canvas_json ||
      canvasState?.canvas_json ||
      canvasState?.template_json ||
      canvasState ||
      {}
    );
  }, [canvasState]);

  const cardWidth = Number(canvas?.cardWidth || canvas?.width || canvas?.cardWidthPx || 638);
  const cardHeight = Number(canvas?.cardHeight || canvas?.height || canvas?.cardHeightPx || 1013);

  // ResizeObserver-based auto-scale when displayWidth not provided
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = React.useState(1);

  React.useEffect(() => {
    if (displayWidth !== undefined) return;
    const parent = containerRef.current?.parentElement;
    if (!parent) return;
    const update = () => {
      const s = window.getComputedStyle(parent);
      const px = parseFloat(s.paddingLeft) + parseFloat(s.paddingRight);
      const py = parseFloat(s.paddingTop) + parseFloat(s.paddingBottom);
      const availW = parent.clientWidth - (isNaN(px) ? 32 : px);
      let availH = parent.clientHeight - (isNaN(py) ? 32 : py);
      if (availH <= 0) availH = window.innerHeight * 0.8;
      setAutoScale(Math.min(availW / cardWidth, availH / cardHeight, 1));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [cardWidth, cardHeight, displayWidth]);

  const scale = displayWidth !== undefined ? displayWidth / cardWidth : autoScale;

  const bg = side === 'FRONT' ? canvas?.frontBackground : canvas?.backBackground;
  const bgStyle = getBackgroundStyle(bg, canvas?.cardSettings, side, canvas);

  const rawElements = React.useMemo(() => {
    if (canvas?.elements && canvas.elements.length > 0) {
      return canvas.elements.filter((el: any) => el.side === side);
    }
    const subEls = side === 'FRONT'
      ? (canvas?.front?.elements || canvas?.frontElements || [])
      : (canvas?.back?.elements || canvas?.backElements || []);
    const wrapper = { elements: subEls };
    const denormSub = denormalizeCanvasToPX(wrapper);
    return denormSub.elements || [];
  }, [canvas, side]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden bg-white ${className || ''}`}
      style={{
        width: cardWidth * scale,
        height: cardHeight * scale,
        minWidth: cardWidth * scale,
        minHeight: cardHeight * scale,
        borderRadius: `${(canvas?.cornerRadius || 16) * scale}px`,
        border: canvas?.border || '1px solid #DFE4EA',
      }}
    >
      {/* Elements layer — rendered at full card size then scaled */}
      <div
        ref={cardRef}
        className="absolute inset-0 z-10"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: cardWidth, height: cardHeight }}
      >
        {/* Background layer rendered at native resolution */}
        <div className="absolute inset-0 w-full h-full z-0 pointer-events-none" style={bgStyle} />
        <TemplateRenderer
          elements={rawElements}
          side={side}
          recordData={recordData}
          isDesignerMode={false}
        />
      </div>
    </div>
  );
}
