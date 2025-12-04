import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Table, { TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { TransferItem } from '../types';

interface ItemsTableCardProps {
	items: TransferItem[];
	totalUnits: number;
	onRemove: (productId: number) => void;
	actionSlot: React.ReactNode;
}

const ItemsTableCard: React.FC<ItemsTableCardProps> = ({
	items,
	totalUnits,
	onRemove,
	actionSlot,
}) => (
	<Card className='mt-6'>
		<CardHeader>
			<CardTitle className='flex items-center justify-between'>
				<div className='flex items-center gap-3'>
					<span>
						<svg
							className='h-6 w-6'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth='2'
								d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
							/>
						</svg>
					</span>
					Productos a Transferir
				</div>
				<div className='flex items-center gap-3'>
					<Badge color='sky' variant='outline'>
						{items.length} producto{items.length !== 1 ? 's' : ''}
					</Badge>
					<Badge color='emerald' variant='outline'>
						{totalUnits} unidades
					</Badge>
				</div>
			</CardTitle>
		</CardHeader>
		<CardBody>
			<div className='overflow-x-auto'>
				<Table>
					<THead>
						<Tr>
							<Th>Producto</Th>
							<Th>SKU</Th>
							<Th>Cantidad</Th>
							<Th>Stock Disponible</Th>
							<Th>Acciones</Th>
						</Tr>
					</THead>
					<TBody>
						{items.map((item) => (
							<Tr key={item.product_id}>
								<Td>
									<div className='font-medium text-gray-900 dark:text-gray-100'>
										{item.product_name}
									</div>
								</Td>
								<Td>
									<Badge color='sky' variant='outline'>
										{item.product_sku}
									</Badge>
								</Td>
								<Td>
									<span className='text-lg font-semibold text-emerald-600'>
										{item.quantity}
									</span>
								</Td>
								<Td>
									<span className='text-gray-500 dark:text-gray-400'>
										{item.available_stock}
									</span>
								</Td>
								<Td>
									<Button
										size='xs'
										color='red'
										variant='outline'
										icon='HeroTrash'
										onClick={() => onRemove(item.product_id)}>
										Remover
									</Button>
								</Td>
							</Tr>
						))}
					</TBody>
				</Table>
			</div>
			<div className='mt-6 flex items-center justify-end gap-3'>{actionSlot}</div>
		</CardBody>
	</Card>
);

export default ItemsTableCard;
