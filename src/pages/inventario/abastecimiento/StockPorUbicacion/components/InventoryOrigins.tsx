import Select from '@/components/form/Select';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import type {
	IInventoryStockListParams,
	TInventoryOriginType,
} from '@/interface/procurement.interface';
import useInventoryOrigins from '@/pages/inventario/abastecimiento/StockPorUbicacion/hooks/useInventoryOrigins';
import StockPagination from '@/pages/inventario/abastecimiento/StockPorUbicacion/components/StockPagination';

const ORIGIN_LABELS: Record<TInventoryOriginType, string> = {
	stock_receipt: 'Recepción',
	initial_stock: 'Conteo inicial',
	inventory_adjustment: 'Ajuste de inventario',
};
export interface InventoryOriginsProps {
	branchId: number;
	productId: number;
	owner: string;
	location: IInventoryStockListParams;
}

const InventoryOrigins = ({ branchId, productId, owner, location }: InventoryOriginsProps) => {
	const { formik, setFilter, options, paginate, refresh, response, error, loading } =
		useInventoryOrigins(branchId, productId, owner, location);
	return (
		<section aria-label='Procedencias del producto' className='space-y-4 p-2'>
			<div>
				<h3 className='font-semibold'>Procedencias · orden FIFO</h3>
				<p className='text-sm text-zinc-500'>
					Cantidades actuales de cada procedencia. El orden conserva su prioridad aunque
					la fecha sea desconocida.
				</p>
			</div>
			<form onSubmit={formik.handleSubmit} className='grid gap-3 sm:grid-cols-2'>
				<div>
					<label htmlFor={`origin-supplier-${productId}`}>Proveedor</label>
					<Select
						id={`origin-supplier-${productId}`}
						name='supplier'
						value={formik.values.supplier}
						onChange={(event) => setFilter('supplier', event.target.value)}
						onBlur={formik.handleBlur}
						isValid={!formik.errors.supplier}
						isTouched={formik.touched.supplier}
						invalidFeedback={formik.errors.supplier}>
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
						onChange={(event) => setFilter('document', event.target.value)}
						onBlur={formik.handleBlur}
						isValid={!formik.errors.document}
						isTouched={formik.touched.document}
						invalidFeedback={formik.errors.document}>
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
							</Tr>
						</THead>
						<TBody>
							{response.data.length === 0 && (
								<Tr>
									<Td colSpan={7}>
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
								</Tr>
							))}
						</TBody>
					</Table>
					<StockPagination meta={response.meta} noun='procedencias' onChange={paginate} />
				</>
			)}
		</section>
	);
};

export default InventoryOrigins;
