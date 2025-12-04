import {
	HiOutlineEye,
	HiOutlineAdjustmentsHorizontal,
	HiOutlineArrowsRightLeft,
} from 'react-icons/hi2';
import Table, { TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { MockInventoryItem } from '../../data/mockData';
import { TColors } from '@/types/colors.type';

interface ItemsTableProps {
	items: MockInventoryItem[];
	loading?: boolean;
	onViewItem?: (item: MockInventoryItem) => void;
	onAdjustStock?: (item: MockInventoryItem) => void;
	onTransferStock?: (item: MockInventoryItem) => void;
}

export const ItemsTable: React.FC<ItemsTableProps> = ({
	items,
	loading = false,
	onViewItem,
	onAdjustStock,
	onTransferStock,
}) => {
	const getStockStatusColor = (status: string): TColors => {
		switch (status) {
			case 'IN_STOCK':
				return 'emerald';
			case 'LOW_STOCK':
				return 'amber';
			case 'OUT_OF_STOCK':
				return 'red';
			default:
				return 'gray';
		}
	};

	const getStockStatusText = (status: string) => {
		switch (status) {
			case 'IN_STOCK':
				return 'Disponible';
			case 'LOW_STOCK':
				return 'Stock Bajo';
			case 'OUT_OF_STOCK':
				return 'Sin Stock';
			default:
				return status;
		}
	};

	if (loading) {
		return (
			<div className='animate-pulse'>
				<Table>
					<THead>
						<Tr>
							<Th>Producto</Th>
							<Th>Almacén</Th>
							<Th>Stock Actual</Th>
							<Th>Stock Disponible</Th>
							<Th>Stock Reservado</Th>
							<Th>Estado</Th>
							<Th>Última Actualización</Th>
							<Th>Acciones</Th>
						</Tr>
					</THead>
					<TBody>
						{Array.from({ length: 5 }).map((_, index) => (
							<Tr key={index}>
								<Td>
									<div className='h-4 w-32 rounded bg-gray-200 dark:bg-gray-700' />
								</Td>
								<Td>
									<div className='h-4 w-20 rounded bg-gray-200 dark:bg-gray-700' />
								</Td>
								<Td>
									<div className='h-4 w-12 rounded bg-gray-200 dark:bg-gray-700' />
								</Td>
								<Td>
									<div className='h-4 w-12 rounded bg-gray-200 dark:bg-gray-700' />
								</Td>
								<Td>
									<div className='h-4 w-12 rounded bg-gray-200 dark:bg-gray-700' />
								</Td>
								<Td>
									<div className='h-4 w-16 rounded bg-gray-200 dark:bg-gray-700' />
								</Td>
								<Td>
									<div className='h-4 w-24 rounded bg-gray-200 dark:bg-gray-700' />
								</Td>
								<Td>
									<div className='h-4 w-20 rounded bg-gray-200 dark:bg-gray-700' />
								</Td>
							</Tr>
						))}
					</TBody>
				</Table>
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<div className='py-8 text-center text-gray-500 dark:text-gray-400'>
				<HiOutlineArrowsRightLeft className='mx-auto mb-4 h-12 w-12 text-gray-300' />
				<p>No hay items para mostrar</p>
			</div>
		);
	}

	return (
		<Table>
			<THead>
				<Tr>
					<Th>Producto</Th>
					<Th>Almacén</Th>
					<Th>Stock Actual</Th>
					<Th>Stock Disponible</Th>
					<Th>Stock Reservado</Th>
					<Th>Estado</Th>
					<Th>Última Actualización</Th>
					<Th>Acciones</Th>
				</Tr>
			</THead>
			<TBody>
				{items.map((item) => (
					<Tr key={`${item.product_id}-${item.warehouse_id}`}>
						<Td>
							<div className='text-sm'>
								<div className='font-medium text-gray-900 dark:text-gray-100'>
									{item.product.name}
								</div>
								<div className='text-gray-500 dark:text-gray-400'>
									{item.product.sku}
								</div>
							</div>
						</Td>
						<Td>
							<div className='text-sm text-gray-900 dark:text-gray-100'>
								{item.warehouse.name}
							</div>
						</Td>
						<Td>
							<div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
								{item.current_stock}
							</div>
						</Td>
						<Td>
							<div className='text-sm font-medium text-green-600 dark:text-green-400'>
								{item.available_stock}
							</div>
						</Td>
						<Td>
							<div className='text-sm font-medium text-blue-600 dark:text-blue-400'>
								{item.reserved_stock}
							</div>
						</Td>
						<Td>
							<Badge color={getStockStatusColor(item.status)} className='text-xs'>
								{getStockStatusText(item.status)}
							</Badge>
						</Td>
						<Td>
							<div className='text-sm text-gray-600 dark:text-gray-400'>
								{new Date(item.last_updated).toLocaleDateString('es-ES')}
							</div>
						</Td>
						<Td>
							<div className='flex items-center space-x-1'>
								<Button
									color='blue'
									size='xs'
									icon='HiOutlineEye'
									onClick={() => onViewItem?.(item)}
									title='Ver detalles'
								/>
								<Button
									color='violet'
									size='xs'
									icon='HiOutlineAdjustmentsHorizontal'
									onClick={() => onAdjustStock?.(item)}
									title='Ajustar stock'
								/>
								<Button
									color='amber'
									size='xs'
									icon='HiOutlineArrowsRightLeft'
									onClick={() => onTransferStock?.(item)}
									title='Transferir'
								/>
							</div>
						</Td>
					</Tr>
				))}
			</TBody>
		</Table>
	);
};
