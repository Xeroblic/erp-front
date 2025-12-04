import { HiOutlineEye, HiOutlineChartBarSquare } from 'react-icons/hi2';
import Table, { TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Progress from '@/components/ui/Progress';
import { MockStockLevel } from '../../data/mockData';
import { TColors } from '@/types/colors.type';

interface StockLevelsTableProps {
	stockLevels: MockStockLevel[];
	loading?: boolean;
	onViewLevel?: (level: MockStockLevel) => void;
	onUpdateLevel?: (level: MockStockLevel) => void;
}

export const StockLevelsTable: React.FC<StockLevelsTableProps> = ({
	stockLevels,
	loading = false,
	onViewLevel,
	onUpdateLevel,
}) => {
	const getStatusColor = (status: string): TColors => {
		switch (status) {
			case 'OPTIMAL':
				return 'emerald';
			case 'LOW':
				return 'amber';
			case 'CRITICAL':
				return 'red';
			case 'OVERSTOCK':
				return 'blue';
			default:
				return 'gray';
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case 'OPTIMAL':
				return 'Óptimo';
			case 'LOW':
				return 'Bajo';
			case 'CRITICAL':
				return 'Crítico';
			case 'OVERSTOCK':
				return 'Exceso';
			default:
				return status;
		}
	};

	const calculateStockPercentage = (current: number, min: number, max: number) => {
		if (max === 0) return 0;
		return Math.min(100, Math.max(0, ((current - min) / (max - min)) * 100));
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
							<Th>Stock Mínimo</Th>
							<Th>Stock Máximo</Th>
							<Th>Punto de Reorden</Th>
							<Th>Nivel</Th>
							<Th>Estado</Th>
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
									<div className='h-4 w-12 rounded bg-gray-200 dark:bg-gray-700' />
								</Td>
								<Td>
									<div className='h-4 w-20 rounded bg-gray-200 dark:bg-gray-700' />
								</Td>
								<Td>
									<div className='h-4 w-16 rounded bg-gray-200 dark:bg-gray-700' />
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

	if (stockLevels.length === 0) {
		return (
			<div className='py-8 text-center text-gray-500 dark:text-gray-400'>
				<HiOutlineChartBarSquare className='mx-auto mb-4 h-12 w-12 text-gray-300' />
				<p>No hay niveles de stock para mostrar</p>
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
					<Th>Stock Mínimo</Th>
					<Th>Stock Máximo</Th>
					<Th>Punto de Reorden</Th>
					<Th>Nivel</Th>
					<Th>Estado</Th>
					<Th>Acciones</Th>
				</Tr>
			</THead>
			<TBody>
				{stockLevels.map((level) => (
					<Tr key={`${level.product_id}-${level.warehouse_id}`}>
						<Td>
							<div className='text-sm'>
								<div className='font-medium text-gray-900 dark:text-gray-100'>
									{level.product.name}
								</div>
								<div className='text-gray-500 dark:text-gray-400'>
									{level.product.sku}
								</div>
							</div>
						</Td>
						<Td>
							<div className='text-sm text-gray-900 dark:text-gray-100'>
								{level.warehouse.name}
							</div>
						</Td>
						<Td>
							<div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
								{level.current_stock}
							</div>
						</Td>
						<Td>
							<div className='text-sm text-red-600 dark:text-red-400'>
								{level.min_stock}
							</div>
						</Td>
						<Td>
							<div className='text-sm text-green-600 dark:text-green-400'>
								{level.max_stock}
							</div>
						</Td>
						<Td>
							<div className='text-sm text-blue-600 dark:text-blue-400'>
								{level.reorder_point}
							</div>
						</Td>
						<Td>
							<div className='w-20'>
								<Progress
									value={calculateStockPercentage(
										level.current_stock,
										level.min_stock,
										level.max_stock,
									)}
									color={getStatusColor(level.status)}
									className='mb-1 h-2'
								/>
								<div className='text-center text-xs text-gray-500 dark:text-gray-400'>
									{Math.round(
										calculateStockPercentage(
											level.current_stock,
											level.min_stock,
											level.max_stock,
										),
									)}
									%
								</div>
							</div>
						</Td>
						<Td>
							<Badge color={getStatusColor(level.status)} className='text-xs'>
								{getStatusText(level.status)}
							</Badge>
						</Td>
						<Td>
							<div className='flex items-center space-x-1'>
								<Button
									color='blue'
									size='xs'
									icon='HiOutlineEye'
									onClick={() => onViewLevel?.(level)}
									title='Ver detalles'
								/>
								<Button
									color='violet'
									size='xs'
									icon='HiOutlineChartBarSquare'
									onClick={() => onUpdateLevel?.(level)}
									title='Actualizar nivel'
								/>
							</div>
						</Td>
					</Tr>
				))}
			</TBody>
		</Table>
	);
};
