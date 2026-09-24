import React from 'react';
import Icon from '@/components/icon/Icon';
import { StatusPill } from '@/components/procurement';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type { IWarehouseDetail } from '@/interface/warehouse.interface';
import InventarioKpis, {
	type IInventarioKpi,
} from '@/pages/inventario/Inventario/components/parts/InventarioKpis';
import WarehouseCapacityBar from '../../components/WarehouseCapacityBar';
import type { IFichaBodegaResumen } from '../../types';

const Campo = ({ label, children }: { label: string; children: React.ReactNode }) => (
	<div>
		<p className='text-xs uppercase text-zinc-500'>{label}</p>
		<p>{children}</p>
	</div>
);

const Vacio = ({ children }: { children: React.ReactNode }) => (
	<span className='text-zinc-400'>{children}</span>
);

interface WarehouseInfoCardProps {
	warehouse: IWarehouseDetail;
	summary: IFichaBodegaResumen;
}

/**
 * Cabecera de la ficha de bodega, con el mismo formato que `ResumenBodega` de
 * Inventario: sus datos, la capacidad usada y los KPI de productos asociados.
 */
const WarehouseInfoCard: React.FC<WarehouseInfoCardProps> = ({ warehouse, summary }) => {
	const kpis: IInventarioKpi[] = [
		{ label: 'Productos', value: summary.products, icon: 'HeroCube', accent: 'bg-blue-600' },
		{
			label: 'Unidades',
			value: summary.units,
			icon: 'HeroArchiveBox',
			accent: 'bg-violet-600',
		},
		{
			label: 'Sincronizados',
			value: summary.synced,
			icon: 'HeroArrowPath',
			accent: 'bg-emerald-600',
		},
		{
			label: 'Cantidad manual',
			value: summary.manual,
			icon: 'HeroPencilSquare',
			accent: 'bg-zinc-700',
		},
	];

	return (
		<div className='space-y-4'>
			<Card>
				<CardHeader>
					<div className='flex items-center gap-3'>
						<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm'>
							<Icon icon='HeroBuildingStorefront' size='text-2xl' color='white' />
						</div>
						<div>
							<CardTitle className='text-lg'>{warehouse.name}</CardTitle>
							<p className='font-mono text-sm text-zinc-500 dark:text-zinc-400'>
								Código {warehouse.code}
							</p>
						</div>
					</div>
					<StatusPill color={warehouse.is_active ? 'emerald' : 'zinc'} fit>
						{warehouse.is_active ? 'Activa' : 'Inactiva'}
					</StatusPill>
				</CardHeader>
				<CardBody>
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
						<Campo label='Tipo'>{warehouse.warehouse_type}</Campo>
						<Campo label='Sucursal'>
							{warehouse.branch_name ?? <Vacio>Sin sucursal</Vacio>}
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
							<p className='mb-1 text-xs uppercase text-zinc-500'>Capacidad</p>
							<WarehouseCapacityBar
								current={warehouse.current_capacity ?? 0}
								maximum={warehouse.maximum_capacity}
							/>
						</div>
						{warehouse.description && (
							<div className='sm:col-span-2 lg:col-span-3'>
								<Campo label='Descripción'>{warehouse.description}</Campo>
							</div>
						)}
					</div>
				</CardBody>
			</Card>
			<InventarioKpis kpis={kpis} />
		</div>
	);
};

export default WarehouseInfoCard;
