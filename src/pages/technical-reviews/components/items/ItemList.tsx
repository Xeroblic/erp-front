/**
 * ItemList - Tabla reutilizable de series/ítems
 * Usado en: pages/items/index.tsx y BatchTabs.tsx
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createColumnHelper, PaginationState, OnChangeFn } from '@tanstack/react-table';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import DataTable from '@/components/ui/DataTable/DataTable';
import Badge from '@/components/ui/Badge';
import type { IItem, ListMeta } from '@/interface/technicalReviews.interface';
import StatusBadge from '../shared/StatusBadge';
import { useAppDispatch } from '@/store';
import { deleteItem } from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import PrintLabel from './PrintLabel';
import { extractValue, formatDateTime, resolveEquipmentTypeMeta } from '../utils/utilsItems';
import { handleDelete as handleDeleteItem, exportItemsToExcel } from './hooks/Item_list';

type ExportMode = 'serials' | 'details';

type ExportFetcher = (includeDetails?: boolean) => Promise<IItem[]>;

interface ItemListProps {
	items: IItem[];
	loading: boolean;
	meta: ListMeta;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onItemClick?: (itemId: number) => void;
	baseUrl?: string; // URL base para navegación (ej: '/technical-reviews/items' o '/technical-reviews/batches/5')
	emptyMessage?: string;
	variant?: 'batch' | 'global';
	exportFileName?: string;
	onExportFetchAll?: ExportFetcher;
	batchDate?: string;
}

const ItemList: React.FC<ItemListProps> = ({
	items,
	loading,
	meta,
	onPageChange,
	onLimitChange,
	onItemClick,
	baseUrl = '/technical-reviews/items',
	emptyMessage = 'No hay series para mostrar',
	variant = 'batch',
	exportFileName = 'items-export',
	onExportFetchAll,
	batchDate,
}) => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();
	const [isExportModalOpen, setIsExportModalOpen] = useState(false);
	const [exportMode, setExportMode] = useState<ExportMode>('serials');
	const [isExporting, setIsExporting] = useState(false);

	// Estados para impresión de etiquetas
	const [isPrintLabelOpen, setIsPrintLabelOpen] = useState(false);
	const [itemToPrint, setItemToPrint] = useState<IItem | null>(null);

	const handleItemClick = (itemId: number) => {
		if (onItemClick) {
			onItemClick(itemId);
		} else {
			navigate(`${baseUrl}/${itemId}`);
		}
	};

	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<IItem | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async (itemId: number) => {
		if (branchId) {
			await handleDeleteItem(
				itemId,
				branchId,
				dispatch,
				setIsDeleting,
				setDeleteModalOpen,
				setItemToDelete,
				onPageChange,
				meta,
			);
		}
	};

	const handleExport = async () => {
		setIsExporting(true);
		try {
			await exportItemsToExcel(
				items,
				exportMode,
				exportFileName,
				onExportFetchAll,
				batchDate,
			);
		} finally {
			setIsExporting(false);
		}
	};

	// Modal para elegir acción (Ver detalle o Trazabilidad)
	const [actionModalOpen, setActionModalOpen] = useState(false);
	const [selectedActionItem, setSelectedActionItem] = useState<IItem | null>(null);

	const handleActionClick = (item: IItem) => {
		setSelectedActionItem(item);
		setActionModalOpen(true);
	};

	const goToReview = () => {
		if (selectedActionItem) {
			if (onItemClick) {
				onItemClick(selectedActionItem.id);
			} else {
				navigate(`${baseUrl}/${selectedActionItem.id}`);
			}
			setActionModalOpen(false);
		}
	};

	const goToTraceability = () => {
		if (selectedActionItem && branchId) {
			navigate(`/technical-reviews/traceability/${selectedActionItem.serial_number}`);
			setActionModalOpen(false);
		}
	};

	// TanStack Table setup (debe ejecutarse SIEMPRE antes de cualquier return condicional)
	const columnHelper = useMemo(() => createColumnHelper<IItem>(), []);

	const columns = useMemo(() => {
		const cols = [
			columnHelper.display({
				id: 'serial_number',
				header: 'Serie',
				cell: (info) => {
					const item = info.row.original;
					return (
						<div className='flex items-center gap-2'>
							<Icon icon='HeroQrCode' className='h-4 w-4 text-gray-400' />
							<span className='font-mono text-sm font-medium text-gray-900 dark:text-gray-100'>
								{item.serial_number}
							</span>
						</div>
					);
				},
			}),

			// Tipo
			columnHelper.display({
				id: 'equipment_type',
				header: 'Tipo',
				cell: (info) => {
					const item = info.row.original;
					const { label, icon } = resolveEquipmentTypeMeta(item.equipment_type);
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

			// Estado revisión
			columnHelper.display({
				id: 'review_status',
				header: 'Estado Revisión',
				cell: (info) => (
					<StatusBadge type='review' status={info.row.original.review_status} />
				),
			}),

			// Estado comercial
			columnHelper.display({
				id: 'current_status',
				header: 'Estado Comercial',
				cell: (info) => (
					<StatusBadge type='commercial' status={info.row.original.current_status} />
				),
			}),

			// Grado
			columnHelper.display({
				id: 'grade',
				header: 'Grado',
				cell: (info) => {
					const item = info.row.original;
					return extractValue(item.grade) ? (
						<Badge
							variant='outline'
							className='gap-1 rounded-full border-yellow-200 bg-yellow-50 px-2 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'>
							<Icon icon='HeroStar' className='h-3 w-3' />
							{extractValue(item.grade)}
							{extractValue(item.suggested_grade) &&
								extractValue(item.grade) !== extractValue(item.suggested_grade) && (
									<span className='ml-1 text-[10px] text-yellow-600/70 dark:text-yellow-400/70'>
										(Sug: {extractValue(item.suggested_grade)})
									</span>
								)}
						</Badge>
					) : extractValue(item.suggested_grade) ? (
						<Badge
							variant='outline'
							className='gap-1 rounded-full border-gray-200 bg-gray-50 px-2 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'>
							<Icon icon='HeroSparkles' className='h-3 w-3' />
							{extractValue(item.suggested_grade)}
						</Badge>
					) : (
						<span className='text-xs text-gray-400'>Pendiente</span>
					);
				},
			}),
		] as any[];

		if (variant === 'global') {
			cols.splice(
				1,
				0,
				// Producto (solo global)
				columnHelper.display({
					id: 'product_name',
					header: 'Producto',
					cell: (info) => {
						const item = info.row.original as any;
						return (
							<span className='text-sm text-gray-700 dark:text-gray-300'>
								{item?.product?.name || item?.product_name || 'Sin producto'}
							</span>
						);
					},
				}),
			);

			cols.push(
				// Bodega (solo global)
				columnHelper.display({
					id: 'warehouse_name',
					header: 'Bodega',
					cell: (info) => {
						const item = info.row.original as any;
						return (
							<span className='text-sm text-gray-700 dark:text-gray-300'>
								{item?.warehouse?.name || item?.warehouse_name || '—'}
							</span>
						);
					},
				}),
				// Última actualización (solo global)
				columnHelper.display({
					id: 'updated_at',
					header: 'Actualización',
					cell: (info) => (
						<span className='text-sm text-gray-500 dark:text-gray-400'>
							{formatDateTime(
								info.row.original.updated_at || info.row.original.created_at,
							)}
						</span>
					),
				}),
			);
		}

		// Acciones
		cols.push(
			columnHelper.display({
				id: 'actions',
				header: 'Acciones',
				cell: (info) => {
					const item = info.row.original;
					const reviewStatus = (extractValue(item.review_status) || '').toLowerCase();
					const isApproved = reviewStatus === 'approved';
					return (
						<div className='inline-flex w-full justify-end gap-2'>
							<Button
								variant='outline'
								size='sm'
								onClick={(e) => {
									e.stopPropagation();
									handleActionClick(item);
								}}
								title='Ver acciones'>
								<Icon icon='HeroEye' className='h-4 w-4' />
							</Button>
							<Button
								variant='outline'
								size='sm'
								color='blue'
								onClick={(e) => {
									e.stopPropagation();
									setItemToPrint(item);
									setIsPrintLabelOpen(true);
								}}
								title='Imprimir etiqueta'>
								<Icon icon='HeroPrinter' className='h-4 w-4' />
							</Button>
							<Button
								variant='outline'
								size='sm'
								color='red'
								isDisable={isApproved}
								onClick={(e) => {
									e.stopPropagation();
									setItemToDelete(item);
									setDeleteModalOpen(true);
								}}
								title={
									isApproved
										? 'No se puede eliminar una revisión aprobada'
										: 'Eliminar revisión'
								}>
								<Icon icon='HeroTrash' className='h-4 w-4' />
							</Button>
						</div>
					);
				},
			}),
		);

		return cols;
	}, [columnHelper, variant]);

	const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
		const current: PaginationState = {
			pageIndex: Math.max((meta?.current_page || 1) - 1, 0),
			pageSize: meta?.per_page || 10,
		};
		const next = typeof updater === 'function' ? updater(current) : updater;

		if (next.pageSize !== current.pageSize) {
			onLimitChange?.(next.pageSize);
			return;
		}

		if (next.pageIndex !== current.pageIndex) {
			onPageChange?.(next.pageIndex + 1);
		}
	};

	return (
		<div className=''>
			<Card className='h-full w-full border-none shadow-none'>
				<CardBody className='p-0'>
					<DataTable
						data={items ?? []}
						columns={columns}
						loading={loading}
						emptyMessage={emptyMessage}
						manualPagination={true}
						pageCount={meta?.last_page || 1}
						paginationState={{
							pageIndex: Math.max((meta?.current_page || 1) - 1, 0),
							pageSize: meta?.per_page || 10,
						}}
						onPaginationChange={handlePaginationChange}
						enableSearch={false} // Se maneja externamente
						actions={
							<Button
								variant='outline'
								size='sm'
								className='flex items-center gap-2'
								isDisable={!items || items.length === 0}
								onClick={() => setIsExportModalOpen(true)}>
								<Icon icon='HeroArrowDownTray' className='h-4 w-4' />
								Exportar XLSX
							</Button>
						}
					/>
				</CardBody>
			</Card>

			{/* Modal de Exportación */}
			<Modal isOpen={isExportModalOpen} setIsOpen={setIsExportModalOpen}>
				<ModalHeader>Exportar Datos</ModalHeader>
				<ModalBody>
					<div className='grid gap-4'>
						<div
							className={`cursor-pointer rounded-lg border p-4 transition-all hover:bg-gray-50 dark:hover:bg-zinc-800 ${
								exportMode === 'serials'
									? 'border-blue-500 ring-1 ring-blue-500'
									: 'border-gray-200 dark:border-gray-700'
							}`}
							onClick={() => setExportMode('serials')}>
							<div className='flex items-center gap-3'>
								<div
									className={`flex h-10 w-10 items-center justify-center rounded-full ${
										exportMode === 'serials'
											? 'bg-blue-100 text-blue-600'
											: 'bg-gray-100 text-gray-500'
									}`}>
									<Icon icon='HeroListBullet' className='h-6 w-6' />
								</div>
								<div>
									<h4 className='font-medium text-gray-900 dark:text-gray-100'>
										Listado de Series
									</h4>
									<p className='text-sm text-gray-500'>
										Exporta solo el listado de números de serie
									</p>
								</div>
							</div>
						</div>

						<div
							className={`cursor-pointer rounded-lg border p-4 transition-all hover:bg-gray-50 dark:hover:bg-zinc-800 ${
								exportMode === 'details'
									? 'border-blue-500 ring-1 ring-blue-500'
									: 'border-gray-200 dark:border-gray-700'
							}`}
							onClick={() => setExportMode('details')}>
							<div className='flex items-center gap-3'>
								<div
									className={`flex h-10 w-10 items-center justify-center rounded-full ${
										exportMode === 'details'
											? 'bg-blue-100 text-blue-600'
											: 'bg-gray-100 text-gray-500'
									}`}>
									<Icon icon='HeroDocumentText' className='h-6 w-6' />
								</div>
								<div>
									<h4 className='font-medium text-gray-900 dark:text-gray-100'>
										Listado Detallado
									</h4>
									<p className='text-sm text-gray-500'>
										Exporta toda la información técnica y especificaciones
									</p>
								</div>
							</div>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button
						variant='outline'
						onClick={() => setIsExportModalOpen(false)}
						isDisable={isExporting}>
						Cancelar
					</Button>
					<Button
						variant='solid'
						color='blue'
						onClick={() => {
							handleExport();
							setIsExportModalOpen(false);
						}}
						isLoading={isExporting}>
						Exportar
					</Button>
				</ModalFooter>
			</Modal>

			{/* Modal de Eliminar */}
			<Modal isOpen={deleteModalOpen} setIsOpen={setDeleteModalOpen}>
				<ModalHeader>Confirmar Eliminación</ModalHeader>
				<ModalBody>
					<p>
						¿Estás seguro que deseas eliminar la revisión del equipo{' '}
						<span className='font-bold'>{itemToDelete?.serial_number}</span>?
					</p>
					<p className='mt-2 text-sm text-gray-500'>Esta acción no se puede deshacer.</p>
				</ModalBody>
				<ModalFooter>
					<Button
						variant='outline'
						onClick={() => setDeleteModalOpen(false)}
						isDisable={isDeleting}>
						Cancelar
					</Button>
					<Button
						variant='solid'
						color='red'
						onClick={() => itemToDelete && handleDelete(itemToDelete.id)}
						isLoading={isDeleting}>
						Eliminar
					</Button>
				</ModalFooter>
			</Modal>

			{/* Modal de Impresión */}
			{isPrintLabelOpen && itemToPrint && (
				<PrintLabel
					isOpen={isPrintLabelOpen}
					onClose={() => setIsPrintLabelOpen(false)}
					item={itemToPrint}
				/>
			)}

			{/* Modal de Selección de Acción */}
			<Modal isOpen={actionModalOpen} setIsOpen={setActionModalOpen}>
				<ModalHeader>Seleccionar Acción</ModalHeader>
				<ModalBody>
					<p className='mb-4 text-gray-600 dark:text-gray-400'>
						¿Qué deseas ver del equipo con serie{' '}
						<span className='font-bold text-gray-900 dark:text-gray-100'>
							{selectedActionItem?.serial_number}
						</span>
						?
					</p>
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
						<div
							className='flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white p-6 transition-all hover:bg-gray-50 hover:shadow-sm dark:border-gray-700 dark:bg-zinc-800 dark:hover:bg-zinc-700'
							onClick={goToReview}>
							<div className='rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'>
								<Icon icon='HeroEye' className='h-8 w-8' />
							</div>
							<div className='text-center'>
								<h3 className='font-semibold text-gray-900 dark:text-gray-100'>
									Ver Revisión
								</h3>
								<p className='text-sm text-gray-500'>
									Ir al detalle técnico y revisión
								</p>
							</div>
						</div>

						<div
							className='flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white p-6 transition-all hover:bg-gray-50 hover:shadow-sm dark:border-gray-700 dark:bg-zinc-800 dark:hover:bg-zinc-700'
							onClick={goToTraceability}>
							<div className='rounded-full bg-purple-100 p-3 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'>
								<Icon icon='HeroClock' className='h-8 w-8' />
							</div>
							<div className='text-center'>
								<h3 className='font-semibold text-gray-900 dark:text-gray-100'>
									Trazabilidad
								</h3>
								<p className='text-sm text-gray-500'>
									Ver historial de vida y movimientos
								</p>
							</div>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button variant='outline' onClick={() => setActionModalOpen(false)}>
						Cancelar
					</Button>
				</ModalFooter>
			</Modal>
		</div>
	);
};

export default ItemList;
