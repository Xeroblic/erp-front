/**
 * Componentes compartidos del módulo de abastecimiento e inventario ubicado
 * (PR #67 del backend). Las ocho cards del módulo consumen estas piezas en vez
 * de redibujar producto, costo, ubicación y botonera en cada pantalla.
 */

export { default as ProductCard } from './ProductCard';
export type { IProductCardProps, TProductCardDensity } from './ProductCard';

export { default as CostBlock } from './CostBlock';
export type { ICostBlockProps } from './CostBlock';

export { default as CostInput } from './CostInput';
export type { ICostInputProps } from './CostInput';

export { default as WarehouseLabel, UNLOCATED_WAREHOUSE_LABEL } from './WarehouseLabel';
export type { IWarehouseLabelProps } from './WarehouseLabel';

export { default as ConditionLabel, CONDITION_LABELS, CONDITION_OPTIONS } from './ConditionLabel';
export type { IConditionLabelProps } from './ConditionLabel';

export {
	default as AllowedActionsToolbar,
	PROCUREMENT_ACTION_DEFINITIONS,
} from './AllowedActionsToolbar';
export type {
	IAllowedActionDefinition,
	IAllowedActionsToolbarProps,
	TProcurementResource,
} from './AllowedActionsToolbar';

export {
	COST_ENTRY_BASIS_OPTIONS,
	costEntrySchema,
	normalizeCostInput,
	optionalCostEntrySchema,
	toCostEntryPayload,
} from './costEntry.schema';
export type { ICostEntryFormValues } from './costEntry.schema';
