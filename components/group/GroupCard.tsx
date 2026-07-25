import { FolderOpen, Users, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useOrgLabels } from '@/hooks/useOrgLabels';

interface GroupCardProps {
  c: any;
  classAssignmentsCount: number;
  onOpen: (id: string) => void;
  onAssignUser: (id: string) => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  subgroupsCount: number;
  recordsCount: number;
}

export function GroupCard({
  c,
  classAssignmentsCount,
  onOpen,
  onAssignUser,
  onEdit,
  onDelete,
  subgroupsCount,
  recordsCount
}: GroupCardProps) {
  const { user } = useAuth();
  const { subgroupLabel, recordLabel } = useOrgLabels(user?.organization_type);

  return (
    <div className="bg-white border border-slate-200/60 hover:border-slate-300 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs transition-colors">
      <div>
        <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Sora' }}>{c.name}</h3>
        <div className="text-xs text-slate-500 mt-2 flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5">
            <Users size={12} className="text-slate-400" />
            {classAssignmentsCount} Staff assigned
          </span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <FolderOpen size={12} className="text-slate-400" />
              {subgroupsCount} {subgroupLabel}{subgroupsCount !== 1 ? 's' : ''}
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <Users size={12} className="text-slate-400" />
              {recordsCount} {recordLabel}{recordsCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={() => onOpen(String(c.id))}
          className="flex-1 h-9 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <FolderOpen size={14} />
          Open
        </button>
        <button
          onClick={() => onAssignUser(String(c.id))}
          className="px-3 h-9 border border-slate-200 hover:border-blue-300 hover:text-blue-600 rounded-xl text-xs font-semibold text-slate-500 transition-colors cursor-pointer flex items-center justify-center"
          title="Assign Staff"
        >
          <Users size={14} />
        </button>
        <button
          onClick={() => onEdit(c)}
          className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 border border-transparent hover:border-slate-200 rounded-xl transition-colors cursor-pointer"
          title="Edit"
        >
          <Edit size={14} />
        </button>
        <button
          onClick={() => onDelete(c.id)}
          className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 rounded-xl transition-colors cursor-pointer"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
