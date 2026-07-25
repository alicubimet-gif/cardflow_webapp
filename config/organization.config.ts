export const ORGANIZATION_TYPES = {
  INSTITUTION: 'institution',
  COOPERATIVE: 'cooperative',
} as const;

export type OrganizationTypeKey = typeof ORGANIZATION_TYPES[keyof typeof ORGANIZATION_TYPES];

export interface OrganizationConfig {
  groupLabel: string;
  groupLabelPlural: string;
  subgroupLabel: string;
  subgroupLabelPlural: string;
  recordLabel: string;
  recordLabelPlural: string;
}

export const ORGANIZATION_CONFIG: Record<OrganizationTypeKey, OrganizationConfig> = {
  institution: {
    groupLabel: 'Class',
    groupLabelPlural: 'Classes',
    subgroupLabel: 'Division',
    subgroupLabelPlural: 'Divisions',
    recordLabel: 'Student',
    recordLabelPlural: 'Students',
  },
  cooperative: {
    groupLabel: 'Branch',
    groupLabelPlural: 'Branches',
    subgroupLabel: 'Department',
    subgroupLabelPlural: 'Departments',
    recordLabel: 'Employee',
    recordLabelPlural: 'Employees',
  },
};

/**
 * Normalize raw organization type string from API or token payload to standard key:
 * 'institution' | 'cooperative'
 */
export function normalizeOrganizationType(rawType?: string): OrganizationTypeKey {
  if (!rawType) return ORGANIZATION_TYPES.INSTITUTION;
  const lower = rawType.trim().toLowerCase();
  if (['cooperative', 'office', 'corporate', 'company', 'business'].includes(lower)) {
    return ORGANIZATION_TYPES.COOPERATIVE;
  }
  return ORGANIZATION_TYPES.INSTITUTION;
}
