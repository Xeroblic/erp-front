import {
	HiOutlineEye,
	HiOutlineArrowsRightLeft,
	HiOutlineAdjustmentsHorizontal,
} from 'react-icons/hi2';
import Table, { TBody, Td, TFoot, THead, Th, Tr } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { MockInventoryMovement } from '../../data/mockData';
import { formatDate } from '@/utils/format.utils';
import { TColors } from '@/types/colors.type';

interface MovementsTableProps {
	movements: MockInventoryMovement[];
	loading?: boolean;
	onViewMovement?: (movement: MockInventoryMovement) => void;
}

export const MovementsTable: React.FC<MovementsTableProps> = ({
	movements,
	loading = false,
	onViewMovement,
}) => {
	const getMovementTypeColor = (type: string): TColors => {
		switch (type) {
			case 'ENTRY':
				return 'emerald';
			case 'EXIT':
				return 'red';
			case 'TRANSFER':
				return 'amber';
			case 'ADJUSTMENT':
				return 'violet';
			default:
				return 'gray';
		}
	};

	const getMovementTypeText = (type: string) => {
		switch (type) {
			case 'ENTRY':
				return 'Entrada';
			case 'EXIT':
				return 'Salida';
			case 'TRANSFER':
				return 'Transferencia';
			case 'ADJUSTMENT':
				return 'Ajuste';
			default:
				return type;
		}
	};

	const getMovementTypeIcon = (type: string) => {
		switch (type) {
			case 'ENTRY':
				return <HiOutlineArrowsRightLeft className='h-4 w-4 rotate-90' />;
			case 'EXIT':
				return <HiOutlineArrowsRightLeft className='h-4 w-4 -rotate-90' />;
			case 'TRANSFER':
				return <HiOutlineArrowsRightLeft className='h-4 w-4' />;
			case 'ADJUSTMENT':
				return <HiOutlineAdjustmentsHorizontal className='h-4 w-4' />;
			default:
				return null;
		}
	};

	if (loading) {
		return (
			<div className='animate-pulse'>
				<Table>
					<THead>
						<Tr>
							<Th>Fecha</Th>
							<Th>Tipo</Th>
							<Th>Producto</Th>
							<Th>Almacén</Th>
							<Th>Cantidad</Th>
							<Th>Referencia</Th>
							<Th>Usuario</Th>
							<Th>Acciones</Th>
						</Tr>
					</THead>
					<TBody>
						{Array.from({ length: 5 }).map((_, index) => (
							<Tr key={index}>
								<Td>
									<div className='h-4 w-24 rounded bg-gray-200 dark:bg-gray-700' />
								</Td>
								<Td>
									<div className='h-4 w-16 rounded bg-gray-200 dark:bg-gray-700' />
								</Td>
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
									<div className='h-4 w-20 rounded bg-gray-200 dark:bg-gray-700' />
								</Td>
								<Td>
									<div className='h-4 w-20 rounded bg-gray-200 dark:bg-gray-700' />
								</Td>
								<Td>
									<div className='h-4 w-16 rounded bg-gray-200 dark:bg-gray-700' />
								</Td>
							</Tr>
						))}
					</TBody>
				</Table>
			</div>
		);
	}

	if (movements.length === 0) {
		return (
			<div className='py-8 text-center text-gray-500 dark:text-gray-400'>
				<HiOutlineArrowsRightLeft className='mx-auto mb-4 h-12 w-12 text-gray-300' />
				<p>No hay movimientos para mostrar</p>
			</div>
		);
	}

	return (
		<Table>
			<THead>
				<Tr>
					<Th>Fecha</Th>
					<Th>Tipo</Th>
					<Th>Producto</Th>
					<Th>Almacén</Th>
					<Th>Cantidad</Th>
					<Th>Referencia</Th>
					<Th>Usuario</Th>
					<Th>Acciones</Th>
				</Tr>
			</THead>
			<TBody>
				{movements.map((movement) => (
					<Tr key={movement.id}>
						<Td>
							<div className='text-sm'>
								<div className='font-medium text-gray-900 dark:text-gray-100'>
									{formatDate(movement.movement_date)}
								</div>
								<div className='text-gray-500 dark:text-gray-400'>
									{formatDate(movement.movement_date, 'es-ES', {
										hour: '2-digit',
										minute: '2-digit',
									})}
								</div>
							</div>
						</Td>
						<Td>
							<Badge
								color={getMovementTypeColor(movement.movement_type)}
								className='flex items-center gap-1'>
								{getMovementTypeIcon(movement.movement_type)}
								{getMovementTypeText(movement.movement_type)}
							</Badge>
						</Td>
						<Td>
							<div className='text-sm'>
								<div className='font-medium text-gray-900 dark:text-gray-100'>
									{movement.product.name}
								</div>
								<div className='text-gray-500 dark:text-gray-400'>
									{movement.product.sku}
								</div>
							</div>
						</Td>
						<Td>
							<div className='text-sm text-gray-900 dark:text-gray-100'>
								{movement.warehouse.name}
							</div>
						</Td>
						<Td>
							<div
								className={`text-sm font-medium ${
									movement.quantity > 0
										? 'text-green-600 dark:text-green-400'
										: 'text-red-600 dark:text-red-400'
								}`}>
								{movement.quantity > 0 ? '+' : ''}
								{movement.quantity}
							</div>
						</Td>
						<Td>
							<div className='text-sm text-gray-900 dark:text-gray-100'>
								{movement.reference}
							</div>
						</Td>
						<Td>
							<div className='text-sm text-gray-600 dark:text-gray-400'>
								{movement.created_by}
							</div>
						</Td>
						<Td>
							<div className='flex items-center space-x-2'>
								<Button
									color='blue'
									size='xs'
									icon='HiOutlineEye'
									onClick={() => onViewMovement?.(movement)}
									title='Ver detalles'
								/>
							</div>
						</Td>
					</Tr>
				))}
			</TBody>
		</Table>
	);
};
