import React, { useMemo, useState } from 'react';
import Input from '@/components/form/Input';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import ProtectedButton from '@/components/ui/ProtectedButton';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import { TableCardFooterTemplateV2 } from '@/templates/Table/TableFooterTemplateV2';
import type { IProduct } from '@/interface/product.interface';
import useClientPagination from '../../hooks/useClientPagination';

const COLUMN_COUNT = 4;

interface AvailableProductsTableProps {
	products: IProduct[];
	loading: boolean;
	branchId: number | null;
	onAttachProduct: (product: IProduct) => void;
}

/** Productos de la sucursal que todavía no están en la bodega, para asociarlos. */
const AvailableProductsTable: React.FC<AvailableProductsTableProps> = ({
	products,
	loading,
	branchId,
	onAttachProduct,
}) => {
	const [search, setSearch] = useState('');
	const rows = useMemo(() => {
		const needle = search.trim().toLowerCase();
		if (!needle) return products;
		return products.filter(
			(product) =>
				product.name.toLowerCase().includes(needle) ||
				product.sku.toLowerCase().includes(needle),
		);
	}, [products, search]);
	const { pageRows, table, resetPage } = useClientPagination(rows);

	return (
		<Card>
			<CardHeader className='flex-wrap gap-3'>
				<div>
					<CardTitle className='text-lg'>Productos disponibles</CardTitle>
					<p className='text-sm text-zinc-500'>
						Productos de la sucursal que aún no están en esta bodega
					</p>
				</div>
				<div className='w-full sm:w-72'>
					<Input
						id='bodega-disponibles-busqueda'
						name='q'
						aria-label='Buscar productos disponibles'
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
				<Table aria-label='Productos disponibles para asociar' className='min-w-[720px]'>
					<THead>
						<Tr>
							<Th scope='col' className='text-left'>
								Producto
							</Th>
							<Th scope='col' className='text-left'>
								Marca
							</Th>
							<Th scope='col' className='text-right'>
								Stock sucursal
							</Th>
							<Th scope='col' className='text-center'>
								Acción
							</Th>
						</Tr>
					</THead>
					<TBody>
						{loading &&
							Array.from({ length: 3 }, (_, rowIndex) => (
								<Tr key={`available-skeleton-${rowIndex}`}>
									{Array.from({ length: COLUMN_COUNT }, (_cell, cellIndex) => (
										<Td key={`available-skeleton-${rowIndex}-${cellIndex}`}>
											<div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
										</Td>
									))}
								</Tr>
							))}
						{!loading && rows.length === 0 && (
							<Tr>
								<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
									<p className='font-medium text-zinc-700 dark:text-zinc-200'>
										{search.trim()
											? 'Sin resultados para la búsqueda'
											: 'No quedan productos por asociar'}
									</p>
									<p className='mt-1 text-sm text-zinc-500'>
										{search.trim()
											? 'Prueba ajustando o limpiando la búsqueda.'
											: 'Todos los productos cargados de la sucursal ya están en esta bodega.'}
									</p>
								</Td>
							</Tr>
						)}
						{!loading &&
							pageRows.map((product) => (
								<Tr key={product.id}>
									<Td>
										<p className='font-medium'>{product.name}</p>
										<p className='font-mono text-xs text-zinc-500'>
											{product.sku}
										</p>
									</Td>
									<Td className='text-sm text-zinc-600 dark:text-zinc-300'>
										{product.brand?.name ?? (
											<span className='text-zinc-400'>Sin marca</span>
										)}
									</Td>
									<Td className='text-right tabular-nums'>
										{(product.stock ?? 0).toLocaleString('es-CL')}
									</Td>
									<Td>
										<div className='flex justify-center'>
											<ProtectedButton
												permission='attach-warehouse-product'
												branchId={branchId}
												scope='access'
												size='sm'
												variant='outline'
												color='blue'
												icon='HeroPlus'
												aria-label={`Asociar ${product.name}`}
												onClick={() => onAttachProduct(product)}>
												Asociar
											</ProtectedButton>
										</div>
									</Td>
								</Tr>
							))}
					</TBody>
				</Table>
			</CardBody>
			{!loading && rows.length > 0 && <TableCardFooterTemplateV2 table={table} />}
		</Card>
	);
};

export default AvailableProductsTable;
