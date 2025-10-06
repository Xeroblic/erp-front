// Helper para formatear nombres de roles
export const formatRoleName = (roleName: string) => {
    const roleMap: Record<string, string> = {
        'super-admin': 'Super Administrador',
        'company-admin': 'Administrador de Empresa',
        'subsidiary-admin': 'Administrador de Subsidiaria',
        'branch-admin': 'Administrador de Sucursal',
        'manager': 'Gerente',
        'employee': 'Empleado',
        'technician': 'Técnico',
        'warehouse-employee': 'Empleado de Bodega'
    };

    return roleMap[roleName] || roleName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
