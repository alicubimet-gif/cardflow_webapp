export interface BranchStaffAssignment {
  id: string;
  staff: string;
  staff_name: string;
  staff_email: string;
  employee_id: string;
  group: string;
  group_name: string;
  subgroup?: string | null;
  sub_group?: string | null;
  sub_group_name: string;
  assignment_level: 'group' | 'subgroup';
  role: string;
  status: 'active' | 'inactive';
  remarks?: string | null;
  assigned_by?: string | null;
  assigned_by_email?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CreateBranchStaffPayload {
  staff: string;
  group?: string | null;
  sub_group?: string | null;
  role: string;
  status: 'active' | 'inactive';
  remarks?: string;
}

export interface UpdateBranchStaffPayload {
  staff: string;
  group?: string | null;
  sub_group?: string | null;
  role: string;
  status: 'active' | 'inactive';
  remarks?: string;
}
