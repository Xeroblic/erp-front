/**
 * ROLES Y UTILIDADES DEL SISTEMA ERP
 * 
 * ✅ Los permisos se obtienen de la BD a través de permissionsSlice
 * ✅ Los permisos específicos están definidos en pages.config.ts
 * ✅ Los roles están normalizados según la estructura del negocio
 */

/**
 * ROLES DEL SISTEMA - NORMALIZADOS ✅
 * Basado en la estructura organizacional real descrita por el usuario
 */
export const SYSTEM_ROLES = {
    // Roles administrativos principales
    SUPER_ADMIN: 'super-admin',           // Acceso exclusivo a la empresa principal  
    COMPANY_ADMIN: 'company-admin',       // Supervisor Empresa - administra empresa principal
    SUBSIDIARY_ADMIN: 'subsidiary-admin', // Administrador - gestiona sub-empresa
    BRANCH_ADMIN: 'branch-admin',         // Administrador Sucursal

    // Roles operacionales específicos del negocio
    WAREHOUSE_MANAGER: 'warehouse-manager',   // Encargado de Bodega
    SALES_REP: 'sales-rep',                   // Vendedor  
    TECHNICIAN: 'technician',                 // Técnico - acceso exclusivo a revisiones técnicas
    AFTER_SALES: 'after-sales',               // Postventa - lectura de pedidos y ventas
    CASHIER: 'cashier',                       // Cajero - cotizaciones y ventas
    MANAGER: 'manager',                       // Gerente - dashboards y reportes

    // Roles generales
    EMPLOYEE: 'employee',                     // Empleado general
    VIEWER: 'viewer',                         // Solo lectura
    SYSTEM: 'system'                          // Rol interno del sistema (no visible)
} as const;

/**
 * DESCRIPCIONES DE ROLES - SEGÚN DOCUMENTACIÓN DEL NEGOCIO ✅
 */
export const ROLE_DESCRIPTIONS = {
    'super-admin': {
        name: 'Super Administrador',
        description: 'Acceso exclusivo a la empresa principal. Puede ver y modificar datos generales. No gestiona sucursales ni sub-empresas.',
        scope: 'Empresa Principal',
        level: 12
    },
    'company-admin': {
        name: 'Supervisor Empresa',
        description: 'Equivale al administrador de la empresa principal. Tiene acceso y supervisión de alto nivel.',
        scope: 'Empresa Principal',
        level: 11
    },
    'subsidiary-admin': {
        name: 'Administrador',
        description: 'Administra una sub-empresa o sucursal. Equivale al "Administrador del Sistema" para esa sub-empresa. Control total dentro de su ámbito.',
        scope: 'Sub-empresa específica',
        level: 10
    },
    'branch-admin': {
        name: 'Administrador Sucursal',
        description: 'Administra una sucursal específica.',
        scope: 'Sucursal específica',
        level: 9
    },
    'warehouse-manager': {
        name: 'Encargado de Bodega',
        description: 'Acceso restringido a información relacionada con bodega. Rol operativo con permisos menores que un supervisor.',
        scope: 'Módulos de bodega e inventario',
        level: 7
    },
    'sales-rep': {
        name: 'Vendedor',
        description: 'Puede visualizar productos, stock y ventas. Tiene acceso en modo solo lectura a información de bodega. No puede editar información fuera de sus competencias.',
        scope: 'Módulos de ventas y productos',
        level: 6
    },
    'technician': {
        name: 'Técnico',
        description: 'Accede exclusivamente al módulo de revisiones técnicas. Puede agregar, editar o eliminar revisiones. El resto de los módulos son de solo lectura.',
        scope: 'Revisiones técnicas',
        level: 4
    },
    'after-sales': {
        name: 'Postventa',
        description: 'Accede en modo lectura a información relacionada con pedidos, órdenes de pedido y ventas. No puede modificar datos en otros módulos.',
        scope: 'Información post-venta',
        level: 3
    },
    'cashier': {
        name: 'Cajero',
        description: 'Puede generar y exportar cotizaciones, visualizar productos y realizar ventas.',
        scope: 'Punto de venta',
        level: 5
    },
    'manager': {
        name: 'Gerente',
        description: 'Accede a dashboards, informes y reportes. Tiene una visión general del funcionamiento del sistema.',
        scope: 'Reportes y análisis',
        level: 8
    },
    'employee': {
        name: 'Empleado',
        description: 'Acceso básico según su función específica.',
        scope: 'Limitado',
        level: 2
    },
    'viewer': {
        name: 'Visualizador',
        description: 'Solo lectura en módulos básicos.',
        scope: 'Solo lectura',
        level: 1
    },
    'system': {
        name: 'Sistema',
        description: 'Rol interno, relacionado con la configuración y lógica del sistema. No es visible para ningún usuario.',
        scope: 'Interno',
        level: 0
    }
} as const;

/**
 * UTILIDADES DE ROLES ✅
 */
export const hasRole = (userRoles: string[], requiredRole: string): boolean => {
    return userRoles.includes(requiredRole);
};

export const hasAnyRole = (userRoles: string[], requiredRoles: string[]): boolean => {
    return requiredRoles.some(role => hasRole(userRoles, role));
};

export const hasMinimumRoleLevel = (userRoles: string[], minimumRole: string): boolean => {
    const userMaxLevel = Math.max(
        ...userRoles.map(role => ROLE_DESCRIPTIONS[role as keyof typeof ROLE_DESCRIPTIONS]?.level || 0)
    );
    const requiredLevel = ROLE_DESCRIPTIONS[minimumRole as keyof typeof ROLE_DESCRIPTIONS]?.level || 0;
    return userMaxLevel >= requiredLevel;
};

export const getRoleDescription = (role: string) => {
    return ROLE_DESCRIPTIONS[role as keyof typeof ROLE_DESCRIPTIONS] || {
        name: 'Rol Desconocido',
        description: 'Rol no definido en el sistema',
        scope: 'No definido',
        level: 0
    };
};

/**
 * TIPOS TYPESCRIPT ✅
 */
export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];
export type RoleDescription = typeof ROLE_DESCRIPTIONS[SystemRole];