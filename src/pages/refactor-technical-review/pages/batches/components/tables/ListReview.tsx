import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { createColumnHelper, PaginationState, OnChangeFn } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchItems,
	selectItems,
	selectItemsMeta,
	selectItemsLoading,
	selectBatches,
	selectSelectedBatch,
} from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import DataTable from '@/components/ui/DataTable/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import {
	EquipmentType,
	FetchItemsParams,
	IItem,
	ListMeta,
	ReviewStatus,
} from '@/interface/technicalReviews.interface';
import ApiService from '@/services/ApiService';
import ExportExcelModal from '@/pages/refactor-technical-review/components/ExcelExport/ExportExcelModal';
import PrintLabel from '@/pages/refactor-technical-review/components/PrintLabel';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
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
	const batch = useAppSelector(selectSelectedBatch);

	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});

	// Review status filter
	const [reviewStatusFilter, setReviewStatusFilter] = useState<ReviewStatus | 'all'>('all');

	// Debounced search for server-side filtering
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const onSearchChange = useCallback((value: string) => {
		setSearchValue(value);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			setDebouncedSearch(value.trim());
			setPagination((prev) => ({ ...prev, pageIndex: 0 }));
		}, 400);
	}, []);

	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	// Fetch items effect
	useEffect(() => {
		if (!branchId || !batchId) return;

		const params: FetchItemsParams = {
			batch_id: batchId,
			page: pagination.pageIndex + 1,
			per_page: pagination.pageSize,
			...(activeTab !== 'all' && { equipment_type: activeTab }),
			...(debouncedSearch && { search: debouncedSearch }),
			...(reviewStatusFilter !== 'all' && { review_status: reviewStatusFilter }),
		};

		dispatch(fetchItems({ branchId, params }));
	}, [
		dispatch,
		branchId,
		batchId,
		pagination.pageIndex,
		pagination.pageSize,
		activeTab,
		debouncedSearch,
		reviewStatusFilter,
	]);

	const fetchAllForExport = useCallback(
		async (includeDetails = false): Promise<IItem[]> => {
			if (!branchId) return [];
			const params: FetchItemsParams = {
				batch_id: batchId,
				...(activeTab !== 'all' && { equipment_type: activeTab }),
			};
			const perPage = 1000;
			let page = 1;
			let lastPage = 1;
			const allItems: IItem[] = [];
			const baseUrl =
				(import.meta.env?.VITE_API_TECHNICAL_REVIEWS_PREFIX as string | undefined) ?? '';
			const url = `${baseUrl}/branches/${branchId}/technical-reviews/items`.replace(
				/([^:])\/\/+/g,
				'$1/',
			);

			do {
				const response = await ApiService.fetchData<{ data?: IItem[]; meta?: ListMeta }>({
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
				const nested = response.data as { data?: IItem[]; meta?: ListMeta } | undefined;
				const list: IItem[] = Array.isArray(nested?.data)
					? nested.data
					: Array.isArray(response.data)
						? (response.data as IItem[])
						: [];
				allItems.push(...list);
				lastPage = nested?.meta?.last_page ?? page;
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

	// View choice modal state
	const [isViewChoiceOpen, setIsViewChoiceOpen] = useState(false);
	const [itemToView, setItemToView] = useState<IItem | null>(null);

	const handleView = (item: IItem) => {
		setItemToView(item);
		setIsViewChoiceOpen(true);
	};

	const handleNavigateReview = () => {
		if (!itemToView) return;
		setIsViewChoiceOpen(false);
		navigate(`/technical-reviews/batches/${batchId}/items/${itemToView.id}`);
	};

	const handleNavigateTraceability = () => {
		if (!itemToView) return;
		setIsViewChoiceOpen(false);
		navigate(`/technical-reviews/traceability/${itemToView.serial_number}`);
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
							<Icon icon={icon} className='h-3 w-3' />
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

	const [searchValue, setSearchValue] = useState('');

	return (
		<Card>
			<CardBody>
				<DataTable
					data={items}
					columns={columns}
					loading={loading}
					paginationState={pagination}
					pageCount={meta?.last_page || 1}
					onPaginationChange={setPagination}
					manualPagination
					actions={
						<div className='flex flex-wrap items-center gap-3'>
							{/* Status filter pills */}
							<div className='flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-800/50'>
								{(
									[
										{ value: 'all' as const, label: 'Todas' },
										{ value: 'pending' as const, label: 'Pendiente' },
										{ value: 'in_review' as const, label: 'En Revisión' },
										{ value: 'reviewed' as const, label: 'Revisado' },
										{ value: 'approved' as const, label: 'Aprobado' },
									] as const
								).map((opt) => (
									<button
										key={opt.value}
										type='button'
										onClick={() => {
											setReviewStatusFilter(opt.value);
											setPagination((prev) => ({ ...prev, pageIndex: 0 }));
										}}
										className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
											reviewStatusFilter === opt.value
												? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-700 dark:text-zinc-100 dark:ring-zinc-600'
												: 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
										}`}>
										{opt.label}
									</button>
								))}
							</div>
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
					}
					searchPlaceholder='Buscar por serie'
					searchValue={searchValue}
					onSearchChange={onSearchChange}
				/>

				<ExportExcelModal
					isOpen={isExportModalOpen}
					setIsOpen={setIsExportModalOpen}
					items={items}
					exportFileName={`${batch?.code || batchId}`}
					onExportFetchAll={fetchAllForExport}
					batchDate={batch?.entry_date}
					customerName={batch?.customer_supplier?.name}
				/>

				{isPrintLabelOpen && itemToPrint && (
					<PrintLabel
						isOpen={isPrintLabelOpen}
						onClose={() => setIsPrintLabelOpen(false)}
						item={itemToPrint}
					/>
				)}

				{/* View choice modal */}
				<Modal
					isOpen={isViewChoiceOpen}
					setIsOpen={setIsViewChoiceOpen}
					isCentered
					size='sm'>
					<ModalHeader>
						<div className='flex items-center gap-2'>
							<Icon icon='HeroEye' className='h-5 w-5 text-blue-500' />
							<span className='text-lg'>Ver detalle</span>
						</div>
					</ModalHeader>
					<ModalBody>
						{itemToView && (
							<p className='mb-4 text-sm text-zinc-500'>
								Serie{' '}
								<span className='font-mono font-semibold text-zinc-800 dark:text-zinc-200'>
									{itemToView.serial_number}
								</span>
							</p>
						)}
						<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
							{/* Revisión Técnica */}
							<button
								type='button'
								onClick={handleNavigateReview}
								className='group flex flex-col items-center gap-3 rounded-xl border-2 border-zinc-200 bg-zinc-50 p-5 transition-all hover:border-blue-400 hover:bg-blue-50 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-blue-500 dark:hover:bg-blue-900/20'>
								<div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-transform group-hover:scale-110 dark:bg-blue-900/40 dark:text-blue-300'>
									<Icon icon='HeroClipboardDocumentCheck' className='h-6 w-6' />
								</div>
								<div className='text-center'>
									<p className='text-sm font-semibold text-zinc-800 dark:text-zinc-100'>
										Revisión Técnica
									</p>
									<p className='mt-1 text-xs text-zinc-500'>
										Ver y editar la revisión del equipo
									</p>
								</div>
							</button>

							{/* Trazabilidad */}
							<button
								type='button'
								onClick={handleNavigateTraceability}
								className='group flex flex-col items-center gap-3 rounded-xl border-2 border-zinc-200 bg-zinc-50 p-5 transition-all hover:border-purple-400 hover:bg-purple-50 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-purple-500 dark:hover:bg-purple-900/20'>
								<div className='flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600 transition-transform group-hover:scale-110 dark:bg-purple-900/40 dark:text-purple-300'>
									<Icon icon='HeroArrowPath' className='h-6 w-6' />
								</div>
								<div className='text-center'>
									<p className='text-sm font-semibold text-zinc-800 dark:text-zinc-100'>
										Trazabilidad
									</p>
									<p className='mt-1 text-xs text-zinc-500'>
										Historial de movimientos y estados
									</p>
								</div>
							</button>
						</div>
					</ModalBody>
				</Modal>
			</CardBody>
		</Card>
	);
};

export default ListReview;
