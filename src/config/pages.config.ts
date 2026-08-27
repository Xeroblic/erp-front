// src/config/pages.config.ts

import { id } from 'date-fns/locale';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';

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
	subPages?: Record<string, PageConfig>;
}

export const authPages = {
	loginPage: {
		id: 'loginPage',
		to: '/login',
		text: 'Login',
		icon: 'DuoLogOut',
		authority: [],
	},
	profilePage: {
		id: 'profilePage',
		to: '/profile',
		text: 'Perfil',
		icon: 'DuoUser',
		authority: [],
	},
	aceptarInvitacion: {
		id: 'aceptarInvitacion',
		to: '/invitar/aceptar/:token',
		text: 'Aceptar invitación',
		icon: 'DuoMailOpened',
		authority: [],
	},
	recuperarPassword: {
		id: 'recuperarPassword',
		to: '/recuperar-password',
		text: 'Recuperar contraseña',
		icon: 'DuoKey',
		authority: [],
	},
	confirmarNuevaPass: {
		id: 'confirmarNuevaPass',
		to: '/reset-password',
		text: 'Confirmar nueva contraseña',
		icon: 'DuoFile',
		authority: [],
	},
	portalPedidos: {
		id: 'portalPedidos',
		to: '/portal-pedidos/:hash',
		text: 'Portal Pedidos',
		icon: 'DuoBox3',
		authority: [],
	},
	portalPedidosMock: {
		id: 'portalPedidosMock',
		to: '/portal-pedidos/mock/:id',
		text: 'Portal Pedidos (Demo)',
		icon: 'DuoBox3',
		authority: [],
	},
	FormularioLockCare: {
		id: 'formularioLockCare',
		to: '/formulario-lock-care',
		text: 'Formulario Lock Care',
		icon: 'DuoForm',
		authority: [],
		subPages: {
			publicLockCare: {
				id: 'publicLockCare',
				to: '/lockers/:token/info',
				text: 'Ingreso Lock Care',
				icon: 'DuoForm',
				authority: [],
			},
			checkOutLockCare: {
				id: 'checkOutLockCare',
				to: '/lockers/check-out',
				text: 'Retiro Lock Care',
				icon: 'DuoUnlock',
				authority: [],
			},
		},
	},
} satisfies Record<string, PageConfig>;

/* =================================================
   PÁGINAS PRIVADAS - MÓDULOS ERP
   ================================================= */

// src/config/pages.config.ts
export const privatePages = {
	dashboard: {
		id: 'dashboard',
		to: '/dashboard',
		text: 'Home',
		icon: 'DuoHomeHeart',
		authority: [],
	},

	// =========================
	// GESTIÓN
	// =========================
	manage: {
		id: 'manage',
		to: '/gestion',
		text: 'Gestión',
		icon: 'HeroBuildingStorefront',
		// Gateado solo por permiso: cada subpágina exige su propio authority. Se listan
		// aquí todos los permisos que abren alguna subpágina de Gestión (view-company,
		// view-subsidiary, view-branch, manage-roles, edit-user) para que el título/collapse
		// no bloquee a roles que solo tienen un subconjunto de esos permisos.
		// OJO: `view-user` NO va en esta lista. Cobranza lo tiene solo para poblar el
		// selector de encargados (assignee_ids) de Pagos diferidos, no para administrar
		// usuarios; incluirlo aquí mostraba «Gestión de usuarios» a un rol que después
		// recibía 403 en /roles y /permissions.
		authority: ['view-company', 'view-subsidiary', 'view-branch', 'manage-roles', 'edit-user'],
		requireAll: false,
		subPages: {
			company: {
				id: 'company',
				to: '/gestion/empresa',
				text: 'Empresa',
				icon: 'DuoBuilding',
				authority: ['view-company'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'company-supervisor',
					'manager',
				],
			},
			subsidiary: {
				id: 'subsidiary',
				to: '/gestion/subempresa',
				text: 'Subempresa',
				icon: 'DuoBuilding',
				authority: ['view-subsidiary'],
			},
			subsidiaryDetail: {
				id: 'subsidiaryDetail',
				to: '/gestion/subempresa/:id',
				text: 'Detalle Subempresa',
				icon: 'DuoBuilding',
				authority: ['view-subsidiary'],
			},
			subsidiaryCustomization: {
				id: 'subsidiaryCustomization',
				to: '/gestion/subempresa/personalizacion',
				text: 'Personalización de Subempresa',
				icon: 'HeroPaintBrush',
				authority: ['view-subsidiary'],
			},
			branch: {
				id: 'branch',
				to: '/gestion/sucursal',
				text: 'Sucursal',
				icon: 'DuoHome',
				authority: ['view-branch'],
			},
			branchDetail: {
				id: 'branchDetail',
				to: '/gestion/sucursal/:id',
				text: 'Detalle Sucursal',
				icon: 'HeroBuildingStorefront',
				authority: ['view-branch'],
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
				// Administrar usuarios exige permiso de administración, no `view-user`
				// (que solo habilita listar usuarios para selectores, p. ej. los
				// encargados/assignee_ids de Pagos diferidos).
				authority: ['manage-roles', 'edit-user'],
				requireAll: false,
			},
			rolesPermisosDetail: {
				id: 'rolesPermisosDetail',
				to: '/gestion/roles-permisos/:userId',
				text: 'Detalle Usuario',
				icon: 'DuoUser',
				// Mismo criterio que `rolesPermisos`: el detalle dispara /roles y
				// /permissions, que requieren permisos de administración.
				authority: ['manage-roles', 'edit-user'],
				requireAll: false,
			},
		},
	},

	// =========================
	// INVENTARIO
	// =========================
	inventory: {
		id: 'inventory',
		to: '/inventario',
		text: 'Inventario',
		icon: 'DuoBox3',
		// Gateado solo por permiso (mismo criterio que ZF-15 en `commercial`): el
		// allowlist de nombres de rol dejaba fuera a perfiles que sí tienen los
		// permisos del flujo de ajuste de stock. `edit-product` habilita la sección
		// para quien puede ejecutar ajustes sin necesitar `view-warehouse`.
		authority: ['view-warehouse', 'edit-product'],
		requireAll: false,
		subPages: {
			transfers: {
				id: 'commercialTransfers',
				to: '/inventario/transferencias',
				text: 'Transferencias Comerciales',
				icon: 'HeroTruck',
				authority: ['view-transfer'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'company-supervisor',
					'warehouse-manager',
				],
			},
			warehouses: {
				id: 'warehouses',
				to: '/inventario/bodegas',
				text: 'Bodegas',
				icon: 'DuoBarcode',
				authority: ['view-warehouse'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'company-supervisor',
					'manager',
					'warehouse-employee',
					'warehouse-manager',
					'after-sales',
				],
				requireAll: false,
			},
			trazabilidadSubsidiary: {
				id: 'trazabilidadSubsidiary',
				to: '/inventario/trazabilidad-subsidiary',
				text: 'Trazabilidad de Sucursal',
				icon: 'HeroArrowsRightLeft',
				authority: ['view-transfer'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'company-supervisor',
					'warehouse-manager',
				],
				requireAll: false,
			},
			movements: {
				id: 'movements',
				to: '/inventario/movimientos',
				text: 'Movimientos',
				icon: 'HeroArrowsRightLeft',
				authority: [],
			},
			ingresoStock: {
				id: 'ingresoStock',
				to: '/inventario/ingreso-stock',
				text: 'Ingreso de Stock',
				icon: 'DuoBox',
				// La vista necesita ambos permisos para ser útil: `view-product` carga
				// el catálogo y el detalle en la sucursal destino; `edit-product`
				// autoriza el POST de ajustes que cierra el flujo.
				// Antes iba con `authority: []`, lo que dejaba la ruta accesible por
				// URL directa a cualquier usuario autenticado.
				authority: ['view-product', 'edit-product'],
				requireAll: true,
			},
		},
	},

	// =========================
	// COMERCIAL
	// =========================
	commercial: {
		id: 'commercial',
		to: '/comercial',
		text: 'Comercial',
		icon: 'DuoBag',
		// Gateado solo por permiso (ZF-15): incluye view-sale (rol comercial clásico) y
		// DEFERRED_PAYMENTS.VIEW para que roles como Cobranza, que no aparecen en un
		// allowlist de nombres de rol, puedan ver la sección y su subpágina Pagos diferidos.
		authority: ['view-sale', ERP_PERMISSIONS.DEFERRED_PAYMENTS.VIEW],
		requireAll: false,
		subPages: {
			sales: {
				id: 'sales',
				to: '/comercial/ventas',
				text: 'Ventas',
				icon: 'DuoSale1',
				authority: ['view-sale'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'company-supervisor',
					'manager',
					'employee',
					'technician',
					'warehouse-employee',
					'warehouse-manager',
					'salesperson',
					'after-sales',
				],
			},
			pendientesSerie: {
				id: 'pendientesSerie',
				to: '/comercial/ventas/pendientes-serie',
				text: 'Pendientes de serie',
				icon: 'HeroQrCode',
				authority: ['view-sale'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'company-supervisor',
					'manager',
					'employee',
					'technician',
					'warehouse-employee',
					'warehouse-manager',
					'salesperson',
					'after-sales',
				],
			},
			quotes: {
				id: 'quotes',
				to: '/comercial/cotizaciones',
				text: 'Cotizaciones',
				icon: 'DuoArticle',
				authority: ['view-quote'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'company-supervisor',
					'manager',
					'employee',
					'technician',
					'warehouse-employee',
					'warehouse-manager',
					'salesperson',
					'after-sales',
				],
			},
			enlacesPublicos: {
				id: 'enlacesPublicos',
				to: '/comercial/enlaces',
				text: 'Enlaces Públicos',
				icon: 'DuoShare',
				authority: ['view-sale'], // Mismos permisos que ventas
				roles: [
					'super-admin',
					// 'admin',
					// 'company-admin',
					// 'subsidiary-admin',
					// 'branch-admin',
					// 'manager',
					// 'salesperson',
				],
			},
			solicitudes: {
				id: 'solicitudesBandeja',
				to: '/comercial/enlaces/:hash/solicitudes',
				text: 'Bandeja de Solicitudes',
				icon: 'DuoClipboardList',
				authority: ['view-sale'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'manager',
					'salesperson',
				],
			},
			transfers: {
				id: 'commercialTransfers',
				to: '/comercial/transferencias',
				text: 'Transferencias',
				icon: 'HeroTruck',
				authority: ['view-sale'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'company-supervisor',
					'manager',
					'employee',
					'technician',
					'warehouse-employee',
					'warehouse-manager',
					'salesperson',
					'after-sales',
				],
			},
			warranties: {
				id: 'warranties',
				to: '/comercial/warranties',
				text: 'Garantías',
				icon: 'DuoShieldCheck',
				authority: ['view-warranty'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'company-supervisor',
					'manager',
					'technician',
					'warehouse-employee',
					'warehouse-manager',
					'salesperson',
					'after-sales',
				],
				requireAll: false,
			},
			warrantyDetail: {
				id: 'warrantyDetail',
				to: '/garantias/:warrantyId',
				text: 'Detalle de garantía',
				icon: 'DuoShieldCheck',
				authority: ['view-warranty'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'company-supervisor',
					'manager',
					'technician',
					'warehouse-employee',
					'warehouse-manager',
					'salesperson',
					'after-sales',
				],
				requireAll: false,
			},
			pagosDiferidos: {
				id: 'pagosDiferidos',
				to: '/comercial/pagos-diferidos',
				text: 'Pagos diferidos',
				icon: 'HeroBanknotes',
				// Gateado solo por permiso (ZF-15): un rol como Cobranza opera el módulo
				// completo sin necesidad de aparecer en un allowlist de nombres de rol.
				authority: [ERP_PERMISSIONS.DEFERRED_PAYMENTS.VIEW],
				requireAll: false,
			},
			carteraCredito: {
				id: 'carteraCredito',
				to: '/comercial/pagos-diferidos/cartera-credito',
				text: 'Cartera de crédito',
				icon: 'HeroCreditCard',
				authority: [ERP_PERMISSIONS.DEFERRED_PAYMENTS.VIEW],
				roles: [],
				requireAll: false,
			},
			clientesVentas: {
				id: 'clientesVentas',
				to: '/comercial/clientes-ventas',
				text: 'Clientes Ventas',
				icon: 'DuoUser',
				authority: ['view-customer-sale'],
			},
			clientesVentasDetalle: {
				id: 'clientesVentasDetalle',
				to: '/comercial/clientes-ventas/:clienteId',
				text: 'Detalle Clientes Ventas',
				icon: 'DuoUsers',
				authority: ['view-customer-sale'],
			},
		},
	},

	// =========================
	// REPORTES (GERENCIA)
	// =========================
	reports: {
		id: 'reports',
		to: '/reportes',
		text: 'Reportes',
		icon: 'DuoChart',
		authority: ['view-dashboard'],
		roles: [
			'super-admin',
			'admin',
			'company-admin',
			'subsidiary-admin',
			'branch-admin',
			'company-supervisor',
			'manager',
		],
		subPages: {
			salesDashboard: {
				id: 'salesDashboard',
				to: '/reportes/ventas',
				text: 'Dashboard de Ventas',
				icon: 'DuoChartBar3',
				authority: ['view-dashboard'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'company-supervisor',
					'manager',
				],
			},
			inventoryReports: {
				id: 'inventoryReports',
				to: '/reportes/inventario',
				text: 'Reportes de Inventario',
				icon: 'DuoBox3',
				authority: ['view-reports'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'company-supervisor',
					'manager',
				],
			},
		},
	},

	// =========================
	// INTEGRACIONES
	// =========================
	integrations: {
		id: 'integrations',
		to: '/integraciones',
		text: 'Integraciones',
		icon: 'DuoGlobe',
		authority: ['view-integration'],
		roles: ['super-admin'],
		requireAll: false,
		subPages: {
			list: {
				id: 'integrationsList',
				to: '/integraciones/lista',
				text: 'Listado',
				icon: 'DuoBulletList',
				authority: ['view-integration'],
				roles: ['super-admin'],
			},
			unmappedProducts: {
				id: 'unmappedProducts',
				to: '/integraciones/productos-sin-mapear',
				text: 'Productos Sin Mapear',
				icon: 'DuoQuestionCircle',
				authority: ['unmapped-woocommerce-products.index'],
				roles: ['super-admin'],
			},
			syncStock: {
				id: 'syncStock',
				to: '/integraciones/sincronizar-stock',
				text: 'Sincronizar Stock',
				icon: 'DuoUpdate',
				authority: ['view-integration'],
				roles: ['super-admin'],
			},
			importOrders: {
				id: 'importOrders',
				to: '/integraciones/importar-ordenes',
				text: 'Importar Órdenes',
				icon: 'DuoDownload',
				authority: ['view-integration'],
				roles: ['super-admin'],
			},
			importTerms: {
				id: 'importTerms',
				to: '/integraciones/importar-terminos',
				text: 'Importar Categorías y Marcas',
				icon: 'DuoCloudDownload',
				authority: ['view-integration'],
				roles: ['super-admin'],
			},
			syncedProducts: {
				id: 'syncedProducts',
				to: '/integraciones/productos-sincronizados',
				text: 'Productos Sincronizados',
				icon: 'DuoPixels',
				authority: ['view-integration'],
				roles: ['super-admin'],
			},
		},
	},

	// =========================
	// RECURSOS HUMANOS
	// =========================
	humanResources: {
		id: 'humanResources',
		to: '/rrhh',
		text: 'Recursos Humanos',
		icon: 'DuoGroup',
		authority: ['invite-users'],
		roles: ['super-admin', 'admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'hr'],
		requireAll: false,
		subPages: {
			invitationsAdmin: {
				id: 'invitationsAdmin',
				to: '/admin/invitaciones',
				text: 'Gestionar Invitaciones',
				icon: 'DuoSend',
				authority: ['invite-users'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
				],
				requireAll: false,
			},
			relojControl: {
				id: 'relojControl',
				to: '/rrhh/reloj-control',
				text: 'Reloj Control',
				icon: 'HeroClock',
				authority: ['invite-users'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'hr',
					'employee',
					'manager',
				],
				requireAll: false,
			},
			configuracionRH: {
				id: 'configuracionRH',
				to: '/rrhh/configuracion',
				text: 'Configuración RH',
				icon: 'HeroCog6Tooth',
				authority: ['invite-users'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'hr',
				],
				requireAll: false,
			},
		},
	},

	// =========================
	// SERVICIO TÉCNICO
	// =========================
	technical: {
		id: 'technical',
		to: '/tecnico',
		text: 'Técnico',
		icon: 'DuoTools',
		authority: ['view-technical-reviews-batches'],
		roles: [
			'super-admin',
			'admin',
			'company-admin',
			'subsidiary-admin',
			'branch-admin',
			'company-supervisor',
			'employee',
			'technician',
			'warehouse-employee',
			'warehouse-manager',
			'salesperson',
			'after-sales',
		],
		subPages: {
			reviews: {
				id: 'technicalReviews',
				to: '/technical-reviews/series',
				text: 'Busqueda global por series',
				icon: 'DuoSearch',
				authority: ['view-technical-reviews-batches'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'company-supervisor',
					'employee',
					'technician',
					'warehouse-employee',
					'warehouse-manager',
					'salesperson',
					'after-sales',
				],
			},
			refactor: {
				id: 'technicalRefactor',
				to: '/technical-reviews/refactor',
				text: 'Revisiones Técnicas',
				icon: 'DuoClipboard', // Using a clipboard icon
				authority: ['view-technical-reviews-batches'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'company-supervisor',
					'employee',
					'technician',
					'warehouse-employee',
					'warehouse-manager',
					'salesperson',
					'after-sales',
				],
			},
			lotes: {
				id: 'technicalLotes',
				to: '/technical-reviews/lotes',
				text: 'Revisiones por lotes',
				icon: 'DuoClipboard', // Using a clipboard icon
				authority: ['view-technical-reviews-batches'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'company-supervisor',
					'employee',
					'technician',
					'warehouse-employee',
					'warehouse-manager',
					'salesperson',
					'after-sales',
				],
			},
			batches: {
				id: 'technicalBatches',
				to: '/technical-reviews/batches',
				text: 'Revisiones por lotes',
				icon: 'DuoClipboard',
				authority: ['view-technical-reviews-batches'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'company-supervisor',
					'employee',
					'technician',
					'warehouse-employee',
					'warehouse-manager',
					'salesperson',
					'after-sales',
				],
			},
			lockersManagement: {
				id: 'lockersManagement',
				to: '/lockers-management',
				text: 'Casilleros',
				icon: 'DuoLockClosed',
				authority: ['view-technical-reviews-batches'],
				roles: [
					'super-admin',
					// 'admin',
					// 'company-admin',
					// 'subsidiary-admin',
					// 'branch-admin',
					// 'company-supervisor',
					// 'employee',
					// 'technician',
				],
			},
		},
	},

	catalogs: {
		id: 'catalogs',
		to: '/catalogos',
		text: 'Catálogos',
		icon: 'DuoArchive',
		authority: ['view-product'],
		roles: [
			'super-admin',
			'admin',
			'company-admin',
			'subsidiary-admin',
			'branch-admin',
			'catalog-admin',
			'company-supervisor',
			'manager',
			'employee',
			'technician',
			'warehouse-employee',
			'warehouse-manager',
			'salesperson',
			'after-sales',
		],
		requireAll: false,
		subPages: {
			products: {
				id: 'products',
				to: '/catalogos/productos',
				text: 'Productos',
				icon: 'DuoPixels',
				authority: ['view-product'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'catalog-admin',
					'company-supervisor',
					'manager',
					'employee',
					'technician',
					'warehouse-employee',
					'warehouse-manager',
					'salesperson',
					'after-sales',
				],
				requireAll: false,
			},
			productsDetail: {
				id: 'productsDetail',
				to: '/catalogos/productos/:productId',
				text: 'Detalle de producto',
				icon: 'DuoBox',
				authority: ['view-product'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'catalog-admin',
					'company-supervisor',
					'manager',
					'employee',
					'technician',
					'warehouse-employee',
					'warehouse-manager',
					'salesperson',
					'after-sales',
				],
				requireAll: false,
			},
			categories: {
				id: 'categories',
				to: '/catalogos/categorias',
				text: 'Categorías',
				icon: 'DuoBox2',
				authority: ['view-category'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'catalog-admin',
					'company-supervisor',
					'manager',
					'employee',
					'salesperson',
					'after-sales',
				],
				requireAll: false,
			},
			brands: {
				id: 'brands',
				to: '/catalogos/marcas',
				text: 'Marcas',
				icon: 'DuoBox1',
				authority: ['view-brand'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'catalog-admin',
					'company-supervisor',
					'manager',
					'employee',
					'salesperson',
					'after-sales',
				],
				requireAll: false,
			},
			suppliers: {
				id: 'suppliers',
				to: '/catalogos/proveedores',
				text: 'Proveedores',
				icon: 'DuoUser',
				authority: ['view-supplier'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'company-supervisor',
					'manager',
				],
				requireAll: false,
			},
			customers: {
				id: 'customers',
				to: '/catalogos/clientes',
				text: 'Clientes-Proveedor',
				icon: 'DuoGroup',
				authority: ['view-customer-supplier'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'company-supervisor',
					'manager',
				],
				requireAll: false,
			},
			documents: {
				id: 'documents',
				to: '/documentos',
				text: 'Documentos',
				icon: 'DuoUpload',
				authority: ['view-document'],
				roles: [
					'super-admin',
					'admin',
					'company-admin',
					'subsidiary-admin',
					'branch-admin',
					'company-supervisor',
				],
				requireAll: false,
			},
		},
	},

	// =========================
	// ADMIN SISTEMA + NOTIFS
	// (no aparecen en el aside, pero se usan en rutas/header)
	// =========================
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
		roles: [
			'super-admin',
			'company-admin',
			'subsidiary-admin',
			'branch-admin',
			'manager',
			'employee',
			'technician',
			'cashier',
			'sales-rep',
		],
	},
} satisfies Record<string, PageConfig>;

export type QuickLinkConfig = {
	section: keyof typeof privatePages;
	items?: string[];
};

export const dashboardQuickLinksConfig: QuickLinkConfig[] = [
	{
		section: 'technical',
		items: ['refactor', 'lotes', 'reviews'],
	},
	{ section: 'catalogs' },
	{
		section: 'commercial',
		items: ['sales', 'quotes', 'clientesVentas', 'pagosDiferidos', 'carteraCredito'],
	},
	// { section: 'inventory' },
	// { section: 'manage' },
	// { section: 'humanResources' },
	{ section: 'reports' },
	// { section: 'integrations' },
];

export const pagesConfig = { ...authPages, ...privatePages };
export default pagesConfig;
