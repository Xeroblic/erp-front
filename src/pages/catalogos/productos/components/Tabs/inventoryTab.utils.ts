import type { IProduct } from '@/interface/product.interface';
import type { VisibleInventoryRow } from './inventoryTab.types';

export const formatNumber = (value: number): string =>
	Number(value ?? 0).toLocaleString('es-CL', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});

export const getFriendlyDate = (value?: string | null): string => {
	if (!value) return 'Sin actualización';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Sin actualización';
	return date.toLocaleDateString('es-CL', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	});
};

export const buildProductsById = (products: IProduct[]): Map<number, IProduct> => {
	const map = new Map<number, IProduct>();
	products.forEach((product) => {
		map.set(product.id, product);
		(product.children ?? []).forEach((child) => {
			map.set(child.id, {
				...product,
				id: child.id,
				parent_product_id: product.id,
				is_parent: false,
				is_child: true,
				grade: child.grade ?? null,
				sku: child.sku,
				name: child.name,
				price: Number(child.price ?? 0),
				offer_price: child.offer_price ? Number(child.offer_price) : null,
				stock: Number(child.stock ?? 0),
				stock_by_status: child.stock_by_status ?? null,
				children: null,
				parent: {
					id: product.id,
					sku: product.sku,
					name: product.name,
				},
			});
		});
	});
	return map;
};

export const buildVisibleInventoryRows = (
	products: IProduct[],
	productsById: Map<number, IProduct>,
): VisibleInventoryRow[] => {
	return products.flatMap((product) => {
		const parentStockStatus = product.stock_by_status ?? null;
		const parentRow: VisibleInventoryRow = {
			id: product.id,
			name: product.name,
			sku: product.sku,
			brand: product.brand?.name ?? product.brand_name ?? 'Sin marca',
			grade: 'Padre',
			stock: Number(product.stock ?? 0),
			available: Number(parentStockStatus?.available ?? product.stock ?? 0),
			reserved: Number(parentStockStatus?.reserved ?? 0),
			onHold: Number(parentStockStatus?.on_hold ?? 0),
			inQuotation: Number(parentStockStatus?.in_quotation ?? 0),
			sold: Number(parentStockStatus?.sold ?? 0),
			isParent: true,
			childrenCount: product.children?.length ?? 0,
			updatedAt: product.updated_at,
			product,
		};

		const childRows: VisibleInventoryRow[] = (product.children ?? []).map((child) => ({
			id: child.id,
			name: child.name,
			sku: child.sku,
			brand: product.brand?.name ?? product.brand_name ?? 'Sin marca',
			grade: child.grade ?? 'Sin grado',
			stock: Number(child.stock ?? 0),
			available: Number(child.stock_by_status?.available ?? child.stock ?? 0),
			reserved: Number(child.stock_by_status?.reserved ?? 0),
			onHold: Number(child.stock_by_status?.on_hold ?? 0),
			inQuotation: Number(child.stock_by_status?.in_quotation ?? 0),
			sold: Number(child.stock_by_status?.sold ?? 0),
			isParent: false,
			childrenCount: 0,
			updatedAt: product.updated_at,
			product: productsById.get(child.id) ?? null,
		}));

		return [parentRow, ...childRows];
	});
};

const escapeCsvValue = (value: string | number | null | undefined): string => {
	const normalized = value === null || value === undefined ? '' : String(value);
	if (normalized.includes(',') || normalized.includes('"') || normalized.includes('\n')) {
		return `"${normalized.replace(/"/g, '""')}"`;
	}
	return normalized;
};

export const downloadInventoryCsv = (rows: VisibleInventoryRow[], branchName?: string): void => {
	const headers = [
		'product_id',
		'tipo',
		'parent_or_self_id',
		'sku',
		'nombre',
		'marca',
		'grado',
		'stock_actual',
		'disponibles',
		'reservado',
		'en_espera',
		'en_cotizacion',
		'vendidos',
		'quantity_change',
	];
	const lines = rows.map((row) =>
		[
			row.id,
			row.isParent ? 'parent' : 'child',
			row.product?.parent_product_id ?? row.product?.id ?? row.id,
			row.sku,
			row.name,
			row.brand,
			row.grade,
			row.stock,
			row.available,
			row.reserved,
			row.onHold,
			row.inQuotation,
			row.sold,
			'',
		]
			.map(escapeCsvValue)
			.join(','),
	);
	const csvContent = [headers.join(','), ...lines].join('\n');
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement('a');
	const safeBranch = (branchName ?? 'inventario').replace(/\s+/g, '-').toLowerCase();
	link.href = url;
	link.download = `inventario-${safeBranch}-${new Date().toISOString().slice(0, 10)}.csv`;
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.URL.revokeObjectURL(url);
};
