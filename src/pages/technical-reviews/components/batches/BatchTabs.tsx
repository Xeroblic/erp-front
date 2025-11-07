/**
 * BatchTabs - Tabs para filtrar items por tipo de equipo
 * Incluye badges con conteo y tabla de items dentro de cada tab
 */
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchItems,
	selectItems,
	selectItemsMeta,
	selectItemsLoading,
} from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import ItemList from '../items/ItemList';
import type { IItem, IBatch, EquipmentType } from '@/interface/technicalReviews.interface';

interface BatchTabsProps {
	batch: IBatch;
	onItemClick?: (itemId: number) => void;
}

interface TabConfig {
	type: EquipmentType;
	label: string;
	icon: string;
}

const TABS: TabConfig[] = [
	{ type: 'notebook', label: 'Notebooks', icon: 'HeroComputerDesktop' },
	{ type: 'desktop', label: 'Desktops', icon: 'HeroServerStack' },
	{ type: 'aio', label: 'All-in-One', icon: 'HeroDeviceTablet' },
	{ type: 'docking', label: 'Dockings', icon: 'HeroCpuChip' },
	{ type: 'monitor', label: 'Monitores', icon: 'HeroTv' },
];

const BatchTabs: React.FC<BatchTabsProps> = ({ batch, onItemClick }) => {
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();
	const items = useAppSelector(selectItems);
	const itemsMeta = useAppSelector(selectItemsMeta);
	const loadingItems = useAppSelector(selectItemsLoading);

	const [activeTab, setActiveTab] = useState<EquipmentType>('notebook');
	const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('all');
	const [commercialStatusFilter, setCommercialStatusFilter] = useState<string>('all');
	const [gradeFilter, setGradeFilter] = useState<string>('all');
	const [currentPage, setCurrentPage] = useState(1);
	const [limitPerPage, setLimitPerPage] = useState(20);

	// Cargar items cuando cambia el tab o los filtros
	useEffect(() => {
		if (!branchId) return;

		const params: Record<string, string | number> = {
			batch_id: batch.id,
			equipment_type: activeTab,
			page: currentPage,
			per_page: limitPerPage,
		};

		if (reviewStatusFilter !== 'all') {
			params.review_status = reviewStatusFilter;
		}
		if (commercialStatusFilter !== 'all') {
			params.current_status = commercialStatusFilter;
		}
		if (gradeFilter !== 'all') {
			params.grade = gradeFilter;
		}

		dispatch(fetchItems({ branchId, params }));
	}, [
		dispatch,
		branchId,
		batch.id,
		activeTab,
		reviewStatusFilter,
		commercialStatusFilter,
		gradeFilter,
		currentPage,
		limitPerPage,
	]);

	// Resetear página cuando cambia el tab
	const handleTabChange = (type: EquipmentType) => {
		setActiveTab(type);
		setCurrentPage(1);
	};

	// Obtener conteo del tab
	const getTabCount = (type: EquipmentType): number => {
		return batch.items_summary?.by_equipment_type?.[type] || 0;
	};

	return (
		<div className='space-y-4'>
			{/* Tabs */}
			<Card>
				<CardBody className='p-0'>
					<div className='flex overflow-x-auto border-b dark:border-gray-700'>
						{TABS.map((tab) => {
							const count = getTabCount(tab.type);
							const isActive = activeTab === tab.type;

							return (
								<button
									key={tab.type}
									onClick={() => handleTabChange(tab.type)}
									className={`flex items-center gap-2 border-b-2 px-6 py-4 transition-colors ${
										isActive
											? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
											: 'border-transparent text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
									}`}>
									<Icon icon={tab.icon as any} className='h-5 w-5' />
									<span className='whitespace-nowrap font-medium'>
										{tab.label}
									</span>
									<span
										className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
											isActive
												? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
												: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
										}`}>
										{count}
									</span>
								</button>
							);
						})}
					</div>
				</CardBody>
			</Card>

			{/* Filtros */}
			<Card>
				<CardBody className='p-4'>
					<div className='flex flex-wrap items-center gap-4'>
						<div className='flex items-center gap-2'>
							<Icon icon='HeroFunnel' className='h-4 w-4 text-gray-500' />
							<span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
								Filtros:
							</span>
						</div>

						{/* Estado de Revisión */}
						<select
							value={reviewStatusFilter}
							onChange={(e) => {
								setReviewStatusFilter(e.target.value);
								setCurrentPage(1);
							}}
							className='rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800'>
							<option value='all'>Todos los estados</option>
							<option value='pending'>Pendiente</option>
							<option value='in_progress'>En revisión</option>
							<option value='reviewed'>Revisado</option>
							<option value='approved'>Aprobado</option>
						</select>

						{/* Estado Comercial */}
						<select
							value={commercialStatusFilter}
							onChange={(e) => {
								setCommercialStatusFilter(e.target.value);
								setCurrentPage(1);
							}}
							className='rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800'>
							<option value='all'>Estado comercial</option>
							<option value='in_stock'>En bodega</option>
							<option value='reserved'>Reservado</option>
							<option value='sold'>Vendido</option>
							<option value='rma'>RMA</option>
							<option value='scrapped'>Descartado</option>
						</select>

						{/* Grado */}
						<select
							value={gradeFilter}
							onChange={(e) => {
								setGradeFilter(e.target.value);
								setCurrentPage(1);
							}}
							className='rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800'>
							<option value='all'>Todos los grados</option>
							<option value='A'>Grado A</option>
							<option value='B'>Grado B</option>
							<option value='C'>Grado C</option>
							<option value='D'>Grado D</option>
							<option value='E'>Grado E</option>
						</select>

						{/* Limpiar Filtros */}
						{(reviewStatusFilter !== 'all' ||
							commercialStatusFilter !== 'all' ||
							gradeFilter !== 'all') && (
							<Button
								variant='outline'
								size='sm'
								onClick={() => {
									setReviewStatusFilter('all');
									setCommercialStatusFilter('all');
									setGradeFilter('all');
									setCurrentPage(1);
								}}>
								<Icon icon='HeroXMark' className='mr-1 h-4 w-4' />
								Limpiar
							</Button>
						)}
					</div>
				</CardBody>
			</Card>

			{/* Tabla de Items */}
			<ItemList
				items={items}
				meta={itemsMeta}
				loading={loadingItems}
				onPageChange={(page) => setCurrentPage(page)}
				onLimitChange={(limit) => {
					setLimitPerPage(limit);
					setCurrentPage(1);
				}}
				onItemClick={onItemClick}
			/>
		</div>
	);
};

export default BatchTabs;
