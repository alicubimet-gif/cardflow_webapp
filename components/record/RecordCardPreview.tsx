'use client';

import React, { useState } from 'react';
import { SharedCardRenderer } from './SharedCardRenderer';

export interface RecordCardPreviewProps {
  record: any;
  templateVersion: any;
  isSingleSided?: boolean;
  displayWidth?: number;
  className?: string;
}

export const RecordCardPreview = React.memo(function RecordCardPreview({
  record,
  templateVersion,
  isSingleSided,
  displayWidth = 280,
  className = '',
}: RecordCardPreviewProps) {
  const [side, setSide] = useState<'FRONT' | 'BACK'>('FRONT');

  const canvasJson = templateVersion?.canvas_json || templateVersion || {};
  const computedIsSingleSided = isSingleSided ?? (
    String(canvasJson.sides || templateVersion?.sides || '2') === '1' ||
    String(canvasJson.sides || templateVersion?.sides || '').toLowerCase() === 'single'
  );

  return (
    <div className={className}>
      {/* Side Switcher for Mobile / Single view toggle */}
      {!computedIsSingleSided && (
        <div className="mb-4 flex w-full max-w-xs mx-auto grid grid-cols-2 rounded-xl bg-slate-100 p-1 lg:hidden">
          <button
            type="button"
            onClick={() => setSide('FRONT')}
            className={`h-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              side === 'FRONT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => setSide('BACK')}
            className={`h-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              side === 'BACK' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Back
          </button>
        </div>
      )}

      {/* Grid container */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Front Side Block */}
        <div className={`min-w-0 ${!computedIsSingleSided && side !== 'FRONT' ? 'hidden lg:block' : 'block'}`}>
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500 text-center lg:text-left">
            Front Side
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">
            <SharedCardRenderer
              record={record}
              effectiveTemplate={templateVersion}
              side="FRONT"
              displayWidth={displayWidth}
            />
          </div>
        </div>

        {/* Back Side Block */}
        {!computedIsSingleSided && (
          <div className={`min-w-0 ${side !== 'BACK' ? 'hidden lg:block' : 'block'}`}>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500 text-center lg:text-left">
              Back Side
            </p>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">
              <SharedCardRenderer
                record={record}
                effectiveTemplate={templateVersion}
                side="BACK"
                displayWidth={displayWidth}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
