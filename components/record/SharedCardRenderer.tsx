'use client';

import React from 'react';
import { IdCardPreview } from '@/components/records/IdCardPreview';

export type SharedCardRendererProps = {
  record: any;
  effectiveTemplate: any;
  side: 'FRONT' | 'BACK';
  displayWidth?: number;
  mode?: 'preview' | 'print' | 'pdf';
  className?: string;
};

export const SharedCardRenderer = React.memo(function SharedCardRenderer({
  record,
  effectiveTemplate,
  side,
  displayWidth = 280,
  className = '',
}: SharedCardRendererProps) {
  if (!effectiveTemplate) {
    return (
      <div className={`flex min-h-32 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 ${className}`}>
        <p className="text-sm text-slate-500 italic">No template is assigned to this record.</p>
      </div>
    );
  }

  const recordMock = {
    fieldValues: record?.fieldValues || record?.data || record || {},
    photoUrl: record?.photoUrl || record?.photo || null,
  };

  return (
    <div className={`mx-auto flex w-full justify-center ${className}`}>
      <IdCardPreview
        record={recordMock}
        templateVersion={effectiveTemplate}
        side={side}
        displayWidth={displayWidth}
      />
    </div>
  );
});
