'use client';

import React from 'react';
import { SharedCardRenderer } from './shared-card-renderer';

export interface IdCardPreviewProps {
  record: any;
  templateVersion: any;
  side: 'FRONT' | 'BACK';
  scale?: number;
  className?: string;
  cardRef?: React.RefObject<HTMLDivElement>;
}

export function IdCardPreview({
  record,
  templateVersion,
  side,
  scale,
  className = '',
  cardRef,
}: IdCardPreviewProps) {
  // Resolve canvas json to find dimensions in pixels for scaling
  const canvasJson = templateVersion?.canvas_json || templateVersion || {};
  const orientation = canvasJson.orientation || 'vertical';
  const cardWidth = Number(canvasJson.cardWidth || canvasJson.width || (orientation === 'horizontal' ? 1013 : 638));
  
  return (
    <SharedCardRenderer
      canvasState={templateVersion}
      side={side}
      recordData={record}
      displayWidth={scale !== undefined ? cardWidth * scale : undefined}
      cardRef={cardRef}
      className={className}
    />
  );
}
