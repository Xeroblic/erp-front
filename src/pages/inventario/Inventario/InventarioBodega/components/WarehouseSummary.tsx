import React from 'react';
import { UNLOCATED_WAREHOUSE_LABEL } from '@/components/procurement';
import Icon from '@/components/icon/Icon';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type { IInventoryWarehouseAggregate } from '@/interface/inventoryOverview.interface';
import WarehouseCapacity from '@/pages/inventario/Inventario/components/parts/WarehouseCapacity';
import InventarioKpis, {
	type IInventarioKpi,
} from '@/pages/inventario/Inventario/components/parts/InventarioKpis';

const Campo = ({ label, children }: { label: string; children: React.ReactNode }) => (
	<div>
		<p className='text-xs text-zinc-500 uppercase'>{label}</p>
		<p>{children}</p>
	</div>
);

const Vacio = ({ children }: { children: React.ReactNode }) => (
	<span className='text-zinc-400'>{children}</span>
);

/**
 * Cabecera de la ficha de bodega, ordenada como la del producto: sus datos
 * (tipo, estado, encargado, dirección, horario, capacidad) y cuánto guarda. Las cifras
 * vienen de A3, así que coinciden con la fila de la vista Por bodega.
 */
const WarehouseSummary: React.FC<{ aggregate: IInventoryWarehouseAggregate }> = ({ aggregate }) => {
	// Sólo las cifras que la fuente publica: `null` no se muestra como `0`.
	// «No vendibles», además, sólo si hay.
	const candidates: { value: number | null; kpi: Omit<IInventarioKpi, 'value'> }[] = [
		{
			value: aggregate.product_count,
			kpi: { label: 'Productos', icon: 'HeroCube', accent: 'bg-blue-600' },
		},
		{
			value: aggregate.physical_quantity,
			kpi: { label: 'Unidades', icon: 'HeroArchiveBox', accent: 'bg-violet-600' },
		},
		{
			value: aggregate.unfit_quantity === 0 ? null : aggregate.unfit_quantity,
			kpi: { label: 'No vendibles', icon: 'HeroExclamationTriangle', accent: 'bg-red-600' },
		},
		{
			value: aggregate.critical_count,
			kpi: { label: 'Bajo el umbral', icon: 'HeroBellAlert', accent: 'bg-amber-600' },
		},
		{
			value: aggregate.undocumented_quantity,
			kpi: { label: 'Sin documento', icon: 'HeroDocumentMinus', accent: 'bg-zinc-700' },
		},
	];
	const kpis = candidates.flatMap(({ value, kpi }): IInventarioKpi[] =>
		value === null ? [] : [{ ...kpi, value }],
	);

	const { warehouse } = aggregate;

	return (
		<div className='space-y-4'>
			<Card>
				<CardHeader>
					<div className='flex items-center gap-3'>
						<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-xs'>
							<Icon icon='HeroBuildingStorefront' size='text-2xl' color='white' />
						</div>
						<div>
							<CardTitle className='text-lg'>
								{warehouse?.name ?? UNLOCATED_WAREHOUSE_LABEL}
							</CardTitle>
							{warehouse?.code && (
								<p className='font-mono text-sm text-zinc-500 dark:text-zinc-400'>
									Código {warehouse.code}
								</p>
							)}
						</div>
					</div>
				</CardHeader>
				<CardBody>
					{warehouse === null ? (
						<p className='text-sm text-zinc-500'>
							Unidades de la sucursal que todavía no tienen bodega asignada.
						</p>
					) : (
						<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
							<Campo label='Tipo'>
								{warehouse.warehouse_type ?? <Vacio>—</Vacio>}
							</Campo>
							<Campo label='Estado'>
								{warehouse.is_active ? 'Activa' : <Vacio>Inactiva</Vacio>}
							</Campo>
							<Campo label='Encargado'>
								{warehouse.manager_name ?? <Vacio>Sin encargado</Vacio>}
							</Campo>
							<Campo label='Dirección'>
								{warehouse.address ? (
									[warehouse.address, warehouse.commune_name]
										.filter(Boolean)
										.join(', ')
								) : (
									<Vacio>Sin dirección</Vacio>
								)}
							</Campo>
							<Campo label='Horario'>
								{warehouse.schedule ?? <Vacio>Sin horario</Vacio>}
							</Campo>
							<Campo label='Series'>
								{warehouse.requires_serial_tracking
									? 'Exige número de serie'
									: 'No exige número de serie'}
							</Campo>
							<div>
								<p className='mb-1 text-xs text-zinc-500 uppercase'>Capacidad</p>
								<WarehouseCapacity aggregate={aggregate} />
							</div>
							{warehouse.description && (
								<div className='sm:col-span-2 lg:col-span-3'>
									<Campo label='Descripción'>{warehouse.description}</Campo>
								</div>
							)}
						</div>
					)}
				</CardBody>
			</Card>
			<InventarioKpis kpis={kpis} />
		</div>
	);
};

export default WarehouseSummary;
