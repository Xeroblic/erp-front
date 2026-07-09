/**
 * Tabla de catálogo de productos para ingreso/egreso
 * Responsabilidad única: renderizar y permitir selección de productos (Single Responsibility)
 */
import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Tooltip from '@/components/ui/Tooltip';
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

	/**
	 * IDs de productos que ya están en la zona de trabajo. Se usan para
	 * deshabilitar su acción "Ingresar/Ajustar" y evitar duplicados.
	 */
	selectedProductIds?: ReadonlySet<number>;
}

const clpFormatter = new Intl.NumberFormat('es-CL', {
	style: 'currency',
	currency: 'CLP',
	maximumFractionDigits: 0,
});

const getStockTone = (stock: number): 'zinc' | 'amber' | 'emerald' => {
	if (stock <= 0) return 'zinc';
	if (stock <= 5) return 'amber';
	return 'emerald';
};

/**
 * Componente puro: solo renderiza, no maneja estado complejo
 * Usa DataTable para catálogo grande (búsqueda, paginación, sorting)
 */
export const ProductsTable = ({
	products,
	loading = false,
	onSelectProduct,
	selectedProductIds,
}: ProductsTableProps) => {
	const columns = useMemo<ColumnDef<IProduct>[]>(
		() => [
			{
				accessorKey: 'id',
				header: 'ID',
				cell: ({ row }) => (
					<span className='font-mono text-xs text-neutral-400'>#{row.original.id}</span>
				),
			},
			{
				id: 'name',
				// Incluye la SKU en el valor filtrable: el buscador global del DataTable
				// (includesString) sólo busca sobre los valores de las columnas, y la SKU
				// se renderiza dentro de esta celda. Sin esto, "buscar por SKU" no encuentra nada.
				accessorFn: (product) => `${product.name ?? ''} ${product.sku ?? ''}`,
				header: 'Nombre Producto',
				cell: ({ row }) => (
					<div className='flex items-center gap-3'>
						<div className='flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400'>
							<Icon icon='HeroCube' className='h-4 w-4' />
						</div>
						<div className='min-w-0'>
							<p className='truncate font-semibold text-neutral-900 dark:text-neutral-100'>
								{row.original.name}
							</p>
							<p className='mt-0.5 font-mono text-[11px] text-neutral-400'>
								SKU: {row.original.sku}
							</p>
						</div>
					</div>
				),
			},
			{
				accessorKey: 'stock',
				header: 'Stock Total',
				cell: ({ row }) => {
					const stock = Number(row.original.stock ?? 0);
					const tone = getStockTone(stock);
					return (
						<Tooltip
							text={
								stock <= 0
									? 'Sin stock disponible — el ajuste lo dejará en positivo.'
									: `${stock} unidades disponibles en stock.`
							}>
							<span className='inline-flex'>
								<Badge
									variant='outline'
									color={tone}
									className='inline-flex items-center gap-1'>
									<Icon icon='HeroArchiveBox' className='h-3 w-3' />
									<strong>{stock}</strong>
									<span className='font-normal opacity-70'>u.</span>
								</Badge>
							</span>
						</Tooltip>
					);
				},
			},
			{
				accessorKey: 'price',
				header: 'Precio',
				cell: ({ row }) => (
					<span className='font-semibold text-neutral-800 dark:text-neutral-100'>
						{clpFormatter.format(Number(row.original.price ?? 0))}
					</span>
				),
			},
			{
				id: 'actions',
				header: 'Acciones',
				enableSorting: false,
				cell: ({ row }) => {
					const alreadyAdded = selectedProductIds?.has(row.original.id) ?? false;
					return (
						<div className='flex items-center justify-end'>
							<Tooltip
								text={
									alreadyAdded
										? 'Este producto ya está en la zona de trabajo'
										: 'Ingresar o ajustar el stock de este producto'
								}>
								<Button
									color='emerald'
									variant='solid'
									size='sm'
									icon={alreadyAdded ? 'HeroCheck' : 'HeroArrowsRightLeft'}
									isDisable={alreadyAdded}
									onClick={() => onSelectProduct(row.original)}>
									{alreadyAdded ? 'En la zona' : 'Ingresar / Ajustar'}
								</Button>
							</Tooltip>
						</div>
					);
				},
			},
		],
		[onSelectProduct, selectedProductIds],
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
