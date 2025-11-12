const CONNECTOR_WORDS = new Set(['de', 'del', 'la', 'el', 'y', 'en']);

const ROLE_LABELS: Record<string, string> = {
    superadmin: 'Super Administrador',
    superadministrador: 'Super Administrador',
    admin: 'Administrador',
    administrador: 'Administrador',
    companyadmin: 'Administrador de Empresa',
    administradordeempresa: 'Administrador de Empresa',
    branchadmin: 'Administrador de Sucursal',
    administradordesucursal: 'Administrador de Sucursal',
    subsidiaryadmin: 'Administrador de Subsidiaria',
    administradordesubsidiaria: 'Administrador de Subsidiaria',
    catalogadmin: 'Administrador de Catálogo',
    catalogmanager: 'Administrador de Catálogo',
    companymember: 'Miembro de Empresa',
    miembrodeempresa: 'Miembro de Empresa',
    employe: 'Empleado',
    employee: 'Empleado',
    user: 'Usuario',
    viewer: 'Visualizador',
    technician: 'Técnico',
    tecnico: 'Técnico',
    salesperson: 'Vendedor',
    salesrep: 'Vendedor',
    aftersales: 'Postventa',
    cashier: 'Cajero',
    manager: 'Gerente',
    warehousemanager: 'Encargado de Bodega',
    employeebodega: 'Empleado de Bodega',
    employeedebodega: 'Empleado de Bodega',
    empleadodebodega: 'Empleado de Bodega',
    subsidiarymember: 'Miembro de Subsidiaria',
    companysupervisor: 'Supervisor de Empresa',
    supervisorcompany: 'Supervisor de Empresa',
    warehouseemployee: 'Empleado de Bodega',
};

const toTitleCase = (value: string) => {
    return value
        .split(' ')
        .filter(Boolean)
        .map((word, index) => {
            const lower = word.toLowerCase();
            if (index > 0 && CONNECTOR_WORDS.has(lower)) {
                return lower;
            }
            return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join(' ');
};

export const normalizeRoleKey = (roleName?: string) => {
    if (!roleName) return '';
    return roleName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
};

// Helper para formatear nombres de roles
export const formatRoleName = (roleName: string) => {
    if (!roleName) return 'Rol';
    const normalized = normalizeRoleKey(roleName);
    if (normalized && ROLE_LABELS[normalized]) {
        return ROLE_LABELS[normalized];
    }
    const cleaned = roleName.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
    return toTitleCase(cleaned || roleName);
};

// Helper para formatear nombres de permisos
export const formatPermissionName = (permissionName: string) => {
    const permissionMap: Record<string, string> = {
        'view-dashboard': 'Ver Dashboard',
        'view-user': 'Ver Usuarios',
        'create-user': 'Crear Usuarios',
        'edit-user': 'Editar Usuarios',
        'delete-user': 'Eliminar Usuarios',
        'view-company': 'Ver Empresas',
        'create-company': 'Crear Empresas',
        'edit-company': 'Editar Empresas',
        'view-branch': 'Ver Sucursales',
        'create-branch': 'Crear Sucursales',
        'edit-branch': 'Editar Sucursales',
        'view-subsidiary': 'Ver Subsidiarias',
        'create-subsidiary': 'Crear Subsidiarias',
        'edit-subsidiary': 'Editar Subsidiarias',
        'view-reports': 'Ver Reportes',
        'view-payslips': 'Ver Nómina',
        'edit-payslips': 'Editar Nómina',
        'manage-roles': 'Gestionar Roles',
        'manage-permissions': 'Gestionar Permisos',
        'invite-user': 'Invitar Usuarios',
        'view-users': 'Ver Usuarios',
        'edit-users': 'Editar Usuarios'
    };

    return permissionMap[permissionName] || permissionName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Helper para organizar permisos por categorías
export const organizePermissionsByCategory = (permissions: string[]) => {
    const categories: Record<string, string[]> = {
        usuarios: [],
        empresas: [],
        sucursales: [],
        subsidiarias: [],
        dashboard: [],
        reportes: [],
        bodega: [],
        nomina: [],
        administracion: [],
        otros: []
    };

    permissions.forEach(permission => {
        const perm = permission.toLowerCase();
        if (perm.includes('user') || perm.includes('usuario')) {
            categories.usuarios.push(permission);
        } else if (perm.includes('company') || perm.includes('empresa')) {
            categories.empresas.push(permission);
        } else if (perm.includes('branch') || perm.includes('sucursal')) {
            categories.sucursales.push(permission);
        } else if (perm.includes('subsidiary') || perm.includes('subsidiaria')) {
            categories.subsidiarias.push(permission);
        } else if (perm.includes('dashboard')) {
            categories.dashboard.push(permission);
        } else if (perm.includes('report') || perm.includes('reporte')) {
            categories.reportes.push(permission);
        } else if (perm.includes('warehouse') || perm.includes('bodega')) {
            categories.bodega.push(permission);
        } else if (perm.includes('payslip') || perm.includes('nomina')) {
            categories.nomina.push(permission);
        } else if (perm.includes('admin') || perm.includes('manage') || perm.includes('role')) {
            categories.administracion.push(permission);
        } else {
            categories.otros.push(permission);
        }
    });

    return categories;
};
