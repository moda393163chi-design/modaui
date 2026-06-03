// MODAUI Unified Role-Based Access Control (RBAC) Permission Matrix

export type UserRole = 'Platform Admin' | 'Merchant Owner' | 'Manager' | 'Staff' | 'Customer';

export interface RolePermissionConfig {
  role: UserRole;
  allowedZones: string[]; // ['workbench', 'store', 'product', 'order', 'customer', 'marketing', 'analytics', 'settings', 'super_admin']
  canCreateProduct: boolean;
  canEditProduct: boolean;
  canDeleteProduct: boolean;
  canDispatchOrder: boolean;
  canApplyRefund: boolean;
  canModifyAITeams: boolean;
  canManageApps: boolean;
  canViewSaaSTelemetry: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissionConfig> = {
  'Platform Admin': {
    role: 'Platform Admin',
    allowedZones: ['workbench', 'store', 'product', 'order', 'customer', 'marketing', 'analytics', 'settings', 'super_admin'],
    canCreateProduct: true,
    canEditProduct: true,
    canDeleteProduct: true,
    canDispatchOrder: true,
    canApplyRefund: true,
    canModifyAITeams: true,
    canManageApps: true,
    canViewSaaSTelemetry: true,
  },
  'Merchant Owner': {
    role: 'Merchant Owner',
    allowedZones: ['workbench', 'store', 'product', 'order', 'customer', 'marketing', 'analytics', 'settings'],
    canCreateProduct: true,
    canEditProduct: true,
    canDeleteProduct: true,
    canDispatchOrder: true,
    canApplyRefund: true,
    canModifyAITeams: true,
    canManageApps: true,
    canViewSaaSTelemetry: false,
  },
  'Manager': {
    role: 'Manager',
    allowedZones: ['workbench', 'store', 'product', 'order', 'customer', 'marketing', 'analytics'],
    canCreateProduct: true,
    canEditProduct: true,
    canDeleteProduct: false,
    canDispatchOrder: true,
    canApplyRefund: false,
    canModifyAITeams: false,
    canManageApps: false,
    canViewSaaSTelemetry: false,
  },
  'Staff': {
    role: 'Staff',
    allowedZones: ['workbench', 'product', 'order'],
    canCreateProduct: false,
    canEditProduct: true,
    canDeleteProduct: false,
    canDispatchOrder: true,
    canApplyRefund: false,
    canModifyAITeams: false,
    canManageApps: false,
    canViewSaaSTelemetry: false,
  },
  'Customer': {
    role: 'Customer',
    allowedZones: [], // Strictly local storefront actions
    canCreateProduct: false,
    canEditProduct: false,
    canDeleteProduct: false,
    canDispatchOrder: false,
    canApplyRefund: false,
    canModifyAITeams: false,
    canManageApps: false,
    canViewSaaSTelemetry: false,
  }
};

export const rbacService = {
  hasAccessToMenu(role: UserRole, menuKey: string): boolean {
    const config = ROLE_PERMISSIONS[role];
    if (!config) return false;
    return config.allowedZones.includes(menuKey);
  },

  canPerform(role: UserRole, action: keyof Omit<RolePermissionConfig, 'role' | 'allowedZones'>): boolean {
    const config = ROLE_PERMISSIONS[role];
    if (!config) return false;
    return !!config[action];
  },

  getHierarchicalRoles(role: UserRole): UserRole[] {
    if (role === 'Platform Admin') {
      return ['Platform Admin', 'Merchant Owner', 'Manager', 'Staff', 'Customer'];
    }
    if (role === 'Merchant Owner') {
      return ['Merchant Owner', 'Manager', 'Staff', 'Customer'];
    }
    if (role === 'Manager') {
      return ['Manager', 'Staff', 'Customer'];
    }
    if (role === 'Staff') {
      return ['Staff', 'Customer'];
    }
    return ['Customer'];
  }
};
