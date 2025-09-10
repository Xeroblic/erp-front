// src/config/pages.config.ts
export interface PageConfig {
  id: string;
  to: string;
  text: string;
  icon: string;
  authority: string[];
  /** Roles específicos requeridos */
  roles?: string[];
  /** Empresa específica requerida */
  companyId?: number;
  /** Requerir todos los permisos (modo AND) */
  requireAll?: boolean;
}

export const authPages = {
  loginPage: { id: 'loginPage', to: '/login', text: 'Login', icon: 'HeroArrowRightOnRectangle', authority: [] },
  profilePage: { id: 'profilePage', to: '/profile', text: 'Perfil', icon: 'HeroUser', authority: [] },
  aceptarInvitacion: { id: 'aceptarInvitacion', to: '/invitar/aceptar/:token', text: 'Aceptar invitación', icon: 'HeroMailOpen', authority: [] },
  recuperarPassword: { id: 'recuperarPassword', to: '/recuperar-password', text: 'Recuperar contraseña', icon: 'HeroKey', authority: [] },
  confirmarNuevaPass: { id: 'confirmarNuevaPass', to: '/recuperar-password/confirmar/:uid/:token', text: 'Confirmar nueva contraseña', icon: 'HeroDocument', authority: [] },
} satisfies Record<string, PageConfig>;

export const privatePages = {
  dashboard: {
    id: 'dashboard',
    to: '/dashboard',
    text: 'Dashboard',
    icon: 'HeroChartBarSquare',
    authority: ['view-dashboard'],
    roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'manager', 'employee'],
  },
  users: {
    id: 'users',
    to: '/usuarios',
    text: 'Usuarios',
    icon: 'HeroUsers',
    authority: ['view-users', 'manage-users'],
    roles: ['super-admin', 'company-admin', 'subsidiary-admin'],
  },
  manage: {
    id: 'manage',
    to: '/gestion',
    text: 'Gestión',
    icon: 'HeroBuildingStorefront',
    authority: [
      'view-company',
      'view-subsidiary',
      'view-branch',
      'view-users',
      'edit-roles'
    ],
    roles: ['super-admin', 'company-admin', 'subsidiary-admin'],
    subPages: {
      company: {
        id: 'company',
        to: '/gestion/empresa',
        text: 'Empresa',
        icon: 'HeroBuildingStorefront',
        authority: ['view-company', 'edit-company'],
        roles: ['super-admin', 'company-admin'],
      },
      subsidiary: {
        id: 'subsidiary',
        to: '/gestion/subempresa',
        text: 'Subempresa',
        icon: 'HeroBuildingStorefront',
        authority: ['view-subsidiary', 'edit-subsidiary'],
        roles: ['super-admin', 'company-admin'],
      },
      subsidiaryDetail: {
        id: 'subsidiaryDetail',
        to: '/gestion/subempresa/:id',
        text: 'Detalle Subempresa',
        icon: 'HeroBuildingStorefront',
        authority: ['view-subsidiary'],
        roles: ['super-admin', 'company-admin', 'subsidiary-admin'],
      },
      branch: {
        id: 'branch',
        to: '/gestion/sucursal',
        text: 'Sucursal',
        icon: 'HeroBuildingStorefront',
        authority: ['view-branch', 'edit-branch'],
        roles: ['super-admin', 'company-admin', 'subsidiary-admin'],
      },
      branchDetail: {
        id: 'branchDetail',
        to: '/gestion/sucursal/:id',
        text: 'Detalle Sucursal',
        icon: 'HeroBuildingStorefront',
        authority: ['view-branch'],
        roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin'],
      },
      roles: {
        id: 'roles',
        to: '/gestion/roles-permisos',
        text: 'Roles y permisos',
        icon: 'HeroShieldCheck',
        authority: ['edit-roles'],
        roles: ['super-admin'],
        requireAll: true,
      },
      manageUsers: {
        id: 'manageUsers',
        to: '/gestion/usuarios',
        text: 'Usuarios',
        icon: 'HeroUsers',
        authority: ['view-users'],
        roles: ['super-admin', 'company-admin', 'subsidiary-admin'],
      },
      permissionsAdmin: {
        id: 'permissionsAdmin',
        to: '/admin/permisos',
        text: 'Administrar Permisos',
        icon: 'HeroShieldCheck',
        authority: ['manage-permissions'],
        roles: ['super-admin'],
        requireAll: true,
      },
    },
  },

  // Módulos ERP con roles normalizados
  inventory: {
    id: 'inventory',
    to: '/inventario',
    text: 'Inventario',
    icon: 'HeroCubeTransparent',
    authority: ['inventory.view'],
    roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'warehouse-manager', 'sales-rep'],
    subPages: {
      transfers: {
        id: 'transfers',
        to: '/inventario/transferencias',
        text: 'Transferencias',
        icon: 'HeroTruck',
        authority: ['transfers.view'],
        roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'warehouse-manager'],
      },
      movements: {
        id: 'movements',
        to: '/inventario/movimientos',
        text: 'Movimientos',
        icon: 'HeroArrowsRightLeft',
        authority: ['inventory.view_movements'],
        roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'warehouse-manager'],
      },
    },
  },

  commercial: {
    id: 'commercial',
    to: '/comercial',
    text: 'Comercial',
    icon: 'HeroShoppingBag',
    authority: ['sales.view', 'quotes.view'],
    roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'sales-rep', 'cashier', 'manager'],
    requireAll: false,
    subPages: {
      sales: {
        id: 'sales',
        to: '/comercial/ventas',
        text: 'Ventas',
        icon: 'HeroReceiptPercent',
        authority: ['sales.view'],
        roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'sales-rep', 'cashier', 'manager', 'after-sales'],
      },
      quotes: {
        id: 'quotes',
        to: '/comercial/cotizaciones',
        text: 'Cotizaciones',
        icon: 'HeroDocumentText',
        authority: ['quotes.view'],
        roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'sales-rep', 'cashier'],
      },
      transfers: {
        id: 'commercialTransfers',
        to: '/comercial/transferencias',
        text: 'Transferencias Comerciales',
        icon: 'HeroTruck',
        authority: ['transfers.view'],
        roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'sales-rep'],
      },
    },
  },

  technical: {
    id: 'technical',
    to: '/tecnico',
    text: 'Técnico',
    icon: 'HeroWrench',
    authority: ['technical.view'],
    roles: ['super-admin', 'company-admin', 'technician'],
    subPages: {
      reviews: {
        id: 'technicalReviews',
        to: '/tecnico/revisiones',
        text: 'Revisiones Técnicas',
        icon: 'HeroClipboardDocumentCheck',
        authority: ['technical.reviews'],
        roles: ['super-admin', 'company-admin', 'technician'],
      },
    },
  },

  reports: {
    id: 'reports',
    to: '/reportes',
    text: 'Reportes',
    icon: 'HeroChartBar',
    authority: ['reports.view'],
    roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'manager'],
    subPages: {
      salesDashboard: {
        id: 'salesDashboard',
        to: '/reportes/ventas',
        text: 'Dashboard de Ventas',
        icon: 'HeroReceiptPercent',
        authority: ['reports.sales_dashboard'],
        roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'manager'],
      },
      inventoryReports: {
        id: 'inventoryReports',
        to: '/reportes/inventario',
        text: 'Reportes de Inventario',
        icon: 'HeroCubeTransparent',
        authority: ['reports.inventory_reports'],
        roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'warehouse-manager', 'manager'],
      },
      financialReports: {
        id: 'financialReports',
        to: '/reportes/financieros',
        text: 'Reportes Financieros',
        icon: 'HeroBanknotes',
        authority: ['reports.financial_reports'],
        roles: ['super-admin', 'company-admin', 'manager'],
      },
    },
  },

  // Sección ERP - Catálogos
  catalogs: {
    id: 'catalogs',
    to: '/catalogos',
    text: 'Catálogos',
    icon: 'HeroArchiveBox',
    authority: ['catalogs.view'],
    roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'warehouse-manager', 'manager'],
    requireAll: false,
    subPages: {
      products: {
        id: 'products',
        to: '/catalogos/productos',
        text: 'Productos',
        icon: 'HeroQueueList',
        authority: ['catalogs.products'],
        roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'warehouse-manager', 'manager'],
        requireAll: false,
      },
      warehouses: {
        id: 'warehouses',
        to: '/catalogos/bodegas',
        text: 'Bodegas',
        icon: 'HeroBuildingStorefront',
        authority: ['catalogs.warehouses'],
        roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'warehouse-manager'],
        requireAll: false,
      },
      categories: {
        id: 'categories',
        to: '/catalogos/categorias',
        text: 'Categorías',
        icon: 'HeroRectangleGroup',
        authority: ['catalogs.categories'],
        roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'manager'],
        requireAll: false,
      },
      brands: {
        id: 'brands',
        to: '/catalogos/marcas',
        text: 'Marcas',
        icon: 'HeroTag',
        authority: ['catalogs.brands'],
        roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'manager'],
        requireAll: false,
      },
      suppliers: {
        id: 'suppliers',
        to: '/catalogos/proveedores',
        text: 'Proveedores',
        icon: 'HeroTruck',
        authority: ['catalogs.suppliers'],
        roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'purchasing-manager', 'manager'],
        requireAll: false,
      },
      customers: {
        id: 'customers',
        to: '/catalogos/clientes',
        text: 'Clientes',
        icon: 'HeroUsers',
        authority: ['catalogs.customers'],
        roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'sales-manager', 'manager'],
        requireAll: false,
      },
    },
  },

  humanResources: {
    id: 'humanResources',
    to: '/rrhh',
    text: 'Recursos Humanos',
    icon: 'HeroUserGroup',
    authority: ['hr.view'],
    roles: ['super-admin', 'company-admin'],
    requireAll: false,
    subPages: {
      invitationsAdmin: {
        id: 'invitationsAdmin',
        to: '/admin/invitaciones',
        text: 'Gestionar Invitaciones',
        icon: 'HeroPaperAirplane',
        authority: ['manage-invitations'],
        roles: ['super-admin', 'company-admin'],
        requireAll: false,
      },
    },
  },

  // Administración del Sistema
  systemAdmin: {
    id: 'systemAdmin',
    to: '/admin',
    text: 'Administración',
    icon: 'HeroCog6Tooth',
    authority: ['manage-invitations'],
    roles: ['super-admin', 'company-admin'],
    requireAll: false,
    subPages: {
      systemParameters: {
        id: 'systemParameters',
        to: '/admin/parametros-sistema',
        text: 'Parámetros del Sistema',
        icon: 'HeroAdjustmentsHorizontal',
        authority: ['manage-invitations'],
        roles: ['super-admin', 'company-admin'],
        requireAll: false,
      },
      systemParametersDetail: {
        id: 'systemParametersDetail',
        to: '/admin/parametros-sistema/:id',
        text: 'Detalle Parámetro',
        icon: 'HeroAdjustmentsHorizontal',
        authority: ['manage-invitations'],
        roles: ['super-admin', 'company-admin'],
        requireAll: false,
      },
    },
  },
};


export const pagesConfig = { ...authPages, ...privatePages };
export default pagesConfig;
