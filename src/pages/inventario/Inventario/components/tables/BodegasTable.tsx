import React from 'react';
import { WarehouseLabel } from '@/components/procurement';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import type { IInventoryWarehouseAggregate } from '@/interface/inventoryOverview.interface';
import CapacidadBodega from '@/pages/inventario/Inventario/components/parts/CapacidadBodega';

const COLUMN_COUNT = 6;

interface IBodegasTableProps {
	warehouses: IInventoryWarehouseAggregate[];
	loading: boolean;
	hasError: boolean;
	onOpen: (aggregate: IInventoryWarehouseAggregate) => void;
}

/**
 * Vista Por bodega: cuántos productos y unidades tiene cada ubicación y qué
 * pide atención. «Ver» abre la ficha de inventario de la bodega.
 */
const BodegasTable: React.FC<IBodegasTableProps> = ({ warehouses, loading, hasError, onOpen }) => (
	<Card>
		<CardHeader>
			<CardTitle className='text-lg'>Bodegas de la sucursal</CardTitle>
			{!loading && !hasError && (
				<span className='text-sm text-zinc-500'>
					{warehouses.length} {warehouses.length === 1 ? 'ubicación' : 'ubicaciones'}
				</span>
			)}
		</CardHeader>
		<CardBody className='overflow-x-auto p-0'>
			<Table aria-label='Inventario por bodega' className='min-w-[720px]'>
				<THead>
					<Tr>
						<Th scope='col'>Bodega</Th>
						<Th scope='col' className='text-right'>
							Productos
						</Th>
						<Th scope='col' className='text-right'>
							Unidades
						</Th>
						<Th scope='col'>Atención</Th>
						<Th scope='col'>Capacidad</Th>
						<Th scope='col' className='text-center'>
							Acciones
						</Th>
					</Tr>
				</THead>
				<TBody>
					{loading &&
						Array.from({ length: 3 }, (_, rowIndex) => (
							<Tr key={`bodegas-skeleton-${rowIndex}`}>
								{Array.from({ length: COLUMN_COUNT }, (_cell, cellIndex) => (
									<Td key={`bodegas-skeleton-${rowIndex}-${cellIndex}`}>
										<div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
									</Td>
								))}
							</Tr>
						))}
					{!loading && hasError && (
						<Tr>
							<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
								<p className='font-medium text-red-700 dark:text-red-300'>
									No fue posible mostrar las bodegas
								</p>
							</Td>
						</Tr>
					)}
					{!loading && !hasError && warehouses.length === 0 && (
						<Tr>
							<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
								<p className='font-medium text-zinc-700 dark:text-zinc-200'>
									Esta sucursal no tiene bodegas ni stock sin ubicación
								</p>
								<p className='mt-1 text-sm text-zinc-500'>
									Las bodegas se crean en Catálogos › Bodegas.
								</p>
							</Td>
						</Tr>
					)}
					{!loading &&
						!hasError &&
						warehouses.map((aggregate) => {
							const name = aggregate.warehouse?.name ?? 'Sin ubicación';
							const alerts = [
								aggregate.critical_count > 0 &&
									`${aggregate.critical_count} bajo el umbral`,
								aggregate.unfit_quantity > 0 &&
									`${aggregate.unfit_quantity} no vendibles`,
								aggregate.undocumented_quantity > 0 &&
									`${aggregate.undocumented_quantity} sin documento`,
							].filter((text): text is string => Boolean(text));
							return (
								<Tr key={aggregate.warehouse?.id ?? 'unlocated'}>
									<Td>
										<WarehouseLabel
											warehouse={aggregate.warehouse}
											className='font-medium'
										/>
										{aggregate.warehouse?.code && (
											<p className='text-xs text-zinc-500'>
												{aggregate.warehouse.code}
											</p>
										)}
									</Td>
									<Td className='text-right tabular-nums'>
										{aggregate.product_count}
									</Td>
									<Td className='text-right text-lg font-semibold tabular-nums'>
										{aggregate.physical_quantity}
									</Td>
									<Td>
										{alerts.length > 0 ? (
											<ul className='space-y-0.5 text-sm text-amber-700 dark:text-amber-300'>
												{alerts.map((text) => (
													<li key={text}>{text}</li>
												))}
											</ul>
										) : (
											<span className='text-sm text-zinc-500'>
												Todo en orden
											</span>
										)}
									</Td>
									<Td>
										<CapacidadBodega aggregate={aggregate} />
									</Td>
									<Td>
										<div className='flex justify-center'>
											<Button
												size='sm'
												variant='outline'
												icon='HeroEye'
												color='violet'
												aria-label={`Ver productos de ${name}`}
												onClick={() => onOpen(aggregate)}>
												Ver
											</Button>
										</div>
									</Td>
								</Tr>
							);
						})}
				</TBody>
			</Table>
		</CardBody>
	</Card>
);

export default BodegasTable;
