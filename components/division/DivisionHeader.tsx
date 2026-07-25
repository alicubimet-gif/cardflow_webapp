import React from 'react';

interface DivisionHeaderProps {
  divisionName: string;
  className: string;
  staffCount: number;
  recordsCount: number;
  children?: React.ReactNode;
}

export function DivisionHeader({
  divisionName,
  className,
  staffCount,
  recordsCount,
  children
}: DivisionHeaderProps) {
  return (
    <div 
      className="bg-white border border-[#DFE4EA] rounded-[16px] p-[20px] shadow-sm flex flex-col gap-4 w-full animate-in fade-in duration-200"
    >
      {/* 1. Division Info Section */}
      <div className="space-y-1">
        <span 
          className="text-[14px] text-[#64748B]"
          style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
        >
          Division
        </span>
        <h2 
          className="text-[20px] font-bold text-[#0B0F19] leading-tight" 
          style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
        >
          {divisionName}
        </h2>
      </div>

      {/* 2. Parent Class Section */}
      <div className="border-t border-[#DFE4EA] pt-4">
        <span 
          className="text-[14px] text-[#64748B] block mb-1"
          style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
        >
          Parent Class:
        </span>
        <span 
          className="text-[16px] font-semibold text-[#0B0F19] block"
          style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
        >
          {className}
        </span>
      </div>

      {/* 3. Stats Row Section */}
      <div className="border-t border-[#DFE4EA] pt-4 flex gap-6 text-[14px] text-[#64748B]">
        <div>
          Staff: <span className="font-bold text-[#0B0F19] ml-1">{staffCount}</span>
        </div>
        <div>
          Records: <span className="font-bold text-[#0B0F19] ml-1">{recordsCount}</span>
        </div>
      </div>

      {/* 4. Actions Section */}
      {children && (
        <div className="border-t border-[#DFE4EA] pt-4 w-full">
          {children}
        </div>
      )}
    </div>
  );
}
