import React, { useMemo } from 'react';
import Alert from '@/components/ui/Alert';
import type { IInventoryWarehouseAggregate } from '@/interface/inventoryOverview.interface';
import type { IWarehouseCompact } from '@/interface/procurement.interface';
import OperationsTable from '@/pages/inventario/Inventario/components/traceability/OperationsTable';
import TraceabilityFilters from '@/pages/inventario/Inventario/components/traceability/TraceabilityFilters';
import useInventoryTraceability from '@/pages/inventario/Inventario/hooks/useInventoryTraceability';
import {
	filtraItems,
	trazabilidadParams,
	type IInventarioFilters,
	type TInventarioUbicacion,
	type TOperacionTipo,
} from '@/pages/inventario/Inventario/types';

interface IInventoryTraceabilityProps {
	subsidiaryId: number;
	branchId: number;
	branchName: string | null;
	owner: string;
	filtros: IInventarioFilters;
	hasFilters: boolean;
	warehouses: IInventoryWarehouseAggregate[];
	onBusqueda: (value: string) => void;
	onTipo: (value: TOperacionTipo | null) => void;
	onUbicacion: (value: TInventarioUbicacion) => void;
	onDesde: (value: string) => void;
	onHasta: (value: string) => void;
	onLimpiar: () => void;
	onPaginate: (page: number, perPage: number) => void;
}

/**
 * Pestaña Trazabilidad: qué entró, salió o se movió en la sucursal, operación
 * por operación. Sólo productos sin serie; los serializados se siguen por su
 * número de serie en Revisión técnica.
 */
const InventoryTraceability: React.FC<IInventoryTraceabilityProps> = ({
	subsidiaryId,
	branchId,
	branchName,
	owner,
	filtros,
	hasFilters,
	warehouses,
	onBusqueda,
	onTipo,
	onUbicacion,
	onDesde,
	onHasta,
	onLimpiar,
	onPaginate,
}) => {
	const { ubicacion, tipo, busqueda, desde, hasta, page, perPage } = filtros;
	// `filtros` cambia de identidad con cada URL: la consulta depende sólo de estos campos.
	const params = useMemo(
		() =>
			trazabilidadParams(
				{ ubicacion, tipo, busqueda, desde, hasta, page, perPage },
				branchId,
			),
		[branchId, ubicacion, tipo, busqueda, desde, hasta, page, perPage],
	);
	const data = useInventoryTraceability({
		subsidiaryId,
		branchId,
		branchName,
		owner: `${owner}:trazabilidad`,
		params,
	});
	const warehouseCatalog = useMemo(
		() =>
			warehouses.flatMap((aggregate): IWarehouseCompact[] =>
				aggregate.warehouse
					? [{ id: aggregate.warehouse.id, name: aggregate.warehouse.name }]
					: [],
			),
		[warehouses],
	);
	const invertedRange = desde !== '' && hasta !== '' && desde > hasta;

	return (
		<div className='space-y-4'>
			<TraceabilityFilters
				filtros={filtros}
				warehouses={warehouses}
				onBusqueda={onBusqueda}
				onTipo={onTipo}
				onUbicacion={onUbicacion}
				onDesde={onDesde}
				onHasta={onHasta}
				onLimpiar={onLimpiar}
			/>
			{invertedRange && (
				<Alert color='amber' variant='outline' title='Revisa las fechas'>
					«Desde» es posterior a «Hasta»: ninguna operación puede cumplir ese rango.
				</Alert>
			)}
			<OperationsTable
				title='Operaciones'
				description='Recepciones, traslados, ajustes y documentación de los productos sin serie, de la más nueva a la más antigua.'
				data={data}
				warehouses={warehouseCatalog}
				hasFilters={hasFilters}
				highlightMatches={filtraItems(params)}
				onPaginate={onPaginate}
			/>
		</div>
	);
};

export default InventoryTraceability;
