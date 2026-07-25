import { OrganizationType } from './organization.types';

export type UserRole = 'organization_admin' | 'organization_staff' | string;

export interface WebAppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  can_approve_records?: boolean;
  organization_id?: string;
  organization_name?: string;
  organization_type?: OrganizationType | string;
  assigned_divisions?: string[];
  assigned_departments?: string[];
  phone?: string;
  first_login?: boolean;
  temp_password?: string;
  permissions?: string[];
}

export interface UserAssignment {
  id: string;
  user_id: string;
  group_id?: string;
  subgroup_id?: string;
  role?: string;
  created_at?: string;
}
