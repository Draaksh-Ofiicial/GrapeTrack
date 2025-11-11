/**
 * Sidebar menu configuration types
 * Permissions-based system for dynamic RBAC integration
 */

export interface MenuItem {
  id: string;
  label: string;
  path?: string; // Optional for parent items
  icon?: React.ComponentType<{ className?: string }>;
  requiredPermissions?: string[]; // Permission codes required to see this item (e.g., "tasks.view", "team.manage")
  children?: MenuItem[];
  badge?: string | number; // Optional badge for notifications
}

export interface SidebarConfig {
  items: MenuItem[];
}

export interface MenuItemProps {
  item: MenuItem;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  level?: number; // Nesting level for indentation
}
