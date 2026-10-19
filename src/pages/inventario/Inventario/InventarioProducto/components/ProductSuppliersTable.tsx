import classNames from 'classnames';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import InventarioPagination from '@/pages/inventario/Inventario/components/parts/InventarioPagination';
import {
	EffectiveCost,
	EXCLUSION_REASON_LABELS,
	PurchaseDate,
	PurchaseReferences,
	SupplierName,
} from '@/pages/inventario/Inventario/InventarioProducto/components/PurchaseParts';
import type {
	IProductSupplierPurchasesRow,
	IProductSuppliersResponse,
} from '@/interface/procurement.interface';

/** Por qué una fila es o no es la sugerida, sin recalcular nada. */
const SuggestionCell = ({ row }: { row: IProductSupplierPurchasesRow }) => {
	if (row.is_suggested)
		return (
			<Badge color='emerald' variant='solid' className='whitespace-nowrap'>
				<Icon icon='HeroStar' className='mr-1 h-4 w-4' aria-hidden='true' />
				Sugerido
			</Badge>
		);
	if (row.exclusion_reason)
		return (
			<span className='text-sm text-amber-700 dark:text-amber-300'>
				{EXCLUSION_REASON_LABELS[row.exclusion_reason]}
			</span>
		);
	return <span className='text-sm text-zinc-500 dark:text-zinc-400'>Comparable</span>;
};

interface IProductSuppliersTableProps {
	response: IProductSuppliersResponse;
	loading: boolean;
	onPaginate: (page: number, perPage: number) => void;
}

/**
 * Proveedores que vendieron el producto, en el orden del backend (el sugerido
 * primero, después por nombre). La sugerencia es la del `context`: el menor
 * costo efectivo de la última compra entre los proveedores activos.
 */
const ProductSuppliersTable = ({ response, loading, onPaginate }: IProductSuppliersTableProps) => {
	const suggested = response.data.find((row) => row.is_suggested) ?? null;
	const hasSuggestion = response.context?.suggested_supplier_id != null;

	return (
		<div className='space-y-3'>
			{hasSuggestion && suggested && (
				<div className='flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100'>
					<Icon icon='HeroStar' className='mt-0.5 h-5 w-5 shrink-0' aria-hidden='true' />
					<p className='text-sm'>
						<span className='font-semibold'>
							Proveedor sugerido: {suggested.supplier.display_name}.
						</span>{' '}
						Tiene el menor costo efectivo en su última compra entre los proveedores
						activos.
					</p>
				</div>
			)}
			{!hasSuggestion && response.data.length > 0 && (
				<p className='text-sm text-zinc-600 dark:text-zinc-300'>
					Ningún proveedor puede sugerirse: todos están desactivados o su última compra no
					tiene costo conocido.
				</p>
			)}
			<div className='overflow-x-auto'>
				<Table
					aria-label='Proveedores que vendieron este producto'
					className='min-w-[880px]'>
					<THead>
						<Tr>
							<Th scope='col'>Proveedor</Th>
							<Th scope='col'>Sugerencia</Th>
							<Th scope='col'>Última compra</Th>
							<Th scope='col'>Costo efectivo</Th>
							<Th scope='col'>Respaldo</Th>
							<Th scope='col' className='text-right'>
								Recepciones
							</Th>
							<Th scope='col' className='text-right'>
								Unidades recibidas
							</Th>
						</Tr>
					</THead>
					<TBody>
						{response.data.map((row) => (
							<Tr
								key={row.supplier.id}
								className={classNames(
									row.is_suggested &&
										'[&>td]:!bg-emerald-50 dark:[&>td]:!bg-emerald-950/40',
								)}>
								<Td
									className={classNames(
										row.is_suggested && 'border-l-4 border-emerald-500',
									)}>
									<SupplierName supplier={row.supplier} />
								</Td>
								<Td>
									<SuggestionCell row={row} />
								</Td>
								<Td>
									<PurchaseDate purchase={row.last_purchase} />
									<p className='text-sm text-zinc-500 dark:text-zinc-400'>
										{row.last_purchase.quantity.toLocaleString('es-CL')}{' '}
										{row.last_purchase.quantity === 1 ? 'unidad' : 'unidades'}
									</p>
								</Td>
								<Td>
									<EffectiveCost cost={row.last_purchase.cost} />
								</Td>
								<Td>
									<PurchaseReferences purchase={row.last_purchase} />
								</Td>
								<Td className='text-right tabular-nums'>
									{row.receipt_count.toLocaleString('es-CL')}
								</Td>
								<Td className='text-right font-semibold tabular-nums'>
									{row.total_units_received.toLocaleString('es-CL')}
								</Td>
							</Tr>
						))}
					</TBody>
				</Table>
			</div>
			{response.meta.last_page > 1 && (
				<InventarioPagination
					meta={response.meta}
					loading={loading}
					onChange={onPaginate}
				/>
			)}
		</div>
	);
};

export default ProductSuppliersTable;
