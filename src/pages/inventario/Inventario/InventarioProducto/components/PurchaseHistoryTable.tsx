import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Validation from '@/components/form/Validation';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import InventarioPagination from '@/pages/inventario/Inventario/components/parts/InventarioPagination';
import {
	EffectiveCost,
	PurchaseDate,
	PurchaseReferences,
	SupplierName,
} from '@/pages/inventario/Inventario/InventarioProducto/components/PurchaseParts';
import type { TProductPurchases } from '@/pages/inventario/Inventario/InventarioProducto/hooks/useProductPurchases';

type IPurchaseHistoryTableProps = Pick<
	TProductPurchases,
	'history' | 'paginateHistory' | 'formik' | 'setFilter' | 'clearFilters' | 'hasFilters'
> & {
	productId: number;
	supplierOptions: TProductPurchases['supplierOptions'];
};

/**
 * Cada compra del producto, de la más reciente a la más antigua, con filtros
 * por proveedor y por fecha de recepción. Una compra sin proveedor también
 * aparece: no se agrupa bajo un proveedor ficticio.
 */
const PurchaseHistoryTable = ({
	productId,
	history,
	paginateHistory,
	formik,
	setFilter,
	clearFilters,
	hasFilters,
	supplierOptions,
}: IPurchaseHistoryTableProps) => {
	const { response, loading, error, retry } = history;
	const fromId = `purchase-history-from-${productId}`;
	const toId = `purchase-history-to-${productId}`;
	const supplierId = `purchase-history-supplier-${productId}`;

	return (
		<section aria-labelledby={`purchase-history-title-${productId}`} className='space-y-4'>
			<div className='flex flex-wrap items-baseline justify-between gap-2'>
				<h3 id={`purchase-history-title-${productId}`} className='text-base font-semibold'>
					Historial de compras
				</h3>
				{response && (
					<span className='text-sm text-zinc-500'>
						{response.meta.total.toLocaleString('es-CL')}{' '}
						{response.meta.total === 1 ? 'compra' : 'compras'}
					</span>
				)}
			</div>

			<form
				onSubmit={formik.handleSubmit}
				className='grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-start'>
				<div className='space-y-1'>
					<label htmlFor={supplierId} className='block text-sm font-medium'>
						Proveedor
					</label>
					<Select
						id={supplierId}
						name='supplier'
						value={formik.values.supplier}
						onChange={(event) => setFilter('supplier', event.target.value)}>
						<option value=''>Todos los proveedores</option>
						{supplierOptions.map((supplier) => (
							<option key={supplier.id} value={String(supplier.id)}>
								{supplier.display_name}
							</option>
						))}
					</Select>
				</div>
				<div className='space-y-1'>
					<label htmlFor={fromId} className='block text-sm font-medium'>
						Recibida desde
					</label>
					<Validation
						isValid={!formik.errors.receivedFrom}
						isTouched={formik.touched.receivedFrom}
						invalidFeedback={formik.errors.receivedFrom}>
						<Input
							id={fromId}
							name='receivedFrom'
							type='date'
							value={formik.values.receivedFrom}
							onChange={(event) => setFilter('receivedFrom', event.target.value)}
							onBlur={formik.handleBlur}
						/>
					</Validation>
				</div>
				<div className='space-y-1'>
					<label htmlFor={toId} className='block text-sm font-medium'>
						Recibida hasta
					</label>
					<Validation
						isValid={!formik.errors.receivedTo}
						isTouched={formik.touched.receivedTo}
						invalidFeedback={formik.errors.receivedTo}>
						<Input
							id={toId}
							name='receivedTo'
							type='date'
							value={formik.values.receivedTo}
							onChange={(event) => setFilter('receivedTo', event.target.value)}
							onBlur={formik.handleBlur}
						/>
					</Validation>
				</div>
				<div className='lg:pt-6'>
					<Button
						type='button'
						variant='outline'
						icon='HeroXMark'
						isDisable={!hasFilters && !formik.dirty}
						onClick={clearFilters}>
						Limpiar filtros
					</Button>
				</div>
			</form>

			{loading && <p role='status'>Cargando historial de compras…</p>}
			{error && (
				<Alert color='red' variant='outline' title='No pudimos cargar el historial'>
					<div className='flex flex-wrap items-center justify-between gap-3'>
						<span>{error.message}</span>
						{error.kind === 'other' && (
							<Button size='sm' variant='outline' onClick={retry}>
								Reintentar
							</Button>
						)}
					</div>
				</Alert>
			)}
			{!loading && response && (
				<div className='overflow-x-auto'>
					<Table aria-label='Historial de compras del producto' className='min-w-[820px]'>
						<THead>
							<Tr>
								<Th scope='col'>Recibida</Th>
								<Th scope='col'>Proveedor</Th>
								<Th scope='col'>Respaldo</Th>
								<Th scope='col'>Bodega</Th>
								<Th scope='col' className='text-right'>
									Unidades
								</Th>
								<Th scope='col'>Costo efectivo</Th>
							</Tr>
						</THead>
						<TBody>
							{response.data.length === 0 && (
								<Tr>
									<Td colSpan={6}>
										{hasFilters
											? 'Ninguna compra coincide con los filtros aplicados.'
											: 'Todavía no hay compras registradas de este producto.'}
									</Td>
								</Tr>
							)}
							{response.data.map((row) => (
								<Tr key={row.stock_receipt_id}>
									<Td>
										<PurchaseDate purchase={row} />
									</Td>
									<Td>
										{row.supplier ? (
											<SupplierName supplier={row.supplier} />
										) : (
											<span className='text-zinc-500'>Sin proveedor</span>
										)}
									</Td>
									<Td>
										<PurchaseReferences purchase={row} />
									</Td>
									<Td>
										{row.warehouse?.name ?? (
											<span className='text-zinc-500'>
												Bodega desconocida
											</span>
										)}
									</Td>
									<Td className='text-right font-semibold tabular-nums'>
										{row.quantity.toLocaleString('es-CL')}
									</Td>
									<Td>
										<EffectiveCost cost={row.cost} />
									</Td>
								</Tr>
							))}
						</TBody>
					</Table>
					<InventarioPagination
						meta={response.meta}
						loading={loading}
						onChange={paginateHistory}
					/>
				</div>
			)}
		</section>
	);
};

export default PurchaseHistoryTable;
