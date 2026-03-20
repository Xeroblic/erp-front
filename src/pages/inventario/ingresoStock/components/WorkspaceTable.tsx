import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import DataTable from '@/components/ui/DataTable/DataTable';
import type { IWorkItem } from '../types';

// 1. Creamos un micro-componente para la celda que maneja su propio foco y estado
const QuantityInputCell = ({
	initialQuantity,
	productId,
	onCommit,
}: {
	initialQuantity: string;
	productId: number;
	onCommit: (productId: number, newQuantity: string) => void;
}) => {
	const [draft, setDraft] = useState(initialQuantity);

	// Sincroniza si el valor inicial cambia desde afuera
	useEffect(() => {
		setDraft(initialQuantity);
	}, [initialQuantity]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const numericOnly = e.target.value.replace(/[^0-9]/g, '');
		setDraft(numericOnly);
	};

	const handleCommit = () => {
		const parsed = Number(draft);
		const safe = Number.isFinite(parsed) && parsed > 0 ? String(parsed) : '1';
		setDraft(safe); // Actualizamos la UI local con el valor seguro
		onCommit(productId, safe); // Avisamos al padre
	};

	return (
		<div className='w-28'>
			<Input
				name={`qty-${productId}`}
				type='text'
				inputMode='numeric'
				value={draft}
				onChange={handleChange}
				onBlur={handleCommit}
				onKeyDown={(e) => {
					if (e.key === '-' || e.key === 'e' || e.key === 'E') {
						e.preventDefault();
					}
					if (e.key === 'Enter') {
						e.currentTarget.blur(); // Esto disparará el onBlur automáticamente
					}
				}}
			/>
		</div>
	);
};

// ------------------------------------------------------------------

interface WorkspaceTableProps {
	items: IWorkItem[];
	getSignedQuantity: (quantity: string) => number;
	onQuantityChange: (productId: number, quantity: string) => void;
	onRemoveItem: (productId: number) => void;
}

export const WorkspaceTable = ({
	items,
	getSignedQuantity,
	onQuantityChange,
	onRemoveItem,
}: WorkspaceTableProps) => {

	// 2. Las columnas ahora son estables y no dependen de borradores locales
	const columns = useMemo<ColumnDef<IWorkItem, unknown>[]>(
		() => [
			{
				id: 'product',
				header: 'Producto',
				cell: ({ row }) => (
					<div>
						<p className='font-semibold'>{row.original.name}</p>
						<p className='text-xs text-zinc-500'>SKU: {row.original.sku}</p>
					</div>
				),
			},
			{
				id: 'stock',
				header: 'Stock',
				cell: ({ row }) => row.original.stock,
			},
			{
				id: 'price',
				header: 'Precio',
				cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
			},
			{
				id: 'quantity',
				header: 'Cantidad',
				cell: ({ row }) => (
					<QuantityInputCell
						initialQuantity={row.original.quantity}
						productId={row.original.productId}
						onCommit={onQuantityChange}
					/>
				),
			},
			{
				id: 'adjustment',
				header: 'Ajuste',
				cell: ({ row }) => {
					// Calculamos el ajuste directamente con el valor real del item
					const signedQuantity = getSignedQuantity(row.original.quantity);
					return (
						<Badge color='blue' variant='solid'>
							{signedQuantity > 0 ? `+${signedQuantity}` : signedQuantity}
						</Badge>
					);
				},
			},
			{
				id: 'action',
				header: 'Accion',
				cell: ({ row }) => (
					<Button
						color='red'
						variant='outline'
						size='sm'
						onClick={() => onRemoveItem(row.original.productId)}>
						Quitar
					</Button>
				),
			},
		],
		[getSignedQuantity, onQuantityChange, onRemoveItem], // Dependencias limpias
	);

	return (
		<DataTable<IWorkItem>
			columns={columns}
			data={items}
			enableSearch={false}
			pageSize={10}
			emptyMessage='Agrega productos desde la tabla principal para iniciar el ajuste.'
			className='max-h-[25vh]'
		/>
	);
};