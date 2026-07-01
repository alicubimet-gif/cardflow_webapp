'use client';

import React, { useEffect, useState } from 'react';

interface VectorElementProps {
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
}

let cachedElements: any[] | null = null;

export default function VectorElement({
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
  flipV = false
}: VectorElementProps) {
  const [elements, setElements] = useState<any[]>(cachedElements || []);
  const uniqueId = React.useId().replace(/:/g, '');

  useEffect(() => {
    if (cachedElements) {
      setElements(cachedElements);
      return;
    }
    fetch('/elements.json')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          cachedElements = data;
          setElements(data);
        }
      })
      .catch((err) => console.error('Failed to load elements JSON:', err));
  }, []);

  const matched = elements.find((e) => e.id === assetId);

  if (!matched) {
    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity }}>
        <rect x="0" y="0" width="100" height="100" fill={primaryColor} />
      </svg>
    );
  }

  const resolveVal = (val: any) => {
    if (val === 'primaryColor') return primaryColor;
    if (val === 'secondaryColor') return secondaryColor;
    if (val === 'borderColor') return borderColor;
    if (val === 'borderWidth') return borderWidth;
    if (val === 'url(#grad)') return gradient ? `url(#grad-${uniqueId})` : primaryColor;
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
        opacity,
        display: 'block',
        overflow: 'visible'
      }}
    >
      <defs>
        <linearGradient id={`grad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
      </defs>

      <g
        transform={transformStr || undefined}
        style={{ transformOrigin: '50px 50px' }}
      >
        {Array.isArray(matched.shapes) &&
          matched.shapes.map((s: any, idx: number) => {
            const fillVal = resolveVal(s.fill);
            const strokeVal = resolveVal(s.stroke);
            const sw = resolveVal(s.strokeWidth);

            if (s.type === 'circle') {
              return (
                <circle
                  key={idx}
                  cx={s.cx}
                  cy={s.cy}
                  r={s.r}
                  fill={fillVal || 'none'}
                  stroke={strokeVal || 'none'}
                  strokeWidth={sw !== undefined ? sw : undefined}
                  opacity={s.opacity}
                  transform={s.transform}
                />
              );
            }
            if (s.type === 'polygon') {
              return (
                <polygon
                  key={idx}
                  points={s.points}
                  fill={fillVal || 'none'}
                  stroke={strokeVal || 'none'}
                  strokeWidth={sw !== undefined ? sw : undefined}
                  opacity={s.opacity}
                  transform={s.transform}
                />
              );
            }
            if (s.type === 'path') {
              return (
                <path
                  key={idx}
                  d={s.d}
                  fill={fillVal || 'none'}
                  stroke={strokeVal || 'none'}
                  strokeWidth={sw !== undefined ? sw : undefined}
                  opacity={s.opacity}
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
                  fill={fillVal || 'none'}
                  stroke={strokeVal || 'none'}
                  strokeWidth={sw !== undefined ? sw : undefined}
                  opacity={s.opacity}
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
                ry={s.ry}
                fill={fillVal || 'none'}
                stroke={strokeVal || 'none'}
                strokeWidth={sw !== undefined ? sw : undefined}
                opacity={s.opacity}
                transform={s.transform}
              />
            );
          })}
      </g>
    </svg>
  );
}
