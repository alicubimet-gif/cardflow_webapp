'use client';

import React from 'react';
import { SharedCardRenderer } from './shared-card-renderer';

export interface IdCardPreviewProps {
  record: any;
  templateVersion: any;
  side: 'FRONT' | 'BACK';
  /** Proportional scale factor: displayWidth = cardWidth × scale */
  scale?: number;
  /** Direct pixel width override — takes priority over scale */
  displayWidth?: number;
  className?: string;
  cardRef?: React.RefObject<HTMLDivElement>;
}

export function IdCardPreview({
  record,
  templateVersion,
  side,
  scale,
  displayWidth,
  className = '',
  cardRef,
}: IdCardPreviewProps) {
  // Resolve canvas json to find native card width in pixels
  const canvasJson = templateVersion?.canvas_json || templateVersion || {};
  const orientation = canvasJson.orientation || 'vertical';
  const cardWidth = Number(canvasJson.cardWidth || canvasJson.width || (orientation === 'horizontal' ? 1013 : 638));

  // displayWidth prop takes priority; otherwise derive from scale
  const resolvedDisplayWidth = displayWidth ?? (scale !== undefined ? cardWidth * scale : undefined);

  return (
    <SharedCardRenderer
      canvasState={templateVersion}
      side={side}
      recordData={record}
      displayWidth={resolvedDisplayWidth}
      cardRef={cardRef}
      className={className}
    />
  );
}
