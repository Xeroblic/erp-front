/**
 *  ARCHIVO TEMPORAL DE COMPATIBILIDAD
 *
 * Este archivo mantiene las constantes ERP_PERMISSIONS para evitar que se rompan
 * los archivos existentes durante la migración.
 *
 * Los permisos reales están en:
 * - pages.config.ts (para validación de rutas)
 * - Backend a través de permissionsSlice (para validación de componentes)
 *
 * ELIMINAR ESTE ARCHIVO una vez migrados todos los componentes
 */

// Función helper para verificar permisos temporalmente
export const hasTemporaryPermission = (permission: string): boolean => {
	// Durante el desarrollo, permitir todos los permisos de inventario
	const inventoryPermissions = [
		'inventory.view',
		'inventory.adjust',
		'inventory.transfer',
		'inventory.generate_reports',
	];

	if (inventoryPermissions.includes(permission)) {
		return true;
	}
	return false;
};

export const ERP_PERMISSIONS = {
	TRANSFERS: {
		VIEW: 'transfers.view',
		CREATE: 'create-transfer',
		UPDATE: 'transfers.update',
		DELETE: 'transfers.delete',
		SHIP: 'transfers.ship',
		RECEIVE: 'transfers.receive',
		APPROVE: 'transfers.approve',
		CANCEL: 'transfers.cancel',
		GENERATE_PDF: 'transfers.generate_pdf',
	},

	INVENTORY: {
		VIEW: 'inventory.view',
		CREATE: 'inventory.create',
		UPDATE: 'inventory.update',
		UPDATE_LEVELS: 'inventory.update_levels',
		DELETE: 'inventory.delete',
		ADJUST: 'inventory.adjust',
		RESERVE: 'inventory.reserve',
		RELEASE: 'inventory.release',
		TRANSFER: 'inventory.transfer',
		VIEW_MOVEMENTS: 'inventory.view_movements',
		GENERATE_REPORTS: 'inventory.generate_reports',
	},

	SALES: {
		VIEW: 'view-sale',
		CREATE: 'create-sale',
		UPDATE: 'update-sale',
		DELETE: 'delete-sale',
		CONFIRM: 'sales.confirm',
		DELIVER: 'sales.deliver',
		CANCEL: 'sales.cancel',
		ADD_PAYMENTS: 'sales.add_payments',
		RECORD_PAYMENT: 'sales.record_payment',
		CONFIRM_PAYMENTS: 'sales.confirm_payments',
		SHIP: 'sales.ship',
		GENERATE_INVOICE: 'sales.generate_invoice',
		MANAGE_DISCOUNTS: 'sales.manage_discounts',
	},

	DEFERRED_PAYMENTS: {
		VIEW: 'view-deferred-payment',
		CREATE: 'create-deferred-payment',
	},

	QUOTES: {
		VIEW: 'view-quote',
		CREATE: 'create-quote',
		UPDATE: 'update-quote',
		DELETE: 'delete-quote',
		SEND: 'quotes.send',
		APPROVE: 'quotes.approve',
		CONVERT: 'quotes.convert',
		GENERATE_PDF: 'quotes.generate_pdf',
		MANAGE_DISCOUNTS: 'quotes.manage_discounts',
	},

	CATALOGS: {
		PRODUCTS: {
			VIEW: 'view-product',
			CREATE: 'create-product',
			UPDATE: 'update-product',
			DELETE: 'delete-product',
		},
		CATEGORIES: {
			VIEW: 'view-category',
			CREATE: 'create-category',
			UPDATE: 'update-category',
			DELETE: 'delete-category',
		},
		BRANDS: {
			VIEW: 'view-brand',
			CREATE: 'create-brand',
			UPDATE: 'update-brand',
			DELETE: 'delete-brand',
		},
		SUPPLIERS: {
			VIEW: 'view-supplier',
			CREATE: 'create-supplier',
			UPDATE: 'update-supplier',
			DELETE: 'delete-supplier',
		},
		CUSTOMERS: {
			VIEW: 'view-customer-supplier',
			CREATE: 'create-customer-supplier',
			UPDATE: 'update-customer-supplier',
			DELETE: 'delete-customer-supplier',
		},
	},

	WAREHOUSES: {
		VIEW: 'view-warehouse',
		CREATE: 'create-warehouse',
		UPDATE: 'update-warehouse',
		DELETE: 'delete-warehouse',
	},

	REPORTS: {
		VIEW: 'reports.view',
		SALES_DASHBOARD: 'reports.sales_dashboard',
		INVENTORY_REPORTS: 'reports.inventory_reports',
		INVENTORY_REPORT: 'reports.inventory_report',
		TRANSFER_REPORTS: 'reports.transfer_reports',
		QUOTE_CONVERSION: 'reports.quote_conversion',
		FINANCIAL_REPORTS: 'reports.financial_reports',
		EXPORT: 'reports.export',
	},
} as const;

// Funciones temporales
export const hasERPPermission = (
	userPermissions: string[],
	requiredPermission: string,
): boolean => {
	console.warn('hasERPPermission: Función temporal. Los permisos deben validarse con el backend');
	return userPermissions.includes(requiredPermission);
};

export const hasAnyERPPermission = (
	userPermissions: string[],
	requiredPermissions: string[],
): boolean => {
	console.warn(
		'hasAnyERPPermission: Función temporal. Los permisos deben validarse con el backend',
	);
	return requiredPermissions.some((permission) => hasERPPermission(userPermissions, permission));
};
