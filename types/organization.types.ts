import { OrganizationTypeKey, OrganizationConfig } from '@/config/organization.config';

export type OrganizationType = OrganizationTypeKey;

export type { OrganizationConfig };

export type EntityType = 'group' | 'subgroup' | 'class' | 'division' | 'branch' | 'department' | string;

export interface GroupItem {
  id: string;
  name: string;
  code?: string;
  organization?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SubgroupItem {
  id: string;
  name: string;
  school_class?: string;
  branch?: string;
  class_id?: string;
  branch_id?: string;
  created_at?: string;
  updated_at?: string;
}
