// src/config/pages.config.ts

/* =================================================
   ZENTRIA ERP - CONFIGURACIÓN DE PÁGINAS
   ================================================= */

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

/* =================================================
   PÁGINAS DE AUTENTICACIÓN - OPERATIVAS
   ================================================= */

export const authPages = {
	loginPage: {
		id: 'loginPage',
		to: '/login',
		text: 'Login',
		icon: 'HeroArrowRightOnRectangle',
		authority: []
	},
	profilePage: {
		id: 'profilePage',
		to: '/profile',
		text: 'Perfil',
		icon: 'HeroUser',
		authority: []
	},
	aceptarInvitacion: {
		id: 'aceptarInvitacion',
		to: '/invitar/aceptar/:token',
		text: 'Aceptar invitación',
		icon: 'HeroMailOpen',
		authority: []
	},
	recuperarPassword: {
		id: 'recuperarPassword',
		to: '/recuperar-password',
		text: 'Recuperar contraseña',
		icon: 'HeroKey',
		authority: []
	},
	confirmarNuevaPass: {
		id: 'confirmarNuevaPass',
		to: '/reset-password',
		text: 'Confirmar nueva contraseña',
		icon: 'HeroDocument',
		authority: []
	},
} satisfies Record<string, PageConfig>;

/* =================================================
   PÁGINAS PRIVADAS - MÓDULOS ERP
   ================================================= */

export const privatePages = {
	/* =================================================
	   DASHBOARD - OPERATIVO
	   ================================================= */
	dashboard: {
		id: 'dashboard',
		to: '/dashboard',
		text: 'Dashboard',
		icon: 'HeroChartBarSquare',
		authority: ['view-dashboard'],
		roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'manager', 'employee'],
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
			'view-user',
			'manage-roles'
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
			subsidiaryCustomization: {
				id: 'subsidiaryCustomization',
				to: '/gestion/subempresa/personalizacion',
				text: 'Personalización de Subempresa',
				icon: 'HeroPaintBrush',
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
			manageUsers: {
				id: 'manageUsers',
				to: '/gestion/usuarios',
				text: 'Usuarios',
				icon: 'HeroUsers',
				authority: ['view-user'],
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
			rolesPermisos: {
				id: 'rolesPermisos',
				to: '/gestion/roles-permisos',
				text: 'Gestion de usuarios',
				icon: 'HeroUserGroup',
				authority: ['manage-roles', 'view-user'],
				roles: ['super-admin', 'company-admin'],
				requireAll: false,
			},
			rolesPermisosDetail: {
				id: 'rolesPermisosDetail',
				to: '/gestion/roles-permisos/:userId',
				text: 'Detalle Usuario',
				icon: 'HeroUser',
				authority: ['manage-roles', 'view-user'],
				roles: ['super-admin', 'company-admin'],
				requireAll: false,
			},


		},
	},

	/* =================================================
	   INVENTARIO - OPERATIVO
	   Productos, Transferencias
	   ================================================= */
	inventory: {
		id: 'inventory',
		to: '/inventario',
		text: 'Inventario',
		icon: 'HeroCubeTransparent',
		authority: [],
		subPages: {
			transfers: {
				id: 'transfers',
				to: '/inventario/transferencias',
				text: 'Transferencias',
				icon: 'HeroTruck',
				authority: [],
			},
			movements: {
				id: 'movements',
				to: '/inventario/movimientos',
				text: 'Movimientos',
				icon: 'HeroArrowsRightLeft',
				authority: [],
			},
		},
	},

	/* =================================================
	   CATÁLOGOS - OPERATIVOS
	   Productos, Bodegas, Categorías, Marcas
	   ================================================= */
	catalogs: {
		id: 'catalogs',
		to: '/catalogos',
		text: 'Catálogos',
		icon: 'HeroArchiveBox',
		authority: ['view-product', 'view-category', 'view-brand'], // Permisos principales de catálogos
		roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'warehouse-employee', 'manager'],
		requireAll: false,
		subPages: {
			products: {
				id: 'products',
				to: '/catalogos/productos',
				text: 'Productos',
				icon: 'HeroQueueList',
				authority: ['view-product'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'warehouse-employee', 'manager'],
				requireAll: false,
			},
			productsDetail: {
				id: 'productsDetail',
				to: '/catalogos/productos/:productId',
				text: 'Detalle de producto',
				icon: 'HeroCube',
				authority: ['view-product'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'warehouse-employee', 'manager'],
				requireAll: false,
			},
			warehouses: {
				id: 'warehouses',
				to: '/catalogos/bodegas',
				text: 'Bodegas',
				icon: 'HeroBuildingStorefront',
				authority: ['view-branch'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'warehouse-employee'],
				requireAll: false,
			},
			categories: {
				id: 'categories',
				to: '/catalogos/categorias',
				text: 'Categorías',
				icon: 'HeroRectangleGroup',
				authority: ['view-category'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'manager'],
				requireAll: false,
			},
			brands: {
				id: 'brands',
				to: '/catalogos/marcas',
				text: 'Marcas',
				icon: 'HeroTag',
				authority: ['view-brand'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'manager'],
				requireAll: false,
			},
			// PENDIENTES - No operativos aún
			suppliers: {
				id: 'suppliers',
				to: '/catalogos/proveedores',
				text: 'Proveedores',
				icon: 'HeroTruck',
				authority: ['View-Supplier'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'purchasing-manager', 'manager'],
				requireAll: false,
			},
			customers: {
				id: 'customers',
				to: '/catalogos/clientes',
				text: 'Clientes-Proveedor',
				icon: 'HeroUsers',
				authority: ['View-Customer-Supplier'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'sales-manager', 'manager'],
				requireAll: false,
			},
			documents: {
				id: 'documents',
				to: '/documentos',
				text: 'Documentos',
				icon: 'HeroDocumentArrowUp',
				authority: ['view-brand'],
				roles: ['super-admin'],
				requireAll: false,
			},
			warranties: {
				id: 'warranties',
				to: '/garantias',
				text: 'Garantías',
				icon: 'HeroShieldCheck',
				authority: ['view-warranty'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'after-sales'],
				requireAll: false,
			},
			warrantyDetail: {
				id: 'warrantyDetail',
				to: '/garantias/:warrantyId',
				text: 'Detalle de garantía',
				icon: 'HeroShieldCheck',
				authority: ['view-warranty'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'after-sales'],
				requireAll: false,
			},
		},
	},

	/* =================================================
	   RECURSOS HUMANOS - OPERATIVO
	   Invitaciones
	   ================================================= */
	humanResources: {
		id: 'humanResources',
		to: '/rrhh',
		text: 'Recursos Humanos',
		icon: 'HeroUserGroup',
		authority: ['view-payslips', 'manage-invitations'], // RH incluye nóminas e invitaciones
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

	/* =================================================
	   ADMINISTRACIÓN DEL SISTEMA - OPERATIVO
	   Parámetros del Sistema
	   ================================================= */
	systemAdmin: {
		id: 'systemAdmin',
		to: '/admin',
		text: 'Administración',
		icon: 'HeroCog6Tooth',
		authority: ['access-admin-panel'],
		roles: ['super-admin', 'company-admin'],
		requireAll: false,
		subPages: {
			systemParameters: {
				id: 'systemParameters',
				to: '/admin/parametros-sistema',
				text: 'Parámetros del Sistema',
				icon: 'HeroAdjustmentsHorizontal',
				authority: ['access-admin-panel'],
				roles: ['super-admin', 'company-admin'],
				requireAll: false,
			},
			systemParametersDetail: {
				id: 'systemParametersDetail',
				to: '/admin/parametros-sistema/:id',
				text: 'Detalle Parámetro',
				icon: 'HeroAdjustmentsHorizontal',
				authority: ['access-admin-panel'],
				roles: ['super-admin', 'company-admin'],
				requireAll: false,
			},
		},
	},

	/* =================================================
	   NOTIFICACIONES - OPERATIVO
	   ================================================= */
	notifications: {
		id: 'notifications',
		to: '/notificaciones',
		text: 'Notificaciones',
		icon: 'HeroBell',
		authority: [],
		roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'manager', 'employee', 'technician', 'cashier', 'sales-rep'],
	},

	/* =================================================
	   MÓDULOS PENDIENTES - NO OPERATIVOS AÚN
	   ================================================= */

	// COMERCIAL - PENDIENTE
	commercial: {
		id: 'commercial',
		to: '/comercial',
		text: 'Comercial',
		icon: 'HeroShoppingBag',
		authority: ['view-sale'],
		roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'sales-rep', 'cashier', 'manager'],
		requireAll: false,
		subPages: {
			sales: {
				id: 'sales',
				to: '/comercial/ventas',
				text: 'Ventas',
				icon: 'HeroReceiptPercent',
				authority: ['view-sale'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'sales-rep', 'cashier', 'manager', 'after-sales'],
			},
			quotes: {
				id: 'quotes',
				to: '/comercial/cotizaciones',
				text: 'Cotizaciones',
				icon: 'HeroDocumentText',
				authority: ['view-sale'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'sales-rep', 'cashier'],
			},
			transfers: {
				id: 'commercialTransfers',
				to: '/comercial/transferencias',
				text: 'Transferencias Comerciales',
				icon: 'HeroTruck',
				authority: ['view-sale'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'sales-rep'],
			},
		},
	},

	// REPORTES - PENDIENTE
	reports: {
		id: 'reports',
		to: '/reportes',
		text: 'Reportes',
		icon: 'HeroChartBar',
		authority: ['view-reports'], // Permiso correcto del PHP
		roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'manager'],
		subPages: {
			salesDashboard: {
				id: 'salesDashboard',
				to: '/reportes/ventas',
				text: 'Dashboard de Ventas',
				icon: 'HeroReceiptPercent',
				authority: ['view-reports'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'manager'],
			},
			inventoryReports: {
				id: 'inventoryReports',
				to: '/reportes/inventario',
				text: 'Reportes de Inventario',
				icon: 'HeroCubeTransparent',
				authority: ['view-reports'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'warehouse-employee', 'manager'],
			},
			financialReports: {
				id: 'financialReports',
				to: '/reportes/financieros',
				text: 'Reportes Financieros',
				icon: 'HeroBanknotes',
				authority: ['view-reports', 'export-reports'], // Reportes financieros pueden necesitar exportación
				roles: ['super-admin', 'company-admin', 'manager'],
			},
		},
	},

	// MÓDULO TÉCNICO - OPERATIVO
	technical: {
		id: 'technical',
		to: '/tecnico',
		text: 'Técnico',
		icon: 'HeroWrench',
		authority: ['view-user'], // Permiso temporal hasta definir permisos técnicos
		roles: ['super-admin', 'company-admin', 'technician'],
		subPages: {
			reviews: {
				id: 'technicalReviews',
				to: '/technical-reviews',
				text: 'Revisiones Técnicas',
				icon: 'HeroWrenchScrewdriver',
				authority: ['view-user'], // Permiso temporal
				roles: ['super-admin', 'company-admin', 'technician'],
			},
		},
	},

	/* =================================================
	   INTEGRACIONES - SOLO SUPER ADMIN
	   ================================================= */
	integrations: {
		id: 'integrations',
		to: '/integraciones',
		text: 'Integraciones',
		icon: 'HeroGlobeAlt',
		authority: ['view-user'],
		roles: ['super-admin'],
		requireAll: true,
		subPages: {
			list: {
				id: 'integrationsList',
				to: '/integraciones/lista',
				text: 'Listado',
				icon: 'HeroListBullet',
				authority: ['view-user'],
				roles: ['super-admin'],
			},
			unmappedProducts: {
				id: 'unmappedProducts',
				to: '/integraciones/productos-sin-mapear',
				text: 'Productos Sin Mapear',
				icon: 'HeroQuestionMarkCircle',
				authority: ['view-user'],
				roles: ['super-admin'],
			},
			syncStock: {
				id: 'syncStock',
				to: '/integraciones/sincronizar-stock',
				text: 'Sincronizar Stock',
				icon: 'HeroArrowPath',
				authority: ['edit-user'],
				roles: ['super-admin'],
			},
			importOrders: {
				id: 'importOrders',
				to: '/integraciones/importar-ordenes',
				text: 'Importar Órdenes',
				icon: 'HeroArrowDownTray',
				authority: ['edit-user'],
				roles: ['super-admin'],
			},
		},
	},
};

/* =================================================
   CONFIGURACIÓN FINAL DE PÁGINAS
   ================================================= */

export const pagesConfig = { ...authPages, ...privatePages };
export default pagesConfig;
