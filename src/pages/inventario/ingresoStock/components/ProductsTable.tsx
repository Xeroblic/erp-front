/**
 * Tabla de catálogo de productos para ingreso/egreso
 * Responsabilidad única: renderizar y permitir selección de productos (Single Responsibility)
 */
import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import type { IProduct } from '@/interface/product.interface';

interface ProductsTableProps {
	/**
	 * Productos a mostrar (ya filtrados de serializados)
	 */
	products: IProduct[];

	/**
	 * Indicador de carga
	 */
	loading?: boolean;

	/**
	 * Callback cuando usuario hace click en "Ingresar/Ajustar"
	 */
	onSelectProduct: (product: IProduct) => void;
}

/**
 * Componente puro: solo renderiza, no maneja estado complejo
 * Usa DataTable para catálogo grande (búsqueda, paginación, sorting)
 */
export const ProductsTable = ({
	products,
	loading = false,
	onSelectProduct,
}: ProductsTableProps) => {
	const columns = useMemo<ColumnDef<IProduct>[]>(
		() => [
			{
				accessorKey: 'id',
				header: 'ID',
				cell: ({ row }) => <span className='font-mono text-xs'>{row.original.id}</span>,
			},
			{
				accessorKey: 'name',
				header: 'Nombre Producto',
				cell: ({ row }) => (
					<div>
						<p className='font-semibold'>{row.original.name}</p>
						<p className='text-xs text-zinc-500'>SKU: {row.original.sku}</p>
					</div>
				),
			},
			{
				accessorKey: 'stock',
				header: 'Stock Actual',
				cell: ({ row }) => (
					<Badge variant='outline' className='w-fit'>
						{Number(row.original.stock ?? 0)}
					</Badge>
				),
			},
			{
				accessorKey: 'price',
				header: 'Precio',
				cell: ({ row }) => <span>${Number(row.original.price ?? 0).toFixed(2)}</span>,
			},
			{
				id: 'actions',
				header: 'Acciones',
				enableSorting: false,
				cell: ({ row }) => (
					<div className='flex items-center justify-end'>
						<Button
							color='emerald'
							size='sm'
							onClick={() => onSelectProduct(row.original)}>
							Ingresar/Ajustar
						</Button>
					</div>
				),
			},
		],
		[onSelectProduct],
	);

	return (
		<DataTable
			columns={columns}
			data={products}
			loading={loading}
			emptyMessage='No hay productos disponibles (sin serialización).'
			searchPlaceholder='Buscar por nombre o SKU...'
		/>
	);
};
