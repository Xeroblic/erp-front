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
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Container from '@/components/layouts/Container/Container';

interface BatchTabsProps {
	batch: IBatch;
	onItemClick?: (itemId: number) => void;
}

type TabKey = EquipmentType | 'all';

interface TabConfig {
    type: TabKey;
    label: string;
    icon: string;
}

const TABS: TabConfig[] = [
    { type: 'all', label: 'Todos', icon: 'HeroSquares2X2' },
    { type: 'notebook', label: 'Notebooks', icon: 'HeroComputerDesktop' },
    { type: 'desktop', label: 'Desktops', icon: 'HeroServerStack' },
    { type: 'aio', label: 'All-in-One', icon: 'HeroDeviceTablet' },
    { type: 'docking', label: 'Dockings', icon: 'HeroCpuChip' },
    { type: 'monitor', label: 'Monitores', icon: 'HeroTv' },
];

const REVIEW_STATUS_OPTIONS: TSelectOption[] = [
	{ value: 'all', label: 'Todos los estados' },
	{ value: 'pending', label: 'Pendiente' },
	{ value: 'in_progress', label: 'En revisión' },
	{ value: 'reviewed', label: 'Revisado' },
	{ value: 'approved', label: 'Aprobado' },
];

const COMMERCIAL_STATUS_OPTIONS: TSelectOption[] = [
	{ value: 'all', label: 'Estado comercial' },
	{ value: 'in_stock', label: 'En bodega' },
	{ value: 'reserved', label: 'Reservado' },
	{ value: 'sold', label: 'Vendido' },
	{ value: 'rma', label: 'RMA' },
	{ value: 'scrapped', label: 'Descartado' },
];

const GRADE_OPTIONS: TSelectOption[] = [
	{ value: 'all', label: 'Todos los grados' },
	{ value: 'A', label: 'Grado A' },
	{ value: 'B', label: 'Grado B' },
	{ value: 'C', label: 'Grado C' },
	{ value: 'M', label: 'Grado M' },
];

const BatchTabs: React.FC<BatchTabsProps> = ({ batch, onItemClick }) => {
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();
	const items = useAppSelector(selectItems);
	const itemsMeta = useAppSelector(selectItemsMeta);
	const loadingItems = useAppSelector(selectItemsLoading);

    const [activeTab, setActiveTab] = useState<TabKey>('all');
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
            page: currentPage,
            per_page: limitPerPage,
        };

        if (activeTab !== 'all') {
            params.equipment_type = activeTab as EquipmentType;
        }

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
    const handleTabChange = (type: TabKey) => {
        setActiveTab(type);
        setCurrentPage(1);
    };

	// Obtener conteo del tab
    const getTabCount = (type: TabKey): number => {
        if (type === 'all') {
            const byType = batch.items_summary?.by_equipment_type || {} as Record<string, number>;
            return (
                (byType['notebook'] || 0) +
                (byType['desktop'] || 0) +
                (byType['aio'] || 0) +
                (byType['docking'] || 0) +
                (byType['monitor'] || 0)
            );
        }
        return batch.items_summary?.by_equipment_type?.[type] || 0;
    };

	return (
		<Container className='space-y-6'>
			{/* Tabs */}
			<Card>
				<CardBody>
					<div className='flex overflow-x-auto border-b dark:border-gray-700'>
						{TABS.map((tab) => {
							const count = getTabCount(tab.type);
							const isActive = activeTab === tab.type;

							return (
								<Button
									key={tab.type}
									onClick={() => handleTabChange(tab.type)}
									className={`flex items-center gap-2 border-b-2 px-4 py-4 transition-colors ${
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
								</Button>
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
						<SelectReact
							name='review_status_filter'
							placeholder='Todos los estados'
							options={REVIEW_STATUS_OPTIONS}
							value={
								REVIEW_STATUS_OPTIONS.find(
									(option) => option.value === reviewStatusFilter,
								) ?? REVIEW_STATUS_OPTIONS[0]
							}
							onChange={(option) => {
								const selectedOption = option as TSelectOption | null;
								setReviewStatusFilter(selectedOption?.value ?? 'all');
								setCurrentPage(1);
							}}
							className='min-w-[200px]'
						/>

						{/* Estado Comercial */}
						<SelectReact
							name='commercial_status_filter'
							placeholder='Estado comercial'
							options={COMMERCIAL_STATUS_OPTIONS}
							value={
								COMMERCIAL_STATUS_OPTIONS.find(
									(option) => option.value === commercialStatusFilter,
								) ?? COMMERCIAL_STATUS_OPTIONS[0]
							}
							onChange={(option) => {
								const selectedOption = option as TSelectOption | null;
								setCommercialStatusFilter(selectedOption?.value ?? 'all');
								setCurrentPage(1);
							}}
							className='min-w-[180px]'
						/>

						{/* Grado */}
						<SelectReact
							name='grade_filter'
							placeholder='Todos los grados'
							options={GRADE_OPTIONS}
							value={
								GRADE_OPTIONS.find((option) => option.value === gradeFilter) ??
								GRADE_OPTIONS[0]
							}
							onChange={(option) => {
								const selectedOption = option as TSelectOption | null;
								setGradeFilter(selectedOption?.value ?? 'all');
								setCurrentPage(1);
							}}
							className='min-w-[180px]'
						/>

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
				</CardBody>
			</Card>
		</Container>
	);
};

export default BatchTabs;
