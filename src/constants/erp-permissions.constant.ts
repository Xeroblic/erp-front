/**
 * Sistema de permisos expandido para ERP P0
 * Basado en la documentación del backend completado
 */

// Permisos por módulo del sistema ERP
export const ERP_PERMISSIONS = {
    // Transferencias - Sistema completo backend implementado
    TRANSFERS: {
        VIEW: 'transfers.view',
        CREATE: 'transfers.create',
        UPDATE: 'transfers.update',
        DELETE: 'transfers.delete',
        SHIP: 'transfers.ship',
        RECEIVE: 'transfers.receive',
        APPROVE: 'transfers.approve',
        CANCEL: 'transfers.cancel',
        GENERATE_PDF: 'transfers.generate_pdf'
    },

    // Cotizaciones - Sistema completo backend implementado
    QUOTES: {
        VIEW: 'quotes.view',
        CREATE: 'quotes.create',
        UPDATE: 'quotes.update',
        DELETE: 'quotes.delete',
        SEND: 'quotes.send',
        APPROVE: 'quotes.approve',
        CONVERT: 'quotes.convert',
        GENERATE_PDF: 'quotes.generate_pdf',
        MANAGE_DISCOUNTS: 'quotes.manage_discounts'
    },

    // Ventas - Sistema completo backend implementado
    SALES: {
        VIEW: 'sales.view',
        CREATE: 'sales.create',
        UPDATE: 'sales.update',
        DELETE: 'sales.delete',
        CONFIRM: 'sales.confirm',
        DELIVER: 'sales.deliver',
        CANCEL: 'sales.cancel',
        ADD_PAYMENTS: 'sales.add_payments',
        CONFIRM_PAYMENTS: 'sales.confirm_payments',
        GENERATE_INVOICE: 'sales.generate_invoice',
        MANAGE_DISCOUNTS: 'sales.manage_discounts'
    },

    // Inventario - InventoryService completo backend implementado
    INVENTORY: {
        VIEW: 'inventory.view',
        CREATE: 'inventory.create',
        UPDATE: 'inventory.update',
        DELETE: 'inventory.delete',
        ADJUST: 'inventory.adjust',
        RESERVE: 'inventory.reserve',
        RELEASE: 'inventory.release',
        TRANSFER: 'inventory.transfer',
        VIEW_MOVEMENTS: 'inventory.view_movements',
        GENERATE_REPORTS: 'inventory.generate_reports'
    },

    // Productos y Catálogo - Backend implementado
    PRODUCTS: {
        VIEW: 'products.view',
        CREATE: 'products.create',
        UPDATE: 'products.update',
        DELETE: 'products.delete',
        MANAGE_CATEGORIES: 'products.manage_categories',
        MANAGE_BRANDS: 'products.manage_brands',
        IMPORT: 'products.import',
        EXPORT: 'products.export'
    },

    // Almacenes - Backend implementado con QR codes
    WAREHOUSES: {
        VIEW: 'warehouses.view',
        CREATE: 'warehouses.create',
        UPDATE: 'warehouses.update',
        DELETE: 'warehouses.delete',
        MANAGE_LOCATIONS: 'warehouses.manage_locations',
        GENERATE_QR: 'warehouses.generate_qr'
    },

    // Contactos (Clientes/Proveedores)
    CONTACTS: {
        VIEW: 'contacts.view',
        CREATE: 'contacts.create',
        UPDATE: 'contacts.update',
        DELETE: 'contacts.delete',
        IMPORT: 'contacts.import',
        EXPORT: 'contacts.export'
    },

    // Reportes - Dashboard implementado en backend
    REPORTS: {
        VIEW: 'reports.view',
        SALES_DASHBOARD: 'reports.sales_dashboard',
        INVENTORY_REPORTS: 'reports.inventory_reports',
        TRANSFER_REPORTS: 'reports.transfer_reports',
        QUOTE_CONVERSION: 'reports.quote_conversion',
        FINANCIAL_REPORTS: 'reports.financial_reports',
        EXPORT: 'reports.export'
    },

    // Configuración
    SETTINGS: {
        VIEW: 'settings.view',
        UPDATE: 'settings.update',
        MANAGE_SEQUENCES: 'settings.manage_sequences',
        MANAGE_TAXES: 'settings.manage_taxes',
        SYSTEM_CONFIG: 'settings.system_config'
    }
} as const;

// Roles expandidos del sistema
export const ERP_ROLES = {
    SUPER_ADMIN: 'super-admin',
    COMPANY_ADMIN: 'company-admin',
    SUBSIDIARY_ADMIN: 'subsidiary-admin',
    BRANCH_ADMIN: 'branch-admin',
    SALES_MANAGER: 'sales-manager',
    INVENTORY_MANAGER: 'inventory-manager',
    SALES_REP: 'sales-rep',
    WAREHOUSE_OPERATOR: 'warehouse-operator',
    VIEWER: 'viewer',
    EMPLOYEE: 'employee'
} as const;

// Mapeo de permisos por rol
export const ROLE_PERMISSION_MAP = {
    [ERP_ROLES.SUPER_ADMIN]: Object.values(ERP_PERMISSIONS).flatMap(module => Object.values(module)),

    [ERP_ROLES.COMPANY_ADMIN]: [
        ...Object.values(ERP_PERMISSIONS.TRANSFERS),
        ...Object.values(ERP_PERMISSIONS.QUOTES),
        ...Object.values(ERP_PERMISSIONS.SALES),
        ...Object.values(ERP_PERMISSIONS.INVENTORY),
        ...Object.values(ERP_PERMISSIONS.PRODUCTS),
        ...Object.values(ERP_PERMISSIONS.WAREHOUSES),
        ...Object.values(ERP_PERMISSIONS.CONTACTS),
        ...Object.values(ERP_PERMISSIONS.REPORTS),
        ...Object.values(ERP_PERMISSIONS.SETTINGS)
    ],

    [ERP_ROLES.SALES_MANAGER]: [
        ...Object.values(ERP_PERMISSIONS.QUOTES),
        ...Object.values(ERP_PERMISSIONS.SALES),
        ...Object.values(ERP_PERMISSIONS.CONTACTS),
        ERP_PERMISSIONS.INVENTORY.VIEW,
        ERP_PERMISSIONS.INVENTORY.RESERVE,
        ERP_PERMISSIONS.PRODUCTS.VIEW,
        ERP_PERMISSIONS.REPORTS.SALES_DASHBOARD,
        ERP_PERMISSIONS.REPORTS.QUOTE_CONVERSION
    ],

    [ERP_ROLES.INVENTORY_MANAGER]: [
        ...Object.values(ERP_PERMISSIONS.TRANSFERS),
        ...Object.values(ERP_PERMISSIONS.INVENTORY),
        ...Object.values(ERP_PERMISSIONS.PRODUCTS),
        ...Object.values(ERP_PERMISSIONS.WAREHOUSES),
        ERP_PERMISSIONS.REPORTS.INVENTORY_REPORTS,
        ERP_PERMISSIONS.REPORTS.TRANSFER_REPORTS
    ],

    [ERP_ROLES.SALES_REP]: [
        ERP_PERMISSIONS.QUOTES.VIEW,
        ERP_PERMISSIONS.QUOTES.CREATE,
        ERP_PERMISSIONS.QUOTES.UPDATE,
        ERP_PERMISSIONS.QUOTES.SEND,
        ERP_PERMISSIONS.QUOTES.GENERATE_PDF,
        ERP_PERMISSIONS.SALES.VIEW,
        ERP_PERMISSIONS.SALES.CREATE,
        ERP_PERMISSIONS.CONTACTS.VIEW,
        ERP_PERMISSIONS.CONTACTS.CREATE,
        ERP_PERMISSIONS.CONTACTS.UPDATE,
        ERP_PERMISSIONS.PRODUCTS.VIEW,
        ERP_PERMISSIONS.INVENTORY.VIEW
    ],

    [ERP_ROLES.WAREHOUSE_OPERATOR]: [
        ERP_PERMISSIONS.TRANSFERS.VIEW,
        ERP_PERMISSIONS.TRANSFERS.RECEIVE,
        ERP_PERMISSIONS.TRANSFERS.SHIP,
        ERP_PERMISSIONS.INVENTORY.VIEW,
        ERP_PERMISSIONS.INVENTORY.UPDATE,
        ERP_PERMISSIONS.INVENTORY.ADJUST,
        ERP_PERMISSIONS.PRODUCTS.VIEW,
        ERP_PERMISSIONS.WAREHOUSES.VIEW,
        ERP_PERMISSIONS.WAREHOUSES.MANAGE_LOCATIONS
    ],

    [ERP_ROLES.VIEWER]: [
        ERP_PERMISSIONS.TRANSFERS.VIEW,
        ERP_PERMISSIONS.QUOTES.VIEW,
        ERP_PERMISSIONS.SALES.VIEW,
        ERP_PERMISSIONS.INVENTORY.VIEW,
        ERP_PERMISSIONS.PRODUCTS.VIEW,
        ERP_PERMISSIONS.WAREHOUSES.VIEW,
        ERP_PERMISSIONS.CONTACTS.VIEW,
        ERP_PERMISSIONS.REPORTS.VIEW
    ]
} as const;

// Utilidades para validación de permisos
export const hasERPPermission = (userPermissions: string[], requiredPermission: string): boolean => {
    return userPermissions.includes(requiredPermission);
};

export const hasAnyERPPermission = (userPermissions: string[], requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(permission => hasERPPermission(userPermissions, permission));
};

export const hasAllERPPermissions = (userPermissions: string[], requiredPermissions: string[]): boolean => {
    return requiredPermissions.every(permission => hasERPPermission(userPermissions, permission));
};

export const getPermissionsByERPRole = (role: string): string[] => {
    return ROLE_PERMISSION_MAP[role as keyof typeof ROLE_PERMISSION_MAP] || [];
};

export type ERPPermissionModule = keyof typeof ERP_PERMISSIONS;
export type ERPRole = keyof typeof ERP_ROLES;
