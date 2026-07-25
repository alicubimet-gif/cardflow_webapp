import React from 'react';
import { useOrgLabels } from '@/hooks/useOrgLabels';

export interface DashboardStatistics {
  group?: number;
  subGroup?: number;
  totalRecords?: number;
  totalStaff?: number;
  pendingReview?: number;
  approved?: number;
  approvers?: number;
  groups?: number;
  subGroups?: number;
  records?: number;
  pendingCards?: number;
  approvedCards?: number;
  totalStudents?: number;
  totalSchoolStaff?: number;
  totalEmployees?: number;
  groupsCount?: number;
  subgroupsCount?: number;
  staffCount?: number;
}

interface DashboardStatsProps {
  isSchool?: boolean;
  statistics?: DashboardStatistics;
  classesCount?: number;
  branchesCount?: number;
  divisionsCount?: number;
  departmentsCount?: number;
  staffCount?: number;
  stats?: any;
}

export function DashboardStats({
  isSchool = true,
  statistics,
  classesCount,
  branchesCount,
  divisionsCount,
  departmentsCount,
  staffCount,
  stats
}: DashboardStatsProps) {
  const labels = useOrgLabels(isSchool ? 'institution' : 'cooperative');

  const statsObj: DashboardStatistics = statistics || stats || {};

  const groupVal = statsObj.group || statsObj.groups || statsObj.groupsCount || (isSchool ? classesCount : branchesCount) || 0;
  const subGroupVal = statsObj.subGroup || statsObj.subGroups || statsObj.subgroupsCount || (isSchool ? divisionsCount : departmentsCount) || 0;
  const recordsVal = statsObj.totalRecords || statsObj.records || statsObj.totalEmployees || ((statsObj.totalStudents || 0) + (statsObj.totalSchoolStaff || 0)) || 0;
  const staffVal = statsObj.totalStaff || statsObj.staffCount || staffCount || statsObj.totalSchoolStaff || 0;
  const pendingVal = statsObj.pendingReview ?? statsObj.pendingCards ?? 0;
  const approvedVal = statsObj.approved ?? statsObj.approvedCards ?? 0;
  const approversVal = statsObj.approvers || staffVal;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {/* 1. Group Card (Class / Branch) */}
      <MobileStatCard
        label={labels.groupLabel || (isSchool ? 'Class' : 'Branch')}
        value={groupVal}
        color="primary"
      />

      {/* 2. Sub Group Card (Division / Department) */}
      <MobileStatCard
        label={labels.subgroupLabel || (isSchool ? 'Division' : 'Department')}
        value={subGroupVal}
      />

      {/* 3. Total Records Card */}
      <MobileStatCard
        label="Total Records"
        value={recordsVal}
      />

      {/* 4. Total Staff Card */}
      <MobileStatCard
        label="Total Staff"
        value={staffVal}
      />

      {/* 5. Pending Review Card */}
      <MobileStatCard
        label="Pending Review"
        value={pendingVal}
        color="amber"
      />

      {/* 6. Approved Card */}
      <MobileStatCard
        label="Approved"
        value={approvedVal}
        color="green"
      />

      {/* 7. Approvers Card */}
      <MobileStatCard
        label="Approvers"
        value={approversVal}
        color="teal"
      />
    </div>
  );
}

function MobileStatCard({ label, value, color = 'default' }: { label: string; value: number | string; color?: string }) {
  const colorMap: Record<string, string> = {
    default: 'text-[#0B0F19]',
    primary: 'text-[#2563EB]',
    amber: 'text-[#F59E0B]',
    green: 'text-[#22C55E]',
    red: 'text-[#EF4444]',
    teal: 'text-[#14B8A6]',
  };
  const textColor = colorMap[color] || colorMap.default;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs min-w-0 overflow-hidden">
      <p className="truncate text-xs font-medium text-[#64748B] sm:text-sm">{label}</p>
      <p className={`mt-1 text-xl font-semibold sm:text-2xl ${textColor}`} style={{ fontFamily: 'Sora, sans-serif' }}>
        {value}
      </p>
    </div>
  );
}
