import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '@/components/form/Input';
import { StatusPill } from '@/components/procurement';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import ProtectedButton from '@/components/ui/ProtectedButton';
// eslint-disable-next-line import/extensions
import SortableTableHeader, { type TableSortState } from '@/components/ui/SortableTableHeader';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import { TableCardFooterTemplateV2 } from '@/templates/Table/TableFooterTemplateV2';
import type { IProduct } from '@/interface/product.interface';
import type { IWarehouseProduct } from '@/interface/warehouse.interface';
import useClientPagination from '../../hooks/useClientPagination';

const COLUMN_COUNT = 6;

interface IAssociatedRow extends IWarehouseProduct {
	brand: string | null;
	/** Stock de la sucursal; `null` si el producto no vino en el catálogo cargado. */
	branchStock: number | null;
}

type SortKey = 'name' | 'brand' | 'quantity' | 'branchStock';
type SortState = TableSortState<SortKey>;

const getSortValue = (row: IAssociatedRow, key: SortKey): string | number => {
	switch (key) {
		case 'name':
			return row.name;
		case 'brand':
			return row.brand ?? '';
		case 'quantity':
			return row.quantity;
		case 'branchStock':
			return row.branchStock ?? -1;
		default:
			return '';
	}
};

const compareRows = (left: IAssociatedRow, right: IAssociatedRow, sort: NonNullable<SortState>) => {
	const leftValue = getSortValue(left, sort.key);
	const rightValue = getSortValue(right, sort.key);
	const comparison =
		typeof leftValue === 'number' && typeof rightValue === 'number'
			? leftValue - rightValue
			: String(leftValue).localeCompare(String(rightValue), 'es', {
					numeric: true,
					sensitivity: 'base',
				});
	return sort.direction === 'asc' ? comparison : -comparison;
};

interface AssociatedProductsTableProps {
	products: IWarehouseProduct[];
	allProducts: IProduct[];
	branchId: number | null;
	onRemoveProduct: (product: IWarehouseProduct) => void;
}

/** Productos asociados a la bodega: cantidad guardada, modo de stock y acciones. */
const AssociatedProductsTable: React.FC<AssociatedProductsTableProps> = ({
	products,
	allProducts,
	branchId,
	onRemoveProduct,
}) => {
	const navigate = useNavigate();
	const [search, setSearch] = useState('');
	const [sort, setSort] = useState<SortState>(null);

	const rows = useMemo<IAssociatedRow[]>(() => {
		const catalog = new Map(allProducts.map((product) => [product.id, product]));
		const needle = search.trim().toLowerCase();
		const enriched = products.map((product) => {
			const fromCatalog = catalog.get(product.id);
			return {
				...product,
				brand: product.brand_name ?? fromCatalog?.brand?.name ?? null,
				branchStock: fromCatalog?.stock ?? null,
			};
		});
		const filtered = needle
			? enriched.filter(
					(row) =>
						row.name.toLowerCase().includes(needle) ||
						row.sku.toLowerCase().includes(needle),
				)
			: enriched;
		return sort === null
			? filtered
			: [...filtered].sort((left, right) => compareRows(left, right, sort));
	}, [products, allProducts, search, sort]);

	const { pageRows, table, resetPage } = useClientPagination(rows);

	const handleSort = (key: SortKey) => {
		setSort((current) => ({
			key,
			direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
		}));
		resetPage();
	};

	return (
		<Card>
			<CardHeader className='flex-wrap gap-3'>
				<div>
					<CardTitle className='text-lg'>Productos asociados</CardTitle>
					<p className='text-sm text-zinc-500'>
						{products.length} {products.length === 1 ? 'producto' : 'productos'} en esta
						bodega
					</p>
				</div>
				<div className='w-full sm:w-72'>
					<Input
						id='bodega-asociados-busqueda'
						name='q'
						aria-label='Buscar productos asociados'
						value={search}
						placeholder='Nombre o SKU'
						onChange={(event) => {
							setSearch(event.target.value);
							resetPage();
						}}
					/>
				</div>
			</CardHeader>
			<CardBody className='overflow-x-auto p-0'>
				<Table aria-label='Productos asociados a la bodega' className='min-w-[900px]'>
					<THead>
						<Tr>
							<SortableTableHeader
								label='Producto'
								sortKey='name'
								sort={sort}
								onSort={handleSort}
							/>
							<SortableTableHeader
								label='Marca'
								sortKey='brand'
								sort={sort}
								onSort={handleSort}
							/>
							<SortableTableHeader
								label='En bodega'
								sortKey='quantity'
								sort={sort}
								onSort={handleSort}
								align='right'
							/>
							<SortableTableHeader
								label='Stock sucursal'
								sortKey='branchStock'
								sort={sort}
								onSort={handleSort}
								align='right'
							/>
							<Th scope='col' className='text-center'>
								Modo
							</Th>
							<Th scope='col' className='text-center'>
								Acciones
							</Th>
						</Tr>
					</THead>
					<TBody>
						{rows.length === 0 && (
							<Tr>
								<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
									<p className='font-medium text-zinc-700 dark:text-zinc-200'>
										{search.trim()
											? 'Sin resultados para la búsqueda'
											: 'Esta bodega aún no tiene productos asociados'}
									</p>
									<p className='mt-1 text-sm text-zinc-500'>
										{search.trim()
											? 'Prueba ajustando o limpiando la búsqueda.'
											: 'Usa «Asociar productos» para agregarlos.'}
									</p>
								</Td>
							</Tr>
						)}
						{pageRows.map((row) => (
							<Tr key={row.id}>
								<Td>
									<p className='font-medium'>{row.name}</p>
									<p className='font-mono text-xs text-zinc-500'>{row.sku}</p>
								</Td>
								<Td className='text-sm text-zinc-600 dark:text-zinc-300'>
									{row.brand ?? <span className='text-zinc-400'>Sin marca</span>}
								</Td>
								<Td className='text-right text-lg font-semibold tabular-nums'>
									{row.quantity.toLocaleString('es-CL')}
								</Td>
								<Td className='text-right tabular-nums'>
									{row.branchStock === null ? (
										<span className='text-zinc-400'>—</span>
									) : (
										row.branchStock.toLocaleString('es-CL')
									)}
								</Td>
								<Td>
									<div className='flex justify-center'>
										<StatusPill
											color={row.sync_stock ? 'emerald' : 'zinc'}
											width={8}>
											{row.sync_stock ? 'Sincronizado' : 'Manual'}
										</StatusPill>
									</div>
								</Td>
								<Td>
									<div className='flex flex-wrap justify-center gap-2'>
										<Button
											size='sm'
											variant='outline'
											icon='HeroEye'
											color='violet'
											aria-label={`Ver ${row.name}`}
											onClick={() =>
												navigate(
													`/catalogos/productos/${row.id}?branchId=${branchId ?? ''}`,
												)
											}>
											Ver
										</Button>
										<ProtectedButton
											permission='detach-warehouse-product'
											branchId={branchId}
											scope='access'
											size='sm'
											variant='outline'
											color='red'
											icon='HeroTrash'
											aria-label={`Quitar ${row.name} de la bodega`}
											onClick={() => onRemoveProduct(row)}>
											Quitar
										</ProtectedButton>
									</div>
								</Td>
							</Tr>
						))}
					</TBody>
				</Table>
			</CardBody>
			{rows.length > 0 && <TableCardFooterTemplateV2 table={table} />}
		</Card>
	);
};

export default AssociatedProductsTable;
