import { useState } from 'react';
import type { PaginationState, Updater } from '@tanstack/react-table';
import Select from '@/components/form/Select';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import {
	TableCardFooterTemplateV2,
	type TablePaginationController,
} from '@/templates/Table/TableFooterTemplateV2';
import type {
	IApiPaginationMeta,
	IInventoryStockListParams,
	IInventoryStockOriginRow,
	TInventoryOriginType,
} from '@/interface/procurement.interface';
import useInventoryOrigins from '@/pages/inventario/abastecimiento/StockPorUbicacion/hooks/useInventoryOrigins';
import DocumentInitialStockModal from '@/pages/inventario/abastecimiento/StockPorUbicacion/components/DocumentInitialStockModal';

/** Mismo paginador que el resto de las tablas de abastecimiento (`TableCardFooterTemplateV2`), no el `Pagination` a medida de `StockPagination`. */
const OriginsPagination = ({
	meta,
	loading,
	onChange,
}: {
	meta: IApiPaginationMeta;
	loading: boolean;
	onChange: (page: number, perPage: number) => void;
}) => {
	const pagination: PaginationState = {
		pageIndex: Math.max(0, meta.current_page - 1),
		pageSize: meta.per_page,
	};
	const table: TablePaginationController = {
		getState: () => ({ pagination }),
		setPageSize: (updater: Updater<number>) => {
			const perPage = typeof updater === 'function' ? updater(pagination.pageSize) : updater;
			onChange(1, perPage);
		},
		setPageIndex: (updater: Updater<number>) => {
			const pageIndex =
				typeof updater === 'function' ? updater(pagination.pageIndex) : updater;
			onChange(Math.min(Math.max(1, pageIndex + 1), meta.last_page), pagination.pageSize);
		},
		getCanPreviousPage: () => meta.current_page > 1,
		previousPage: () => onChange(Math.max(1, meta.current_page - 1), pagination.pageSize),
		getPageCount: () => meta.last_page,
		getCanNextPage: () => meta.current_page < meta.last_page,
		nextPage: () => onChange(meta.current_page + 1, pagination.pageSize),
	};

	return <TableCardFooterTemplateV2 table={table} isDisabled={loading} />;
};

const ORIGIN_LABELS: Record<TInventoryOriginType, string> = {
	stock_receipt: 'Recepción',
	initial_stock: 'Conteo inicial',
	inventory_adjustment: 'Ajuste de inventario',
};
export interface InventoryOriginsProps {
	branchId: number;
	subsidiaryId: number | null;
	productId: number;
	owner: string;
	location: IInventoryStockListParams;
	/**
	 * Refresca la fila agregada de `useStockPorUbicacion` (físico/documentado/
	 * sin documento) que vive en la tabla contenedora. Se invoca junto con el
	 * `refresh` interno de este panel tras documentar, para que ambos —fila
	 * agregada y tabla de procedencias— muestren la misma cifra sin recargar
	 * la página (hallazgo QA: la fila agregada no se refrescaba).
	 */
	onDocumented: (quantity: number) => void;
}

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

	// `IInventoryStockOriginRow` no declara `warehouse_id` (sección 3 del
	// contrato): la única ubicación inequívoca de cada fila es la del
	// `context` de la consulta vigente — sólo cierta cuando el filtro ya
	// apunta a una bodega concreta o a Sin ubicación, nunca a «sucursal
	// completa», donde el listado mezcla procedencias de varias bodegas.
	const resolvedWarehouseId =
		response && response.context.scope === 'warehouse'
			? (response.context.warehouse?.id ?? null)
			: null;
	const canDocumentHere = Boolean(response) && response!.context.scope !== 'branch';

	return (
		<section aria-label='Procedencias del producto' className='space-y-4 p-2'>
			<div className='flex flex-wrap items-start justify-between gap-2'>
				<div>
					<h3 className='font-semibold'>Procedencias · orden FIFO</h3>
					<p className='text-sm text-zinc-500'>
						Cantidades actuales de cada procedencia. El orden conserva su prioridad
						aunque la fecha sea desconocida.
					</p>
				</div>
				{response && (
					<span className='text-sm text-zinc-500'>
						{response.meta.total} procedencias
					</span>
				)}
			</div>
			<form onSubmit={formik.handleSubmit} className='grid gap-3 sm:grid-cols-2'>
				<div>
					<label htmlFor={`origin-supplier-${productId}`}>Proveedor</label>
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
				<div>
					<label htmlFor={`origin-document-${productId}`}>Documento de compra</label>
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
				<>
					<Table aria-label='Cantidades actuales por procedencia'>
						<THead>
							<Tr>
								<Th scope='col'>Procedencia</Th>
								<Th scope='col'>Fecha de recepción</Th>
								<Th scope='col'>Proveedor</Th>
								<Th scope='col'>Respaldo</Th>
								<Th scope='col'>Físico</Th>
								<Th scope='col'>Apto</Th>
								<Th scope='col'>No apto</Th>
								<Th scope='col'>Acciones</Th>
							</Tr>
						</THead>
						<TBody>
							{response.data.length === 0 && (
								<Tr>
									<Td colSpan={8}>
										Sin procedencias para los filtros aplicados.
									</Td>
								</Tr>
							)}
							{response.data.map((origin) => (
								<Tr key={origin.origin_id}>
									<Td>
										{ORIGIN_LABELS[origin.origin_type]} #{origin.origin_id}
										{!origin.supplier && !origin.purchase_document && (
											<p className='text-sm text-zinc-500'>
												Procedencia desconocida
											</p>
										)}
									</Td>
									<Td>{origin.received_on ?? 'Fecha desconocida'}</Td>
									<Td>
										{origin.supplier?.display_name ?? 'Proveedor desconocido'}
									</Td>
									<Td>
										{origin.purchase_document
											? `${origin.physical_quantity} documentados por ${origin.purchase_document.document_type === 'invoice' ? 'factura' : 'boleta'} #${origin.purchase_document.document_number}`
											: `${origin.physical_quantity} sin respaldo`}
									</Td>
									<Td className='font-semibold tabular-nums'>
										{origin.physical_quantity}
									</Td>
									<Td className='tabular-nums'>{origin.fit_quantity}</Td>
									<Td
										className={
											origin.unfit_quantity > 0
												? 'font-semibold text-amber-700 dark:text-amber-300'
												: ''
										}>
										{origin.unfit_quantity}
									</Td>
									<Td>
										{/* La UI no ofrece crear una recepción para respaldar
										    unidades que ya están en bodega: sólo este botón
										    documental, nunca un enlace a «nueva recepción». */}
										{!origin.purchase_document &&
											(canDocumentHere ? (
												<Button
													type='button'
													size='sm'
													variant='outline'
													onClick={() =>
														setDocumentingOrigin({
															origin_id: origin.origin_id,
															physical_quantity:
																origin.physical_quantity,
														})
													}>
													Documentar
												</Button>
											) : (
												<p className='text-xs text-zinc-500'>
													Filtra por bodega o Sin ubicación para
													documentar
												</p>
											))}
									</Td>
								</Tr>
							))}
						</TBody>
					</Table>
					<OriginsPagination meta={response.meta} loading={loading} onChange={paginate} />
				</>
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
