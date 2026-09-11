import * as Yup from 'yup';
import type { IInventoryStockListParams } from '@/interface/procurement.interface';

export const OriginsFiltersSchema = Yup.object({
	supplier: Yup.string()
		.matches(/^([1-9]\d*)?$/, 'Selecciona un proveedor válido.')
		.defined(),
	document: Yup.string()
		.matches(/^([1-9]\d*)?$/, 'Selecciona un documento válido.')
		.defined(),
});
export const inventoryLocationParams = (location: string): IInventoryStockListParams => {
	if (location === 'unlocated') return { unlocated: 1 };
	if (location.startsWith('warehouse:')) return { warehouse_id: Number(location.slice(10)) };
	return {};
};
