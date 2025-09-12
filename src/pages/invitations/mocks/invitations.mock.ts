import { Invitation } from '@/interface/invitacion.interface';

// CU019 - Mock data para invitaciones con todos los estados
export const mockInvitations: Invitation[] = [
    {
        id: 1,
        uid: 'invite-001-uuid',
        email: 'maria.gonzalez@empresa.com',
        first_name: 'María',
        last_name: 'González',
        rut: '12.345.678-9',
        position: 'Administradora',
        phone_number: '+56912345678',
        company_id: 1,
        subsidiary_id: 1,
        branch_id: 1,
        role_name: 'administrador',
        role: 'administrador',
        permissions: ['view-dashboard', 'manage-users', 'edit-company'],
        status: 'pending',
        additional_data: {
            message: 'Bienvenida al equipo de administración. Por favor, acepta esta invitación para comenzar.',
            custom_welcome: true
        },
        created_at: '2025-01-10T08:30:00Z',
        updated_at: '2025-01-10T08:30:00Z',
        expires_at: '2025-01-17T08:30:00Z',
        sent_at: '2025-01-10T08:30:15Z',
        accepted_at: undefined,
        company: {
            id: 1,
            company_name: 'EcoTech Solutions'
        },
        subsidiary: {
            id: 1,
            name: 'Sede Principal'
        },
        branch: {
            id: 1,
            branch_name: 'Oficina Central'
        },
        sent_by_user: {
            id: 1,
            first_name: 'Admin',
            last_name: 'Principal',
            email: 'admin@empresa.com'
        }
    },
    {
        id: 2,
        uid: 'invite-002-uuid',
        email: 'carlos.rodriguez@empresa.com',
        first_name: 'Carlos',
        last_name: 'Rodríguez',
        rut: '11.234.567-8',
        position: 'Gestor Operativo',
        phone_number: '+56923456789',
        company_id: 1,
        subsidiary_id: 1,
        branch_id: 2,
        role_name: 'gestor-operativo',
        role: 'gestor-operativo',
        permissions: ['view-dashboard', 'inventory.view', 'inventory.create'],
        status: 'accepted',
        additional_data: {
            message: 'Te invitamos a formar parte del equipo operativo.',
            department: 'Operaciones'
        },
        created_at: '2025-01-08T14:20:00Z',
        updated_at: '2025-01-09T09:15:00Z',
        expires_at: '2025-01-15T14:20:00Z',
        sent_at: '2025-01-08T14:20:30Z',
        accepted_at: '2025-01-09T09:15:00Z',
        company: {
            id: 1,
            company_name: 'EcoTech Solutions'
        },
        subsidiary: {
            id: 1,
            name: 'Sede Principal'
        },
        branch: {
            id: 2,
            branch_name: 'Sucursal Norte'
        },
        sent_by_user: {
            id: 1,
            first_name: 'Admin',
            last_name: 'Principal',
            email: 'admin@empresa.com'
        }
    },
    {
        id: 3,
        uid: 'invite-003-uuid',
        email: 'ana.martinez@empresa.com',
        first_name: 'Ana',
        last_name: 'Martínez',
        rut: '10.123.456-7',
        position: 'Supervisora de Área',
        phone_number: '+56934567890',
        company_id: 1,
        subsidiary_id: 2,
        branch_id: 3,
        role_name: 'supervisor-area',
        role: 'supervisor-area',
        permissions: ['view-dashboard', 'view-users', 'reports.view'],
        status: 'expired',
        additional_data: {
            message: 'Invitación para unirse como supervisora de área.',
            area: 'Ventas'
        },
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        expires_at: '2025-01-08T10:00:00Z',
        sent_at: '2025-01-01T10:00:45Z',
        accepted_at: undefined,
        company: {
            id: 1,
            company_name: 'EcoTech Solutions'
        },
        subsidiary: {
            id: 2,
            name: 'Sede Sur'
        },
        branch: {
            id: 3,
            branch_name: 'Sucursal Centro'
        },
        sent_by_user: {
            id: 1,
            first_name: 'Admin',
            last_name: 'Principal',
            email: 'admin@empresa.com'
        }
    },
    {
        id: 4,
        uid: 'invite-004-uuid',
        email: 'luis.fernandez@empresa.com',
        first_name: 'Luis',
        last_name: 'Fernández',
        rut: '9.012.345-6',
        position: 'Coordinador Logístico',
        phone_number: '+56945678901',
        company_id: 1,
        subsidiary_id: 1,
        branch_id: 1,
        role_name: 'coordinador-logistico',
        role: 'coordinador-logistico',
        permissions: ['view-dashboard', 'inventory.view', 'transfers.view'],
        status: 'pending',
        additional_data: {
            message: 'Necesitamos tu experiencia en el área de logística.',
            priority: 'high'
        },
        created_at: '2025-01-12T16:45:00Z',
        updated_at: '2025-01-12T16:45:00Z',
        expires_at: '2025-01-19T16:45:00Z',
        sent_at: '2025-01-12T16:45:20Z',
        accepted_at: undefined,
        company: {
            id: 1,
            company_name: 'EcoTech Solutions'
        },
        subsidiary: {
            id: 1,
            name: 'Sede Principal'
        },
        branch: {
            id: 1,
            branch_name: 'Oficina Central'
        },
        sent_by_user: {
            id: 2,
            first_name: 'Supervisor',
            last_name: 'Empresa',
            email: 'supervisor@empresa.com'
        }
    },
    {
        id: 5,
        uid: 'invite-005-uuid',
        email: 'patricia.lopez@empresa.com',
        first_name: 'Patricia',
        last_name: 'López',
        rut: '8.901.234-5',
        position: 'Analista Senior',
        phone_number: '+56956789012',
        company_id: 1,
        subsidiary_id: 1,
        branch_id: 2,
        role_name: 'analista-senior',
        role: 'analista-senior',
        permissions: ['view-dashboard', 'reports.view', 'reports.generate'],
        status: 'accepted',
        additional_data: {},
        created_at: '2025-01-05T11:30:00Z',
        updated_at: '2025-01-06T08:20:00Z',
        expires_at: '2025-01-12T11:30:00Z',
        sent_at: '2025-01-05T11:30:15Z',
        accepted_at: '2025-01-06T08:20:00Z',
        company: {
            id: 1,
            company_name: 'EcoTech Solutions'
        },
        subsidiary: {
            id: 1,
            name: 'Sede Principal'
        },
        branch: {
            id: 2,
            branch_name: 'Sucursal Norte'
        },
        sent_by_user: {
            id: 1,
            first_name: 'Admin',
            last_name: 'Principal',
            email: 'admin@empresa.com'
        }
    },
    {
        id: 6,
        uid: 'invite-006-uuid',
        email: 'diego.morales@empresa.com',
        first_name: 'Diego',
        last_name: 'Morales',
        rut: '7.890.123-4',
        position: 'Gestor de Inventario',
        phone_number: '+56967890123',
        company_id: 1,
        subsidiary_id: 2,
        branch_id: 4,
        role_name: 'gestor-inventario',
        role: 'gestor-inventario',
        permissions: ['view-dashboard', 'inventory.view', 'inventory.manage'],
        status: 'pending',
        additional_data: {
            message: 'Tu experiencia en gestión de inventarios será muy valiosa para nuestro equipo.',
            department: 'Almacén'
        },
        created_at: '2025-01-14T13:15:00Z',
        updated_at: '2025-01-14T13:15:00Z',
        expires_at: '2025-01-21T13:15:00Z',
        sent_at: '2025-01-14T13:15:30Z',
        accepted_at: undefined,
        company: {
            id: 1,
            company_name: 'EcoTech Solutions'
        },
        subsidiary: {
            id: 2,
            name: 'Sede Sur'
        },
        branch: {
            id: 4,
            branch_name: 'Almacén Central'
        },
        sent_by_user: {
            id: 1,
            first_name: 'Admin',
            last_name: 'Principal',
            email: 'admin@empresa.com'
        }
    },
    {
        id: 7,
        uid: 'invite-007-uuid',
        email: 'sofia.ruiz@empresa.com',
        first_name: 'Sofía',
        last_name: 'Ruiz',
        rut: '6.789.012-3',
        position: 'Operadora General',
        phone_number: '+56978901234',
        company_id: 1,
        subsidiary_id: 1,
        branch_id: 3,
        role_name: 'operador-general',
        role: 'operador-general',
        permissions: ['view-dashboard'],
        status: 'expired',
        additional_data: {
            message: 'Bienvenida al equipo operativo.',
            shift: 'morning'
        },
        created_at: '2024-12-28T09:00:00Z',
        updated_at: '2024-12-28T09:00:00Z',
        expires_at: '2025-01-04T09:00:00Z',
        sent_at: '2024-12-28T09:00:30Z',
        accepted_at: undefined,
        company: {
            id: 1,
            company_name: 'EcoTech Solutions'
        },
        subsidiary: {
            id: 1,
            name: 'Sede Principal'
        },
        branch: {
            id: 3,
            branch_name: 'Sucursal Centro'
        },
        sent_by_user: {
            id: 2,
            first_name: 'Supervisor',
            last_name: 'Empresa',
            email: 'supervisor@empresa.com'
        }
    },
    {
        id: 8,
        uid: 'invite-008-uuid',
        email: 'ricardo.vargas@empresa.com',
        first_name: 'Ricardo',
        last_name: 'Vargas',
        rut: '5.678.901-2',
        position: 'Administrador',
        phone_number: '+56989012345',
        company_id: 1,
        subsidiary_id: 1,
        branch_id: 1,
        role_name: 'administrador',
        role: 'administrador',
        permissions: ['view-dashboard', 'manage-users', 'edit-company', 'view-subsidiary'],
        status: 'accepted',
        additional_data: {
            message: 'Esperamos contar con tu liderazgo administrativo.',
            leadership_level: 'senior'
        },
        created_at: '2025-01-03T15:20:00Z',
        updated_at: '2025-01-04T10:30:00Z',
        expires_at: '2025-01-10T15:20:00Z',
        sent_at: '2025-01-03T15:20:45Z',
        accepted_at: '2025-01-04T10:30:00Z',
        company: {
            id: 1,
            company_name: 'EcoTech Solutions'
        },
        subsidiary: {
            id: 1,
            name: 'Sede Principal'
        },
        branch: {
            id: 1,
            branch_name: 'Oficina Central'
        },
        sent_by_user: {
            id: 1,
            first_name: 'Admin',
            last_name: 'Principal',
            email: 'admin@empresa.com'
        }
    }
];

// Estadísticas calculadas a partir de los mocks
export const mockInvitationStats = {
    total: mockInvitations.length,
    pending: mockInvitations.filter(inv => inv.status === 'pending').length,
    sent: mockInvitations.filter(inv => inv.status === 'sent').length,
    accepted: mockInvitations.filter(inv => inv.status === 'accepted').length,
    expired: mockInvitations.filter(inv => inv.status === 'expired').length,
    cancelled: mockInvitations.filter(inv => inv.status === 'cancelled').length,
};

// Roles disponibles para crear invitaciones
export const mockAvailableRoles = [
    { value: 'super-admin', label: 'Super Administrador' },
    { value: 'supervisor-empresa', label: 'Supervisor de Empresa' },
    { value: 'administrador', label: 'Administrador' },
    { value: 'gestor-operativo', label: 'Gestor Operativo' },
    { value: 'coordinador-logistico', label: 'Coordinador Logístico' },
    { value: 'analista-senior', label: 'Analista Senior' },
    { value: 'supervisor-area', label: 'Supervisor de Área' },
    { value: 'gestor-inventario', label: 'Gestor de Inventario' },
    { value: 'operador-general', label: 'Operador General' },
];

// Estados de invitación
export const mockInvitationStatuses = [
    { value: '', label: 'Todos los estados' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'sent', label: 'Enviadas' },
    { value: 'accepted', label: 'Aceptadas' },
    { value: 'expired', label: 'Expiradas' },
    { value: 'cancelled', label: 'Canceladas' },
];

// Función para simular la creación de una nueva invitación
export const createMockInvitation = (data: {
    email: string;
    first_name: string;
    last_name: string;
    role_name: string;
    rut?: string;
    position?: string;
    phone_number?: string;
    company_id?: number;
    subsidiary_id?: number;
    branch_id?: number;
    message?: string;
}): Invitation => {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días de expiración

    return {
        id: Date.now(), // ID único basado en timestamp
        uid: `invite-${Date.now()}-uuid`,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        rut: data.rut,
        position: data.position,
        phone_number: data.phone_number,
        company_id: data.company_id || 1,
        subsidiary_id: data.subsidiary_id || 1,
        branch_id: data.branch_id || 1,
        role_name: data.role_name,
        role: data.role_name,
        permissions: ['view-dashboard'],
        status: 'pending',
        additional_data: data.message ? { message: data.message } : {},
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        sent_at: new Date(now.getTime() + 1000).toISOString(), // 1 segundo después
        accepted_at: undefined,
        company: {
            id: data.company_id || 1,
            company_name: 'EcoTech Solutions'
        },
        subsidiary: {
            id: data.subsidiary_id || 1,
            name: 'Sede Principal'
        },
        branch: {
            id: data.branch_id || 1,
            branch_name: 'Oficina Central'
        },
        sent_by_user: {
            id: 1,
            first_name: 'Admin',
            last_name: 'Principal',
            email: 'admin@empresa.com'
        }
    };
};

// Función para simular búsqueda y filtrado
export const filterMockInvitations = (
    invitations: Invitation[],
    filters: {
        search?: string;
        status?: string;
        role?: string;
    }
): Invitation[] => {
    let filtered = [...invitations];

    // Filtro por búsqueda (email o nombre)
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(inv =>
            inv.email.toLowerCase().includes(searchLower) ||
            inv.first_name.toLowerCase().includes(searchLower) ||
            inv.last_name.toLowerCase().includes(searchLower)
        );
    }

    // Filtro por estado
    if (filters.status && filters.status !== '') {
        filtered = filtered.filter(inv => inv.status === filters.status);
    }

    // Filtro por rol
    if (filters.role && filters.role !== '') {
        filtered = filtered.filter(inv => inv.role === filters.role);
    }

    return filtered;
};

// Función para simular paginación
export const paginateMockInvitations = (
    invitations: Invitation[],
    page: number = 1,
    pageSize: number = 10
): {
    data: Invitation[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
} => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const data = invitations.slice(startIndex, endIndex);

    return {
        data,
        pagination: {
            page,
            pageSize,
            total: invitations.length,
            totalPages: Math.ceil(invitations.length / pageSize),
        },
    };
};

export default mockInvitations;