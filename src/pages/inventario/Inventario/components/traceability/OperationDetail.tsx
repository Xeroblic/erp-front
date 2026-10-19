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
import type { IOperationDetailState } from '@/pages/inventario/Inventario/hooks/useInventoryTraceability';

const signed = (value: number): string =>
	value > 0 ? `+${value.toLocaleString('es-CL')}` : value.toLocaleString('es-CL');

/**
 * Saldo histórico. `null` es «no se guardó» (movimiento anterior a que el
 * backend registrara el saldo previo): se muestra «—», nunca `0`, que sería
 * un saldo real distinto.
 */
const Balance = ({ value }: { value: number | null }) =>
	value === null ? (
		<span title='Sin dato: movimiento anterior al registro de saldos'>
			<span aria-hidden='true'>—</span>
			<span className='sr-only'>sin dato</span>
		</span>
	) : (
		<>{value.toLocaleString('es-CL')}</>
	);

/**
 * Ubicación de un efecto: el backend la trae con el nombre de hoy; el mock de
 * stock la nombra desde las bodegas de la sucursal.
 */
const warehouseOf = (
	effect: IInventoryOperationEffect,
	warehouses: ReadonlyMap<number, IWarehouseCompact>,
): IWarehouseCompact | null => {
	const { warehouse_id: warehouseId } = effect;
	if (warehouseId === null) return null;
	return (
		effect.warehouse ??
		warehouses.get(warehouseId) ?? { id: warehouseId, name: `Bodega #${warehouseId}` }
	);
};

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
			<WarehouseLabel warehouse={warehouseOf(effect, warehouses)} />
			<span className='tabular-nums text-zinc-600 dark:text-zinc-300'>
				<Balance value={effect.physical_quantity_before} /> →{' '}
				<span className='font-semibold text-zinc-900 dark:text-zinc-100'>
					<Balance value={effect.physical_quantity_after} />
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

/**
 * `origins: []` es normal fuera de salidas y devoluciones: una entrada crea
 * una procedencia nueva y un traslado mueve saldo sin tocarla. Se explica
 * qué pasó en vez de mostrarlo como un dato que falta.
 */
const sinProcedencias = (effects: IInventoryOperationEffect[]): string => {
	const entra = effects.some((effect) => effect.physical_quantity_delta > 0);
	const sale = effects.some((effect) => effect.physical_quantity_delta < 0);
	if (entra && sale) return 'Mueve saldo entre ubicaciones; la procedencia no cambia.';
	if (entra) return 'Ingresa como procedencia nueva.';
	return 'Sin procedencias asociadas.';
};

const Procedencias = ({
	origins,
	effects,
}: {
	origins: IInventoryOperationItemOrigin[];
	effects: IInventoryOperationEffect[];
}) => {
	if (origins.length === 0)
		return (
			<span className='text-sm text-zinc-500 dark:text-zinc-400'>
				{sinProcedencias(effects)}
			</span>
		);
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

interface IOperationDetailProps {
	state: IOperationDetailState;
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
const OperationDetail: React.FC<IOperationDetailProps> = ({
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
										{/* Una operación documental no tiene efectos: no movió unidades. */}
										{item.effects.length === 0 && (
											<span className='text-sm text-zinc-500 dark:text-zinc-400'>
												Sin cambio físico
											</span>
										)}
										<ul className='space-y-1'>
											{item.effects.map((effect, index) => (
												<Efecto
													// Un traslado entre sucursales repite «Sin ubicación»: el orden de escritura desempata.
													// eslint-disable-next-line react/no-array-index-key
													key={`${effect.branch_id}:${effect.warehouse_id ?? 'unlocated'}:${index}`}
													effect={effect}
													warehouses={warehouses}
												/>
											))}
										</ul>
									</Td>
									<Td>
										<Procedencias
											origins={item.origins}
											effects={item.effects}
										/>
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

export default OperationDetail;
