import React, { Fragment, useState } from 'react';
import classNames from 'classnames';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
// eslint-disable-next-line import/extensions
import SortableTableHeader, { type TableSortState } from '@/components/ui/SortableTableHeader';
import type {
	IInventoryOverviewResponse,
	IInventoryOverviewRow,
	TInventoryStockSort,
	TInventoryStockSortField,
} from '@/interface/inventoryOverview.interface';
import { ProductThumbnail } from '@/components/procurement';
import EstadoStockPill, {
	todoReservado,
} from '@/pages/inventario/Inventario/components/parts/EstadoStockPill';
import InventarioPagination from '@/pages/inventario/Inventario/components/parts/InventarioPagination';
import { estadoVisible, type TInventarioEstadoVisible } from '@/pages/inventario/Inventario/types';

const COLUMN_COUNT = 6;

const sortState = (orden: TInventoryStockSort): TableSortState<TInventoryStockSortField> =>
	orden.startsWith('-')
		? { key: orden.slice(1) as TInventoryStockSortField, direction: 'desc' }
		: { key: orden as TInventoryStockSortField, direction: 'asc' };

const nextOrden = (
	orden: TInventoryStockSort,
	key: TInventoryStockSortField,
): TInventoryStockSort => (orden === key ? `-${key}` : key);

/** Color del número de stock según el estado del producto: se lee de un vistazo. */
const STOCK_TONES: Record<TInventarioEstadoVisible, string> = {
	healthy: 'text-emerald-700 dark:text-emerald-300',
	critical: 'text-amber-700 dark:text-amber-300',
	out: 'text-red-700 dark:text-red-300',
	unconfigured: 'text-zinc-900 dark:text-white',
};

const stockTone = (row: IInventoryOverviewRow): string =>
	todoReservado(row.critical_stock)
		? 'text-violet-700 dark:text-violet-300'
		: STOCK_TONES[estadoVisible(row.critical_stock) ?? 'unconfigured'];

const plural = (count: number, singular: string, pluralForm: string): string =>
	`${count} ${count === 1 ? singular : pluralForm}`;

interface IDato {
	label: string;
	value: React.ReactNode;
	tone?: 'amber' | 'muted';
}

/** Detalle desplegado: cómo se reparten las unidades de esta bodega y el umbral del producto. */
const DetalleProducto = ({ row, onOpen }: { row: IInventoryOverviewRow; onOpen: () => void }) => {
	const critical = row.critical_stock;
	const datos: IDato[] = [
		{ label: 'Vendibles', value: row.fit_quantity },
		{
			label: 'No vendibles',
			value: row.unfit_quantity,
			tone: row.unfit_quantity > 0 ? 'amber' : undefined,
		},
		{ label: 'Con documento', value: row.documented_quantity },
		{
			label: 'Sin documento',
			value: row.undocumented_quantity,
			tone: row.undocumented_quantity > 0 ? 'amber' : undefined,
		},
	];

	return (
		<div className='space-y-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900'>
			<div>
				<p className='mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200'>
					En esta bodega
				</p>
				<dl className='grid grid-cols-2 gap-3 md:grid-cols-4'>
					{datos.map((dato) => (
						<div
							key={dato.label}
							className='rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/60'>
							<dt className='text-sm text-zinc-500 dark:text-zinc-400'>
								{dato.label}
							</dt>
							<dd
								className={classNames(
									'text-xl font-semibold tabular-nums',
									dato.tone === 'amber'
										? 'text-amber-700 dark:text-amber-300'
										: 'text-zinc-900 dark:text-white',
								)}>
								{dato.value}
							</dd>
						</div>
					))}
				</dl>
			</div>
			{critical && critical.held_quantity > 0 && (
				<p className='rounded-lg bg-violet-50 p-3 text-sm text-violet-800 dark:bg-violet-500/10 dark:text-violet-200'>
					<span className='font-semibold'>
						{plural(critical.held_quantity, 'unidad reservada', 'unidades reservadas')}
					</span>{' '}
					en la sucursal ·{' '}
					{plural(
						Math.max(critical.available_quantity, 0),
						'disponible para vender',
						'disponibles para vender',
					)}
					. Las reservas son de la sucursal, no de una bodega en particular.
				</p>
			)}
			<div className='flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-700'>
				<div className='flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300'>
					<span className='font-semibold text-zinc-700 dark:text-zinc-200'>Umbral</span>
					{row.product.serial_tracking || !critical ? (
						<span>Los productos con serie no usan umbral.</span>
					) : (
						<>
							<EstadoStockPill critical={critical} fit />
							<span>
								{critical.threshold === null
									? 'Sin umbral: no avisa cuando se agota.'
									: `Avisa con ${critical.threshold} o menos disponibles en la sucursal (hoy ${critical.available_quantity}).`}
							</span>
						</>
					)}
				</div>
				<Button
					size='sm'
					variant='outline'
					icon='HeroEye'
					color='violet'
					aria-label={`Ver ficha de ${row.product.name}`}
					onClick={onOpen}>
					Ver ficha del producto
				</Button>
			</div>
		</div>
	);
};

interface IBodegaProductosTableProps {
	title: string;
	response: IInventoryOverviewResponse | null;
	loading: boolean;
	hasError: boolean;
	hasFilters: boolean;
	orden: TInventoryStockSort;
	onOrden: (orden: TInventoryStockSort) => void;
	onPaginate: (page: number, perPage: number) => void;
	onOpen: (row: IInventoryOverviewRow) => void;
}

/**
 * Productos de una bodega: SKU, nombre, marca y stock en esa ubicación. Al
 * hacer clic en la fila (o en la flecha) se despliega el detalle con el
 * reparto vendible/no vendible, documentado/sin documento y el umbral, y el
 * acceso a la ficha del producto.
 */
const BodegaProductosTable: React.FC<IBodegaProductosTableProps> = ({
	title,
	response,
	loading,
	hasError,
	hasFilters,
	orden,
	onOrden,
	onPaginate,
	onOpen,
}) => {
	const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
	const rows = response?.data ?? [];
	const sort = sortState(orden);
	const handleSort = (key: TInventoryStockSortField) => onOrden(nextOrden(orden, key));
	const toggle = (productId: number) =>
		setExpanded((current) => {
			const next = new Set(current);
			if (next.has(productId)) next.delete(productId);
			else next.add(productId);
			return next;
		});

	return (
		<Card>
			<CardHeader>
				<CardTitle className='text-lg'>{title}</CardTitle>
				{!hasError && response && (
					<span className='text-sm text-zinc-500'>
						{response.meta.total} {response.meta.total === 1 ? 'producto' : 'productos'}
					</span>
				)}
			</CardHeader>
			<CardBody className='overflow-x-auto p-0'>
				<Table aria-label='Productos de la bodega' className='min-w-[640px]'>
					<THead>
						<Tr>
							<Th scope='col' className='w-12'>
								<span className='sr-only'>Detalle</span>
							</Th>
							<SortableTableHeader
								label='Producto'
								sortKey='name'
								sort={sort}
								onSort={handleSort}
							/>
							<Th scope='col' className='w-44'>
								SKU
							</Th>
							<Th scope='col' className='w-40'>
								Marca
							</Th>
							<SortableTableHeader
								label='Stock'
								sortKey='physical_quantity'
								sort={sort}
								onSort={handleSort}
								align='center'
							/>
							<Th scope='col' className='w-44 text-center'>
								Estado
							</Th>
						</Tr>
					</THead>
					<TBody>
						{loading &&
							Array.from({ length: 5 }, (_, rowIndex) => (
								<Tr key={`bodega-skeleton-${rowIndex}`}>
									{Array.from({ length: COLUMN_COUNT }, (_cell, cellIndex) => (
										<Td key={`bodega-skeleton-${rowIndex}-${cellIndex}`}>
											<div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
										</Td>
									))}
								</Tr>
							))}
						{!loading && hasError && (
							<Tr>
								<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
									<p className='font-medium text-red-700 dark:text-red-300'>
										No fue posible mostrar los productos
									</p>
								</Td>
							</Tr>
						)}
						{!loading && !hasError && rows.length === 0 && (
							<Tr>
								<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
									<p className='font-medium text-zinc-700 dark:text-zinc-200'>
										{hasFilters
											? 'Ningún producto coincide con estos filtros'
											: 'Esta bodega no tiene productos'}
									</p>
								</Td>
							</Tr>
						)}
						{!loading &&
							!hasError &&
							rows.map((row) => {
								const isOpen = expanded.has(row.product.id);
								const panelId = `bodega-producto-${row.product.id}`;
								return (
									<Fragment key={row.product.id}>
										{/* La fila entera despliega el detalle con el mouse; el
										    botón de la flecha es el control accesible por teclado. */}
										{/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
										<Tr
											className='cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
											onClick={() => toggle(row.product.id)}>
											<Td>
												<button
													type='button'
													aria-expanded={isOpen}
													aria-controls={panelId}
													aria-label={`${isOpen ? 'Ocultar' : 'Mostrar'} detalle de ${row.product.name}`}
													onClick={(event) => {
														event.stopPropagation();
														toggle(row.product.id);
													}}
													className='flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 dark:hover:bg-zinc-800'>
													<Icon
														icon={
															isOpen
																? 'HeroChevronDown'
																: 'HeroChevronRight'
														}
														className='h-5 w-5'
													/>
												</button>
											</Td>
											<Td>
												<div className='flex items-center gap-3'>
													<ProductThumbnail
														product={row.product}
														size='h-10 w-10'
													/>
													<div className='min-w-0'>
														<p className='truncate font-semibold text-zinc-900 dark:text-white'>
															{row.product.name}
														</p>
														<p className='truncate text-xs text-zinc-500'>
															{row.product.categories
																.map((category) => category.name)
																.join(' · ') || 'Sin categoría'}
														</p>
													</div>
												</div>
											</Td>
											<Td>
												<span className='font-mono text-sm text-zinc-600 dark:text-zinc-300'>
													{row.product.sku}
												</span>
											</Td>
											<Td>
												{row.product.brand ? (
													<span className='text-sm text-zinc-700 dark:text-zinc-200'>
														{row.product.brand.name}
													</span>
												) : (
													<span className='text-sm text-zinc-400'>
														Sin marca
													</span>
												)}
											</Td>
											<Td className='text-center'>
												<span
													className={classNames(
														'text-lg font-bold tabular-nums',
														stockTone(row),
													)}>
													{row.physical_quantity}
												</span>
												{row.unfit_quantity > 0 && (
													<p className='mt-1 text-xs font-medium text-amber-700 dark:text-amber-300'>
														{row.unfit_quantity} no vendible
														{row.unfit_quantity === 1 ? '' : 's'}
													</p>
												)}
												{(row.critical_stock?.held_quantity ?? 0) > 0 && (
													<p className='mt-1 text-xs font-medium text-violet-700 dark:text-violet-300'>
														{plural(
															row.critical_stock?.held_quantity ?? 0,
															'reservada',
															'reservadas',
														)}{' '}
														en la sucursal
													</p>
												)}
											</Td>
											<Td className='text-center'>
												<EstadoStockPill critical={row.critical_stock} />
											</Td>
										</Tr>
										{isOpen && (
											<Tr id={panelId}>
												<Td
													colSpan={COLUMN_COUNT}
													className='bg-zinc-50/80 dark:bg-zinc-900/40'>
													<DetalleProducto
														row={row}
														onOpen={() => onOpen(row)}
													/>
												</Td>
											</Tr>
										)}
									</Fragment>
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

export default BodegaProductosTable;
