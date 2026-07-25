import { LayoutDashboard, GraduationCap, Building2, Layers, Grid, Users, User, LogOut, ClipboardList, Settings, CreditCard, LayoutTemplate, PieChart, FileText } from 'lucide-react';
import { WebAppUser } from '@/context/auth-context';

export interface NavItem {
  id: string;
  label: string;
  icon: any;
  route: string;
}

export function getNavigationItems(
  user: WebAppUser,
  isAdmin: boolean,
  isOrganization: boolean,
  groupLabel: string,
  subgroupLabel: string
): NavItem[] {
  const items: NavItem[] = [];
  const groupLabelPlural = groupLabel === 'Class' ? 'Classes' : (groupLabel === 'Branch' ? 'Branches' : (groupLabel === 'Group' ? 'Groups' : groupLabel + 's'));

  // Super Admin Navigation
  if (user.role === 'SUPER_ADMIN' || user.role === 'SUPER_ADMIN_STAFF') {
    items.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' });
    items.push({ id: 'organizations', label: 'Organizations', icon: Building2, route: '/organizations' });
    items.push({ id: 'organization_admins', label: 'Organization Admins', icon: Users, route: '/organization-admins' });
    items.push({ id: 'staff', label: 'Staff', icon: Users, route: '/staff' });
    items.push({ id: 'settings', label: 'Settings', icon: Settings, route: '/settings' });
    return items;
  }

  // Common initial route for Org Admins and Staff
  items.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' });

  // Organization Admin Navigation
  if (user.role === 'ORGANIZATION_ADMIN' || isAdmin) {
    items.push({ id: 'groups', label: groupLabelPlural, icon: Grid, route: '/groups' });
    items.push({ id: 'staff', label: 'Staff', icon: Users, route: '/staff' });
    items.push({ id: 'branch-staff', label: `Assign ${groupLabel}`, icon: Users, route: '/branch-staff' });
    items.push({ id: 'staff-assignments', label: 'Staff Assignments', icon: ClipboardList, route: '/staff-assignments' });
    items.push({ id: 'approvals', label: 'Approvals', icon: FileText, route: '/approvals' });
    items.push({ id: 'approval_logs', label: 'Approval Logs', icon: ClipboardList, route: '/approval-logs' });
    items.push({ id: 'settings', label: 'Settings', icon: Settings, route: '/settings' });
    return items;
  }

  // Staff Navigation
  if (user.role === 'ORGANIZATION_STAFF' || user.role === 'organization_staff') {
    items.push({ id: 'groups', label: groupLabelPlural, icon: Grid, route: '/groups' });
    items.push({ id: 'profile', label: 'Profile', icon: User, route: '/profile' });
    
    return items;
  }

  // Fallbacks
  return items;
}
