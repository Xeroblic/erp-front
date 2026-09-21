import { useState } from 'react';
import Select from '@/components/form/Select';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import InventarioPagination from '@/pages/inventario/Inventario/components/parts/InventarioPagination';
import type {
	IInventoryStockListParams,
	IInventoryStockOriginRow,
	TInventoryOriginType,
} from '@/interface/procurement.interface';
import useInventoryOrigins from '@/pages/inventario/Inventario/InventarioProducto/hooks/useInventoryOrigins';
import DocumentInitialStockModal from '@/pages/inventario/Inventario/InventarioProducto/components/DocumentInitialStockModal';

const ORIGIN_LABELS: Record<TInventoryOriginType, string> = {
	stock_receipt: 'Recepción',
	initial_stock: 'Conteo inicial',
	inventory_adjustment: 'Ajuste de inventario',
};

const documentLabel = (origin: IInventoryStockOriginRow): string | null =>
	origin.purchase_document
		? `${origin.purchase_document.document_type === 'invoice' ? 'Factura' : 'Boleta'} #${origin.purchase_document.document_number}`
		: null;

export interface InventoryOriginsProps {
	branchId: number;
	subsidiaryId: number | null;
	productId: number;
	owner: string;
	/** Siempre una ubicación concreta (bodega o Sin ubicación): la ficha la elige. */
	location: IInventoryStockListParams;
	/** Avisa a la ficha para que vuelva a pedir sus totales tras documentar. */
	onDocumented: (quantity: number) => void;
}

/**
 * Procedencias del producto en una ubicación, en orden FIFO (§3 del contrato),
 * con la acción «Documentar» del §8 para las que no tienen respaldo.
 */
const InventoryOrigins = ({
	branchId,
	subsidiaryId,
	productId,
	owner,
	location,
	onDocumented,
}: InventoryOriginsProps) => {
	const { formik, setFilter, options, paginate, refresh, response, error, loading } =
		useInventoryOrigins(branchId, productId, owner, location);
	const [documentingOrigin, setDocumentingOrigin] = useState<Pick<
		IInventoryStockOriginRow,
		'origin_id' | 'physical_quantity'
	> | null>(null);

	// `IInventoryStockOriginRow` no declara `warehouse_id` (§3): la ubicación
	// de cada fila es la del `context` de la consulta, que la ficha siempre
	// acota a una bodega o a Sin ubicación.
	const resolvedWarehouseId =
		response && response.context.scope === 'warehouse'
			? (response.context.warehouse?.id ?? null)
			: null;
	const canDocumentHere = Boolean(response) && response?.context.scope !== 'branch';
	const hasFilterOptions = options.suppliers.length > 0 || options.documents.length > 0;

	return (
		<section aria-label='Procedencias del producto' className='space-y-4'>
			<div className='flex flex-wrap items-start justify-between gap-2'>
				<p className='text-sm text-zinc-600 dark:text-zinc-300'>
					De dónde vino cada unidad, de la más antigua a la más nueva. Las ventas
					descuentan primero las de arriba.
				</p>
				{response && (
					<span className='text-sm text-zinc-500'>
						{response.meta.total}{' '}
						{response.meta.total === 1 ? 'procedencia' : 'procedencias'}
					</span>
				)}
			</div>
			{hasFilterOptions && (
				<form onSubmit={formik.handleSubmit} className='grid gap-3 sm:grid-cols-2'>
					<div className='space-y-1'>
						<label
							htmlFor={`origin-supplier-${productId}`}
							className='block text-sm font-medium'>
							Proveedor
						</label>
						<Select
							id={`origin-supplier-${productId}`}
							name='supplier'
							value={formik.values.supplier}
							onChange={(event) => setFilter('supplier', event.target.value)}>
							<option value=''>Todos los proveedores</option>
							{options.suppliers.map((supplier) => (
								<option key={supplier.id} value={supplier.id}>
									{supplier.display_name}
								</option>
							))}
						</Select>
					</div>
					<div className='space-y-1'>
						<label
							htmlFor={`origin-document-${productId}`}
							className='block text-sm font-medium'>
							Documento de compra
						</label>
						<Select
							id={`origin-document-${productId}`}
							name='document'
							value={formik.values.document}
							onChange={(event) => setFilter('document', event.target.value)}>
							<option value=''>Todos los documentos</option>
							{options.documents.map((document) => (
								<option key={document.id} value={document.id}>
									{document.document_type === 'invoice' ? 'Factura' : 'Boleta'} #
									{document.document_number}
								</option>
							))}
						</Select>
					</div>
				</form>
			)}
			{loading && <p role='status'>Cargando procedencias…</p>}
			{error && (
				<Alert color='red' title='No pudimos cargar las procedencias'>
					<span>{error}</span>
					<Button type='button' onClick={refresh}>
						Reintentar procedencias
					</Button>
				</Alert>
			)}
			{!loading && !error && response && (
				<div className='overflow-x-auto'>
					<Table aria-label='Procedencias en esta ubicación' className='min-w-[640px]'>
						<THead>
							<Tr>
								<Th scope='col'>Procedencia</Th>
								<Th scope='col'>Proveedor</Th>
								<Th scope='col'>Respaldo</Th>
								<Th scope='col'>Unidades</Th>
								<Th scope='col'>
									<span className='sr-only'>Acción</span>
								</Th>
							</Tr>
						</THead>
						<TBody>
							{response.data.length === 0 && (
								<Tr>
									<Td colSpan={5}>
										Sin procedencias para los filtros aplicados.
									</Td>
								</Tr>
							)}
							{response.data.map((origin) => (
								<Tr key={origin.origin_id}>
									<Td>
										{/* Una recepción se nombra por su número, que es lo que el usuario
										    busca en Recepciones; el resto no tiene otro identificador. */}
										<p className='font-medium'>
											{ORIGIN_LABELS[origin.origin_type]} #
											{origin.stock_receipt_id ?? origin.origin_id}
										</p>
										<p className='text-sm text-zinc-500'>
											{origin.received_on ?? 'Fecha desconocida'}
										</p>
									</Td>
									<Td>{origin.supplier?.display_name ?? 'Desconocido'}</Td>
									<Td>
										{documentLabel(origin) ?? (
											<span className='text-zinc-500'>Sin documento</span>
										)}
									</Td>
									<Td>
										<p className='font-semibold tabular-nums'>
											{origin.physical_quantity}
										</p>
										{origin.unfit_quantity > 0 && (
											<p className='text-sm font-medium text-amber-700 dark:text-amber-300'>
												{origin.unfit_quantity} no vendible
												{origin.unfit_quantity === 1 ? '' : 's'}
											</p>
										)}
									</Td>
									<Td className='text-right'>
										{/* La UI no ofrece crear una recepción para respaldar
										    unidades que ya están en bodega: sólo este botón
										    documental, nunca un enlace a «nueva recepción». */}
										{!origin.purchase_document && canDocumentHere && (
											<Button
												type='button'
												size='sm'
												variant='outline'
												onClick={() =>
													setDocumentingOrigin({
														origin_id: origin.origin_id,
														physical_quantity: origin.physical_quantity,
													})
												}>
												Documentar
											</Button>
										)}
									</Td>
								</Tr>
							))}
						</TBody>
					</Table>
					<InventarioPagination
						meta={response.meta}
						loading={loading}
						onChange={paginate}
					/>
				</div>
			)}
			<DocumentInitialStockModal
				isOpen={documentingOrigin !== null}
				setIsOpen={(open) => {
					if (!open) setDocumentingOrigin(null);
				}}
				subsidiaryId={subsidiaryId}
				branchId={branchId}
				productId={productId}
				warehouseId={resolvedWarehouseId}
				origin={documentingOrigin}
				onDocumented={(quantity) => {
					setDocumentingOrigin(null);
					refresh();
					onDocumented(quantity);
				}}
			/>
		</section>
	);
};

export default InventoryOrigins;
