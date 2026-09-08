import React from 'react';
import type { PaginationState, Updater } from '@tanstack/react-table';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Table, { TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import TableCardFooterTemplateV2, {
	type TablePaginationController,
} from '@/templates/Table/TableFooterTemplateV2';
import { formatDate } from '@/utils/format.utils';
import { formatDecimalAmount } from '@/utils/procurementDecimal.util';
import type {
	IApiPaginationMeta,
	IPurchaseDocumentListRow,
} from '@/interface/procurement.interface';
import DocumentTypeBadge from '../parts/DocumentTypeBadge';
import DocumentStatusBadge from '../parts/DocumentStatusBadge';
import ReceptionStatusBadge from '../parts/ReceptionStatusBadge';

interface IDocumentosCompraTableProps {
	rows: IPurchaseDocumentListRow[];
	meta: IApiPaginationMeta | null;
	loading: boolean;
	hasError: boolean;
	hasActiveFilters: boolean;
	onPaginationChange: (page: number, perPage: number) => void;
	onView: (id: number) => void;
}

const COLUMN_COUNT = 8;

const DocumentosCompraPagination: React.FC<{
	meta: IApiPaginationMeta;
	loading: boolean;
	onChange: (page: number, perPage: number) => void;
}> = ({ meta, loading, onChange }) => {
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

const DocumentosCompraTable: React.FC<IDocumentosCompraTableProps> = ({
	rows,
	meta,
	loading,
	hasError,
	hasActiveFilters,
	onPaginationChange,
	onView,
}) => (
	<Card>
		<CardHeader>
			<CardTitle className='text-lg'>Documentos de compra</CardTitle>
			{!hasError && (
				<span className='text-sm text-zinc-500'>
					{meta?.total ?? rows.length} documentos
				</span>
			)}
		</CardHeader>
		<CardBody className='overflow-x-auto p-0'>
			<Table className='min-w-[1080px]'>
				<THead>
					<Tr>
						<Th>Folio</Th>
						<Th>Tipo</Th>
						<Th>Emisión</Th>
						<Th>Proveedor</Th>
						<Th className='text-right'>Total</Th>
						<Th className='text-center'>Estado</Th>
						<Th className='text-center'>Cobertura</Th>
						<Th>Acciones</Th>
					</Tr>
				</THead>
				<TBody>
					{loading &&
						Array.from({ length: 5 }, (_, rowIndex) => (
							<Tr key={`document-skeleton-${rowIndex}`}>
								{Array.from({ length: COLUMN_COUNT }, (_cell, cellIndex) => (
									<Td key={`document-skeleton-${rowIndex}-${cellIndex}`}>
										<div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
									</Td>
								))}
							</Tr>
						))}
					{!loading && hasError && (
						<Tr>
							<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
								<p className='font-medium text-red-700 dark:text-red-300'>
									No fue posible mostrar los documentos
								</p>
							</Td>
						</Tr>
					)}
					{!loading && !hasError && rows.length === 0 && (
						<Tr>
							<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
								<p className='font-medium text-zinc-700 dark:text-zinc-200'>
									{hasActiveFilters
										? 'Sin resultados para los filtros aplicados'
										: 'Aún no hay documentos de compra registrados'}
								</p>
								<p className='mt-1 text-sm text-zinc-500'>
									{hasActiveFilters
										? 'Prueba ajustando o limpiando los filtros.'
										: 'Los documentos aparecerán aquí cuando se registren.'}
								</p>
							</Td>
						</Tr>
					)}
					{!loading &&
						!hasError &&
						rows.map((document) => (
							<Tr key={document.id}>
								<Td className='font-mono'>{document.document_number}</Td>
								<Td>
									<DocumentTypeBadge documentType={document.document_type} />
								</Td>
								<Td>{formatDate(document.issue_date)}</Td>
								<Td>
									{document.supplier ? (
										<div className='flex flex-col'>
											<span className='font-medium'>
												{document.supplier.display_name}
											</span>
											<span className='font-mono text-xs text-zinc-500'>
												{document.supplier.rut}
											</span>
										</div>
									) : (
										<span className='text-zinc-400'>Sin proveedor</span>
									)}
								</Td>
								<Td className='text-right'>
									{formatDecimalAmount(
										document.total_amount,
										document.currency_code,
									) ?? <span className='text-zinc-400'>—</span>}
								</Td>
								<Td>
									<div className='flex justify-center'>
										<DocumentStatusBadge status={document.status} />
									</div>
								</Td>
								<Td>
									<div className='flex justify-center'>
										<ReceptionStatusBadge
											receptionStatus={document.reception_status}
										/>
									</div>
								</Td>
								<Td>
									<Button
										size='sm'
										variant='outline'
										icon='HeroEye'
										color='violet'
										onClick={() => onView(document.id)}>
										Ver
									</Button>
								</Td>
							</Tr>
						))}
				</TBody>
			</Table>
		</CardBody>
		{meta && !hasError && (
			<DocumentosCompraPagination
				meta={meta}
				loading={loading}
				onChange={onPaginationChange}
			/>
		)}
	</Card>
);

export default DocumentosCompraTable;
