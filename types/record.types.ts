export type RecordApprovalStatus = 'pending' | 'approved' | 'rejected' | 'correction_required' | 'draft' | string;

export interface DynamicField {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  order?: number;
}

export interface RecordItem {
  id: string;
  card_id?: string;
  full_name?: string;
  name?: string;
  student_name?: string;
  employee_name?: string;
  email?: string;
  email_address?: string;
  phone?: string;
  mobile_number?: string;
  school_class?: string;
  class?: string;
  division?: string;
  branch?: string;
  department?: string;
  approval_status?: RecordApprovalStatus;
  status?: string;
  photo?: string;
  photo_url?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}
