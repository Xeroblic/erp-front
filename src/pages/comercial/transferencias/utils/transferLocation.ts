import { UNLOCATED_WAREHOUSE_LABEL } from '@/components/procurement/WarehouseLabel';
import type { ITransferWarehouseSummary } from '@/interface/transfers.interface';

/**
 * Texto de la bodega de origen o destino de un traslado. En la etapa 2 una
 * bodega sin `id` es «Sin ubicación»: de ahí salieron o ahí entraron las
 * unidades. En la etapa 1 la bodega sólo rotula el documento, así que se
 * mantiene el texto genérico de siempre.
 */
const transferWarehouseLabel = (
	warehouse: ITransferWarehouseSummary | null | undefined,
	isMultiLocation: boolean,
	fallback: string,
): string => {
	if (isMultiLocation && (warehouse?.id ?? null) === null) return UNLOCATED_WAREHOUSE_LABEL;
	return warehouse?.name || fallback;
};

export default transferWarehouseLabel;
