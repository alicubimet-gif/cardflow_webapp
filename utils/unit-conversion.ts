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

export const MM_TO_PX = 3.779527559055118;
export const PX_TO_MM = 1 / MM_TO_PX;
export const PT_TO_PX = 1.3333333333;
export const PX_TO_PT = 0.75;

export function getEstimatedTextWidthInEMs(text: string): number {
  let len = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (/[A-Z]/.test(char)) {
      len += 0.72;
    } else if (/[a-z]/.test(char)) {
      len += 0.52;
    } else if (/[0-9]/.test(char)) {
      len += 0.55;
    } else if (/\s/.test(char)) {
      len += 0.28;
    } else if (/[i1l|!.,;' ]/.test(char)) {
      len += 0.25;
    } else {
      len += 0.45;
    }
  }
  return Math.max(len, 0.5);
}

export function getResponsiveFontSize(
  text: string,
  width: number,
  height: number,
  paddingX: number,
  minFontScale = 0.5,
  maxFontScale = 2.5,
  multiline = false
): number {
  if (!text) text = 'Text';
  const usableW = Math.max(0, width - 2 * paddingX);
  const ems = getEstimatedTextWidthInEMs(text);
  
  if (!multiline) {
    const baseFontSize = height * 0.80;
    const fontSizeWidth = usableW / ems;
    const minFontSize = baseFontSize * minFontScale;
    const maxFontSize = baseFontSize * maxFontScale;
    const targetFontSize = Math.min(baseFontSize, fontSizeWidth);
    return Math.max(minFontSize, Math.min(maxFontSize, targetFontSize));
  } else {
    const singleLineSize = height * 0.80;
    const fontSizeWidth = usableW / ems;
    if (fontSizeWidth >= singleLineSize) {
      const minFontSize = singleLineSize * minFontScale;
      const maxFontSize = singleLineSize * maxFontScale;
      return Math.max(minFontSize, Math.min(maxFontSize, fontSizeWidth));
    }
    const totalNeededWidth = ems * (height * 0.40);
    const estimatedLines = Math.max(1.5, Math.ceil(totalNeededWidth / usableW));
    const targetFontSize = Math.min(height * 0.80, (height * 0.90) / estimatedLines);
    
    const minFontSize = (height * 0.80) * minFontScale;
    const maxFontSize = (height * 0.80) * maxFontScale;
    return Math.max(minFontSize, Math.min(maxFontSize, targetFontSize));
  }
}

export function doesTextFit(
  text: string,
  fontSize: number,
  usableW: number,
  height: number,
  lineHeight: number,
  multiline: boolean,
  maxLines?: number
): boolean {
  if (fontSize <= 0) return true;

  if (!multiline) {
    const ems = getEstimatedTextWidthInEMs(text);
    const textWidth = ems * fontSize;
    const textHeight = fontSize * lineHeight;
    return textWidth <= usableW && textHeight <= height;
  } else {
    const paragraphs = text.split('\n');
    let totalLines = 0;
    const spaceW = getEstimatedTextWidthInEMs(' ') * fontSize;

    for (const p of paragraphs) {
      if (p.trim() === '') {
        totalLines += 1;
        continue;
      }

      const words = p.split(' ');
      let currentLineW = 0;
      let pLines = 1;

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const wordW = getEstimatedTextWidthInEMs(word) * fontSize;

        if (wordW > usableW) {
          if (currentLineW > 0) {
            pLines++;
            currentLineW = 0;
          }
          const wordLines = Math.ceil(wordW / usableW);
          pLines += wordLines - 1;
          currentLineW = wordW % usableW;
        } else {
          const addedW = currentLineW === 0 ? wordW : spaceW + wordW;
          if (currentLineW + addedW <= usableW) {
            currentLineW += addedW;
          } else {
            pLines++;
            currentLineW = wordW;
          }
        }
      }
      totalLines += pLines;
    }

    const totalHeight = totalLines * fontSize * lineHeight;
    if (maxLines && totalLines > maxLines) {
      return false;
    }
    return totalHeight <= height;
  }
}

export function getAutoFitFontSize({
  text,
  width,
  height,
  paddingX,
  designedFontSize,
  minFontSize,
  maxFontSize,
  autoFit,
  multiline,
  lineHeight = 1.2,
  maxLines
}: {
  text: string;
  width: number;
  height: number;
  paddingX: number;
  designedFontSize: number;
  minFontSize: number;
  maxFontSize?: number;
  autoFit: boolean;
  multiline: boolean;
  lineHeight?: number;
  maxLines?: number;
}): number {
  if (!text) text = ' ';
  const usableW = Math.max(1, width - 2 * paddingX);
  const usableH = Math.max(1, height);

  // The font size configured by the designer is the absolute maximum
  const startFontSize = designedFontSize;

  // First, check if the text fits perfectly at the designed font size
  if (!autoFit || doesTextFit(text, startFontSize, usableW, usableH, lineHeight, multiline, maxLines)) {
    return startFontSize;
  }

  // If it doesn't fit, we reduce the font size until it fits using binary search
  let low = 0.1;
  let high = startFontSize;
  let optimalSize = low;

  for (let iter = 0; iter < 40; iter++) {
    const mid = (low + high) / 2;
    if (doesTextFit(text, mid, usableW, usableH, lineHeight, multiline, maxLines)) {
      optimalSize = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  // If even the smallest size doesn't fit, optimalSize will be 0.1, preventing any massive overflow.
  return Number(optimalSize.toFixed(2));
}

export function pxToMm(px: number): number {
  return px * PX_TO_MM;
}

export function pxToUnit(px: number, unit: 'mm' | 'cm'): number {
  const mm = px * PX_TO_MM;
  const val = unit === 'cm' ? mm / 10 : mm;
  return Number(val.toFixed(6));
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
      const pxX = el.x !== undefined ? unitToPx(el.x, unit) : 0;
      const pxY = el.y !== undefined ? unitToPx(el.y, unit) : 0;
      const pxW = el.width !== undefined ? unitToPx(el.width, unit) : 100;
      const pxH = el.height !== undefined ? unitToPx(el.height, unit) : 100;
      
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
      if (nextEl.type === 'text' || nextEl.type === 'field') {
        nextEl.autoFit = style.autoFit ?? nextEl.autoFit ?? (style.autoScale ?? nextEl.autoScale ?? true);
        nextEl.autoScale = nextEl.autoFit;
        if (style.minFontSize !== undefined) {
          nextEl.minFontSize = unitToPx(style.minFontSize, unit);
        } else if (el.minFontSize !== undefined) {
          nextEl.minFontSize = unitToPx(el.minFontSize, unit);
        } else {
          nextEl.minFontSize = unitToPx(1.5, unit);
        }
        if (style.maxFontSize !== undefined) {
          nextEl.maxFontSize = unitToPx(style.maxFontSize, unit);
        } else if (el.maxFontSize !== undefined) {
          nextEl.maxFontSize = unitToPx(el.maxFontSize, unit);
        } else {
          nextEl.maxFontSize = unitToPx(100.0, unit);
        }
        nextEl.minFontScale = style.minFontScale ?? nextEl.minFontScale ?? 0.5;
        nextEl.maxFontScale = style.maxFontScale ?? nextEl.maxFontScale ?? 2.5;
        
        nextEl.padding = style.padding !== undefined ? unitToPx(style.padding, unit) : (el.padding !== undefined ? unitToPx(el.padding, unit) : undefined);
        nextEl.alignment = style.alignment ?? el.alignment ?? el.textAlign ?? style.textAlign ?? 'center';
        nextEl.textAlign = nextEl.alignment;

        nextEl.paddingX = style.paddingX ?? nextEl.paddingX ?? 1.5;
        nextEl.paddingY = style.paddingY ?? nextEl.paddingY ?? 0;
        nextEl.whiteSpace = style.whiteSpace ?? nextEl.whiteSpace ?? (el.multiline ? 'normal' : 'nowrap');
        
        if (nextEl.padding !== undefined) {
          nextEl.paddingX = pxToUnit(nextEl.padding, unit);
          nextEl.paddingLeft = Math.round(nextEl.padding);
          nextEl.paddingRight = Math.round(nextEl.padding);
        } else {
          nextEl.padding = unitToPx(nextEl.paddingX, unit);
          nextEl.paddingLeft = Math.round(nextEl.padding);
          nextEl.paddingRight = Math.round(nextEl.padding);
        }
        nextEl.paddingTop = 0;
        nextEl.paddingBottom = 0;

        if (style.fontSize !== undefined) {
          nextEl.fontSize = style.fontSize;
        } else if (el.fontSize !== undefined) {
          nextEl.fontSize = el.fontSize;
        } else {
          nextEl.fontSize = 14;
        }
        if (nextEl.style) {
          delete nextEl.style.calculatedFontSize;
          delete nextEl.style.baseFontSize;
          delete nextEl.style.baseWidth;
        }
      } else {
        // Denormalize style measurements to px
        if (style.baseFontSize !== undefined) {
          nextEl.baseFontSize = style.baseFontSize;
        }
        if (style.calculatedFontSize !== undefined) {
          nextEl.fontSize = style.calculatedFontSize;
          nextEl.fontUnit = 'pt';
        } else if (style.fontSize !== undefined) {
          const fUnit = style.fontUnit || 'mm';
          if (fUnit === 'pt') {
            nextEl.fontSize = style.fontSize;
            nextEl.fontUnit = 'pt';
          } else {
            const px = unitToPx(style.fontSize, fUnit as any);
            nextEl.fontSize = Math.round(px * PX_TO_PT);
            nextEl.fontUnit = 'pt';
          }
        }
        if (style.baseWidth !== undefined) {
          nextEl.baseWidth = Math.round(unitToPx(style.baseWidth, unit));
        }
        nextEl.autoScale = style.autoScale ?? true;
        if (style.borderWidth !== undefined) {
          nextEl.borderWidth = Math.round(unitToPx(style.borderWidth, unit));
        }
        if (style.borderRadius !== undefined) {
          nextEl.borderRadius = Math.round(unitToPx(style.borderRadius, unit));
        }
        if (style.strokeWidth !== undefined) {
          nextEl.strokeWidth = Math.round(unitToPx(style.strokeWidth, unit));
        }
        if (style.padding && typeof style.padding === 'object') {
          const pUnit = style.padding.unit || unit;
          nextEl.paddingLeft = Math.round(unitToPx(style.padding.left ?? 2, pUnit));
          nextEl.paddingRight = Math.round(unitToPx(style.padding.right ?? 2, pUnit));
          nextEl.paddingTop = Math.round(unitToPx(style.padding.top ?? 1, pUnit));
          nextEl.paddingBottom = Math.round(unitToPx(style.padding.bottom ?? 1, pUnit));
        } else {
          const pLeft = el.paddingLeft ?? el.paddingX ?? 2;
          const pRight = el.paddingRight ?? el.paddingX ?? 2;
          const pTop = el.paddingTop ?? el.paddingY ?? 1;
          const pBottom = el.paddingBottom ?? el.paddingY ?? 1;
          nextEl.paddingLeft = Math.round(unitToPx(pLeft, unit));
          nextEl.paddingRight = Math.round(unitToPx(pRight, unit));
          nextEl.paddingTop = Math.round(unitToPx(pTop, unit));
          nextEl.paddingBottom = Math.round(unitToPx(pBottom, unit));
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
        nextEl.shapeId = props.shapeId || props.assetId || props.asset || el.shapeId || el.assetId || el.asset;
        nextEl.asset = props.shapeId || props.assetId || props.asset || el.shapeId || el.assetId || el.asset;
        nextEl.assetId = props.shapeId || props.assetId || props.asset || el.shapeId || el.assetId || el.asset;
        nextEl.shapeType = props.shapeType || el.shapeType || 'polygon';
        
        nextEl.fill = style.fillColor || style.fill || el.fillColor || el.fill || '#3A75FF';
        nextEl.fillColor = style.fillColor || style.fill || el.fillColor || el.fill || '#3A75FF';
        nextEl.stroke = style.strokeColor || style.stroke || el.strokeColor || el.stroke || 'none';
        nextEl.strokeColor = style.strokeColor || style.stroke || el.strokeColor || el.stroke || 'none';
        
        nextEl.secondaryFill = props.secondaryFill || style.secondaryFill || el.secondaryFill;
        nextEl.accentColor = props.accentColor || style.accentColor || el.accentColor;
        nextEl.flipH = props.flipH ?? el.flipH;
        nextEl.flipV = props.flipV ?? el.flipV;
        nextEl.gradientEnabled = props.gradientEnabled ?? el.gradientEnabled;
        nextEl.gradientColors = props.gradientColors || el.gradientColors;
        nextEl.gradientDirection = props.gradientDirection || el.gradientDirection;
        nextEl.shadowEnabled = props.shadowEnabled ?? el.shadowEnabled;
        nextEl.shadowColor = props.shadowColor || el.shadowColor;
        nextEl.shadowBlur = props.shadowBlur !== undefined ? props.shadowBlur : el.shadowBlur;
        nextEl.shadowOffsetX = props.shadowOffsetX !== undefined ? props.shadowOffsetX : el.shadowOffsetX;
        nextEl.shadowOffsetY = props.shadowOffsetY !== undefined ? props.shadowOffsetY : el.shadowOffsetY;
        nextEl.shadowOpacity = props.shadowOpacity !== undefined ? props.shadowOpacity : el.shadowOpacity;
      }
      
      // If photo_frame or premiumPhotoFrame or image representing photo frame
      const isPhotoFrameType = nextEl.type === 'premiumPhotoFrame' || nextEl.type === 'photo_frame' || nextEl.type === 'photo_field' || !!props.frameId || !!style.frameAsset || !!props.frame;
      if (isPhotoFrameType) {
        nextEl.frameId = props.frameId || props.frameStyle || el.frameId;
        nextEl.frameStyle = props.frameId || props.frameStyle || el.frameStyle;
        nextEl.frame = props.frame || el.frame;
        nextEl.imageFit = props.fit || props.imageFit || el.imageFit || el.fit;
        nextEl.fit = props.fit || props.imageFit || el.imageFit || el.fit;
      }

      // Resolve color aliases
      nextEl.color = style.textColor || style.color || style.fill || el.color || el.fill;
      nextEl.textColor = style.textColor || style.color || el.textColor;
      nextEl.fill = style.fill || el.fill;

      if (el.qr) {
        const qrUnit = el.qr.size?.unit || 'mm';
        nextEl.qr = {
          ...el.qr,
          size: {
            width: Math.round(unitToPx(el.qr.size?.width ?? 18, qrUnit)),
            height: Math.round(unitToPx(el.qr.size?.height ?? 18, qrUnit)),
            unit: 'px'
          }
        };
      }
      if (el.barcode) {
        const barUnit = el.barcode.size?.unit || 'mm';
        nextEl.barcode = {
          ...el.barcode,
          size: {
            width: Math.round(unitToPx(el.barcode.size?.width ?? 35, barUnit)),
            height: Math.round(unitToPx(el.barcode.size?.height ?? 10, barUnit)),
            unit: 'px'
          }
        };
      }

      if (nextEl.type === 'barcode') {
        nextEl.showText = props.showText !== undefined ? props.showText : (props.displayValue !== undefined ? props.displayValue : true);
        nextEl.displayValue = nextEl.showText;
        nextEl.fontFamily = props.fontFamily || el.fontFamily || 'Inter';
        nextEl.fontWeight = props.fontWeight || el.fontWeight || 500;
        nextEl.textAlign = props.textAlign || el.textAlign || 'center';
        nextEl.lineColor = props.lineColor || el.lineColor || '#000000';
        nextEl.textMargin = props.textMargin !== undefined ? props.textMargin : (el.textMargin !== undefined ? el.textMargin : 2);
        nextEl.backgroundMode = props.backgroundMode || el.backgroundMode || 'transparent';
      }

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
    raw.elements = raw.elements.filter((el: any) => el).map((el: any) => {
      if (!el || typeof el !== 'object') return el;
      
      const id = el.id;
      const type = el.type || 'text';
      const side = String(el.side || 'FRONT').toLowerCase();
      
      const x = el.x !== undefined ? el.x : (el.position?.x !== undefined ? unitToPx(el.position.x, el.position.unit) : 0);
      const y = el.y !== undefined ? el.y : (el.position?.y !== undefined ? unitToPx(el.position.y, el.position.unit) : 0);
      const width = el.width !== undefined ? el.width : (el.size?.width !== undefined ? unitToPx(el.size.width, el.size.unit) : 100);
      const height = el.height !== undefined ? el.height : (el.size?.height !== undefined ? unitToPx(el.size.height, el.size.unit) : 100);
      
      const normX = Number(pxToUnit(x, targetUnit).toFixed(6));
      const normY = Number(pxToUnit(y, targetUnit).toFixed(6));
      const normW = Number(pxToUnit(width, targetUnit).toFixed(6));
      const normH = Number(pxToUnit(height, targetUnit).toFixed(6));
      
      const rotation = el.rotation || 0;
      const zIndex = el.zIndex !== undefined ? el.zIndex : (el.layerIndex || 0);
      const visible = el.visible !== undefined ? el.visible : (el.hidden !== undefined ? !el.hidden : true);
      const locked = !!el.locked;
      const opacity = el.opacity !== undefined ? el.opacity : 1;

      // Extract style: all visual styles go into style object
      const style: Record<string, any> = { ...el.style };
      
      // Font / text styling
      if (el.fontFamily !== undefined) style.fontFamily = el.fontFamily;
      
      if (el.type === 'text' || el.type === 'field') {
        style.fontSize = el.fontSize || 14;
        style.fontUnit = el.fontUnit || 'pt';
        delete style.calculatedFontSize;
        delete style.baseFontSize;
        delete style.baseWidth;
        delete style.padding;
        
        style.autoFit = el.autoFit !== undefined ? el.autoFit : (el.autoScale !== undefined ? el.autoScale : true);
        style.autoScale = style.autoFit;
        if (el.minFontSize !== undefined) {
          style.minFontSize = Number(pxToUnit(el.minFontSize, targetUnit).toFixed(6));
        } else {
          style.minFontSize = 1.5;
        }
        if (el.maxFontSize !== undefined) {
          style.maxFontSize = Number(pxToUnit(el.maxFontSize, targetUnit).toFixed(6));
        } else {
          style.maxFontSize = 100.0;
        }
        if (el.padding !== undefined) {
          style.padding = Number(pxToUnit(el.padding, targetUnit).toFixed(6));
        } else {
          style.padding = el.paddingX !== undefined ? el.paddingX : 1.5;
        }
        style.alignment = el.alignment ?? el.textAlign ?? 'center';
        style.textAlign = style.alignment;

        style.minFontScale = el.minFontScale !== undefined ? el.minFontScale : 0.5;
        style.maxFontScale = el.maxFontScale !== undefined ? el.maxFontScale : 2.5;
        style.paddingX = el.paddingX !== undefined ? el.paddingX : 1.5;
        style.paddingY = el.paddingY !== undefined ? el.paddingY : 0;
        style.whiteSpace = el.whiteSpace !== undefined ? el.whiteSpace : (el.multiline ? 'normal' : 'nowrap');
        style.multiline = el.multiline || false;
        
        el.autoFit = style.autoFit;
        el.autoScale = style.autoScale;
        el.minFontSize = style.minFontSize;
        el.maxFontSize = style.maxFontSize;
        el.padding = style.padding;
        el.alignment = style.alignment;
        el.textAlign = style.textAlign;
        el.minFontScale = style.minFontScale;
        el.maxFontScale = style.maxFontScale;
        el.paddingX = style.paddingX;
        el.paddingY = style.paddingY;
        el.whiteSpace = style.whiteSpace;
      } else {
        if (el.fontSize !== undefined || el.font_size !== undefined) {
          const fsVal = el.fontSize || el.font_size || 12;
          const bFontSize = el.baseFontSize || fsVal;
          const bWidth = el.baseWidth || el.width || 100;
          
          style.baseFontSize = bFontSize;
          style.baseWidth = parseFloat(pxToUnit(bWidth, targetUnit).toFixed(4));
          style.autoScale = true;

          // Compute calculatedFontSize in points
          const scale = el.width / bWidth;
          const scaledFontSize = bFontSize * scale;

          // Resolve fitting limit
          const text = el.text || el.sampleValue || el.name || 'Text';
          const resolvedText = text.replace(/\{\{[^}]+\}\}/g, 'Basil Bray le laudanti');
          const lines = resolvedText.split('\n');

          // Available Content Bounds (in mm)
          const pLeft = el.paddingLeft !== undefined ? pxToUnit(el.paddingLeft, targetUnit) : 2;
          const pRight = el.paddingRight !== undefined ? pxToUnit(el.paddingRight, targetUnit) : 2;
          const pTop = el.paddingTop !== undefined ? pxToUnit(el.paddingTop, targetUnit) : 0;
          const pBottom = el.paddingBottom !== undefined ? pxToUnit(el.paddingBottom, targetUnit) : 0;

          const elW_mm = pxToUnit(el.width, targetUnit);
          const elH_mm = pxToUnit(el.height, targetUnit);
          const contentW_mm = Math.max(2, elW_mm - (pLeft + pRight));
          const contentH_mm = Math.max(2, elH_mm - (pTop + pBottom));

          // Convert dimensions to points (1mm = 2.83464 pt)
          const MM_TO_PT = 2.8346456693;
          const contentW_pt = contentW_mm * MM_TO_PT;
          const contentH_pt = contentH_mm * MM_TO_PT;

          const fsHeightMax = (contentH_pt / (Math.max(lines.length, 1) * 1.3)) * 0.95;

          let maxLineEMs = 0;
          for (const line of lines) {
            let lineLen = 0;
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (/[A-Z]/.test(char)) lineLen += 0.72;
              else if (/[a-z]/.test(char)) lineLen += 0.52;
              else if (/\s/.test(char)) lineLen += 0.28;
              else lineLen += 0.45;
            }
            maxLineEMs = Math.max(maxLineEMs, Math.max(lineLen, 1));
          }
          const fsWidthMax = (contentW_pt / maxLineEMs) * 0.95;
          const maxFittingFontSize = Math.min(fsHeightMax, fsWidthMax);

          style.calculatedFontSize = Math.round(Math.max(6, Math.min(300, Math.min(scaledFontSize, maxFittingFontSize))));
          
          style.fontSize = style.calculatedFontSize;
          style.fontUnit = 'pt';
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
      if (el.margin !== undefined) style.margin = el.margin;

      // Shape styling
      if (el.fill !== undefined || el.fillColor !== undefined) {
        style.fill = el.fill || el.fillColor;
        style.fillColor = el.fill || el.fillColor;
      }
      if (el.fillType !== undefined) style.fillType = el.fillType;
      if (el.gradientFrom !== undefined) style.gradientFrom = el.gradientFrom;
      if (el.gradientTo !== undefined) style.gradientTo = el.gradientTo;
      if (el.gradientDirection !== undefined) style.gradientDirection = el.gradientDirection;
      if (el.stroke !== undefined || el.strokeColor !== undefined) {
        style.stroke = el.stroke || el.strokeColor;
        style.strokeColor = el.stroke || el.strokeColor;
      }
      if (el.strokeWidth !== undefined) {
        const swVal = typeof el.strokeWidth === 'object' ? el.strokeWidth.value : el.strokeWidth;
        const swUnit = el.strokeWidth?.unit || 'px';
        const swPx = swUnit === 'mm' || swUnit === 'cm' ? unitToPx(swVal, swUnit as any) : swVal;
        style.strokeWidth = parseFloat(pxToUnit(swPx, targetUnit).toFixed(6));
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
      
      if (!(el.type === 'text' || el.type === 'field')) {
        // Save structured padding for non-text elements
        const pLeft = el.paddingLeft !== undefined ? pxToUnit(el.paddingLeft, targetUnit) : (el.paddingX !== undefined ? el.paddingX : (el.padding !== undefined && typeof el.padding !== 'object' ? pxToUnit(el.padding, targetUnit) : (el.padding?.left !== undefined ? el.padding.left : 2)));
        const pRight = el.paddingRight !== undefined ? pxToUnit(el.paddingRight, targetUnit) : (el.paddingX !== undefined ? el.paddingX : (el.padding !== undefined && typeof el.padding !== 'object' ? pxToUnit(el.padding, targetUnit) : (el.padding?.right !== undefined ? el.padding.right : 2)));
        const pTop = el.paddingTop !== undefined ? pxToUnit(el.paddingTop, targetUnit) : (el.paddingY !== undefined ? el.paddingY : (el.padding !== undefined && typeof el.padding !== 'object' ? pxToUnit(el.padding, targetUnit) : (el.padding?.top !== undefined ? el.padding.top : 1)));
        const pBottom = el.paddingBottom !== undefined ? pxToUnit(el.paddingBottom, targetUnit) : (el.paddingY !== undefined ? el.paddingY : (el.padding !== undefined && typeof el.padding !== 'object' ? pxToUnit(el.padding, targetUnit) : (el.padding?.bottom !== undefined ? el.padding.bottom : 1)));

        style.padding = {
          left: parseFloat(pLeft.toFixed(2)),
          right: parseFloat(pRight.toFixed(2)),
          top: parseFloat(pTop.toFixed(2)),
          bottom: parseFloat(pBottom.toFixed(2)),
          unit: targetUnit
        };
      }

      // Ensure autoScale and helper scaling values are serialized to the database template JSON

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
        // Only carry forward an explicit asset URL — never construct a /frames/*.png fallback that doesn't exist.
        // PremiumPhotoFrame handles the frame shape via its JSON-driven SVG clipPath system.
        style.frameAsset = el.style?.frameAsset || el.frame?.asset || undefined;
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
      if (el.foregroundColor !== undefined) props.foregroundColor = el.foregroundColor;
      if (el.backgroundMode !== undefined) props.backgroundMode = el.backgroundMode;
      if (el.backgroundColor !== undefined) props.backgroundColor = el.backgroundColor;
      if (el.margin !== undefined) props.margin = el.margin;
      if (el.errorCorrection !== undefined) props.errorCorrection = el.errorCorrection;
      if (el.level !== undefined) props.level = el.level;
      if (el.lineThickness !== undefined) props.lineThickness = el.lineThickness;
      if (el.displayValue !== undefined || el.showText !== undefined) {
        props.displayValue = el.displayValue !== undefined ? el.displayValue : el.showText;
        props.showText = el.showText !== undefined ? el.showText : el.displayValue;
      }
      if (el.fontSize !== undefined) props.fontSize = el.fontSize;
      if (el.fontColor !== undefined) props.fontColor = el.fontColor;
      if (el.fontFamily !== undefined) props.fontFamily = el.fontFamily;
      if (el.fontWeight !== undefined) props.fontWeight = el.fontWeight;
      if (el.textAlign !== undefined) props.textAlign = el.textAlign;
      if (el.lineColor !== undefined) props.lineColor = el.lineColor;
      if (el.textMargin !== undefined) props.textMargin = el.textMargin;
      if (el.fieldKey !== undefined) props.fieldKey = el.fieldKey;
      if (el.dataKey !== undefined) props.dataKey = el.dataKey;

      // Shape specific props
      if (el.shapeId !== undefined || el.assetId !== undefined || el.asset !== undefined) {
        props.shapeId = el.shapeId || el.assetId || el.asset;
        props.assetId = el.shapeId || el.assetId || el.asset;
        props.asset = el.shapeId || el.assetId || el.asset;
      }
      if (el.shapeType !== undefined) props.shapeType = el.shapeType;
      if (el.secondaryFill !== undefined) props.secondaryFill = el.secondaryFill;
      if (el.accentColor !== undefined) props.accentColor = el.accentColor;
      if (el.flipH !== undefined) props.flipH = el.flipH;
      if (el.flipV !== undefined) props.flipV = el.flipV;
      if (el.gradientEnabled !== undefined) props.gradientEnabled = el.gradientEnabled;
      if (el.gradientColors !== undefined) props.gradientColors = el.gradientColors;
      if (el.gradientDirection !== undefined) props.gradientDirection = el.gradientDirection;
      if (el.shadowEnabled !== undefined) props.shadowEnabled = el.shadowEnabled;
      if (el.shadowColor !== undefined) props.shadowColor = el.shadowColor;
      if (el.shadowBlur !== undefined) props.shadowBlur = el.shadowBlur;
      if (el.shadowOffsetX !== undefined) props.shadowOffsetX = el.shadowOffsetX;
      if (el.shadowOffsetY !== undefined) props.shadowOffsetY = el.shadowOffsetY;
      if (el.shadowOpacity !== undefined) props.shadowOpacity = el.shadowOpacity;

      // Premium Frame props
      if (el.frameId !== undefined || el.frameStyle !== undefined) {
        props.frameId = el.frameId || el.frameStyle;
        props.frameStyle = el.frameId || el.frameStyle;
      }
      if (el.frameName !== undefined) props.frameName = el.frameName;
      if (el.frame !== undefined) props.frame = el.frame;

      let qrNorm = undefined;
      if (el.qr) {
        const qrW = el.qr.size?.width !== undefined ? (el.qr.size.unit === 'px' ? pxToUnit(el.qr.size.width, targetUnit) : el.qr.size.width) : 18;
        const qrH = el.qr.size?.height !== undefined ? (el.qr.size.unit === 'px' ? pxToUnit(el.qr.size.height, targetUnit) : el.qr.size.height) : 18;
        qrNorm = {
          enabled: !!el.qr.enabled,
          color: el.qr.color || '#000000',
          background: el.qr.background || 'transparent',
          size: {
            width: parseFloat(qrW.toFixed(2)),
            height: parseFloat(qrH.toFixed(2)),
            unit: targetUnit
          },
          errorCorrection: el.qr.errorCorrection || 'M',
          sourceField: el.qr.sourceField
        };
      }

      let barcodeNorm = undefined;
      if (el.barcode) {
        const barW = el.barcode.size?.width !== undefined ? (el.barcode.size.unit === 'px' ? pxToUnit(el.barcode.size.width, targetUnit) : el.barcode.size.width) : 35;
        const barH = el.barcode.size?.height !== undefined ? (el.barcode.size.unit === 'px' ? pxToUnit(el.barcode.size.height, targetUnit) : el.barcode.size.height) : 10;
        barcodeNorm = {
          enabled: !!el.barcode.enabled,
          color: el.barcode.color || '#000000',
          background: el.barcode.background || 'transparent',
          format: el.barcode.format || 'CODE128',
          size: {
            width: parseFloat(barW.toFixed(2)),
            height: parseFloat(barH.toFixed(2)),
            unit: targetUnit
          },
          sourceField: el.barcode.sourceField
        };
      }

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
        ...(qrNorm ? { qr: qrNorm } : {}),
        ...(barcodeNorm ? { barcode: barcodeNorm } : {})
      };
    });
  }

  return raw;
}
