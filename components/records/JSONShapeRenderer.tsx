import React from 'react';
import shapesData from '@/public/shapes.json';

interface JSONShapeRendererProps {
  shapeId?: string;       // e.g. "corner_modern_01"
  asset?: string;         // fallback e.g. "modern-wave"
  shapeType?: string;     // legacy fallback e.g. "rectangle"
  fill?: string;          // primary color
  secondaryFill?: string; // secondary color
  accentColor?: string;   // accent color
  stroke?: string;        // border color
  borderColor?: string;   // alias for stroke
  strokeWidth?: number;   // border width
  borderWidth?: number;   // alias for strokeWidth
  strokeStyle?: string;   // border style (solid | dashed | dotted)
  borderStyle?: string;   // alias for strokeStyle
  borderRadius?: number;
  opacity?: number;
  flipH?: boolean;
  flipV?: boolean;
  gradientEnabled?: boolean;
  gradientColors?: string[];
  gradientDirection?: string;
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number; // shadow opacity (0 to 1)
}

function applyShadowOpacity(color: string, opacity: number = 0.3): string {
  if (!color) return `rgba(0,0,0,${opacity})`;
  let hex = color.trim();
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
    let r = 0, g = 0, b = 0;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6 || hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  if (hex.startsWith('rgb')) {
    const matches = hex.match(/\d+/g);
    if (matches && matches.length >= 3) {
      return `rgba(${matches[0]}, ${matches[1]}, ${matches[2]}, ${opacity})`;
    }
  }
  return hex;
}

export default function JSONShapeRenderer({
  shapeId,
  asset,
  shapeType,
  fill = '#3A75FF',
  secondaryFill = '#60A5FA',
  accentColor = '#3B82F6',
  stroke = 'none',
  borderColor,
  strokeWidth,
  borderWidth = 0,
  strokeStyle,
  borderStyle = 'solid',
  borderRadius = 0,
  opacity = 1,
  flipH = false,
  flipV = false,
  gradientEnabled = false,
  gradientColors,
  gradientDirection,
  shadowEnabled = false,
  shadowColor = '#000000',
  shadowBlur = 4,
  shadowOffsetX = 2,
  shadowOffsetY = 2,
  shadowOpacity,
}: JSONShapeRendererProps) {
  const finalId = shapeId || asset || shapeType || 'rectangle';

  // Normalize shape matching
  let matched = shapesData.find(s => s.id === finalId);
  if (!matched) {
    const cleanId = finalId.toLowerCase().replace(/-/g, '_');
    matched = shapesData.find(s => s.id === cleanId || s.id.toLowerCase() === cleanId);
  }

  // Fallback by legacy type
  if (!matched) {
    if (finalId === 'rectangle') matched = shapesData.find(s => s.id === 'rectangle');
    else if (finalId === 'circle') matched = shapesData.find(s => s.id === 'circle');
    else if (finalId === 'line') matched = shapesData.find(s => s.id === 'line');
    else if (finalId === 'triangle') matched = shapesData.find(s => s.id === 'triangle');
    else if (finalId === 'polygon') matched = shapesData.find(s => s.id === 'hexagon');
  }

  const shapeConfig = matched || {
    id: 'rectangle',
    svgType: 'rect',
    svgProps: { x: 4, y: 4, width: 92, height: 92 }
  };

  const resolvedStroke = stroke !== 'none' && stroke !== undefined ? stroke : (borderColor !== undefined ? borderColor : 'none');
  const resolvedStrokeWidth = strokeWidth !== undefined ? strokeWidth : (borderWidth !== undefined ? borderWidth : 0);
  const resolvedStrokeStyle = strokeStyle !== undefined ? strokeStyle : (borderStyle !== undefined ? borderStyle : 'solid');
  const resolvedShadowOpacity = shadowOpacity !== undefined ? shadowOpacity : 0.3;
  const resolvedShadowColor = applyShadowOpacity(shadowColor, resolvedShadowOpacity);

  const uniqueId = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradId = `grad-${uniqueId}`;

  const mapColor = (colVal: string) => {
    if (!colVal) return 'none';
    if (colVal === 'primaryColor') {
      return gradientEnabled ? `url(#${gradId})` : fill;
    }
    if (colVal === 'secondaryColor') return secondaryFill;
    if (colVal === 'accentColor') return accentColor;
    if (colVal === 'borderColor') return resolvedStroke;
    if (colVal === 'shadowColor') return resolvedShadowColor;
    if (colVal === 'none') return 'none';
    return colVal;
  };

  const mapWidth = (wVal: any) => {
    if (wVal === 'borderWidth') return resolvedStrokeWidth;
    return wVal;
  };

  const shadowFilter = shadowEnabled
    ? `drop-shadow(${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${resolvedShadowColor})`
    : undefined;

  const renderShapeElement = (sh: any, index: number) => {
    const elType = sh.type || sh.svgType;
    const props = sh.svgProps || sh;

    const fillMapped = mapColor(props.fill);
    const strokeMapped = mapColor(props.stroke);
    const strokeWidthMapped = mapWidth(props.strokeWidth);

    let strokeDasharray: string | undefined = undefined;
    const strokeStyleMapped = props.strokeStyle || resolvedStrokeStyle;
    if (strokeStyleMapped === 'dashed') {
      strokeDasharray = '6,6';
    } else if (strokeStyleMapped === 'dotted') {
      strokeDasharray = '2,2';
    }

    const commonProps = {
      fill: fillMapped,
      stroke: strokeMapped !== 'none' ? strokeMapped : undefined,
      strokeWidth: strokeWidthMapped,
      strokeDasharray: strokeMapped !== 'none' && strokeWidthMapped > 0 ? strokeDasharray : undefined,
      opacity: props.opacity !== undefined ? props.opacity : undefined,
    };

    if (elType === 'rect') {
      return (
        <rect
          key={index}
          {...commonProps}
          x={props.x ?? 0}
          y={props.y ?? 0}
          width={props.width ?? 100}
          height={props.height ?? 100}
          rx={props.rx ?? borderRadius}
          ry={props.ry ?? borderRadius}
        />
      );
    }
    if (elType === 'circle') {
      return (
        <circle
          key={index}
          {...commonProps}
          cx={props.cx ?? 50}
          cy={props.cy ?? 50}
          r={props.r ?? 45}
        />
      );
    }
    if (elType === 'polygon') {
      return (
        <polygon
          key={index}
          {...commonProps}
          points={props.points}
        />
      );
    }
    if (elType === 'line') {
      return (
        <line
          key={index}
          {...commonProps}
          x1={props.x1 ?? 0}
          y1={props.y1 ?? 50}
          x2={props.x2 ?? 100}
          y2={props.y2 ?? 50}
        />
      );
    }
    if (elType === 'path') {
      return (
        <path
          key={index}
          {...commonProps}
          d={props.d}
        />
      );
    }
    if (elType === 'dots') {
      return (
        <g key={index}>
          {[0, 1, 2, 3, 4].map(i => [0, 1, 2, 3, 4].map(j => (
            <circle
              key={`${i}-${j}`}
              cx={10 + i * 20}
              cy={10 + j * 20}
              r="3"
              fill={fillMapped}
              opacity={props.opacity !== undefined ? props.opacity : undefined}
            />
          )))}
        </g>
      );
    }
    return null;
  };

  const getGradientCoords = (dir: string) => {
    switch (dir) {
      case 'to-r': return { x1: '0%', y1: '0%', x2: '100%', y2: '0%' };
      case 'to-b': return { x1: '0%', y1: '0%', x2: '0%', y2: '100%' };
      case 'to-tr': return { x1: '0%', y1: '100%', x2: '100%', y2: '0%' };
      case 'to-br':
      default:
        return { x1: '0%', y1: '0%', x2: '100%', y2: '100%' };
    }
  };

  const colors = gradientColors || [fill, secondaryFill];
  const coords = getGradientCoords(gradientDirection || 'to-br');

  const transform = `scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`;

  return (
    <div
      className="w-full h-full"
      style={{
        opacity,
        filter: shadowFilter,
        transform,
        transformOrigin: 'center center',
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        {gradientEnabled && (
          <defs>
            <linearGradient id={gradId} {...coords}>
              <stop offset="0%" stopColor={colors[0] || fill} />
              <stop offset="100%" stopColor={colors[1] || secondaryFill} />
            </linearGradient>
          </defs>
        )}
        {(shapeConfig as any).shapes ? (
          (shapeConfig as any).shapes.map((sh: any, index: number) => renderShapeElement(sh, index))
        ) : (
          renderShapeElement(shapeConfig, 0)
        )}
      </svg>
    </div>
  );
}
