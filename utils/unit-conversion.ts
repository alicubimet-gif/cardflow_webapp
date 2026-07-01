export interface Measurement1D {
  value: number;
  unit: 'mm' | 'cm';
}

export interface Dimension2D {
  width: number;
  height: number;
  unit: 'mm' | 'cm';
}

export interface Position2D {
  x: number;
  y: number;
  unit: 'mm' | 'cm';
}

export const PX_TO_MM = 0.2645833333;
export const MM_TO_PX = 3.7795275591;
export const PT_TO_PX = 1.3333333333;
export const PX_TO_PT = 0.75;

export function pxToMm(px: number): number {
  return Number((px * PX_TO_MM).toFixed(2));
}

export function pxToUnit(px: number, unit: 'mm' | 'cm'): number {
  const mm = pxToMm(px);
  if (unit === 'cm') {
    return Number((mm / 10).toFixed(4));
  }
  return Number(mm.toFixed(4));
}

export function unitToPx(value: number, unit: 'mm' | 'cm'): number {
  const mm = unit === 'cm' ? value * 10 : value;
  return mm * MM_TO_PX;
}

export function formatSizeValue(mmVal: number, unit: 'mm' | 'cm'): string {
  const val = unit === 'cm' ? mmVal / 10 : mmVal;
  return Number(val.toFixed(2)).toString() + ' ' + unit;
}

/**
 * Automatically converts legacy pixel card templates to millimeter based template configs.
 */
export function migrateTemplateToMM(canvasJson: any): any {
  if (!canvasJson || typeof canvasJson !== 'object') return canvasJson;
  const migrated = { ...canvasJson };

  // Detect cardSize structure, if missing, migrate
  if (!migrated.cardSize) {
    const orientation = migrated.orientation || 'vertical';
    const pxW = migrated.cardWidth || migrated.width || migrated.cardWidthPx || (orientation === 'vertical' ? 638 : 1013);
    const pxH = migrated.cardHeight || migrated.height || migrated.cardHeightPx || (orientation === 'vertical' ? 1013 : 638);
    migrated.cardSize = {
      width: pxToMm(pxW),
      height: pxToMm(pxH),
      unit: 'mm',
      orientation: orientation
    };
  }

  if (migrated.cardSize && !migrated.cardSize.orientation) {
    migrated.cardSize.orientation = migrated.orientation || 'vertical';
  }

  // Remove px fields
  delete migrated.cardWidth;
  delete migrated.cardHeight;
  delete migrated.cardWidthPx;
  delete migrated.cardHeightPx;
  delete migrated.width;
  delete migrated.height;

  // Migrate cornerRadius
  if (migrated.cornerRadius !== undefined && typeof migrated.cornerRadius === 'number') {
    migrated.cornerRadius = {
      value: parseFloat((migrated.cornerRadius * PX_TO_MM).toFixed(4)),
      unit: 'mm'
    };
  }

  // Migrate print settings
  if (migrated.printSettings) {
    const ps = { ...migrated.printSettings };
    if (ps.margin && typeof ps.margin.top === 'number') {
      ps.margins = {
        top: parseFloat((ps.margin.top * PX_TO_MM).toFixed(4)),
        bottom: parseFloat((ps.margin.bottom * PX_TO_MM).toFixed(4)),
        left: parseFloat((ps.margin.left * PX_TO_MM).toFixed(4)),
        right: parseFloat((ps.margin.right * PX_TO_MM).toFixed(4)),
        unit: 'mm'
      };
      delete ps.margin;
    }
    if (ps.gap && typeof ps.gap.horizontal === 'number') {
      ps.gap = {
        horizontal: parseFloat((ps.gap.horizontal * PX_TO_MM).toFixed(4)),
        vertical: parseFloat((ps.gap.vertical * PX_TO_MM).toFixed(4)),
        unit: 'mm'
      };
    }
    migrated.printSettings = ps;
  }

  // Migrate elements
  if (Array.isArray(migrated.elements)) {
    migrated.elements = migrated.elements.map((el: any) => {
      if (!el || typeof el !== 'object') return el;
      const nextEl = { ...el };

      // Migrate element position
      if (!nextEl.position) {
        const x = nextEl.x !== undefined ? nextEl.x : 0;
        const y = nextEl.y !== undefined ? nextEl.y : 0;
        nextEl.position = {
          x: parseFloat((x * PX_TO_MM).toFixed(4)),
          y: parseFloat((y * PX_TO_MM).toFixed(4)),
          unit: 'mm'
        };
      }

      // Migrate element size
      if (!nextEl.size) {
        const w = nextEl.width !== undefined ? nextEl.width : 100;
        const h = nextEl.height !== undefined ? nextEl.height : 100;
        nextEl.size = {
          width: parseFloat((w * PX_TO_MM).toFixed(4)),
          height: parseFloat((h * PX_TO_MM).toFixed(4)),
          unit: 'mm'
        };
      }

      // Migrate borderWidth
      if (nextEl.borderWidth !== undefined && typeof nextEl.borderWidth === 'number') {
        nextEl.borderWidth = {
          value: parseFloat((nextEl.borderWidth * PX_TO_MM).toFixed(4)),
          unit: 'mm'
        };
      }

      // Migrate borderRadius
      if (nextEl.borderRadius !== undefined && typeof nextEl.borderRadius === 'number') {
        nextEl.borderRadius = {
          value: parseFloat((nextEl.borderRadius * PX_TO_MM).toFixed(4)),
          unit: 'mm'
        };
      }

      // Migrate fontSize
      if (nextEl.fontSize !== undefined && typeof nextEl.fontSize === 'number' && !nextEl.fontUnit) {
        nextEl.fontSize = parseFloat((nextEl.fontSize * PX_TO_MM).toFixed(4));
        nextEl.fontUnit = 'mm';
      }

      return nextEl;
    });
  }

  return migrated;
}

/**
 * Resolves a physical-unit configuration into legacy pixel formats for internal canvas rendering.
 */
export function denormalizeCanvasToPX(canvasJson: any): any {
  if (!canvasJson || typeof canvasJson !== 'object') return canvasJson;
  
  // Ensure legacy format is migrated first
  const migrated = migrateTemplateToMM(canvasJson);
  const raw = { ...migrated };

  if (raw.cardSize) {
    const unit = raw.cardSize.unit || 'mm';
    const pxW = Math.round(unitToPx(raw.cardSize.width, unit));
    const pxH = Math.round(unitToPx(raw.cardSize.height, unit));

    raw.cardWidthPx = pxW;
    raw.cardHeightPx = pxH;
    raw.width = pxW;
    raw.height = pxH;
    raw.cardWidth = pxW;
    raw.cardHeight = pxH;
  }

  // Convert cornerRadius
  if (raw.cornerRadius && typeof raw.cornerRadius === 'object') {
    const unit = raw.cornerRadius.unit || 'mm';
    raw.cornerRadius = Math.round(unitToPx(raw.cornerRadius.value, unit));
  }

  // Convert print settings
  if (raw.printSettings) {
    const ps = { ...raw.printSettings };
    if (ps.margins && typeof ps.margins === 'object') {
      const unit = ps.margins.unit || 'mm';
      ps.margin = {
        top: Math.round(unitToPx(ps.margins.top, unit)),
        bottom: Math.round(unitToPx(ps.margins.bottom, unit)),
        left: Math.round(unitToPx(ps.margins.left, unit)),
        right: Math.round(unitToPx(ps.margins.right, unit)),
      };
    }
    if (ps.gap && typeof ps.gap === 'object' && ps.gap.unit) {
      const unit = ps.gap.unit || 'mm';
      ps.gap = {
        horizontal: Math.round(unitToPx(ps.gap.horizontal, unit)),
        vertical: Math.round(unitToPx(ps.gap.vertical, unit)),
      };
    }
    raw.printSettings = ps;
  }

  // Convert elements
  if (Array.isArray(raw.elements)) {
    raw.elements = raw.elements.map((el: any) => {
      if (!el || typeof el !== 'object') return el;
      
      const unit = el.unit || 'mm';
      
      // If flat properties x, y, width, height exist and aren't wrap-objects:
      const pxX = el.x !== undefined ? Math.round(unitToPx(el.x, unit)) : 0;
      const pxY = el.y !== undefined ? Math.round(unitToPx(el.y, unit)) : 0;
      const pxW = el.width !== undefined ? Math.round(unitToPx(el.width, unit)) : 100;
      const pxH = el.height !== undefined ? Math.round(unitToPx(el.height, unit)) : 100;
      
      // Extract zIndex to layerIndex
      const layerIndex = el.zIndex !== undefined ? el.zIndex : (el.layerIndex || 0);
      const hidden = el.visible !== undefined ? !el.visible : !!el.hidden;
      const side = String(el.side || 'FRONT').toUpperCase() as 'FRONT' | 'BACK';
      
      // Flatten style and props onto element root
      const style = el.style || {};
      const props = el.props || {};
      
      const nextEl = {
        ...el,
        ...props,
        ...style,
        id: el.id,
        type: el.type || 'text',
        side,
        x: pxX,
        y: pxY,
        width: pxW,
        height: pxH,
        rotation: el.rotation || 0,
        layerIndex,
        hidden,
        locked: !!el.locked,
        opacity: el.opacity !== undefined ? el.opacity : 1
      };
      
      // Denormalize style measurements to px
      const isTextOrField = el.type === 'text' || el.type === 'field';
      if (isTextOrField) {
        nextEl.autoScale = style.autoScale ?? true;
        nextEl.baseFontSize = style.baseFontSize ?? style.fontSize ?? 3.5;
        const baseWidthMm = style.baseWidth ?? el.width ?? 45;
        nextEl.baseWidth = Math.round(unitToPx(baseWidthMm, unit));
        
        const fsVal = style.fontSize ?? 3.5;
        nextEl.fontSize = Math.round(mmToPt(fsVal));
        nextEl.fontUnit = 'pt';
        
        const padLeftMm = style.padding?.left ?? 2;
        const padRightMm = style.padding?.right ?? 2;
        nextEl.paddingLeft = Math.round(unitToPx(padLeftMm, unit));
        nextEl.paddingRight = Math.round(unitToPx(padRightMm, unit));
        nextEl.paddingTop = 0;
        nextEl.paddingBottom = 0;
      } else {
        if (style.fontSize !== undefined) {
          nextEl.fontSize = Math.round(unitToPx(style.fontSize, unit));
          nextEl.fontUnit = 'px';
        }
        if (style.borderWidth !== undefined) {
          nextEl.borderWidth = Math.round(unitToPx(style.borderWidth, unit));
        }
        if (style.borderRadius !== undefined) {
          nextEl.borderRadius = Math.round(unitToPx(style.borderRadius, unit));
        }
        if (style.strokeWidth !== undefined) {
          nextEl.strokeWidth = Math.round(unitToPx(style.strokeWidth, unit));
        }
        if (style.padding !== undefined) {
          nextEl.padding = Math.round(unitToPx(style.padding, unit));
        }
      }

      // Backward compatibility fields
      nextEl.field_key = props.dataKey || props.field_key || el.field_key || null;
      nextEl.dataKey = props.dataKey || props.field_key || el.dataKey;
      nextEl.sourceField = props.sourceField || el.sourceField;
      nextEl.source_field = props.sourceField || el.source_field;
      nextEl.source_context = props.sourceField || el.source_context;
      
      // If shape, set shapeType
      if (nextEl.type === 'shape') {
        nextEl.shapeType = props.shapeType || el.shapeType;
      }
      
      // If photo_frame or premiumPhotoFrame or image representing photo frame
      const frameObj = el.frame || props.frame || style.frame;
      const isPhotoFrameType = nextEl.type === 'premiumPhotoFrame' || nextEl.type === 'photo_frame' || nextEl.type === 'photo_field' || !!props.frameId || !!style.frameAsset || !!frameObj;
      if (isPhotoFrameType) {
        nextEl.frame = frameObj || el.frame;
        nextEl.frameId = frameObj?.id || props.frameId || props.frameStyle || el.frameId;
        nextEl.frameStyle = frameObj?.id || props.frameId || props.frameStyle || el.frameStyle;
        nextEl.imageFit = props.fit || props.imageFit || el.imageFit || el.fit;
        nextEl.fit = props.fit || props.imageFit || el.imageFit || el.fit;
        
        if (frameObj) {
          nextEl.accentColor = frameObj.primaryColor || nextEl.accentColor;
          nextEl.secondaryColor = frameObj.secondaryColor || nextEl.secondaryColor;
          nextEl.borderColor = frameObj.borderColor || nextEl.borderColor;
          if (frameObj.borderWidth !== undefined) {
            nextEl.borderWidth = Math.round(unitToPx(frameObj.borderWidth, unit));
          }
          if (frameObj.shadow !== undefined) {
            nextEl.shadowBlur = frameObj.shadow ? 8 : 0;
            nextEl.shadowColor = '#00000040';
            nextEl.shadowOffsetX = 0;
            nextEl.shadowOffsetY = 2;
          }
          if (frameObj.opacity !== undefined) {
            nextEl.opacity = frameObj.opacity;
          }
        }
      }

      if (nextEl.type === 'element') {
        nextEl.assetId = el.assetId;
        nextEl.primaryColor = style.primaryColor || el.primaryColor || '#1D4ED8';
        nextEl.secondaryColor = style.secondaryColor || el.secondaryColor || '#38BDF8';
        nextEl.gradient = style.gradient ?? el.gradient ?? false;
        nextEl.flipH = !!(style.flipH ?? el.flipH);
        nextEl.flipV = !!(style.flipV ?? el.flipV);
        nextEl.borderColor = style.borderColor || el.borderColor || '#ffffff';
        nextEl.borderWidth = style.borderWidth !== undefined ? style.borderWidth : (el.borderWidth !== undefined ? el.borderWidth : 0);
      }

      // Resolve color aliases
      nextEl.color = style.textColor || style.color || style.fill || el.color || el.fill;
      nextEl.textColor = style.textColor || style.color || el.textColor;
      nextEl.fill = style.fill || el.fill;

      return nextEl;
    });
  }

  return raw;
}

/**
 * Serializes internal pixel coordinates and dimensions into the normalized physical-unit format.
 */
export function normalizeCanvasToMM(canvasState: any, targetUnit: 'mm' | 'cm' = 'mm'): any {
  if (!canvasState || typeof canvasState !== 'object') return canvasState;
  const raw = { ...canvasState };

  const orientation = raw.orientation || 'vertical';
  const pxW = raw.cardWidth || raw.width || raw.cardWidthPx || (orientation === 'vertical' ? 638 : 1013);
  const pxH = raw.cardHeight || raw.height || raw.cardHeightPx || (orientation === 'vertical' ? 1013 : 638);

  raw.cardSize = {
    width: pxToUnit(pxW, targetUnit),
    height: pxToUnit(pxH, targetUnit),
    unit: targetUnit,
    orientation: orientation
  };

  // Deprecate legacy root properties
  delete raw.cardWidthPx;
  delete raw.cardHeightPx;
  delete raw.width;
  delete raw.height;
  delete raw.cardWidth;
  delete raw.cardHeight;

  // Convert cornerRadius
  if (raw.cornerRadius !== undefined) {
    const val = typeof raw.cornerRadius === 'object' ? raw.cornerRadius.value : raw.cornerRadius;
    raw.cornerRadius = {
      value: typeof raw.cornerRadius === 'object' ? val : pxToUnit(raw.cornerRadius, targetUnit),
      unit: targetUnit
    };
  }

  // Convert print settings
  if (raw.printSettings) {
    const ps = { ...raw.printSettings };
    if (ps.margin) {
      ps.margins = {
        top: pxToUnit(ps.margin.top, targetUnit),
        bottom: pxToUnit(ps.margin.bottom, targetUnit),
        left: pxToUnit(ps.margin.left, targetUnit),
        right: pxToUnit(ps.margin.right, targetUnit),
        unit: targetUnit
      };
      delete ps.margin;
    }
    if (ps.gap) {
      ps.gap = {
        horizontal: pxToUnit(ps.gap.horizontal, targetUnit),
        vertical: pxToUnit(ps.gap.vertical, targetUnit),
        unit: targetUnit
      };
    }
    raw.printSettings = ps;
  }

  // Convert elements
  if (Array.isArray(raw.elements)) {
    raw.elements = raw.elements.map((el: any) => {
      if (!el || typeof el !== 'object') return el;
      
      const id = el.id;
      const type = el.type || 'text';
      const side = String(el.side || 'FRONT').toLowerCase();
      
      const x = el.x !== undefined ? el.x : (el.position?.x !== undefined ? unitToPx(el.position.x, el.position.unit) : 0);
      const y = el.y !== undefined ? el.y : (el.position?.y !== undefined ? unitToPx(el.position.y, el.position.unit) : 0);
      const width = el.width !== undefined ? el.width : (el.size?.width !== undefined ? unitToPx(el.size.width, el.size.unit) : 100);
      const height = el.height !== undefined ? el.height : (el.size?.height !== undefined ? unitToPx(el.size.height, el.size.unit) : 100);
      
      const normX = parseFloat(pxToUnit(x, targetUnit).toFixed(4));
      const normY = parseFloat(pxToUnit(y, targetUnit).toFixed(4));
      const normW = parseFloat(pxToUnit(width, targetUnit).toFixed(4));
      const normH = parseFloat(pxToUnit(height, targetUnit).toFixed(4));
      
      const rotation = el.rotation || 0;
      const zIndex = el.zIndex !== undefined ? el.zIndex : (el.layerIndex || 0);
      const visible = el.visible !== undefined ? el.visible : (el.hidden !== undefined ? !el.hidden : true);
      const locked = !!el.locked;
      const opacity = el.opacity !== undefined ? el.opacity : 1;

      // Extract style: all visual styles go into style object
      const style: Record<string, any> = { ...el.style };
      
      // Font / text styling
      if (el.fontFamily !== undefined) style.fontFamily = el.fontFamily;
      const isTextOrField = type === 'text' || type === 'field';
      if (isTextOrField) {
        const bFontSize = el.baseFontSize || ptToMm(el.fontSize || 12);
        const bWidth = el.baseWidth ? pxToUnit(el.baseWidth, targetUnit) : normW;
        style.baseFontSize = parseFloat(bFontSize.toFixed(4));
        style.baseWidth = parseFloat(bWidth.toFixed(4));
        style.autoScale = el.autoScale ?? true;
        style.singleLine = true;
        style.fontSize = parseFloat(ptToMm(el.fontSize || 12).toFixed(4));
        style.fontUnit = targetUnit;
        style.padding = {
          left: 2,
          right: 2,
          unit: targetUnit
        };
      } else {
        if (el.fontSize !== undefined) {
          const fsVal = typeof el.fontSize === 'object' ? el.fontSize.value : el.fontSize;
          const fsUnit = el.fontUnit || el.fontSize?.unit || 'px';
          const fsPx = fsUnit === 'mm' || fsUnit === 'cm' ? unitToPx(fsVal, fsUnit as any) : fsVal;
          style.fontSize = parseFloat(pxToUnit(fsPx, targetUnit).toFixed(4));
        }
      }
      if (el.fontWeight !== undefined) style.fontWeight = el.fontWeight;
      if (el.textColor !== undefined || el.color !== undefined || el.fill !== undefined) {
        style.textColor = el.textColor || el.color || el.fill;
      }
      if (el.textAlign !== undefined || el.align !== undefined) style.textAlign = el.textAlign || el.align;
      if (el.italic !== undefined) style.italic = el.italic;
      if (el.letterSpacing !== undefined) {
        style.letterSpacing = el.letterSpacing;
      }
      if (el.lineHeight !== undefined) style.lineHeight = el.lineHeight;
      if (el.textDecoration !== undefined) style.textDecoration = el.textDecoration;
      if (el.textTransform !== undefined) style.textTransform = el.textTransform;
      if (el.autoScale !== undefined) style.autoScale = el.autoScale;

      // Shape styling
      if (el.fill !== undefined) style.fill = el.fill;
      if (el.fillType !== undefined) style.fillType = el.fillType;
      if (el.gradientFrom !== undefined) style.gradientFrom = el.gradientFrom;
      if (el.gradientTo !== undefined) style.gradientTo = el.gradientTo;
      if (el.gradientDirection !== undefined) style.gradientDirection = el.gradientDirection;
      if (el.stroke !== undefined) style.stroke = el.stroke;
      if (el.strokeWidth !== undefined) {
        const swVal = typeof el.strokeWidth === 'object' ? el.strokeWidth.value : el.strokeWidth;
        const swUnit = el.strokeWidth?.unit || 'px';
        const swPx = swUnit === 'mm' || swUnit === 'cm' ? unitToPx(swVal, swUnit as any) : swVal;
        style.strokeWidth = parseFloat(pxToUnit(swPx, targetUnit).toFixed(4));
      }
      if (el.strokeStyle !== undefined) style.strokeStyle = el.strokeStyle;
      if (el.borderRadius !== undefined) {
        const brVal = typeof el.borderRadius === 'object' ? el.borderRadius.value : el.borderRadius;
        const brUnit = el.borderRadius?.unit || 'px';
        const brPx = brUnit === 'mm' || brUnit === 'cm' ? unitToPx(brVal, brUnit as any) : brVal;
        style.borderRadius = parseFloat(pxToUnit(brPx, targetUnit).toFixed(4));
      }

      // Shadow styling
      if (el.shadowColor !== undefined) style.shadowColor = el.shadowColor;
      if (el.shadowBlur !== undefined) style.shadowBlur = el.shadowBlur;
      if (el.shadowOffsetX !== undefined) style.shadowOffsetX = el.shadowOffsetX;
      if (el.shadowOffsetY !== undefined) style.shadowOffsetY = el.shadowOffsetY;

      // Border styling
      if (el.borderWidth !== undefined) {
        const bwVal = typeof el.borderWidth === 'object' ? el.borderWidth.value : el.borderWidth;
        const bwUnit = el.borderWidth?.unit || 'px';
        const bwPx = bwUnit === 'mm' || bwUnit === 'cm' ? unitToPx(bwVal, bwUnit as any) : bwVal;
        style.borderWidth = parseFloat(pxToUnit(bwPx, targetUnit).toFixed(4));
      }
      if (el.borderColor !== undefined) style.borderColor = el.borderColor;
      if (el.borderStyle !== undefined) style.borderStyle = el.borderStyle;
      if (el.padding !== undefined) {
        style.padding = parseFloat(pxToUnit(el.padding, targetUnit).toFixed(4));
      }

      // Check if this represents a dynamic profile photo field
      const isPhotoField =
        type === 'image' &&
        (el.name === 'photo' ||
          el.name === 'Student Photo' ||
          el.name === 'Employee Photo' ||
          id === 'photo' ||
          (el.fieldName && el.fieldName.toLowerCase().includes('photo')) ||
          (el as any).field_key === 'photo');

      // Photo frame styling (for premium frames & photo fields)
      if (type === 'premiumPhotoFrame' || type === 'photo_frame' || el.frameStyle || el.frameId || isPhotoField) {
        style.borderColor = el.style?.borderColor || el.borderColor || '#3b82f6';
        style.borderWidth = el.style?.borderWidth !== undefined ? el.style.borderWidth : (el.borderWidth !== undefined ? parseFloat(pxToUnit(typeof el.borderWidth === 'object' ? el.borderWidth.value : el.borderWidth, targetUnit).toFixed(4)) : 3);
        style.accentColor = el.style?.accentColor || el.accentColor || '#93c5fd';
        style.secondaryColor = el.style?.secondaryColor || el.secondaryColor || '#facc15';
        style.shadowColor = el.style?.shadowColor || el.shadowColor || '#000000';
        style.shadow = el.style?.shadow !== undefined ? el.style.shadow : true;
        style.frameAsset = el.style?.frameAsset || (el.frame?.asset || `/frames/${el.frameId || el.frameStyle || 'classic_circle'}.png`);
        
        if (el.frameId || el.frameStyle || el.frame?.id) {
          style.frame = {
            id: el.frameId || el.frameStyle || el.frame?.id,
            category: el.frame?.category || el.frameCategory || 'Classic',
            primaryColor: el.accentColor || el.style?.accentColor || '#2563EB',
            secondaryColor: el.secondaryColor || el.style?.secondaryColor || '#60A5FA',
            borderColor: el.borderColor || el.style?.borderColor || '#FFFFFF',
            borderWidth: parseFloat(pxToUnit(el.borderWidth !== undefined ? el.borderWidth : 0, targetUnit).toFixed(4)),
            shadow: (el.shadowBlur || 0) > 0,
            opacity: el.opacity !== undefined ? el.opacity : 1
          };
        }
      }

      if (type === 'element' || type === 'shape') {
        style.primaryColor = el.primaryColor || el.style?.primaryColor || '#1D4ED8';
        style.secondaryColor = el.secondaryColor || el.style?.secondaryColor || '#38BDF8';
        style.gradient = el.gradient !== undefined ? el.gradient : (el.style?.gradient ?? false);
        style.flipH = !!(el.flipH ?? el.style?.flipH);
        style.flipV = !!(el.flipV ?? el.style?.flipV);
        style.borderColor = el.borderColor || el.style?.borderColor || '#ffffff';
        style.borderWidth = el.borderWidth !== undefined ? parseFloat(pxToUnit(el.borderWidth, targetUnit).toFixed(4)) : (el.style?.borderWidth !== undefined ? el.style.borderWidth : 0);
      }

      // Extract props: logical properties go into props object
      const props: Record<string, any> = { ...el.props };
      
      // Text & Field props
      if (el.text !== undefined) props.text = el.text;
      if (el.dataKey !== undefined || el.field_key !== undefined || el.fieldKey !== undefined) {
        props.dataKey = el.dataKey || el.field_key || el.fieldKey;
      }
      if (el.fieldName !== undefined || el.field_name !== undefined) props.fieldName = el.fieldName || el.field_name;
      if (el.fieldType !== undefined || el.field_type !== undefined) props.fieldType = el.fieldType || el.field_type;
      if (el.fieldId !== undefined || el.field_id !== undefined) props.fieldId = el.fieldId || el.field_id;
      if (el.organizationId !== undefined || el.organization_id !== undefined) props.organizationId = el.organizationId || el.organization_id;

      // Image / Photo props
      if (el.imageSrc !== undefined) props.imageSrc = el.imageSrc;
      if (el.imageShape !== undefined || el.photoShape !== undefined || el.shape !== undefined) {
        props.imageShape = el.imageShape || el.photoShape || el.shape;
      }
      if (el.fit !== undefined || el.imageFit !== undefined) {
        props.fit = el.fit || el.imageFit;
        props.imageFit = el.fit || el.imageFit;
      }
      if (el.cropScale !== undefined) props.cropScale = el.cropScale;
      if (el.cropX !== undefined) props.cropX = el.cropX;
      if (el.cropY !== undefined) props.cropY = el.cropY;

      // QR / Barcode props
      if (el.qrData !== undefined) props.qrData = el.qrData;
      if (el.qrDataType !== undefined) props.qrDataType = el.qrDataType;
      if (el.barcodeFormat !== undefined) props.barcodeFormat = el.barcodeFormat;
      if (el.sourceField !== undefined || el.source_field !== undefined || el.source_context !== undefined) {
        props.sourceField = el.sourceField || el.source_field || el.source_context;
      }
      if (el.qrColor !== undefined) props.qrColor = el.qrColor;
      if (el.qrBackgroundColor !== undefined) props.qrBackgroundColor = el.qrBackgroundColor;

      // Shape specific props
      if (el.shapeType !== undefined) props.shapeType = el.shapeType;

      // Premium Frame props
      if (el.frameId !== undefined || el.frameStyle !== undefined) {
        props.frameId = el.frameId || el.frameStyle;
        props.frameStyle = el.frameId || el.frameStyle;
      }
      if (el.frameName !== undefined) props.frameName = el.frameName;
      if (el.frame !== undefined) props.frame = el.frame;

      return {
        id,
        type,
        side,
        x: normX,
        y: normY,
        width: normW,
        height: normH,
        unit: targetUnit,
        rotation,
        zIndex,
        visible,
        locked,
        opacity,
        style,
        props,
        ...(el.assetId ? { assetId: el.assetId } : {}),
        ...(style.frame ? { frame: style.frame } : {})
      };
    });
  }

  return raw;
}

export function ptToMm(pt: number): number {
  return Number((pt * 1.3333333333 * 0.2645833333).toFixed(4));
}

export function mmToPt(mm: number): number {
  return Number((mm * 3.7795275591 * 0.75).toFixed(4));
}

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

export function calculateAutoFontSize(
  textVal: string,
  widthPx: number,
  heightPx: number,
  baseWidthMm: number,
  baseFontSizeMm: number,
  paddingLeftMm: number = 2,
  paddingRightMm: number = 2
): { fontSizePt: number; fontSizeMm: number } {
  const widthMm = widthPx * PX_TO_MM;
  
  const leftPadding = paddingLeftMm;
  const rightPadding = paddingRightMm;

  const baseUsableWidth = Math.max(0.1, baseWidthMm - leftPadding - rightPadding);
  const usableWidth = Math.max(0.1, widthMm - leftPadding - rightPadding);
  
  const scale = usableWidth / baseUsableWidth;
  let newFontSizeMm = baseFontSizeMm * scale;

  // Reduce font size if text overflows usable width
  const textEMs = getEstimatedTextWidthInEMs(textVal);
  const maxFittingFontSizeMm = textEMs > 0 ? (usableWidth / textEMs) : newFontSizeMm;
  
  if (newFontSizeMm > maxFittingFontSizeMm) {
    newFontSizeMm = maxFittingFontSizeMm;
  }

  // Clamp font size: min 1.5mm, max 20mm
  newFontSizeMm = Math.max(1.5, Math.min(20, newFontSizeMm));

  // Convert to pt
  const fontSizePt = mmToPt(newFontSizeMm);

  return {
    fontSizeMm: Number(newFontSizeMm.toFixed(4)),
    fontSizePt: Number(fontSizePt.toFixed(4))
  };
}

export function resolveRenderFontSize(el: any, customText?: string): number {
  if (el.autoScale) {
    const textVal = customText !== undefined ? customText : (el.text || el.sampleValue || el.name || 'Text');
    const padLeftMm = el.style?.padding?.left ?? el.padding?.left ?? 2;
    const padRightMm = el.style?.padding?.right ?? el.padding?.right ?? 2;
    const baseFontSizeMm = el.baseFontSize ?? el.style?.baseFontSize ?? 3.5;
    const baseWidthMm = el.baseWidth ? (el.baseWidth * PX_TO_MM) : (el.style?.baseWidth ?? pxToMm(el.width || 100));
    
    const { fontSizePt } = calculateAutoFontSize(
      textVal,
      el.width || 100,
      el.height || 25,
      baseWidthMm,
      baseFontSizeMm,
      padLeftMm,
      padRightMm
    );
    return fontSizePt;
  } else {
    if (el.style?.fontSize !== undefined) {
      return Number((el.style.fontSize * 3.7795275591 * 0.75).toFixed(4));
    }
    return el.fontSize || 12;
  }
}
