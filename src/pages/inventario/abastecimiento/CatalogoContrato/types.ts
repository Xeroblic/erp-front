import type {
	IProcurementCost,
	IProcurementProduct,
	IWarehouseCompact,
	TProcurementAllowedAction,
	TStockCondition,
} from '@/interface/procurement.interface';
import type { TProcurementResource, TStatusPillColor } from '@/components/procurement';

/**
 * Tipos de la pantalla de catálogo del contrato de abastecimiento.
 *
 * La pantalla no tiene formularios de negocio propios ni escrituras: es el
 * inventario visual de los componentes compartidos en cada estado que el
 * contrato admite. El único formulario es la demo de `CostInput`, que reutiliza
 * `costEntrySchema` en vez de declarar un schema propio.
 */

export interface ICatalogCostSample {
	id: string;
	title: string;
	/** Qué regla del contrato ilustra este estado. */
	description: string;
	cost: IProcurementCost;
}

export interface ICatalogProductSample {
	id: string;
	title: string;
	description: string;
	product: IProcurementProduct;
}

export interface ICatalogWarehouseSample {
	id: string;
	title: string;
	description: string;
	warehouse: IWarehouseCompact | null;
}

export interface ICatalogActionsSample {
	id: string;
	title: string;
	description: string;
	resource: TProcurementResource;
	allowedActions: TProcurementAllowedAction[];
}

export interface ICatalogConditionSample {
	id: string;
	title: string;
	description: string;
	condition: TStockCondition;
	withIcon: boolean;
}

export interface ICatalogStatusPillSample {
	color: TStatusPillColor;
	/** Etiqueta real de una pantalla del módulo que usa este color. */
	label: string;
	/** Qué significa el color en todo el módulo. */
	meaning: string;
}
