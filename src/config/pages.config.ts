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
	roles?: string[];
	companyId?: number;
	requireAll?: boolean;
}


export const authPages = {
	loginPage: {
		id: 'loginPage',
		to: '/login',
		text: 'Login',
		icon: 'DuoLogOut',
		authority: []
	},
	profilePage: {
		id: 'profilePage',
		to: '/profile',
		text: 'Perfil',
		icon: 'DuoUser',
		authority: []
	},
	aceptarInvitacion: {
		id: 'aceptarInvitacion',
		to: '/invitar/aceptar/:token',
		text: 'Aceptar invitación',
		icon: 'DuoMailOpened',
		authority: []
	},
	recuperarPassword: {
		id: 'recuperarPassword',
		to: '/recuperar-password',
		text: 'Recuperar contraseña',
		icon: 'DuoKey',
		authority: []
	},
	confirmarNuevaPass: {
		id: 'confirmarNuevaPass',
		to: '/reset-password',
		text: 'Confirmar nueva contraseña',
		icon: 'DuoFile',
		authority: []
	},
} satisfies Record<string, PageConfig>;

/* =================================================
   PÁGINAS PRIVADAS - MÓDULOS ERP
   ================================================= */

export const privatePages = {
	dashboard: {
		id: 'dashboard',
		to: '/dashboard',
		text: 'Home',
		icon: 'DuoHomeHeart',
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
				icon: 'DuoBuilding',
				authority: ['view-company', 'edit-company'],
				roles: ['super-admin', 'company-admin'],
			},
			subsidiary: {
				id: 'subsidiary',
				to: '/gestion/subempresa',
				text: 'Subempresa',
				icon: 'DuoBuilding',
				authority: ['view-subsidiary', 'edit-subsidiary'],
				roles: ['super-admin', 'company-admin'],
			},
			subsidiaryDetail: {
				id: 'subsidiaryDetail',
				to: '/gestion/subempresa/:id',
				text: 'Detalle Subempresa',
				icon: 'DuoBuilding',
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
				icon: 'DuoHome',
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
				icon: 'DuoUsers',
				authority: ['view-user'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin'],
			},
			permissionsAdmin: {
				id: 'permissionsAdmin',
				to: '/admin/permisos',
				text: 'Administrar Permisos',
				icon: 'DuoShieldCheck',
				authority: ['manage-permissions'],
				roles: ['super-admin'],
				requireAll: true,
			},
			rolesPermisos: {
				id: 'rolesPermisos',
				to: '/gestion/roles-permisos',
				text: 'Gestion de usuarios',
				icon: 'DuoGroup',
				authority: ['manage-roles', 'view-user'],
				roles: ['super-admin', 'company-admin'],
				requireAll: false,
			},
			rolesPermisosDetail: {
				id: 'rolesPermisosDetail',
				to: '/gestion/roles-permisos/:userId',
				text: 'Detalle Usuario',
				icon: 'DuoUser',
				authority: ['manage-roles', 'view-user'],
				roles: ['super-admin', 'company-admin'],
				requireAll: false,
			},
		},
	},

	inventory: {
		id: 'inventory',
		to: '/inventario',
		text: 'Inventario',
		icon: 'DuoBox3',
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

catalogs: {
    id: 'catalogs',
    to: '/catalogos',
    text: 'Catálogos',
    icon: 'DuoArchive',
    authority: ['view-product', 'view-category', 'view-brand'],
    roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'warehouse-employee', 'manager'],
    requireAll: false,
    subPages: {
        products: {
            id: 'products',
            to: '/catalogos/productos',
            text: 'Productos',
            icon: 'DuoPixels',
            authority: ['view-product'],
            roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'warehouse-employee', 'manager'],
            requireAll: false,
        },
        productsDetail: {
            id: 'productsDetail',
            to: '/catalogos/productos/:productId',
            text: 'Detalle de producto',
            icon: 'DuoBox',
            authority: ['view-product'],
            roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'warehouse-employee', 'manager'],
            requireAll: false,
        },
        warehouses: {
            id: 'warehouses',
            to: '/catalogos/bodegas',
            text: 'Bodegas',
            icon: 'DuoBarcode', // ← reemplazo equivalente al Building pero versión DUO
            authority: ['view-branch'],
            roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'warehouse-employee'],
            requireAll: false,
        },
        categories: {
            id: 'categories',
            to: '/catalogos/categorias',
            text: 'Categorías',
            icon: 'DuoBox2',
            authority: ['view-category'],
            roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'manager'],
            requireAll: false,
        },
        brands: {
            id: 'brands',
            to: '/catalogos/marcas',
            text: 'Marcas',
            icon: 'DuoBox1',
            authority: ['view-brand'],
            roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'manager'],
            requireAll: false,
        },
        suppliers: {
            id: 'suppliers',
            to: '/catalogos/proveedores',
            text: 'Proveedores',
            icon: 'DuoUser',
            authority: ['View-Supplier'],
            roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'purchasing-manager', 'manager'],
            requireAll: false,
        },
        customers: {
            id: 'customers',
            to: '/catalogos/clientes',
            text: 'Clientes-Proveedor',
            icon: 'DuoGroup',
            authority: ['View-Customer-Supplier'],
            roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'sales-manager', 'manager'],
            requireAll: false,
        },
        documents: {
            id: 'documents',
            to: '/documentos',
            text: 'Documentos',
            icon: 'DuoUpload',
            authority: ['view-brand'],
            roles: ['super-admin'],
            requireAll: false,
        },
    },
},


	humanResources: {
		id: 'humanResources',
		to: '/rrhh',
		text: 'Recursos Humanos',
		icon: 'DuoGroup',
		authority: ['view-payslips', 'manage-invitations'],
		roles: ['super-admin', 'company-admin'],
		requireAll: false,
		subPages: {
			invitationsAdmin: {
				id: 'invitationsAdmin',
				to: '/admin/invitaciones',
				text: 'Gestionar Invitaciones',
				icon: 'DuoSend',
				authority: ['manage-invitations'],
				roles: ['super-admin', 'company-admin'],
				requireAll: false,
			},
		},
	},

	systemAdmin: {
		id: 'systemAdmin',
		to: '/admin',
		text: 'Administración',
		icon: 'DuoSettings',
		authority: ['access-admin-panel'],
		roles: ['super-admin', 'company-admin'],
		requireAll: false,
		subPages: {
			systemParameters: {
				id: 'systemParameters',
				to: '/admin/parametros-sistema',
				text: 'Parámetros del Sistema',
				icon: 'DuoSliders',
				authority: ['access-admin-panel'],
				roles: ['super-admin', 'company-admin'],
				requireAll: false,
			},
			systemParametersDetail: {
				id: 'systemParametersDetail',
				to: '/admin/parametros-sistema/:id',
				text: 'Detalle Parámetro',
				icon: 'DuoSliders',
				authority: ['access-admin-panel'],
				roles: ['super-admin', 'company-admin'],
				requireAll: false,
			},
		},
	},

	notifications: {
		id: 'notifications',
		to: '/notificaciones',
		text: 'Notificaciones',
		icon: 'DuoNotification',
		authority: [],
		roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'manager', 'employee', 'technician', 'cashier', 'sales-rep'],
	},

	commercial: {
		id: 'commercial',
		to: '/comercial',
		text: 'Comercial',
		icon: 'DuoBag',
		authority: ['view-sale'],
		roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'sales-rep', 'cashier', 'manager'],
		requireAll: false,
		subPages: {
			sales: {
				id: 'sales',
				to: '/comercial/ventas',
				text: 'Ventas',
				icon: 'DuoSale1',
				authority: ['view-sale'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'sales-rep', 'cashier', 'manager', 'after-sales'],
			},
			quotes: {
				id: 'quotes',
				to: '/comercial/cotizaciones',
				text: 'Cotizaciones',
				icon: 'DuoArticle',
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
			warranties: {
				id: 'warranties',
				to: '/comercial/warranties',
				text: 'Garantías',
				icon: 'DuoShieldCheck',
				authority: ['view-warranty'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'after-sales'],
				requireAll: false,
			},
			warrantyDetail: {
				id: 'warrantyDetail',
				to: '/garantias/:warrantyId',
				text: 'Detalle de garantía',
				icon: 'DuoShieldCheck',
				authority: ['view-warranty'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'after-sales'],
				requireAll: false,
			},
			clientesVentas:{
				id: 'clientesVentas',
				to: '/comercial/clientes-ventas',
				text: 'Clientes Ventas',
				icon: 'DuoUser',
				authority: ['view-sale'],
				roles: ['super-admin', 'company-admin', 
					'subsidiary-admin', 'branch-admin', 'cashier', 'manager'],
			},
			clientesVentasDetalle:{
				id: 'clientesVentasDetalle',
				to: '/comercial/clientes-ventas/:clienteId',
				text: 'Detalle Clientes Ventas',
				icon: 'DuoUsers',
				authority: ['view-sale'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'cashier', 'manager'],
			},
		},
	},

	reports: {
		id: 'reports',
		to: '/reportes',
		text: 'Reportes',
		icon: 'DuoChart',
		authority: ['view-reports'],
		roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'manager'],
		subPages: {
			salesDashboard: {
				id: 'salesDashboard',
				to: '/reportes/ventas',
				text: 'Dashboard de Ventas',
				icon: 'DuoPriceTag',
				authority: ['view-reports'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'manager'],
			},
			inventoryReports: {
				id: 'inventoryReports',
				to: '/reportes/inventario',
				text: 'Reportes de Inventario',
				icon: 'DuoBox3',
				authority: ['view-reports'],
				roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'warehouse-employee', 'manager'],
			},
			financialReports: {
				id: 'financialReports',
				to: '/reportes/financieros',
				text: 'Reportes Financieros',
				icon: 'DuoMoney',
				authority: ['view-reports', 'export-reports'],
				roles: ['super-admin', 'company-admin', 'manager'],
			},
		},
	},

	technical: {
		id: 'technical',
		to: '/tecnico',
		text: 'Técnico',
		icon: 'DuoTools',
		authority: ['view-user'],
		roles: ['super-admin', 'company-admin', 'technician'],
		subPages: {
			reviews: {
				id: 'technicalReviews',
				to: '/technical-reviews',
				text: 'Revisiones Técnicas',
				icon: 'DuoTools',
				authority: ['view-user'],
				roles: ['super-admin', 'company-admin', 'technician'],
			},
		},
	},

	integrations: {
		id: 'integrations',
		to: '/integraciones',
		text: 'Integraciones',
		icon: 'DuoGlobe',
		authority: ['view-user'],
		roles: ['super-admin'],
		requireAll: true,
		subPages: {
			list: {
				id: 'integrationsList',
				to: '/integraciones/lista',
				text: 'Listado',
				icon: 'DuoBulletList',
				authority: ['view-user'],
				roles: ['super-admin'],
			},
			unmappedProducts: {
				id: 'unmappedProducts',
				to: '/integraciones/productos-sin-mapear',
				text: 'Productos Sin Mapear',
				icon: 'DuoQuestionCircle',
				authority: ['view-user'],
				roles: ['super-admin'],
			},
			syncStock: {
				id: 'syncStock',
				to: '/integraciones/sincronizar-stock',
				text: 'Sincronizar Stock',
				icon: 'DuoUpdate',
				authority: ['edit-user'],
				roles: ['super-admin'],
			},
			importOrders: {
				id: 'importOrders',
				to: '/integraciones/importar-ordenes',
				text: 'Importar Órdenes',
				icon: 'DuoDownload',
				authority: ['edit-user'],
				roles: ['super-admin'],
			},
		},
	},
};

export const pagesConfig = { ...authPages, ...privatePages };
export default pagesConfig;
