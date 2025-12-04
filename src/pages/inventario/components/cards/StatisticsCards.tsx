import {
	HiOutlineArchiveBox,
	HiOutlineBuildingOffice2,
	HiOutlineArrowTrendingUp,
	HiOutlineExclamationTriangle,
	HiOutlineXCircle,
	HiOutlineChartBarSquare,
} from 'react-icons/hi2';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { MockInventoryStatistics } from '../../data/mockData';
import { TColors } from '@/types/colors.type';

interface StatisticsCardsProps {
	statistics: MockInventoryStatistics;
	loading?: boolean;
}

interface StatCard {
	title: string;
	value: number | string;
	icon: React.ReactNode;
	color: TColors;
	description?: string;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({
	statistics,
	loading = false,
}) => {
	const cards: StatCard[] = [
		{
			title: 'Total Productos',
			value: statistics.totalProducts,
			icon: <HiOutlineArchiveBox className='h-6 w-6' />,
			color: 'blue',
			description: 'Productos registrados',
		},
		{
			title: 'Almacenes',
			value: statistics.totalWarehouses,
			icon: <HiOutlineBuildingOffice2 className='h-6 w-6' />,
			color: 'violet',
			description: 'Ubicaciones activas',
		},
		{
			title: 'Movimientos',
			value: statistics.totalMovements.toLocaleString(),
			icon: <HiOutlineChartBarSquare className='h-6 w-6' />,
			color: 'emerald',
			description: 'Total histórico',
		},
		{
			title: 'Stock Bajo',
			value: statistics.lowStockItems,
			icon: <HiOutlineExclamationTriangle className='h-6 w-6' />,
			color: 'amber',
			description: 'Productos en alerta',
		},
		{
			title: 'Sin Stock',
			value: statistics.outOfStockItems,
			icon: <HiOutlineXCircle className='h-6 w-6' />,
			color: 'red',
			description: 'Productos agotados',
		},
		{
			title: 'Recientes',
			value: statistics.recentMovements,
			icon: <HiOutlineArrowTrendingUp className='h-6 w-6' />,
			color: 'emerald',
			description: 'Últimos 7 días',
		},
	];

	if (loading) {
		return (
			<div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
				{Array.from({ length: 6 }).map((_, index) => (
					<Card key={index} className='animate-pulse'>
						<CardBody className='p-4'>
							<div className='flex items-center space-x-3'>
								<div className='h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700' />
								<div className='flex-1'>
									<div className='mb-2 h-4 w-20 rounded bg-gray-200 dark:bg-gray-700' />
									<div className='h-6 w-16 rounded bg-gray-200 dark:bg-gray-700' />
								</div>
							</div>
						</CardBody>
					</Card>
				))}
			</div>
		);
	}

	return (
		<div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
			{cards.map((card, index) => (
				<Card key={index} className='transition-shadow duration-200 hover:shadow-lg'>
					<CardBody className='p-4'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center space-x-3'>
								<div
									className={`rounded-lg p-2 ${
										card.color === 'blue'
											? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
											: card.color === 'violet'
												? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
												: card.color === 'emerald'
													? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
													: card.color === 'amber'
														? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
														: card.color === 'red'
															? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
															: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
									}`}>
									{card.icon}
								</div>
								<div>
									<p className='text-sm text-gray-600 dark:text-gray-400'>
										{card.title}
									</p>
									<p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
										{card.value}
									</p>
									{card.description && (
										<p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
											{card.description}
										</p>
									)}
								</div>
							</div>
						</div>
					</CardBody>
				</Card>
			))}
		</div>
	);
};
