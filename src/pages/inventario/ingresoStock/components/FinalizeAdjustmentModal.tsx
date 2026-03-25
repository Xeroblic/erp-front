import React, { useEffect, useMemo, useState } from 'react';
import { FormikProps } from 'formik';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import Textarea from '@/components/form/Textarea';
import { useAppSelector } from '@/store';
import { useUserBranches } from '@/hooks/userBrandBranch';
import ApiService from '@/services/ApiService';
import type { IWorkItem } from '../types';
import { IAdjustmentForm } from '../types';

interface FinalizeAdjustmentModalProps {
	isOpen: boolean;
	onClose: () => void;
	form: FormikProps<IAdjustmentForm>;
	isSubmitting: boolean;
	itemCount: number;
	workItems: IWorkItem[];
	/** Subsidiaria activa — se usa para filtrar las sucursales del dropdown */
	subsidiaryId: number | null;
}

export const FinalizeAdjustmentModal: React.FC<FinalizeAdjustmentModalProps> = ({
	isOpen,
	onClose,
	form,
	isSubmitting,
	itemCount,
	workItems,
	subsidiaryId,
}) => {
	const { user } = useAppSelector((state) => state.auth);
	const userId = user?.id ?? (user as { pk?: number } | null)?.pk ?? undefined;
	const { branches, loading: loadingBranches } = useUserBranches(userId, {
		enabled: Boolean(userId),
	});
	const [stockByProduct, setStockByProduct] = useState<Map<number, number>>(new Map());
	const [isLoadingBranchStock, setIsLoadingBranchStock] = useState(false);

	// Filtrar sucursales: solo las de la subsidiary activa
	const filteredBranches = useMemo(() => {
		if (!subsidiaryId) return branches;
		return branches.filter((b) => Number(b.subsidiaryId) === subsidiaryId);
	}, [branches, subsidiaryId]);

	useEffect(() => {
		const selectedBranchId = Number(form.values.branchId);
		if (!isOpen || selectedBranchId <= 0 || !workItems.length) {
			setStockByProduct(new Map());
			return;
		}

		let isCancelled = false;
		const loadBranchStock = async () => {
			setIsLoadingBranchStock(true);
			try {
				const rows = await Promise.all(
					workItems.map(async (item) => {
						try {
							const response = await ApiService.fetchData({
								url: `/branches/${selectedBranchId}/products/${item.productId}`,
								method: 'get',
							});
							const payload =
								(response.data as { data?: Record<string, unknown> } | undefined)
									?.data ??
								(response.data as Record<string, unknown> | undefined) ??
								{};
							const stock = Number(payload.stock ?? 0);
							return {
								productId: item.productId,
								stock: Number.isFinite(stock) ? stock : 0,
							};
						} catch {
							return { productId: item.productId, stock: 0 };
						}
					}),
				);

				if (isCancelled) return;
				setStockByProduct(new Map(rows.map((row) => [row.productId, row.stock])));
			} finally {
				if (!isCancelled) setIsLoadingBranchStock(false);
			}
		};

		void loadBranchStock();

		return () => {
			isCancelled = true;
		};
	}, [form.values.branchId, isOpen, workItems]);

	const handleTypeChange = (type: 'ingreso' | 'egreso') => {
		form.setFieldValue('movementType', type);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose}>
			<ModalHeader>
				<h3 className='text-xl font-bold'>Finalizar Ajuste de Stock</h3>
			</ModalHeader>
			<ModalBody>
				<div className='flex flex-col gap-5'>
					{/* Información */}
					<div className='flex items-center justify-between rounded-md bg-zinc-100 p-3 text-sm text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400'>
						<span>
							Se ajustarán <strong>{itemCount}</strong> productos de la zona de
							trabajo.
						</span>
					</div>

					{/* Tipo de movimiento */}
					<div>
						<Label htmlFor='movementTypeBtn' className='mb-2 block'>
							Tipo de Movimiento
						</Label>
						<div className='flex flex-wrap items-center gap-3'>
							<Button
								color={form.values.movementType === 'ingreso' ? 'emerald' : 'zinc'}
								variant={
									form.values.movementType === 'ingreso' ? 'solid' : 'outline'
								}
								onClick={() => handleTypeChange('ingreso')}>
								Ingreso (+)
							</Button>
							<Button
								color={form.values.movementType === 'egreso' ? 'red' : 'zinc'}
								variant={
									form.values.movementType === 'egreso' ? 'solid' : 'outline'
								}
								onClick={() => handleTypeChange('egreso')}>
								Egreso (-)
							</Button>
							{form.touched.movementType && form.errors.movementType && (
								<span className='text-xs text-red-500'>
									{form.errors.movementType}
								</span>
							)}
						</div>
					</div>

					<div className='grid grid-cols-1 gap-4'>
						<div className='col-span-1'>
							<Label htmlFor='branchId'>Sucursal destino</Label>
							<Select
								id='branchId'
								name='branchId'
								value={form.values.branchId}
								onChange={form.handleChange}
								onBlur={form.handleBlur}
								disabled={loadingBranches}>
								<option value=''>Selecciona una sucursal...</option>
								{filteredBranches.map((b) => (
									<option key={b.id} value={b.id}>
										{b.name}
									</option>
								))}
							</Select>
							{form.touched.branchId && form.errors.branchId && (
								<p className='mt-1 text-xs text-red-500'>{form.errors.branchId}</p>
							)}
						</div>

						<div className='col-span-1'>
							<Label htmlFor='reason'>Razón del ajuste</Label>
							<Input
								id='reason'
								name='reason'
								placeholder='Ej: Ingreso por Factura #8821'
								value={form.values.reason}
								onChange={form.handleChange}
								onBlur={form.handleBlur}
								isValid={form.isValid}
								isTouched={!!form.touched.reason}
								invalidFeedback={form.errors.reason}
							/>
						</div>

						<div className='col-span-1'>
							<Label htmlFor='notes'>Notas (opcional)</Label>
							<Textarea
								id='notes'
								name='notes'
								placeholder='Detalles adicionales...'
								value={form.values.notes}
								onChange={form.handleChange}
								onBlur={form.handleBlur}
								rows={3}
							/>
						</div>
					</div>

					{Number(form.values.branchId) > 0 && (
						<div className='rounded-md border border-zinc-200 p-3 dark:border-zinc-700'>
							<p className='mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
								Stock en sucursal seleccionada
							</p>
							{isLoadingBranchStock ? (
								<div className='flex flex-col gap-2'>
									{[1, 2].map((i) => (
										<div
											key={i}
											className='h-8 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700'
										/>
									))}
								</div>
							) : (
								<div className='flex flex-col gap-2'>
									{workItems.map((item) => {
										const stock = Number(
											stockByProduct.get(item.productId) ?? 0,
										);
										return (
											<div
												key={item.productId}
												className='flex items-center justify-between rounded border border-zinc-100 px-3 py-2 text-sm dark:border-zinc-700'>
												<div className='min-w-0'>
													<p className='truncate font-medium text-zinc-800 dark:text-zinc-100'>
														{item.name}
													</p>
													<p className='text-xs text-zinc-500'>
														SKU: {item.sku}
													</p>
												</div>
												<Badge
													variant='outline'
													color={stock > 0 ? 'emerald' : 'zinc'}>
													{stock.toLocaleString('es-CL')} uds
												</Badge>
											</div>
										);
									})}
								</div>
							)}
						</div>
					)}
				</div>
			</ModalBody>
			<ModalFooter>
				<Button color='zinc' variant='outline' onClick={onClose} isDisable={isSubmitting}>
					Cancelar
				</Button>
				<Button
					color='amber'
					variant='solid'
					onClick={() => form.handleSubmit()}
					isDisable={isSubmitting}>
					{isSubmitting ? 'Enviando...' : 'Confirmar Ajuste'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};
