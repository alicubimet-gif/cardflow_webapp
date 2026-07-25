import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';

interface DashboardHeaderProps {
  user: any;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return <PageHeader user={user} />;
}
export type DashboardHeaderType = typeof DashboardHeader;
