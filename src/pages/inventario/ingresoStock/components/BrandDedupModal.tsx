import React, { useEffect, useMemo, useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Checkbox from '@/components/form/Checkbox';
import type { DedupProductItem } from '../hooks/useBrandDeduplication';

type DuplicateBrand = {
	id: number;
	name: string;
};

interface BrandDedupModalProps {
	isOpen: boolean;
	duplicates: DuplicateBrand[];
	affectedProductsByBrand: Record<number, DedupProductItem[]>;
	defaultKeepId?: number | null;
	isLoadingProducts?: boolean;
	isSubmitting?: boolean;
	onClose: () => void;
	onConfirm: (payload: { keepId: number; selectedProductIds: number[] }) => void;
}

export const BrandDedupModal: React.FC<BrandDedupModalProps> = ({
	isOpen,
	duplicates,
	affectedProductsByBrand,
	defaultKeepId,
	isLoadingProducts = false,
	isSubmitting = false,
	onClose,
	onConfirm,
}) => {
	const [selectedId, setSelectedId] = useState<number>(0);
	const [checkedMap, setCheckedMap] = useState<Record<number, boolean>>({});

	useEffect(() => {
		if (!isOpen) return;
		const fallback =
			defaultKeepId && duplicates.some((d) => d.id === defaultKeepId)
				? defaultKeepId
				: (duplicates[0]?.id ?? 0);
		setSelectedId(fallback);
	}, [isOpen, defaultKeepId, duplicates]);

	const hasSelection = useMemo(() => selectedId > 0, [selectedId]);

	const currentAffectedProducts = useMemo(() => {
		return duplicates
			.filter((brand) => brand.id !== selectedId)
			.flatMap((brand) => affectedProductsByBrand[brand.id] ?? []);
	}, [duplicates, selectedId, affectedProductsByBrand]);

	useEffect(() => {
		if (!isOpen) return;
		const nextMap: Record<number, boolean> = {};
		currentAffectedProducts.forEach((product) => {
			nextMap[product.id] = checkedMap[product.id] ?? false;
		});
		setCheckedMap(nextMap);
	}, [isOpen, selectedId, currentAffectedProducts]);

	const selectedProductIds = useMemo(
		() =>
			Object.entries(checkedMap)
				.filter(([, checked]) => checked)
				.map(([id]) => Number(id)),
		[checkedMap],
	);

	const unresolvedProductsCount = useMemo(() => {
		const requiredIds = new Set(currentAffectedProducts.map((p) => p.id));
		let resolved = 0;
		selectedProductIds.forEach((id) => {
			if (requiredIds.has(id)) resolved += 1;
		});
		return Math.max(currentAffectedProducts.length - resolved, 0);
	}, [currentAffectedProducts, selectedProductIds]);

	const canConfirm =
		hasSelection && !isLoadingProducts && !isSubmitting && unresolvedProductsCount === 0;

	const toggleProductCheck = (productId: number) => {
		setCheckedMap((prev) => ({
			...prev,
			[productId]: !prev[productId],
		}));
	};

	const toggleAllCurrent = (value: boolean) => {
		setCheckedMap((prev) => {
			const next = { ...prev };
			currentAffectedProducts.forEach((product) => {
				next[product.id] = value;
			});
			return next;
		});
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} isStaticBackdrop size='xl' isScrollable>
			<ModalHeader>
				<h3 className='text-xl font-bold'>Resolver Marcas Duplicadas</h3>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-4'>
					<div className='rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200'>
						Detectamos marcas que parecen ser la misma (por ejemplo: del, dell, Dell).
						Selecciona cuál deseas conservar. No se eliminará ninguna marca hasta
						reasignar todos los productos afectados.
					</div>

					<div className='space-y-2'>
						{duplicates.map((brand) => {
							const isSelected = selectedId === brand.id;
							return (
								<button
									key={brand.id}
									type='button'
									onClick={() => setSelectedId(brand.id)}
									className={`w-full rounded-lg border px-3 py-2 text-left transition ${
										isSelected
											? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
											: 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'
									}`}>
									<div className='flex items-center justify-between'>
										<div className='font-medium'>{brand.name}</div>
										<Badge variant='outline'>ID: {brand.id}</Badge>
									</div>
								</button>
							);
						})}
					</div>

					<div className='rounded-md border border-zinc-200 p-3 dark:border-zinc-700'>
						<div className='mb-2 flex items-center justify-between'>
							<h4 className='text-sm font-semibold'>Productos Afectados</h4>
							<Badge variant='outline'>
								{currentAffectedProducts.length} pendiente
								{currentAffectedProducts.length === 1 ? '' : 's'}
							</Badge>
						</div>

						{isLoadingProducts ? (
							<div className='text-sm text-zinc-500'>
								Cargando productos vinculados a marcas duplicadas...
							</div>
						) : currentAffectedProducts.length === 0 ? (
							<div className='text-sm text-emerald-600 dark:text-emerald-400'>
								No hay productos vinculados a marcas que se eliminarán.
							</div>
						) : (
							<div className='space-y-2'>
								<div className='flex gap-2'>
									<Button
										color='zinc'
										variant='outline'
										size='sm'
										onClick={() => toggleAllCurrent(true)}>
										Seleccionar todos
									</Button>
									<Button
										color='zinc'
										variant='outline'
										size='sm'
										onClick={() => toggleAllCurrent(false)}>
										Limpiar selección
									</Button>
								</div>

								<div className='max-h-64 space-y-2 overflow-auto pr-1'>
									{currentAffectedProducts.map((product) => (
										<div
											key={product.id}
											className='rounded-md border border-zinc-200 p-2 dark:border-zinc-700'>
											<Checkbox
												checked={Boolean(checkedMap[product.id])}
												onChange={() => toggleProductCheck(product.id)}
												label={
													<div className='flex flex-col'>
														<span className='text-sm font-medium'>
															{product.name}
														</span>
														<span className='text-xs text-zinc-500'>
															SKU: {product.sku} - Marca actual:{' '}
															{product.brandName}
														</span>
													</div>
												}
											/>
										</div>
									))}
								</div>

								{unresolvedProductsCount > 0 && (
									<div className='rounded-md bg-red-50 p-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-300'>
										Faltan {unresolvedProductsCount} producto
										{unresolvedProductsCount === 1 ? '' : 's'} por confirmar
										para reasignación. No se permitirá eliminar marcas hasta
										completar este paso.
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				<Button color='zinc' variant='outline' onClick={onClose} isDisable={isSubmitting}>
					Cancelar
				</Button>
				<Button
					color='emerald'
					variant='solid'
					isDisable={!canConfirm}
					onClick={() =>
						onConfirm({
							keepId: selectedId,
							selectedProductIds,
						})
					}>
					{isSubmitting ? 'Resolviendo...' : 'Conservar Seleccionada'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};
