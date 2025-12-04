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

const ACTION_TRANSLATIONS: Record<string, string> = {
	view: 'Ver',
	read: 'Ver',
	show: 'Ver',
	list: 'Listar',
	create: 'Crear',
	add: 'Crear',
	register: 'Registrar',
	edit: 'Editar',
	update: 'Actualizar',
	delete: 'Eliminar',
	remove: 'Eliminar',
	destroy: 'Eliminar',
	manage: 'Gestionar',
	assign: 'Asignar',
	approve: 'Aprobar',
	reject: 'Rechazar',
	download: 'Descargar',
	upload: 'Subir',
	import: 'Importar',
	export: 'Exportar',
	send: 'Enviar',
	invite: 'Invitar',
	access: 'Acceder',
	attach: 'Adjuntar',
	configure: 'Configurar',
	sync: 'Sincronizar',
	close: 'Cerrar',
	open: 'Abrir',
	pay: 'Pagar',
	approvepay: 'Aprobar Pago',
	print: 'Imprimir',
	share: 'Compartir',
	generate: 'Generar',
	cancel: 'Cancelar',
	audit: 'Auditar',
	comment: 'Comentar',
	sign: 'Firmar',
	authorize: 'Autorizar',
	validate: 'Validar',
	grant: 'Otorgar',
	revoke: 'Revocar',
};

const ACTION_PREPOSITIONS: Record<string, string> = {
	access: 'al',
	attach: 'a',
	assign: 'a',
	invite: 'a',
};

const SUBJECT_TRANSLATIONS: Record<string, string> = {
	dashboard: 'Dashboard',
	user: 'Usuario',
	users: 'Usuarios',
	invitation: 'Invitación',
	invitations: 'Invitaciones',
	role: 'Rol',
	roles: 'Roles',
	permission: 'Permiso',
	permissions: 'Permisos',
	company: 'Empresa',
	companies: 'Empresas',
	branch: 'Sucursal',
	branches: 'Sucursales',
	subsidiary: 'Subsidiaria',
	subsidiaries: 'Subsidiarias',
	warehouse: 'Bodega',
	warehouses: 'Bodegas',
	inventory: 'Inventario',
	inventories: 'Inventarios',
	sale: 'Venta',
	sales: 'Ventas',
	quote: 'Cotización',
	quotes: 'Cotizaciones',
	order: 'Orden',
	orders: 'Órdenes',
	product: 'Producto',
	products: 'Productos',
	item: 'Ítem',
	items: 'Ítems',
	batch: 'Lote',
	batches: 'Lotes',
	review: 'Revisión',
	reviews: 'Revisiones',
	technical: 'Técnica',
	document: 'Documento',
	documents: 'Documentos',
	warranty: 'Garantía',
	warranties: 'Garantías',
	report: 'Reporte',
	reports: 'Reportes',
	customer: 'Cliente',
	customers: 'Clientes',
	client: 'Cliente',
	clients: 'Clientes',
	supplier: 'Proveedor',
	suppliers: 'Proveedores',
	payment: 'Pago',
	payments: 'Pagos',
	invoice: 'Factura',
	invoices: 'Facturas',
	credit: 'Crédito',
	limit: 'Límite',
	profile: 'Perfil',
	configuration: 'Configuración',
	settings: 'Configuración',
	notification: 'Notificación',
	notifications: 'Notificaciones',
	permissiongroup: 'Grupo de Permisos',
	personalizacion: 'Personalización',
	access: 'Acceso',
	menu: 'Menú',
	admin: 'Administración',
	panel: 'Panel',
	brand: 'Marca',
	brands: 'Marcas',
	category: 'Categoría',
	categories: 'Categorías',
	notebook: 'Cuaderno',
	warrantyseries: 'Series de Garantía',
	warrantyseriesmode: 'Modo Serie de Garantía',
};

const SUBJECT_COMPOSITE_TRANSLATIONS: Record<string, string> = {
	'admin-panel': 'Panel de Administración',
	'technical-review': 'Revisión Técnica',
	'technical-reviews': 'Revisiones Técnicas',
	'technical-review-item': 'Ítem de Revisión Técnica',
	'technical-review-items': 'Ítems de Revisión Técnica',
	'technical-reviews-items': 'Ítems de Revisiones Técnicas',
	'technical-reviews-batches': 'Lotes de Revisiones Técnicas',
	'technical-reviews-batch-items': 'Ítems de Lotes de Revisiones Técnicas',
	'technical-review-step': 'Paso de Revisión Técnica',
	'warehouse-product': 'Producto de Bodega',
	'warehouse-products': 'Productos de Bodega',
	'warehouse-item': 'Ítem de Bodega',
	'warehouse-items': 'Ítems de Bodega',
	'warehouse-transfer': 'Transferencia de Bodega',
	'warehouse-transfers': 'Transferencias de Bodega',
	'warehouse-movement': 'Movimiento de Bodega',
	'warehouse-movements': 'Movimientos de Bodega',
	'warehouse-order': 'Orden de Bodega',
	'warehouse-orders': 'Órdenes de Bodega',
	'customer-sale': 'Cliente de Venta',
	'customer-sales': 'Clientes de Venta',
	'customer-supplier': 'Cliente-Proveedor',
	'sales-order': 'Orden de Venta',
	'sales-orders': 'Órdenes de Venta',
	'sales-quote': 'Cotización de Venta',
	'sales-quotes': 'Cotizaciones de Venta',
	'sales-detail': 'Detalle de Venta',
	'sales-details': 'Detalles de Venta',
	'after-sales': 'Postventa',
	'customer-sale-order': 'Orden de Venta para Cliente',
	'customer-supplier-order': 'Orden de Cliente-Proveedor',
	'brand-catalog': 'Catálogo de Marcas',
	'catalog-product': 'Producto de Catálogo',
	'catalog-products': 'Productos de Catálogo',
	'document-signature': 'Firma de Documento',
	'document-template': 'Plantilla de Documento',
	'warranty-series': 'Series de Garantía',
	'warranty-series-mode': 'Modo Serie de Garantía',
};

const PERMISSION_CONNECTORS: Record<string, string> = {
	of: 'de',
	del: 'del',
	to: 'a',
	para: 'para',
	for: 'para',
	and: 'y',
	the: 'el',
	in: 'en',
	with: 'con',
	without: 'sin',
	per: 'por',
	from: 'de',
	on: 'en',
	as: 'como',
	by: 'por',
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

const translateSubjectParts = (parts: string[]): string => {
	if (!parts.length) return '';

	const compositeKey = parts.join('-');
	if (SUBJECT_COMPOSITE_TRANSLATIONS[compositeKey]) {
		return SUBJECT_COMPOSITE_TRANSLATIONS[compositeKey];
	}

	if (parts.length > 1) {
		for (let size = parts.length - 1; size >= 1; size -= 1) {
			const prefixKey = parts.slice(0, size).join('-');
			if (SUBJECT_COMPOSITE_TRANSLATIONS[prefixKey]) {
				const left = SUBJECT_COMPOSITE_TRANSLATIONS[prefixKey];
				const right = translateSubjectParts(parts.slice(size));
				return right ? `${left} ${right}` : left;
			}
		}
	}

	return parts
		.map(
			(part) =>
				SUBJECT_TRANSLATIONS[part] || PERMISSION_CONNECTORS[part] || toTitleCase(part),
		)
		.join(' ')
		.trim();
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

const PERMISSION_LABELS: Record<string, string> = {
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
	'edit-users': 'Editar Usuarios',
};

const normalizePermissionKey = (name?: string) => {
	if (!name) return '';
	return name
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
};

// Helper para formatear nombres de permisos
export const formatPermissionName = (permissionName: string) => {
	const normalizedKey = normalizePermissionKey(permissionName);
	if (!normalizedKey) {
		return 'Permiso';
	}

	if (PERMISSION_LABELS[normalizedKey]) {
		return PERMISSION_LABELS[normalizedKey];
	}

	const parts = normalizedKey.split('-').filter(Boolean);
	if (!parts.length) {
		return toTitleCase(permissionName);
	}

	const firstPart = parts[0];
	const lastPart = parts[parts.length - 1];

	let actionLabel = '';
	let subjectParts: string[] = [];
	let actionKey = firstPart;

	if (parts.length === 1) {
		actionLabel = ACTION_TRANSLATIONS[firstPart] || toTitleCase(firstPart);
	} else if (ACTION_TRANSLATIONS[firstPart]) {
		actionKey = firstPart;
		actionLabel = ACTION_TRANSLATIONS[firstPart];
		subjectParts = parts.slice(1);
	} else if (ACTION_TRANSLATIONS[lastPart]) {
		actionKey = lastPart;
		actionLabel = ACTION_TRANSLATIONS[lastPart];
		subjectParts = parts.slice(0, -1);
	} else {
		actionKey = firstPart;
		actionLabel = toTitleCase(firstPart);
		subjectParts = parts.slice(1);
	}

	const subjectLabel = translateSubjectParts(subjectParts);
	const preposition = subjectLabel ? ACTION_PREPOSITIONS[actionKey] : '';

	const label = [actionLabel, preposition, subjectLabel]
		.filter(Boolean)
		.join(' ')
		.replace(/\s+/g, ' ')
		.trim();

	return label || toTitleCase(permissionName);
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
		otros: [],
	};

	permissions.forEach((permission) => {
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
