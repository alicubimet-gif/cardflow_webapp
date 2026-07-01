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
  strokeWidth?: number;   // border width
  strokeStyle?: string;   // border style
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
}

export default function JSONShapeRenderer({
  shapeId,
  asset,
  shapeType,
  fill = '#3A75FF',
  secondaryFill = '#60A5FA',
  accentColor = '#3B82F6',
  stroke = 'none',
  strokeWidth = 0,
  strokeStyle = 'solid',
  borderRadius = 0,
  opacity = 1,
  flipH = false,
  flipV = false,
  gradientEnabled = false,
  gradientColors,
  gradientDirection,
  shadowEnabled = false,
  shadowColor = '#00000030',
  shadowBlur = 4,
  shadowOffsetX = 2,
  shadowOffsetY = 2,
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

  const uniqueId = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradId = `grad-${uniqueId}`;

  const mapColor = (colVal: string) => {
    if (!colVal) return 'none';
    if (colVal === 'primaryColor') {
      return gradientEnabled ? `url(#${gradId})` : fill;
    }
    if (colVal === 'secondaryColor') return secondaryFill;
    if (colVal === 'accentColor') return accentColor;
    if (colVal === 'borderColor') return stroke;
    if (colVal === 'shadowColor') return shadowColor;
    if (colVal === 'none') return 'none';
    return colVal;
  };

  const mapWidth = (wVal: any) => {
    if (wVal === 'borderWidth') return strokeWidth;
    return wVal;
  };

  const shadowFilter = shadowEnabled
    ? `drop-shadow(${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor})`
    : undefined;

  const renderShapeElement = (sh: any, index: number) => {
    const elType = sh.type || sh.svgType;
    const props = sh.svgProps || sh;

    const fillMapped = mapColor(props.fill);
    const strokeMapped = mapColor(props.stroke);
    const strokeWidthMapped = mapWidth(props.strokeWidth);

    const commonProps = {
      key: index,
      fill: fillMapped,
      stroke: strokeMapped !== 'none' ? strokeMapped : undefined,
      strokeWidth: strokeWidthMapped,
      opacity: props.opacity !== undefined ? props.opacity : undefined,
    };

    if (elType === 'rect') {
      return (
        <rect
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
          {...commonProps}
          points={props.points}
        />
      );
    }
    if (elType === 'line') {
      return (
        <line
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
