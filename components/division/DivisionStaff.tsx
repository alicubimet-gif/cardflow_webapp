import React from 'react';

interface DivisionStaffProps {
  staffList: any[];
  allAssignmentsList: any[];
  divisionId: string;
  onViewStaff: (staff: any) => void;
}

export function DivisionStaff({
  staffList,
  allAssignmentsList,
  divisionId,
  onViewStaff
}: DivisionStaffProps) {
  // Filter staff assignments & staff members assigned to this division
  const divAssignments = allAssignmentsList.filter(
    a => a.assignment_level === 'division' && String(a.division || a.division_id) === String(divisionId)
  );
  const divStaff = staffList.filter(st => 
    divAssignments.some(a => String(a.staff || a.staff_id) === String(st.id))
  );

  return (
    <div className="space-y-[16px]">
      {/* Section Header */}
      <h3 
        className="text-[16px] font-semibold text-[#0B0F19]" 
        style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
      >
        Division Staff ({divStaff.length})
      </h3>

      {divStaff.length === 0 ? (
        <div className="bg-white border border-[#DFE4EA] rounded-[16px] p-5 text-center text-xs text-slate-400 italic font-medium">
          No staff members assigned directly to this division.
        </div>
      ) : (
        <div className="space-y-[16px]">
          {divStaff.map(st => {
            const name = st.name || st.full_name || 'Staff operator';
            const isActive = st.status === 'active' || st.is_active;

            return (
              <div
                key={st.id}
                className="bg-white border border-[#DFE4EA] rounded-[16px] px-4 py-3 flex items-center justify-between min-h-[64px] shadow-sm hover:border-[#2563EB]/40 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div 
                    className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] font-bold text-sm shrink-0" 
                    style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
                  >
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#0B0F19] leading-tight">{name}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onViewStaff(st)}
                  className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer px-3 py-2 rounded-lg hover:bg-[#2563EB]/5 transition-all"
                >
                  View
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
