import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createColumnHelper, PaginationState, OnChangeFn } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchItems,
	selectItems,
	selectItemsMeta,
	selectItemsLoading,
} from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import DataTable from '@/components/ui/DataTable/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { EquipmentType, IItem } from '@/interface/technicalReviews.interface';
import ApiService from '@/services/ApiService';
import ExportExcelModal from '@/pages/refactor-technical-review/components/ExcelExport/ExportExcelModal';
import PrintLabel from '@/pages/refactor-technical-review/components/PrintLabel';
import Card, { CardBody } from '@/components/ui/Card';
import StatusBadge from '@/pages/refactor-technical-review/components/StatusBadge';
import {
	extractValue,
	resolveEquipmentTypeMeta,
} from '@/pages/refactor-technical-review/components/utils/utilsItems';
interface ListReviewProps {
	batchId: number;
	activeTab: EquipmentType | 'all';
}

const ListReview: React.FC<ListReviewProps> = ({ batchId, activeTab }) => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { branchId } = useCurrentBranch();

	const items = useAppSelector(selectItems);
	const meta = useAppSelector(selectItemsMeta);
	const loading = useAppSelector(selectItemsLoading);

	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});

	// Fetch items effect
	useEffect(() => {
		if (!branchId || !batchId) return;

		const params: any = {
			batch_id: batchId,
			page: pagination.pageIndex + 1,
			per_page: pagination.pageSize,
		};

		if (activeTab !== 'all') {
			params.equipment_type = activeTab;
		}

		dispatch(fetchItems({ branchId, params }));
	}, [dispatch, branchId, batchId, pagination.pageIndex, pagination.pageSize, activeTab]);

	const fetchAllForExport = useCallback(
		async (includeDetails = false): Promise<IItem[]> => {
			if (!branchId) return [];
			const params: any = {
				batch_id: batchId,
			};
			if (activeTab !== 'all') {
				params.equipment_type = activeTab;
			}
			const perPage = 1000;
			let page = 1;
			let lastPage = 1;
			const allItems: IItem[] = [];
			const baseUrl = (import.meta as any)?.env?.VITE_API_TECHNICAL_REVIEWS_PREFIX || '';
			const url = `${baseUrl}/branches/${branchId}/technical-reviews/items`.replace(
				/([^:])\/\/+/g,
				'$1/',
			);

			do {
				const response = await ApiService.fetchData<{ data?: any[]; meta?: any }>({
					url,
					method: 'get',
					params: {
						...params,
						page,
						per_page: perPage,
						with_details: includeDetails ? 1 : undefined,
						with_attributes: includeDetails ? 1 : undefined,
					},
				});
				const list = Array.isArray(response.data?.data)
					? response.data?.data
					: Array.isArray(response.data)
						? (response.data as any[])
						: [];
				allItems.push(...list);
				lastPage = response.data?.meta?.last_page ?? page;
				page += 1;
			} while (page <= lastPage);
			return allItems;
		},
		[branchId, batchId, activeTab],
	);

	// Print & Export State
	const [isExportModalOpen, setIsExportModalOpen] = useState(false);
	const [isPrintLabelOpen, setIsPrintLabelOpen] = useState(false);
	const [itemToPrint, setItemToPrint] = useState<IItem | null>(null);

	const handlePrint = (item: IItem) => {
		setItemToPrint(item);
		setIsPrintLabelOpen(true);
	};

	const handleView = (item: IItem) => {
		// Navigates to the refactored item review wizard (route now points to Revisiones component)
		navigate(`/technical-reviews/batches/${batchId}/items/${item.id}`);
	};

	// Columns
	const columnHelper = createColumnHelper<IItem>();
	const columns = useMemo(
		() => [
			columnHelper.display({
				id: 'serial_number',
				header: 'Serie',
				cell: (info) => (
					<div className='flex items-center gap-2'>
						<Icon icon='HeroQrCode' className='h-4 w-4 text-gray-400' />
						<span className='font-mono text-sm font-medium text-gray-900 dark:text-gray-100'>
							{info.row.original.serial_number}
						</span>
					</div>
				),
			}),
			columnHelper.display({
				id: 'equipment_type',
				header: 'Tipo',
				cell: (info) => {
					const { label, icon } = resolveEquipmentTypeMeta(
						info.row.original.equipment_type,
					);
					return (
						<Badge
							variant='outline'
							className='gap-2 rounded-full border-blue-200 bg-blue-50 px-2 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300'>
							<Icon icon={icon as any} className='h-3 w-3' />
							{label}
						</Badge>
					);
				},
			}),
			columnHelper.display({
				id: 'review_status',
				header: 'Estado Revisión',
				cell: (info) => (
					<StatusBadge type='review' status={info.row.original.review_status} />
				),
			}),
			columnHelper.display({
				id: 'current_status',
				header: 'Estado Comercial',
				cell: (info) => (
					<StatusBadge type='commercial' status={info.row.original.current_status} />
				),
			}),
			columnHelper.display({
				id: 'grade',
				header: 'Grado',
				cell: (info) => {
					const item = info.row.original;
					const grade = extractValue(item.grade);
					const suggested = extractValue(item.suggested_grade);

					if (grade) {
						return (
							<Badge
								variant='outline'
								className='gap-1 rounded-full border-yellow-200 bg-yellow-50 px-2 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'>
								<Icon icon='HeroStar' className='h-3 w-3' />
								{grade}
								{suggested && grade !== suggested && (
									<span className='ml-1 text-[10px] text-yellow-600/70 dark:text-yellow-400/70'>
										(Sug: {suggested})
									</span>
								)}
							</Badge>
						);
					}
					if (suggested) {
						return (
							<Badge
								variant='outline'
								className='gap-1 rounded-full border-gray-200 bg-gray-50 px-2 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'>
								<Icon icon='HeroSparkles' className='h-3 w-3' />
								{suggested}
							</Badge>
						);
					}
					return <span className='text-xs text-gray-400'>Pendiente</span>;
				},
			}),
			columnHelper.display({
				id: 'actions',
				header: 'Acciones',
				cell: (info) => (
					<div className='flex items-center gap-2'>
						<Button
							variant='outline'
							size='sm'
							onClick={() => handleView(info.row.original)}
							title='Ver detalle'>
							<Icon icon='HeroEye' className='h-4 w-4' />
						</Button>
						<Button
							variant='outline'
							size='sm'
							color='blue'
							onClick={() => handlePrint(info.row.original)}
							title='Imprimir etiqueta'>
							<Icon icon='HeroPrinter' className='h-4 w-4' />
						</Button>
					</div>
				),
			}),
		],
		[columnHelper, batchId],
	);

	return (
		<Card>
			<CardBody>
				<div className='mb-4 flex flex-wrap items-center justify-between'>
					<div></div>
					<Button
						variant='outline'
						size='sm'
						className='flex items-center gap-2'
						isDisable={!items || items.length === 0}
						onClick={() => setIsExportModalOpen(true)}>
						<Icon icon='HeroArrowDownTray' className='h-4 w-4' />
						Exportar XLSX
					</Button>
				</div>
				<DataTable
					data={items}
					columns={columns}
					loading={loading}
					paginationState={pagination}
					pageCount={meta?.last_page || 1}
					onPaginationChange={setPagination}
					manualPagination
				/>

				<ExportExcelModal
					isOpen={isExportModalOpen}
					setIsOpen={setIsExportModalOpen}
					items={items}
					exportFileName={`Lote_${batchId}`}
					onExportFetchAll={fetchAllForExport}
				/>

				{isPrintLabelOpen && itemToPrint && (
					<PrintLabel
						isOpen={isPrintLabelOpen}
						onClose={() => setIsPrintLabelOpen(false)}
						item={itemToPrint}
					/>
				)}
			</CardBody>
		</Card>
	);
};

export default ListReview;
