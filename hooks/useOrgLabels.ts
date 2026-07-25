import { useMemo } from 'react';
import { ORGANIZATION_CONFIG, normalizeOrganizationType, OrganizationConfig } from '@/config/organization.config';

export const useOrgLabels = (organizationType?: string): OrganizationConfig => {
  return useMemo(() => {
    const key = normalizeOrganizationType(organizationType);
    return ORGANIZATION_CONFIG[key];
  }, [organizationType]);
};
