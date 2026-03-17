/**
 * Formulario para crear producto expres (rápido)
 * Responsabilidad única: capturar datos mínimos de producto (Single Responsibility)
 */
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { useState } from 'react';

interface QuickProductFormProps {
	/**
	 * Branch ID actual (auto-populated desde el primer item del workspace)
	 */
	branchId: string;

	/**
	 * Indica si se está creando
	 */
	isCreating: boolean;

	/**
	 * Callback cuando se envía el formulario
	 */
	onSubmit: (data: { name: string; sku: string; price: string }) => void;

	/**
	 * Callback para limpiar el formulario (opcional)
	 */
	onClear?: () => void;
}

/**
 * Componente puro: solo renderiza, el estado está en el contenedor
 */
export const QuickProductForm = ({
	branchId,
	isCreating,
	onSubmit,
	onClear,
}: QuickProductFormProps) => {
	const [name, setName] = useState('');
	const [sku, setSku] = useState('');
	const [price, setPrice] = useState('0');

	const handleSubmit = () => {
		onSubmit({ name, sku, price });
		if (onClear) {
			setName('');
			setSku('');
			setPrice('0');
		}
	};

	return (
		<Card className='border-l-4 border-l-blue-500'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<span>⚡ Crear Producto Expres</span>
					<Badge color='blue' variant='solid'>
						Nuevo
					</Badge>
				</CardTitle>
				<p className='text-xs text-zinc-500'>
					Crea un producto rápidamente sin pasar por el catálogo principal.
				</p>
			</CardHeader>
			<CardBody className='space-y-3'>
				<Input
					name='quick_name'
					placeholder='Nombre del producto'
					value={name}
					onChange={(e) => setName(e.target.value)}
					disabled={isCreating}
				/>

				<Input
					name='quick_sku'
					placeholder='SKU (código único)'
					value={sku}
					onChange={(e) => setSku(e.target.value)}
					disabled={isCreating}
				/>

				<Input
					name='quick_price'
					type='number'
					min={0}
					step='0.01'
					placeholder='Precio'
					value={price}
					onChange={(e) => setPrice(e.target.value)}
					disabled={isCreating}
				/>

				<div className='flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800'>
					<span className='text-xs text-zinc-600 dark:text-zinc-400'>
						Sucursal: <strong>{branchId || '-'}</strong>
					</span>
					<span className='text-xs text-zinc-600 dark:text-zinc-400'>
						Serial: <strong>No</strong>
					</span>
				</div>

				<div className='flex gap-2'>
					<Button
						color='blue'
						className='flex-1'
						isDisable={isCreating || !name.trim()}
						onClick={handleSubmit}>
						{isCreating ? 'Creando...' : '+ Crear & Agregar'}
					</Button>
				</div>
			</CardBody>
		</Card>
	);
};
