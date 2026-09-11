import type { IInventoryStockListParams } from '@/interface/procurement.interface';

// eslint-disable-next-line import/prefer-default-export -- único helper del archivo; un default no aporta contra el nombre explícito.
export const inventoryLocationParams = (location: string): IInventoryStockListParams => {
	if (location === 'unlocated') return { unlocated: 1 };
	if (location.startsWith('warehouse:')) return { warehouse_id: Number(location.slice(10)) };
	return {};
};
