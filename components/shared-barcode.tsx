import React from 'react';
import Barcode from 'react-barcode';

export interface SharedBarcodeProps {
  elementId: string;
  value: string;
  width: number;       // Element width (for dynamic height calculation)
  height: number;      // Element height
  
  // Design properties read from unified JSON
  color?: string;
  backgroundColor?: string;
  backgroundMode?: string;
  barcodeFormat?: string;
  format?: string;
  lineThickness?: number;
  displayValue?: boolean;
  showText?: boolean;
  fontSize?: number;
  fontColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontWeight?: string | number;
  letterSpacing?: number;
  textAlign?: string;
  textMargin?: number;
  borderRadius?: number;
}

export function SharedBarcode({
  elementId,
  value,
  width,
  height,
  color,
  backgroundColor,
  backgroundMode,
  barcodeFormat,
  format,
  lineThickness,
  displayValue,
  showText,
  fontSize,
  fontColor,
  textColor,
  fontFamily,
  fontWeight,
  letterSpacing,
  textAlign,
  textMargin,
  borderRadius,
}: SharedBarcodeProps) {
  // Enforce single source of truth for color
  const fgColor = color || '#000000';
  
  // Background logic
  const bgMode = backgroundMode || 'transparent';
  const bgColor = bgMode === 'transparent' ? 'transparent' : (backgroundColor || '#ffffff');
  
  // Format
  const finalFormat = barcodeFormat || format || 'CODE128';
  
  // Typography & Layout
  const thickness = lineThickness !== undefined ? lineThickness : (width > 80 ? 2 : 1);
  const textVisible = displayValue !== false && showText !== false;
  const fontSz = fontSize || 10;
  const fColor = fontColor || textColor || color || '#000000';
  const fFamily = fontFamily || 'Inter';
  const fWeight = fontWeight || 500;
  
  // Barcode library applies internal margins/text heights; we need to constrain the svg
  const barcodeHeight = Math.max(10, height - (textVisible ? fontSz + 15 : 10));

  const fontOptions = (fWeight === 'bold' || fWeight === 700 || fWeight === 'semibold' || fWeight === 600) ? 'bold' : '';

  return (
    <div 
      className={`barcode-shared-${elementId}`}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bgColor,
        borderRadius: borderRadius ? `${borderRadius}px` : undefined,
        overflow: 'hidden',
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .barcode-shared-${elementId} svg {
          max-width: 100% !important;
          max-height: 100% !important;
          width: auto !important;
          height: auto !important;
          display: block;
        }
        .barcode-shared-${elementId} svg text {
          font-family: ${fFamily} !important;
          font-weight: ${fWeight} !important;
          letter-spacing: ${letterSpacing || 0}px !important;
        }
      `}} />
      <Barcode
        value={value}
        width={thickness}
        height={barcodeHeight}
        fontSize={fontSz}
        displayValue={textVisible}
        format={finalFormat as any}
        lineColor={fgColor}
        background={bgColor}
        margin={0}
        {...{ 
          fontColor: fColor,
          font: fFamily,
          fontOptions: fontOptions,
          textAlign: textAlign || 'center',
          textMargin: textMargin !== undefined ? textMargin : 2,
        } as any}
      />
    </div>
  );
}
