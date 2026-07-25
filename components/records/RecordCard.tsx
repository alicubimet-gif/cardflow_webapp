'use client';

import React, { useState, useMemo } from 'react';
import { UserRound, Eye, Camera } from 'lucide-react';
import { cn } from '@/utils/cn';

interface RecordCardProps {
  record: any;
  isSchool?: boolean;
  onView: (rec: any) => void;
  onUpdatePhoto?: (rec: any) => void;
  templateFields?: any[];
  [key: string]: any;
}

export function getRecordFieldValues(record: any) {
  if (record?.data && typeof record.data === 'object') {
    return record.data;
  }
  return (
    record?.field_values ??
    record?.dynamic_data ??
    record?.fields ??
    record?.values ??
    {}
  );
}

export function getRecordName(record: any) {
  const values = getRecordFieldValues(record);
  return (
    values.full_name ??
    values.name ??
    values.employee_name ??
    values.student_name ??
    values.visitor_name ??
    record.name ??
    record.display_name ??
    "Unnamed Record"
  );
}

export function formatDateValue(value: any) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(value);
  }
}

export function formatRecordFieldValue(field: { type?: string; value: any }) {
  const value = field.value;

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  switch (field.type) {
    case "boolean":
      return value ? "Yes" : "No";

    case "checkbox":
      return Array.isArray(value)
        ? value.join(", ")
        : String(value);

    case "date":
      return formatDateValue(value);

    case "image":
      return "Photo available";

    case "file":
      return "File uploaded";

    default:
      if (Array.isArray(value)) {
        return value.join(", ");
      }

      if (typeof value === "object") {
        return JSON.stringify(value);
      }

      return String(value);
  }
}

export function buildRecordDisplayFields(record: any, templateFields: any[]) {
  const values = getRecordFieldValues(record);
  return templateFields
    .filter((field) => field.visible !== false)
    .map((field) => {
      const fieldId = field.field_id || field.id || field.key || field.slug;
      const rawVal = values?.[fieldId] ?? values?.[field.label] ?? values?.[field.key];
      return {
        id: fieldId || field.label,
        label: field.label || fieldId,
        type: field.type,
        value: rawVal,
      };
    });
}

export function RecordStatusBadge({ status }: { status?: string }) {
  const normalizedStatus = String(status ?? "pending_review")
    .toLowerCase()
    .replace(/\s+/g, "_");

  const config = ({
    pending_review: {
      label: "Pending",
      className: "bg-amber-100 text-amber-700",
    },
    approved: {
      label: "Approved",
      className: "bg-emerald-100 text-emerald-700",
    },
    rejected: {
      label: "Rejected",
      className: "bg-red-100 text-red-700",
    },
    draft: {
      label: "Draft",
      className: "bg-slate-100 text-slate-600",
    },
  } as any)[normalizedStatus] ?? {
    label: status || "Unknown",
    className: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center",
        "rounded-md px-1.5",
        "text-[9px] font-semibold uppercase",
        "leading-none tracking-wide whitespace-nowrap",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

function RecordAvatar({ record, name }: { record: any; name: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const photoUrl = record.photoUrl || record.profile_photo || record.photo || '';
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-105 border border-slate-100">
      {photoUrl && !imageFailed ? (
        <img
          src={photoUrl}
          alt={`${name} profile`}
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <UserRound className="h-6 w-6 text-slate-500" aria-hidden="true" />
      )}
    </div>
  );
}

export function RecordCard({
  record,
  onView,
  onUpdatePhoto,
  templateFields = [],
}: RecordCardProps) {
  const recordName = getRecordName(record);
  const status = record.approval_status || record.status || 'draft';
  const groupName = (record.group_name || record.group?.name || '')?.trim();
  const subgroupName = (record.subgroup_name || record.subgroup?.name || '')?.trim();
  const hasLocation = Boolean(groupName || subgroupName);

  const displayFields = useMemo(() => {
    return buildRecordDisplayFields(record, templateFields);
  }, [record, templateFields]);

  return (
    <article
      className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow pointer-events-auto touch-manipulation"
    >
      {/* RecordHeader */}
      <div className="flex items-start gap-3">
        <RecordAvatar record={record} name={recordName} />

        <div className="min-w-0 flex-1">
          <h3 className="break-words text-sm font-bold leading-5 text-slate-900">
            {recordName}
          </h3>

          {hasLocation && (
            <p className="mt-1.5 break-words text-xs font-medium text-slate-500">
              {[groupName, subgroupName].filter(Boolean).join(" – ")}
            </p>
          )}

          <div className="mt-2">
            <RecordStatusBadge status={status} />
          </div>
        </div>
      </div>

      {/* DynamicFieldList */}
      {displayFields.length === 0 ? (
        <div className="mt-3 rounded-xl bg-slate-50 px-3 py-3 flex-1 flex items-center justify-center">
          <p className="text-xs text-slate-500">
            No additional details available.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 flex-1">
          {displayFields.map((field: any, idx: number) => (
            <div
              key={field.id || field.field_id || field.key || field.label || idx}
              className="flex flex-col gap-1 min-[380px]:grid min-[380px]:grid-cols-2 gap-3"
            >
              <span className="break-words text-xs font-medium text-slate-500">
                {field.label}
              </span>

              <span
                className="break-words min-[380px]:text-right text-xs font-semibold text-slate-800"
              >
                {formatRecordFieldValue(field)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* RecordActions */}
      <div className="mt-4 grid grid-cols-1 gap-2 min-[390px]:grid-cols-2 border-t border-slate-105 pt-3">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onView(record);
          }}
          className="h-9 w-full rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2 text-[11px] font-semibold text-slate-700 transition-colors flex items-center justify-center cursor-pointer shadow-xs"
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          <span>View Card</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onUpdatePhoto?.(record);
          }}
          className="h-9 w-full rounded-lg bg-blue-600 hover:bg-blue-700 px-2 text-[11px] font-semibold text-white transition-colors flex items-center justify-center cursor-pointer shadow-xs shadow-blue-500/10"
        >
          <Camera className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          <span>Capture Photo</span>
        </button>
      </div>
    </article>
  );
}

export type RecordCardType = typeof RecordCard;
