import React from 'react';

interface OrganizationStats {
  totalStudents: number;
  totalSchoolStaff: number;
  totalEmployees: number;
  pendingCards: number;
  approvedCards: number;
  rejectedCards: number;
  correctionRequired: number;
  totalApprovedRecords: number;
  recentlyUpdated: any[];
}

interface DashboardStatsProps {
  isSchool: boolean;
  classesCount: number;
  branchesCount: number;
  divisionsCount: number;
  departmentsCount: number;
  staffCount: number;
  stats: OrganizationStats;
}

export function DashboardStats({
  isSchool,
  classesCount,
  branchesCount,
  divisionsCount,
  departmentsCount,
  staffCount,
  stats
}: DashboardStatsProps) {
  const totalRecords = isSchool
    ? (stats.totalStudents + stats.totalSchoolStaff)
    : stats.totalEmployees;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      <MobileStatCard
        label={isSchool ? 'Classes' : 'Branches'}
        value={isSchool ? classesCount : branchesCount}
        color="primary"
      />
      <MobileStatCard
        label={isSchool ? 'Divisions' : 'Departments'}
        value={isSchool ? divisionsCount : departmentsCount}
      />
      <MobileStatCard
        label="Total Staff"
        value={staffCount}
      />
      <MobileStatCard
        label="Total Records"
        value={totalRecords}
      />
      <MobileStatCard
        label="Pending Review"
        value={stats.pendingCards}
        color="amber"
      />
      <MobileStatCard
        label="Approved"
        value={stats.approvedCards}
        color="green"
      />
    </div>
  );
}

function MobileStatCard({ label, value, color = 'default' }: { label: string; value: number | string; color?: string }) {
  const colorMap: Record<string, string> = {
    default: 'border-[#DFE4EA] text-[#0B0F19]',
    primary: 'border-[#2563EB] text-[#2563EB]',
    amber: 'border-[#F59E0B] text-[#F59E0B]',
    green: 'border-[#22C55E] text-[#22C55E]',
    red: 'border-[#EF4444] text-[#EF4444]',
    teal: 'border-[#14B8A6] text-[#14B8A6]',
  };
  const cls = colorMap[color] || colorMap.default;
  return (
    <div className="bg-white border rounded-2xl p-4 shadow-sm" style={{ borderColor: '#DFE4EA', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <p className="text-xs font-semibold text-[#64748B] mb-1">{label}</p>
      <p className={`text-2xl font-bold ${cls.split(' ')[1]}`} style={{ fontFamily: 'Sora, sans-serif' }}>{value}</p>
    </div>
  );
}
