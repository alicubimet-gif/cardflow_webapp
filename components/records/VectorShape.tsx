'use client';

import React, { useEffect, useState } from 'react';

interface VectorShapeProps {
  assetId: string;
  primaryColor?: string;
  secondaryColor?: string;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
  gradient?: boolean;
  width: number;
  height: number;
  flipH?: boolean;
  flipV?: boolean;
  style?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
  };
}

let cachedShapes: any[] | null = null;

export default function VectorShape({
  assetId,
  primaryColor = '#1D4ED8',
  secondaryColor = '#38BDF8',
  borderColor = '#ffffff',
  borderWidth = 0,
  opacity = 1,
  gradient = false,
  width,
  height,
  flipH = false,
  flipV = false,
  style
}: VectorShapeProps) {
  const [shapes, setShapes] = useState<any[]>(cachedShapes || []);
  const uniqueId = React.useId().replace(/[^a-zA-Z0-9]/g, '');

  useEffect(() => {
    if (cachedShapes) {
      setShapes(cachedShapes);
      return;
    }
    fetch('/shapes.json')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          cachedShapes = data;
          setShapes(data);
        }
      })
      .catch((err) => console.error('Failed to load shapes JSON:', err));
  }, []);

  const matched = shapes.find((s) => s.id === assetId);

  if (!assetId) {
    console.warn('VectorShape: assetId is missing or undefined.');
  } else if (shapes.length > 0 && !matched) {
    console.warn(`VectorShape: assetId "${assetId}" was not found in shapes.json.`, { assetId, shapesCount: shapes.length });
  }

  const fillVal = style?.fill || primaryColor;
  const strokeVal = style?.stroke || borderColor || secondaryColor;
  const strokeWidthVal = style?.strokeWidth !== undefined ? style.strokeWidth : borderWidth;
  const opacityVal = style?.opacity !== undefined ? style.opacity : opacity;

  if (!matched) {
    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: opacityVal }}>
        <rect x="0" y="0" width="100" height="100" fill={fillVal} />
      </svg>
    );
  }

  const resolveVal = (val: any) => {
    if (!val || val === 'none') return 'none';
    if (val === 'url(#grad)') return gradient ? `url(#grad-${uniqueId})` : fillVal;
    if (val === 'primaryColor' || val === '#2563EB' || val === '#2563eb' || val === '#3A75FF' || val === '#3a75ff') return fillVal;
    if (val === 'secondaryColor' || val === 'borderColor' || val === '#FFFFFF' || val === '#ffffff') return strokeVal;
    return val;
  };

  const transformStr = [
    flipH ? 'scale(-1, 1)' : '',
    flipV ? 'scale(1, -1)' : ''
  ].filter(Boolean).join(' ');

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        opacity: opacityVal,
        display: 'block',
        overflow: 'visible'
      }}
    >
      <defs>
        <linearGradient id={`grad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={fillVal} />
          <stop offset="100%" stopColor={strokeVal} />
        </linearGradient>
      </defs>

      <g
        transform={transformStr || undefined}
        style={{ transformOrigin: '50px 50px' }}
      >
        {Array.isArray(matched.shapes) &&
          matched.shapes.map((s: any, idx: number) => {
            const stroke = resolveVal(s.stroke) || 'none';
            const fill = resolveVal(s.fill) || 'none';
            
            // Overwrite hardcoded or default stroke width if style provides one
            const sw = (s.stroke && s.stroke !== 'none') ? (s.strokeWidth !== undefined ? strokeWidthVal : strokeWidthVal) : undefined;
            const itemOpacity = s.opacity !== undefined ? s.opacity * opacityVal : opacityVal;
            
            if (s.type === 'circle') {
              return (
                <circle
                  key={idx}
                  cx={s.cx}
                  cy={s.cy}
                  r={s.r}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={sw !== undefined ? sw : undefined}
                  opacity={itemOpacity}
                  transform={s.transform}
                />
              );
            }
            if (s.type === 'polygon') {
              return (
                <polygon
                  key={idx}
                  points={s.points}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={sw !== undefined ? sw : undefined}
                  opacity={itemOpacity}
                  transform={s.transform}
                />
              );
            }
            if (s.type === 'path') {
              return (
                <path
                  key={idx}
                  d={s.d}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={sw !== undefined ? sw : undefined}
                  opacity={itemOpacity}
                  transform={s.transform}
                />
              );
            }
            if (s.type === 'line') {
              return (
                <line
                  key={idx}
                  x1={s.x1}
                  y1={s.y1}
                  x2={s.x2}
                  y2={s.y2}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={sw !== undefined ? sw : 4}
                  opacity={itemOpacity}
                  transform={s.transform}
                />
              );
            }
            return (
              <rect
                key={idx}
                x={s.x}
                y={s.y}
                width={s.width}
                height={s.height}
                rx={s.rx}
                fill={fill}
                stroke={stroke}
                strokeWidth={sw !== undefined ? sw : undefined}
                opacity={itemOpacity}
                transform={s.transform}
              />
            );
          })}
      </g>
    </svg>
  );
}
