/**
 * Tabla del workspace: muestra items agregados y permite editar/remover
 * Responsabilidad única: renderizar items y capturar cambios de cantidad (Single Responsibility)
 */
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Table, { TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import type { IWorkItem } from '../types';

interface WorkspaceTableProps {
	/**
	 * Items agregados al workspace
	 */
	items: IWorkItem[];

	/**
	 * Función para convertir quantity a número con signo
	 */
	getSignedQuantity: (quantity: string) => number;

	/**
	 * Callback cuando se edita la cantidad
	 */
	onQuantityChange: (productId: number, quantity: string) => void;

	/**
	 * Callback cuando se elimina un item
	 */
	onRemoveItem: (productId: number) => void;
}

/**
 * Usa Table simple (no DataTable) porque:
 * - No necesita búsqueda
 * - No necesita paginación (max ~50 items)
 * - Necesita edición inline y control fino
 * - Solo resumen temporal
 */
export const WorkspaceTable = ({
	items,
	getSignedQuantity,
	onQuantityChange,
	onRemoveItem,
}: WorkspaceTableProps) => {
	return (
		<div className='max-h-[25vh] overflow-auto'>
			<Table>
				<THead>
					<Tr>
						<Th>Producto</Th>
						<Th>Stock</Th>
						<Th>Precio</Th>
						<Th>Cantidad</Th>
						<Th>Cambio</Th>
						<Th>Acción</Th>
					</Tr>
				</THead>
				<TBody>
					{items.length ? (
						items.map((item) => {
							const signedQuantity = getSignedQuantity(item.quantity);
							return (
								<Tr key={item.productId}>
									<Td>
										<div>
											<p className='font-semibold'>{item.name}</p>
											<p className='text-xs text-zinc-500'>SKU: {item.sku}</p>
										</div>
									</Td>
									<Td>{item.stock}</Td>
									<Td>${item.price.toFixed(2)}</Td>
									<Td className='w-28'>
										<Input
											name={`qty-${item.productId}`}
											type='number'
											min={1}
											value={item.quantity}
											onChange={(e) =>
												onQuantityChange(item.productId, e.target.value)
											}
										/>
									</Td>
									<Td>
										<Badge
											color={signedQuantity < 0 ? 'red' : 'emerald'}
											variant='outline'>
											{signedQuantity > 0
												? `+${signedQuantity}`
												: signedQuantity}
										</Badge>
									</Td>
									<Td>
										<Button
											color='red'
											variant='outline'
											size='sm'
											onClick={() => onRemoveItem(item.productId)}>
											Quitar
										</Button>
									</Td>
								</Tr>
							);
						})
					) : (
						<Tr>
							<Td colSpan={6}>
								<p className='text-center text-sm text-zinc-500'>
									Agrega productos desde la tabla principal para iniciar el
									ajuste.
								</p>
							</Td>
						</Tr>
					)}
				</TBody>
			</Table>
		</div>
	);
};
