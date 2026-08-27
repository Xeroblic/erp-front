import React, { useEffect, useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import type { IProduct } from '@/interface/product.interface';
import toast from '@/utils/toast.utils';
import { useAppDispatch, useAppSelector } from '@/store';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import {
	assignStockToBranch,
	fetchProductSeries,
	unassignStockFromProduct,
} from '@/store/slices/products/productStockSlice';

interface StockSeriesModalProps {
	isOpen: boolean;
	onClose: () => void;
	product: IProduct | null;
	subsidiaryId: number;
}

interface ISeriesItem {
	serial_number: string;
	grade?: string;
	current_status?: string;
	branch_name?: string;
	branch_id?: number | null;
}

const StockSeriesModal: React.FC<StockSeriesModalProps> = ({
	isOpen,
	onClose,
	product,
	subsidiaryId,
}) => {
	const dispatch = useAppDispatch();
	const [activeTab, setActiveTab] = useState<'return' | 'assign'>('return');
	const [series, setSeries] = useState<ISeriesItem[]>([]);
	const [selectedSeries, setSelectedSeries] = useState<string[]>([]);

	const user = useAppSelector((state) => state.auth.user);
	const { isLoadingSeries, isAssigning, isUnassigning } = useAppSelector(
		(state) => state.productStock,
	);

	const visibleBranches = (user?.visible as any)?.branches || [];
	const accessibleBranches = visibleBranches.filter(
		(b: any) => b.subsidiary?.id === subsidiaryId,
	);

	const defaultBranchId = user?.branch?.id || '';
	const initialBranchId = accessibleBranches.some((b: any) => b.id === defaultBranchId)
		? defaultBranchId
		: accessibleBranches.length > 0
			? accessibleBranches[0].id
			: '';

	const [selectedBranchId, setSelectedBranchId] = useState<number | ''>(initialBranchId);

	useEffect(() => {
		if (!isOpen || !product) {
			setSeries([]);
			setSelectedSeries([]);
			return;
		}

		const fetchSeries = async () => {
			// Si estamos devolviendo y aún no se seleccionó sucursal de origen, no hacemos la petición
			if (activeTab === 'return' && !selectedBranchId) {
				setSeries([]);
				setSelectedSeries([]);
				return;
			}

			try {
				// branch_id: selectedBranchId si es Devolver, 'null' si es Asignar (Bodega Central)
				const branchParam = activeTab === 'return' ? selectedBranchId : 'null';

				const seriesData = await dispatch(
					fetchProductSeries({
						subsidiaryId,
						productId: product.id,
					}),
				).unwrap();

				// Validamos localmente frente a lo que responde el back:
				const filteredSeries = seriesData.filter((s: ISeriesItem) => {
					const isAvailable =
						s.current_status === 'available' ||
						s.current_status === 'available_for_sale';
					const sBranchId = s.branch_id === null ? 'null' : s.branch_id;

					return isAvailable && String(sBranchId) === String(branchParam);
				});

				setSeries(filteredSeries);
				setSelectedSeries([]);
			} catch (error) {
				console.error('Error fetching series:', error);
				toast.error('Error al obtener las series para el producto.');
			}
		};

		fetchSeries();
	}, [dispatch, isOpen, product, subsidiaryId, activeTab, selectedBranchId]);

	const handleToggleSelect = (serial: string) => {
		setSelectedSeries((prev) =>
			prev.includes(serial) ? prev.filter((s) => s !== serial) : [...prev, serial],
		);
	};

	const handleSelectAll = () => {
		if (selectedSeries.length === series.length) {
			setSelectedSeries([]);
		} else {
			setSelectedSeries(series.map((s) => s.serial_number));
		}
	};

	const handleAssignStock = async () => {
		if (!product || selectedSeries.length === 0) return;
		if (!selectedBranchId) {
			toast.error('Debe seleccionar una sucursal de destino para asignar el stock.');
			return;
		}

		// Obtener los grados de las series seleccionadas
		const selectedItems = series.filter((s) => selectedSeries.includes(s.serial_number));
		const uniqueGrades = Array.from(new Set(selectedItems.map((s) => s.grade).filter(Boolean)));

		if (uniqueGrades.length > 1) {
			toast.error(
				`Todas las series deben ser del mismo grado. Se detectaron grados mixtos: ${uniqueGrades.join(', ')}.`,
			);
			return;
		}

		let childId = product.id;
		const selectedGrade = uniqueGrades[0];

		if (product.children && product.children.length > 0 && selectedGrade) {
			const childProduct = product.children.find((c) => c.grade === selectedGrade);
			if (childProduct) {
				childId = childProduct.id;
			} else {
				toast.error(`Producto hijo no encontrado para el grado ${selectedGrade}.`);
				return;
			}
		}

		try {
			await dispatch(
				assignStockToBranch({
					subsidiaryId,
					productId: product.id,
					payload: {
						branch_id: Number(selectedBranchId),
						assignments: [
							{
								child_product_id: childId,
								assign_all: false,
								serial_numbers: selectedSeries,
							},
						],
					},
				}),
			).unwrap();
			const destinationBranch =
				accessibleBranches.find((b: any) => b.id === selectedBranchId)?.name ||
				'la sucursal seleccionada';
			toast.success(
				`Stock asignado exitosamente desde la Bodega Central hacia ${destinationBranch}.`,
			);
			onClose();
		} catch (error) {
			console.error('Error assigning stock:', error);
			toast.error('Ocurrió un error al intentar asignar el stock.');
		}
	};

	const handleReturnStock = async () => {
		if (!product || selectedSeries.length === 0) return;
		if (!selectedBranchId) {
			toast.error('Debe seleccionar la sucursal de origen para devolver el stock.');
			return;
		}

		const selectedItems = series.filter((s) => selectedSeries.includes(s.serial_number));
		const uniqueGrades = Array.from(new Set(selectedItems.map((s) => s.grade).filter(Boolean)));

		if (uniqueGrades.length > 1) {
			toast.error(
				`Todas las series deben ser del mismo grado. Se detectaron grados mixtos: ${uniqueGrades.join(', ')}.`,
			);
			return;
		}

		try {
			await dispatch(
				unassignStockFromProduct({
					subsidiaryId,
					productId: product.id,
					payload: {
						branch_id: Number(selectedBranchId),
						confirm: true,
						serial_numbers: selectedSeries,
						notes: 'Devolución de stock a la subsidiaria',
					},
				}),
			).unwrap();
			const branchName =
				series.find((s) => selectedSeries.includes(s.serial_number))?.branch_name ||
				'la sucursal';
			toast.success(
				`Stock devuelto exitosamente desde ${branchName} hacia la Bodega Central.`,
			);
			onClose();
		} catch (error) {
			console.error('Error returning stock:', error);
			toast.error('Ocurrió un error al intentar devolver el stock.');
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose}>
			<ModalHeader>
				<div className='flex items-center gap-3'>
					<span className='flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600'>
						<Icon icon='HeroQrCode' className='h-5 w-5' />
					</span>
					<div>
						<p className='text-lg font-semibold'>Gestión de Series</p>
						<p className='text-sm text-neutral-500'>
							Administra el inventario serializado
						</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-4 py-4'>
					{/* Selector de Modo */}
					<div className='flex rounded-md border border-gray-200 bg-gray-50 p-1 shadow-sm dark:border-gray-700 dark:bg-gray-800'>
						<button
							type='button'
							onClick={() => {
								setActiveTab('return');
								setSelectedBranchId(initialBranchId);
								setSelectedSeries([]);
							}}
							className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
								activeTab === 'return'
									? 'bg-white text-neutral-900 shadow dark:bg-gray-700 dark:text-white'
									: 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
							}`}>
							Devolver a Bodega Central
						</button>
						<button
							type='button'
							onClick={() => {
								setActiveTab('assign');
								setSelectedBranchId(initialBranchId);
								setSelectedSeries([]);
							}}
							className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
								activeTab === 'assign'
									? 'bg-white text-neutral-900 shadow dark:bg-gray-700 dark:text-white'
									: 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
							}`}>
							Asignar a Sucursal
						</button>
					</div>

					{/* Selector de Sucursal */}
					<div className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/50'>
						<label className='mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300'>
							{activeTab === 'return'
								? 'Seleccionar Sucursal de Origen (Dónde está ahora el stock)'
								: 'Seleccionar Sucursal de Destino (A dónde enviarlo)'}
						</label>
						<select
							className='block w-full rounded-md border-gray-300 text-neutral-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-neutral-100 sm:text-sm'
							value={selectedBranchId}
							onChange={(e) => setSelectedBranchId(Number(e.target.value))}>
							<option value=''>-- Seleccione una sucursal --</option>
							{accessibleBranches.map((b: any) => (
								<option key={b.id} value={b.id}>
									{b.name}
								</option>
							))}
						</select>
					</div>

					{/* Tarjeta de Resumen del Producto */}
					{product && (
						<div className='rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50'>
							<p className='text-sm font-medium text-gray-900 dark:text-gray-100'>
								{product.name}
							</p>
							<div className='mt-1 flex items-center justify-between'>
								{product.sku && (
									<p className='text-sm text-gray-500'>SKU: {product.sku}</p>
								)}
								<div className='flex gap-2'>
									{product.grade && (
										<Badge
											variant='outline'
											color='emerald'
											className='px-2 py-0.5 text-xs'>
											Grado: {product.grade}
										</Badge>
									)}
								</div>
							</div>
						</div>
					)}

					{/* Lista de Series */}
					<div>
						<div className='mb-2 flex items-center justify-between'>
							<p className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
								Séries disponibles ({series.length}):
							</p>
							{series.length > 0 && (
								<button
									className='text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400'
									onClick={handleSelectAll}>
									{selectedSeries.length === series.length
										? 'Deseleccionar todas'
										: 'Seleccionar todas'}
								</button>
							)}
						</div>

						{series.length > 0 && (
							<div className='mb-3'>
								<SelectReact
									name='series_selector'
									isMulti
									options={series.map((s) => ({
										value: s.serial_number,
										label: `${s.serial_number} ${s.grade ? `(Grado ${s.grade})` : ''}`,
									}))}
									value={series
										.filter((s) => selectedSeries.includes(s.serial_number))
										.map((s) => ({
											value: s.serial_number,
											label: `${s.serial_number} ${s.grade ? `(Grado ${s.grade})` : ''}`,
										}))}
									onChange={(newValue: any) => {
										if (!newValue) {
											setSelectedSeries([]);
											return;
										}
										const selected = (newValue as TSelectOption[]).map(
											(o) => o.value,
										);
										setSelectedSeries(selected);
									}}
									placeholder='Buscar o pistolear series...'
								/>
							</div>
						)}

						<div className='max-h-[40vh] min-h-[100px] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900'>
							{isLoadingSeries ? (
								<div className='flex h-full min-h-[100px] items-center justify-center'>
									<Icon
										icon='HeroArrowPath'
										className='h-6 w-6 animate-spin text-blue-500'
									/>
								</div>
							) : series.length > 0 ? (
								<ul className='space-y-1.5'>
									{series.map((item) => (
										<li
											key={item.serial_number}
											onClick={() => handleToggleSelect(item.serial_number)}
											className={`flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 ${
												selectedSeries.includes(item.serial_number)
													? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
													: 'border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800'
											}`}>
											<div className='flex items-center gap-3'>
												<input
													type='checkbox'
													checked={selectedSeries.includes(
														item.serial_number,
													)}
													readOnly
													className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
												/>
												<span className='font-mono font-medium text-neutral-700 dark:text-neutral-200'>
													{item.serial_number}
												</span>
											</div>
											{item.grade && (
												<Badge
													variant='outline'
													color='stone'
													className='text-xs'>
													{item.grade}
												</Badge>
											)}
										</li>
									))}
								</ul>
							) : (
								<div className='flex h-full min-h-[100px] flex-col items-center justify-center space-y-2 text-gray-400'>
									<Icon icon='HeroArchiveBoxXMark' className='h-8 w-8' />
									<p className='text-sm'>
										No hay series disponibles para esta acción.
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				<div className='flex w-full items-center justify-between'>
					<Button
						variant='outline'
						onClick={onClose}
						isDisable={isLoadingSeries || isAssigning || isUnassigning}>
						Cancelar
					</Button>
					<div className='flex gap-2'>
						{activeTab === 'return' ? (
							<Button
								variant='outline'
								color='red'
								onClick={handleReturnStock}
								isLoading={isUnassigning}
								isDisable={
									isLoadingSeries ||
									isAssigning ||
									isUnassigning ||
									selectedSeries.length === 0
								}
								icon='HeroArrowUturnLeft'>
								Devolver Seleccionadas ({selectedSeries.length})
							</Button>
						) : (
							<Button
								variant='solid'
								color='blue'
								onClick={handleAssignStock}
								isLoading={isAssigning}
								isDisable={
									isLoadingSeries ||
									isAssigning ||
									isUnassigning ||
									selectedSeries.length === 0
								}
								icon='HeroArrowRightOnRectangle'>
								Asignar Seleccionadas ({selectedSeries.length})
							</Button>
						)}
					</div>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default StockSeriesModal;
