import React from 'react';
import classNames from 'classnames';
import { ConditionLabel, ProductCard, WarehouseLabel } from '@/components/procurement';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import type {
	IInventoryOperationEffect,
	IInventoryOperationItemOrigin,
} from '@/interface/inventoryOperations.interface';
import type { IWarehouseCompact } from '@/interface/procurement.interface';
import type { IOperacionDetalleState } from '@/pages/inventario/Inventario/hooks/useInventarioTrazabilidad';

const signed = (value: number): string =>
	value > 0 ? `+${value.toLocaleString('es-CL')}` : value.toLocaleString('es-CL');

/** Ubicación de un efecto: el §14 trae sólo el ID; el nombre sale de las bodegas de la sucursal. */
const warehouseOf = (
	warehouseId: number | null,
	warehouses: ReadonlyMap<number, IWarehouseCompact>,
): IWarehouseCompact | null =>
	warehouseId === null
		? null
		: (warehouses.get(warehouseId) ?? { id: warehouseId, name: `Bodega #${warehouseId}` });

/**
 * Saldo de la ubicación antes y después: la historia, no el stock de hoy
 * (ese está en la vista General). Una operación documental no mueve unidades.
 */
const Efecto = ({
	effect,
	warehouses,
}: {
	effect: IInventoryOperationEffect;
	warehouses: ReadonlyMap<number, IWarehouseCompact>;
}) => {
	const delta = effect.physical_quantity_delta;
	return (
		<li className='flex flex-wrap items-center gap-x-3 gap-y-1'>
			<WarehouseLabel warehouse={warehouseOf(effect.warehouse_id, warehouses)} />
			<span className='tabular-nums text-zinc-600 dark:text-zinc-300'>
				{effect.physical_quantity_before.toLocaleString('es-CL')} →{' '}
				<span className='font-semibold text-zinc-900 dark:text-zinc-100'>
					{effect.physical_quantity_after.toLocaleString('es-CL')}
				</span>
			</span>
			{delta === 0 ? (
				<span className='text-sm text-zinc-500'>Sin cambio físico</span>
			) : (
				<span
					className={classNames(
						'text-sm font-semibold tabular-nums',
						delta > 0
							? 'text-emerald-700 dark:text-emerald-300'
							: 'text-red-700 dark:text-red-300',
					)}>
					{signed(delta)}
				</span>
			)}
			{effect.unfit_quantity_delta !== 0 && delta !== 0 && (
				<span className='text-sm text-amber-700 dark:text-amber-300'>
					{signed(effect.unfit_quantity_delta)} no vendible
					{Math.abs(effect.unfit_quantity_delta) === 1 ? '' : 's'}
				</span>
			)}
		</li>
	);
};

const documentLabel = (origin: IInventoryOperationItemOrigin): string | null =>
	origin.purchase_document
		? `${origin.purchase_document.document_type === 'invoice' ? 'Factura' : 'Boleta'} #${origin.purchase_document.document_number}`
		: null;

const Procedencias = ({ origins }: { origins: IInventoryOperationItemOrigin[] }) => {
	if (origins.length === 0) return <span className='text-zinc-400'>—</span>;
	return (
		<ul className='space-y-1'>
			{origins.map((origin) => (
				<li key={origin.origin_id}>
					<p>{origin.supplier?.display_name ?? 'Proveedor desconocido'}</p>
					<p className='text-sm text-zinc-500'>
						{documentLabel(origin) ?? 'Sin documento'} ·{' '}
						{origin.quantity.toLocaleString('es-CL')}{' '}
						{origin.quantity === 1 ? 'unidad' : 'unidades'}
					</p>
				</li>
			))}
		</ul>
	);
};

interface IOperacionDetalleProps {
	state: IOperacionDetalleState;
	warehouses: ReadonlyMap<number, IWarehouseCompact>;
	/** Algún filtro elige productos: se destacan los ítems que coinciden. */
	highlightMatches: boolean;
	onRetry: () => void;
}

/**
 * La operación completa, aunque la lista se haya filtrado por un producto o
 * una bodega: los ítems que coinciden se destacan y el resto queda atenuado
 * (§14: «mostrar operación completa y marcar ítems coincidentes»).
 */
const OperacionDetalle: React.FC<IOperacionDetalleProps> = ({
	state,
	warehouses,
	highlightMatches,
	onRetry,
}) => {
	const { detail, loading, error } = state;
	if (error)
		return (
			<Alert color='red' variant='outline' title='No pudimos cargar el detalle'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<span>{error}</span>
					<Button size='sm' variant='outline' onClick={onRetry}>
						Reintentar
					</Button>
				</div>
			</Alert>
		);
	if (loading || !detail) return <p role='status'>Cargando detalle…</p>;

	return (
		<div className='space-y-3'>
			{detail.reverses_operation_id && (
				<p className='text-sm text-zinc-600 dark:text-zinc-300'>
					Deshace las unidades que ingresó la operación original.
				</p>
			)}
			<div className='overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'>
				<Table aria-label={`Productos de ${detail.title}`} className='min-w-[760px]'>
					<THead>
						<Tr>
							<Th scope='col'>Producto</Th>
							<Th scope='col' className='text-right'>
								Cantidad
							</Th>
							<Th scope='col'>Condición</Th>
							<Th scope='col'>Saldo por ubicación</Th>
							<Th scope='col'>Procedencia</Th>
						</Tr>
					</THead>
					<TBody>
						{detail.items.map((item) => {
							const dimmed = highlightMatches && !item.matches_filter;
							return (
								<Tr
									key={`${item.product_id}:${item.condition ?? 'documental'}`}
									className={classNames(dimmed && 'opacity-50')}>
									<Td>
										<ProductCard
											product={item.product}
											density='compact'
											showCatalogPricing={false}
										/>
										{highlightMatches && item.matches_filter && (
											<p className='mt-1 text-sm font-medium text-blue-700 dark:text-blue-300'>
												Coincide con el filtro
											</p>
										)}
									</Td>
									<Td className='text-right font-semibold tabular-nums'>
										{item.quantity.toLocaleString('es-CL')}
									</Td>
									<Td>
										{item.condition ? (
											<ConditionLabel condition={item.condition} />
										) : (
											<span className='text-zinc-400'>—</span>
										)}
									</Td>
									<Td>
										<ul className='space-y-1'>
											{item.effects.map((effect) => (
												<Efecto
													key={effect.warehouse_id ?? 'unlocated'}
													effect={effect}
													warehouses={warehouses}
												/>
											))}
										</ul>
									</Td>
									<Td>
										<Procedencias origins={item.origins} />
									</Td>
								</Tr>
							);
						})}
					</TBody>
				</Table>
			</div>
		</div>
	);
};

export default OperacionDetalle;
