import React from 'react';
import { ProductCard, UNLOCATED_WAREHOUSE_LABEL } from '@/components/procurement';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
// eslint-disable-next-line import/extensions
import SortableTableHeader, { type TableSortState } from '@/components/ui/SortableTableHeader';
import type {
	IInventoryOverviewResponse,
	IInventoryOverviewRow,
	IInventoryWarehouseAggregate,
	TInventoryStockSort,
	TInventoryStockSortField,
} from '@/interface/inventoryOverview.interface';
import EstadoStockPill from '@/pages/inventario/Inventario/components/parts/EstadoStockPill';
import InventarioPagination from '@/pages/inventario/Inventario/components/parts/InventarioPagination';
import RepartoBodegas from '@/pages/inventario/Inventario/components/parts/RepartoBodegas';
import type { TInventarioUbicacion } from '@/pages/inventario/Inventario/types';

const sortState = (orden: TInventoryStockSort): TableSortState<TInventoryStockSortField> =>
	orden.startsWith('-')
		? { key: orden.slice(1) as TInventoryStockSortField, direction: 'desc' }
		: { key: orden as TInventoryStockSortField, direction: 'asc' };

/** Mismo criterio que `SortableTableHeader` local: el primer clic ordena ascendente. */
const nextOrden = (
	orden: TInventoryStockSort,
	key: TInventoryStockSortField,
): TInventoryStockSort => (orden === key ? `-${key}` : key);

const highlightedWarehouse = (ubicacion: TInventarioUbicacion): number | null | undefined => {
	if (ubicacion === 'branch') return undefined;
	if (ubicacion === 'unlocated') return null;
	return Number(ubicacion.slice('warehouse:'.length));
};

interface IInventarioGeneralTableProps {
	response: IInventoryOverviewResponse | null;
	loading: boolean;
	hasError: boolean;
	hasFilters: boolean;
	ubicacion: TInventarioUbicacion;
	orden: TInventoryStockSort;
	warehouses: IInventoryWarehouseAggregate[];
	onOrden: (orden: TInventoryStockSort) => void;
	onPaginate: (page: number, perPage: number) => void;
	onOpen: (row: IInventoryOverviewRow) => void;
}

/**
 * Lista de productos de la vista General: qué es, dónde está, cuánto hay,
 * cuánto se puede vender y en qué estado está. «Ver» abre la ficha.
 */
const InventarioGeneralTable: React.FC<IInventarioGeneralTableProps> = ({
	response,
	loading,
	hasError,
	hasFilters,
	ubicacion,
	orden,
	warehouses,
	onOrden,
	onPaginate,
	onOpen,
}) => {
	const columnCount = 6;
	const rows = response?.data ?? [];
	const sort = sortState(orden);
	const handleSort = (key: TInventoryStockSortField) => onOrden(nextOrden(orden, key));
	const isFiltered = ubicacion !== 'branch';
	const ubicacionName =
		ubicacion === 'unlocated'
			? UNLOCATED_WAREHOUSE_LABEL
			: (warehouses.find((aggregate) => `warehouse:${aggregate.warehouse?.id}` === ubicacion)
					?.warehouse?.name ?? 'esta bodega');

	return (
		<Card>
			<CardHeader>
				<CardTitle className='text-lg'>
					{isFiltered ? `Productos en ${ubicacionName}` : 'Productos'}
				</CardTitle>
				{!hasError && response && (
					<span className='text-sm text-zinc-500'>
						{response.meta.total} {response.meta.total === 1 ? 'producto' : 'productos'}
					</span>
				)}
			</CardHeader>
			<CardBody className='overflow-x-auto p-0'>
				<Table aria-label='Inventario por producto' className='min-w-[860px]'>
					<THead>
						<Tr>
							<SortableTableHeader
								label='Producto'
								sortKey='name'
								sort={sort}
								onSort={handleSort}
							/>
							<Th scope='col'>Dónde está</Th>
							<SortableTableHeader
								label={isFiltered ? 'En esta ubicación' : 'En bodega'}
								sortKey='physical_quantity'
								sort={sort}
								onSort={handleSort}
								align='right'
							/>
							<SortableTableHeader
								label='Disponible'
								sortKey='available_quantity'
								sort={sort}
								onSort={handleSort}
								align='right'
							/>
							<Th scope='col' className='text-center'>
								Estado
							</Th>
							<Th scope='col' className='text-center'>
								Acciones
							</Th>
						</Tr>
					</THead>
					<TBody>
						{loading &&
							Array.from({ length: 5 }, (_, rowIndex) => (
								<Tr key={`inventario-skeleton-${rowIndex}`}>
									{Array.from({ length: columnCount }, (_cell, cellIndex) => (
										<Td key={`inventario-skeleton-${rowIndex}-${cellIndex}`}>
											<div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
										</Td>
									))}
								</Tr>
							))}
						{!loading && hasError && (
							<Tr>
								<Td colSpan={columnCount} className='py-12 text-center'>
									<p className='font-medium text-red-700 dark:text-red-300'>
										No fue posible mostrar el inventario
									</p>
								</Td>
							</Tr>
						)}
						{!loading && !hasError && rows.length === 0 && (
							<Tr>
								<Td colSpan={columnCount} className='py-12 text-center'>
									<p className='font-medium text-zinc-700 dark:text-zinc-200'>
										{hasFilters
											? 'Ningún producto coincide con estos filtros'
											: 'Todavía no hay stock en esta sucursal'}
									</p>
									<p className='mt-1 text-sm text-zinc-500'>
										{hasFilters
											? 'Prueba ajustando o limpiando los filtros.'
											: 'Aparecerá acá cuando entren productos por una recepción o un ajuste.'}
									</p>
								</Td>
							</Tr>
						)}
						{!loading &&
							!hasError &&
							rows.map((row) => {
								const critical = row.critical_stock;
								return (
									<Tr key={row.product.id}>
										<Td>
											<ProductCard
												product={row.product}
												density='compact'
												showCatalogPricing={false}
											/>
										</Td>
										<Td>
											<RepartoBodegas
												warehouses={row.warehouses}
												highlighted={highlightedWarehouse(ubicacion)}
											/>
										</Td>
										<Td className='text-right'>
											<p className='text-lg font-semibold tabular-nums'>
												{row.physical_quantity}
											</p>
											{row.unfit_quantity > 0 && (
												<p className='text-sm font-medium text-amber-700 dark:text-amber-300'>
													{row.unfit_quantity} no vendible
													{row.unfit_quantity === 1 ? '' : 's'}
												</p>
											)}
										</Td>
										<Td className='text-right'>
											{critical ? (
												<>
													<p
														className={
															critical.available_quantity <= 0
																? 'font-semibold tabular-nums text-red-700 dark:text-red-300'
																: 'font-semibold tabular-nums'
														}>
														{critical.available_quantity}
													</p>
													{critical.held_quantity > 0 && (
														<p className='text-sm text-zinc-500'>
															{critical.held_quantity} reservada
															{critical.held_quantity === 1
																? ''
																: 's'}
														</p>
													)}
												</>
											) : (
												<span className='text-sm text-zinc-500'>—</span>
											)}
										</Td>
										<Td className='text-center'>
											<EstadoStockPill critical={critical} />
										</Td>
										<Td>
											<div className='flex justify-center'>
												<Button
													size='sm'
													variant='outline'
													icon='HeroEye'
													color='violet'
													aria-label={`Ver ficha de ${row.product.name}`}
													onClick={() => onOpen(row)}>
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
			{response && !hasError && (
				<InventarioPagination
					meta={response.meta}
					loading={loading}
					onChange={onPaginate}
				/>
			)}
		</Card>
	);
};

export default InventarioGeneralTable;
