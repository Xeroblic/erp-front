import React from 'react';
import type { PaginationState, Updater } from '@tanstack/react-table';
import Button from '@/components/ui/Button';
import ProtectedButton from '@/components/ui/ProtectedButton';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Table, { TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import TableCardFooterTemplateV2, {
	type TablePaginationController,
} from '@/templates/Table/TableFooterTemplateV2';
import type {
	IApiPaginationMeta,
	IProcurementSupplierListRow,
} from '@/interface/procurement.interface';
import SupplierStatusBadge from '../parts/SupplierStatusBadge';

interface IProveedoresTableProps {
	rows: IProcurementSupplierListRow[];
	meta: IApiPaginationMeta | null;
	loading: boolean;
	hasError: boolean;
	hasSearch: boolean;
	onPaginationChange: (page: number, perPage: number) => void;
	onView: (id: number) => void;
	onDeactivate: (row: IProcurementSupplierListRow) => void;
	onRestore: (row: IProcurementSupplierListRow) => void;
	branchId?: number | null;
	subsidiaryId?: number | null;
}

const COLUMN_COUNT = 6;

const ProveedoresPagination: React.FC<{
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

const ProveedoresTable: React.FC<IProveedoresTableProps> = ({
	rows,
	meta,
	loading,
	hasError,
	hasSearch,
	onPaginationChange,
	onView,
	onDeactivate,
	onRestore,
	branchId,
	subsidiaryId,
}) => (
	<Card>
		<CardHeader>
			<CardTitle className='text-lg'>Proveedores</CardTitle>
			{!hasError && (
				<span className='text-sm text-zinc-500'>
					{meta?.total ?? rows.length} proveedores
				</span>
			)}
		</CardHeader>
		<CardBody className='overflow-x-auto p-0'>
			<Table className='min-w-[980px]'>
				<THead>
					<Tr>
						<Th>RUT</Th>
						<Th>Proveedor</Th>
						<Th>Giro</Th>
						<Th>Contacto</Th>
						<Th className='text-center'>Estado</Th>
						<Th>Acciones</Th>
					</Tr>
				</THead>
				<TBody>
					{loading &&
						Array.from({ length: 5 }, (_, rowIndex) => (
							<Tr key={`supplier-skeleton-${rowIndex}`}>
								{Array.from({ length: COLUMN_COUNT }, (_cell, cellIndex) => (
									<Td key={`supplier-skeleton-${rowIndex}-${cellIndex}`}>
										<div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
									</Td>
								))}
							</Tr>
						))}
					{!loading && hasError && (
						<Tr>
							<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
								<p className='font-medium text-red-700 dark:text-red-300'>
									No fue posible mostrar los proveedores
								</p>
							</Td>
						</Tr>
					)}
					{!loading && !hasError && rows.length === 0 && (
						<Tr>
							<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
								<p className='font-medium text-zinc-700 dark:text-zinc-200'>
									{hasSearch
										? 'Sin resultados para la búsqueda aplicada'
										: 'Aún no hay proveedores registrados'}
								</p>
								<p className='mt-1 text-sm text-zinc-500'>
									{hasSearch
										? 'Prueba ajustando o limpiando la búsqueda.'
										: 'Los proveedores aparecerán aquí cuando se registren.'}
								</p>
							</Td>
						</Tr>
					)}
					{!loading &&
						!hasError &&
						rows.map((supplier) => (
							<Tr key={supplier.id}>
								<Td className='font-mono'>{supplier.rut}</Td>
								<Td>
									<div className='flex flex-col'>
										<span className='font-medium'>{supplier.display_name}</span>
										{supplier.company_name && supplier.contact_name && (
											<span className='text-xs text-zinc-500'>
												{supplier.contact_name}
											</span>
										)}
									</div>
								</Td>
								<Td className='text-sm text-zinc-600 dark:text-zinc-300'>
									{supplier.business_activity ?? (
										<span className='text-zinc-400'>Sin giro</span>
									)}
								</Td>
								<Td>
									<div className='flex flex-col text-sm'>
										<span>
											{supplier.email ?? (
												<span className='text-zinc-400'>—</span>
											)}
										</span>
										<span className='text-xs text-zinc-500'>
											{supplier.phone ?? ''}
										</span>
									</div>
								</Td>
								<Td>
									<div className='flex justify-center'>
										<SupplierStatusBadge isActive={supplier.is_active} />
									</div>
								</Td>
								<Td>
									<div className='flex flex-wrap gap-2'>
										<Button
											size='sm'
											variant='outline'
											icon='HeroEye'
											color='violet'
											onClick={() => onView(supplier.id)}>
											Ver
										</Button>
										{supplier.is_active ? (
											<ProtectedButton
												permission='delete-procurement-supplier'
												branchId={branchId}
												subsidiaryId={subsidiaryId}
												scope='access'
												size='sm'
												variant='outline'
												color='amber'
												icon='HeroNoSymbol'
												onClick={() => onDeactivate(supplier)}>
												Desactivar
											</ProtectedButton>
										) : (
											<ProtectedButton
												permission='restore-procurement-supplier'
												branchId={branchId}
												subsidiaryId={subsidiaryId}
												scope='access'
												size='sm'
												variant='outline'
												color='blue'
												icon='HeroArrowPathRoundedSquare'
												onClick={() => onRestore(supplier)}>
												Restaurar
											</ProtectedButton>
										)}
									</div>
								</Td>
							</Tr>
						))}
				</TBody>
			</Table>
		</CardBody>
		{meta && !hasError && (
			<ProveedoresPagination meta={meta} loading={loading} onChange={onPaginationChange} />
		)}
	</Card>
);

export default ProveedoresTable;
